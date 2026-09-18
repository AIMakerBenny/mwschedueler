//go:build windows

package main

import (
	"bytes"
	_ "embed"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"image"
	_ "image/jpeg"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"

	"github.com/energye/systray"
	webview "github.com/jchv/go-webview2"
)

const (
	appURL   = "https://mawang-scheduler.majoku.workers.dev/"
	appTitle = "Mawang Scheduler"
)

const (
	swHide           = 0
	swShow           = 5
	swMaximize       = 3
	wmDestroy        = 0x0002
	wmPaint          = 0x000F
	wmClose          = 0x0010
	wmEraseBkgnd     = 0x0014
	wmKeyDown        = 0x0100
	wmSysCommand     = 0x0112
	wmLButtonDown    = 0x0201
	wmRButtonDown    = 0x0204
	wmMButtonDown    = 0x0207
	wmAppIntroFinish = 0x8001
	wmAppIntroAbort  = 0x8002
	scMinimize       = 0xF020
	wsPopup          = 0x80000000
	wsCaption        = 0x00C00000
	wsThickFrame     = 0x00040000
	wsMinBox         = 0x00020000
	wsMaxBox         = 0x00010000
	wsSysMenu        = 0x00080000
	swpNoZOrder      = 0x0004
	swpNoActivate    = 0x0010
	swpFrameChanged  = 0x0020
	swpNoOwnerZOrder = 0x0200
	monitorNearest   = 2
	vkReturn         = 0x0D
	vkEscape         = 0x1B
	vkSpace          = 0x20
	vkMenu           = 0x12
	wmSetIcon        = 0x0080
	iconSmall        = 0
	iconBig          = 1
	wsExTopmost      = 0x00000008
	srcCopy          = 0x00CC0020
	blackness        = 0x00000042
	stretchHalftone  = 4
	bkModeTransparent = 1
	dtCenter         = 0x00000001
	dtVCenter        = 0x00000004
	dtSingleLine     = 0x00000020
	fwSemibold       = 600
)

type rect struct{ Left, Top, Right, Bottom int32 }

type monitorInfo struct {
	CbSize    uint32
	RcMonitor rect
	RcWork    rect
	DwFlags   uint32
}

type point struct {
	X int32
	Y int32
}

type winMsg struct {
	Hwnd     uintptr
	Message  uint32
	WParam   uintptr
	LParam   uintptr
	Time     uint32
	Pt       point
	LPrivate uint32
}

type paintStruct struct {
	Hdc         uintptr
	Erase       int32
	Paint       rect
	Restore     int32
	IncUpdate   int32
	Reserved    [32]byte
}

type wndClassEx struct {
	CbSize        uint32
	Style         uint32
	WndProc       uintptr
	ClsExtra      int32
	WndExtra      int32
	Instance      uintptr
	Icon          uintptr
	Cursor        uintptr
	Background    uintptr
	MenuName      *uint16
	ClassName     *uint16
	IconSmall     uintptr
}

type bitmapInfoHeader struct {
	Size          uint32
	Width         int32
	Height        int32
	Planes        uint16
	BitCount      uint16
	Compression   uint32
	SizeImage     uint32
	XPelsPerMeter int32
	YPelsPerMeter int32
	ClrUsed       uint32
	ClrImportant  uint32
}

type bitmapInfo struct {
	Header bitmapInfoHeader
	Colors [1]uint32
}

type introSession struct {
	hwnd       uintptr
	mu         sync.Mutex
	photoAlpha byte
	titleAlpha byte
	skipOnce   sync.Once
	skipCh     chan struct{}
}

//go:embed assets/mawang.ico
var iconBytes []byte

//go:embed assets/mawang-intro.b64
var introImageB64 string

var (
	user32                  = syscall.NewLazyDLL("user32.dll")
	kernel32                = syscall.NewLazyDLL("kernel32.dll")
	gdi32                   = syscall.NewLazyDLL("gdi32.dll")
	procShowWindow          = user32.NewProc("ShowWindow")
	procRegisterClassEx     = user32.NewProc("RegisterClassExW")
	procCreateWindowEx      = user32.NewProc("CreateWindowExW")
	procDefWindowProc       = user32.NewProc("DefWindowProcW")
	procGetMessage          = user32.NewProc("GetMessageW")
	procTranslateMessage    = user32.NewProc("TranslateMessage")
	procDispatchMessage     = user32.NewProc("DispatchMessageW")
	procPostMessage         = user32.NewProc("PostMessageW")
	procDestroyWindow       = user32.NewProc("DestroyWindow")
	procPostQuitMessage     = user32.NewProc("PostQuitMessage")
	procBeginPaint          = user32.NewProc("BeginPaint")
	procEndPaint            = user32.NewProc("EndPaint")
	procGetClientRect       = user32.NewProc("GetClientRect")
	procInvalidateRect      = user32.NewProc("InvalidateRect")
	procDrawText            = user32.NewProc("DrawTextW")
	procLoadCursor          = user32.NewProc("LoadCursorW")
	procSetForegroundWindow = user32.NewProc("SetForegroundWindow")
	procSetWindowLongPtr    = user32.NewProc("SetWindowLongPtrW")
	procGetWindowLongPtr    = user32.NewProc("GetWindowLongPtrW")
	procCallWindowProc      = user32.NewProc("CallWindowProcW")
	procGetWindowRect       = user32.NewProc("GetWindowRect")
	procSetWindowPos        = user32.NewProc("SetWindowPos")
	procMonitorFromWindow   = user32.NewProc("MonitorFromWindow")
	procGetMonitorInfo      = user32.NewProc("GetMonitorInfoW")
	procIsZoomed            = user32.NewProc("IsZoomed")
	procGetAsyncKeyState    = user32.NewProc("GetAsyncKeyState")
	procSendMessage         = user32.NewProc("SendMessageW")
	procCreateIconFromRes   = user32.NewProc("CreateIconFromResourceEx")
	procCreateMutex         = kernel32.NewProc("CreateMutexW")
	procCreateEvent         = kernel32.NewProc("CreateEventW")
	procOpenEvent           = kernel32.NewProc("OpenEventW")
	procSetEvent            = kernel32.NewProc("SetEvent")
	procWaitForSingleObject = kernel32.NewProc("WaitForSingleObject")
	procCloseHandle         = kernel32.NewProc("CloseHandle")
	procGetModuleHandle     = kernel32.NewProc("GetModuleHandleW")
	procPatBlt              = gdi32.NewProc("PatBlt")
	procStretchDIBits       = gdi32.NewProc("StretchDIBits")
	procSetStretchBltMode   = gdi32.NewProc("SetStretchBltMode")
	procSetBkMode           = gdi32.NewProc("SetBkMode")
	procSetTextColor        = gdi32.NewProc("SetTextColor")
	procCreateFont          = gdi32.NewProc("CreateFontW")
	procSelectObject        = gdi32.NewProc("SelectObject")
	procDeleteObject        = gdi32.NewProc("DeleteObject")
)

var (
	wvMu           sync.Mutex
	wv             webview.WebView
	hwnd           uintptr
	appStarting    bool
	oldWndProc     uintptr
	newWndProc     = syscall.NewCallback(windowProc)
	exiting        bool
	fullscreen     bool
	savedStyle     uintptr
	savedRect      rect
	wasMaximized   bool
	fsMu           sync.Mutex
	stateMu        sync.Mutex
	lastRect       rect
	lastMaximized  = true
	lastStateValid bool
	pendingMu      sync.Mutex
	pendingSection string

	introMu     sync.Mutex
	activeIntro *introSession

	introClassOnce sync.Once
	introClassErr  error
	introWndProc   = syscall.NewCallback(nativeIntroWndProc)
	introImageOnce sync.Once
	introPixels    []byte
	introImageW    int
	introImageH    int
	introImageErr  error

	appStartOnce  sync.Once
	appReadyMu    sync.Mutex
	appReadyState bool

	startupMu     sync.Mutex
	startupLocked = true
)

const appBridgeScript = `(function(){
  if(window.__mwsDesktopBridgeInstalled)return;
  window.__mwsDesktopBridgeInstalled=true;

  function norm(v){return String(v||'').replace(/\s+/g,'').toLowerCase();}

  window.__mwsDesktopOpenSection=function(tab,labels){
    var tries=0,wanted=String(tab||''),names=String(labels||'').split('|').map(norm).filter(Boolean);
    function go(){
      tries++;
      try{
        var buttons=[].slice.call(document.querySelectorAll('[data-tab]'));
        var btn=buttons.find(function(b){return String(b.dataset.tab||'')===wanted;});
        if(!btn&&names.length){
          btn=buttons.find(function(b){
            var t=norm(b.textContent);
            return names.some(function(n){return t.indexOf(n)>=0;});
          });
        }
        if(btn){btn.click();return true;}
        var section=wanted?document.getElementById(wanted):null;
        if(section&&typeof window.setTab==='function'){window.setTab(wanted);return true;}
      }catch(_){}
      if(tries<40)setTimeout(go,500);
      return false;
    }
    go();
  };

  function syncFullscreenButton(full){
    var b=document.getElementById('mwsDesktopFullscreenButton');
    if(b)b.textContent=full?'창모드':'전체화면';
  }
  window.__mwsDesktopSyncFullscreen=syncFullscreenButton;

  function installDesktopChrome(){
    try{
      if(!document.getElementById('mwsDesktopChromeStyle')){
        var style=document.createElement('style');
        style.id='mwsDesktopChromeStyle';
        style.textContent='#mwsDesktopFullscreenButton{height:30px;padding:0 10px;border-radius:8px;font-size:11px;font-weight:800;white-space:nowrap;margin-right:2px}';
        document.head.appendChild(style);
      }
      var clock=document.querySelector('.topbar .clock');
      var sync=document.querySelector('.topbar .sync-status');
      if(clock&&!document.getElementById('mwsDesktopFullscreenButton')){
        var b=document.createElement('button');
        b.type='button';
        b.id='mwsDesktopFullscreenButton';
        b.className='ghost';
        b.textContent='전체화면';
        b.title='전체화면 전환';
        b.addEventListener('click',function(){
          try{
            Promise.resolve(window.__mwsToggleFullscreen()).then(function(v){syncFullscreenButton(!!v);});
          }catch(_){}
        });
        if(sync)clock.insertBefore(b,sync);else clock.insertBefore(b,clock.firstChild);
      }
    }catch(_){}
  }

  var readySent=false;
  function notifyReady(){
    if(readySent)return;
    readySent=true;
    try{Promise.resolve(window.__mwsAppReady());}catch(_){}
  }

  function checkReady(){
    try{
      installDesktopChrome();
      var gate=document.getElementById('mwsAccessGate');
      var gateVisible=false;
      if(gate){
        var gs=getComputedStyle(gate);
        gateVisible=gs.display!=='none'&&gs.visibility!=='hidden'&&gs.opacity!=='0';
      }
      var shell=document.querySelector('.topbar,.sidebar,[data-tab],#dashboard,#calendar');
      if(shell&&!gateVisible){notifyReady();return;}
    }catch(_){}
    setTimeout(checkReady,500);
  }

  window.addEventListener('mws:app-ready',function(){
    installDesktopChrome();
    notifyReady();
  },{once:true});

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){
      installDesktopChrome();
      setTimeout(checkReady,600);
    },{once:true});
  }else{
    installDesktopChrome();
    setTimeout(checkReady,600);
  }

  document.addEventListener('keydown',function(e){
    if(e.key==='F11'){
      e.preventDefault();
      e.stopPropagation();
      try{
        Promise.resolve(window.__mwsToggleFullscreen()).then(function(v){syncFullscreenButton(!!v);});
      }catch(_){}
    }
  },true);
})();`

func appDataPath() string {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	dir := filepath.Join(base, "MawangSchedulerDesktop", "WebView2")
	_ = os.MkdirAll(dir, 0700)
	return dir
}

func windowProc(h uintptr, msg uint32, wparam, lparam uintptr) uintptr {
	switch msg {
	case wmClose:
		rememberWindowState(h)
		procShowWindow.Call(h, swHide)
		return 0
	case wmSysCommand:
		if wparam&0xFFF0 == scMinimize {
			rememberWindowState(h)
			procShowWindow.Call(h, swHide)
			return 0
		}
	}
	if oldWndProc != 0 {
		r, _, _ := procCallWindowProc.Call(oldWndProc, h, uintptr(msg), wparam, lparam)
		return r
	}
	return 0
}

func installWindowHook(h uintptr) {
	if h == 0 || oldWndProc != 0 {
		return
	}
	r, _, _ := procSetWindowLongPtr.Call(h, ^uintptr(3), newWndProc)
	if r != 0 {
		oldWndProc = r
	}
}

func rememberWindowState(h uintptr) {
	if h == 0 {
		return
	}
	fsMu.Lock()
	isFS := fullscreen
	fsMu.Unlock()
	if isFS {
		return
	}
	var r rect
	ok, _, _ := procGetWindowRect.Call(h, uintptr(unsafe.Pointer(&r)))
	if ok == 0 || r.Right <= r.Left || r.Bottom <= r.Top {
		return
	}
	z, _, _ := procIsZoomed.Call(h)
	stateMu.Lock()
	lastRect = r
	lastMaximized = z != 0
	lastStateValid = true
	stateMu.Unlock()
}

func currentIntro() *introSession {
	introMu.Lock()
	session := activeIntro
	introMu.Unlock()
	return session
}

func showIntroWindow() {
	session := currentIntro()
	if session == nil || session.hwnd == 0 {
		return
	}
	procShowWindow.Call(session.hwnd, swShow)
	procSetForegroundWindow.Call(session.hwnd)
}

func showWindow() {
	startupMu.Lock()
	locked := startupLocked
	startupMu.Unlock()
	if locked {
		showIntroWindow()
		return
	}

	wvMu.Lock()
	h := hwnd
	w := wv
	starting := appStarting
	wvMu.Unlock()
	if h == 0 || w == nil {
		if !starting {
			startApp()
		}
		return
	}

	fsMu.Lock()
	isFS := fullscreen
	fsMu.Unlock()
	if isFS {
		procShowWindow.Call(h, swShow)
		procSetForegroundWindow.Call(h)
		return
	}

	stateMu.Lock()
	r := lastRect
	maximized := lastMaximized
	valid := lastStateValid
	stateMu.Unlock()

	if valid {
		if maximized {
			procShowWindow.Call(h, swMaximize)
		} else {
			procSetWindowPos.Call(h, 0, uintptr(r.Left), uintptr(r.Top), uintptr(r.Right-r.Left), uintptr(r.Bottom-r.Top), swpNoZOrder|swpNoActivate)
			procShowWindow.Call(h, swShow)
		}
	} else {
		procShowWindow.Call(h, swMaximize)
	}
	procSetForegroundWindow.Call(h)
}

func hideWindow() {
	wvMu.Lock()
	h := hwnd
	wvMu.Unlock()
	if h != 0 {
		rememberWindowState(h)
		procShowWindow.Call(h, swHide)
	}
}

func toggleFullscreen() bool {
	wvMu.Lock()
	h := hwnd
	wvMu.Unlock()
	if h == 0 {
		fsMu.Lock()
		state := fullscreen
		fsMu.Unlock()
		return state
	}
	rememberWindowState(h)
	fsMu.Lock()
	defer fsMu.Unlock()

	if !fullscreen {
		procGetWindowRect.Call(h, uintptr(unsafe.Pointer(&savedRect)))
		savedStyle, _, _ = procGetWindowLongPtr.Call(h, ^uintptr(15))
		z, _, _ := procIsZoomed.Call(h)
		wasMaximized = z != 0
		mon, _, _ := procMonitorFromWindow.Call(h, monitorNearest)
		mi := monitorInfo{CbSize: uint32(unsafe.Sizeof(monitorInfo{}))}
		if mon != 0 {
			procGetMonitorInfo.Call(mon, uintptr(unsafe.Pointer(&mi)))
		}
		style := savedStyle &^ (wsCaption | wsThickFrame | wsMinBox | wsMaxBox | wsSysMenu)
		procSetWindowLongPtr.Call(h, ^uintptr(15), style)
		r := mi.RcMonitor
		procSetWindowPos.Call(h, 0, uintptr(r.Left), uintptr(r.Top), uintptr(r.Right-r.Left), uintptr(r.Bottom-r.Top), swpFrameChanged|swpNoOwnerZOrder)
		fullscreen = true
	} else {
		procSetWindowLongPtr.Call(h, ^uintptr(15), savedStyle)
		r := savedRect
		procSetWindowPos.Call(h, 0, uintptr(r.Left), uintptr(r.Top), uintptr(r.Right-r.Left), uintptr(r.Bottom-r.Top), swpFrameChanged|swpNoOwnerZOrder)
		if wasMaximized {
			procShowWindow.Call(h, swMaximize)
		} else {
			procShowWindow.Call(h, swShow)
		}
		fullscreen = false
	}
	return fullscreen
}

func startApp() {
	appStartOnce.Do(func() {
		go runAppWebView()
	})
}

func setAppReady() {
	appReadyMu.Lock()
	appReadyState = true
	appReadyMu.Unlock()
}

func isAppReady() bool {
	appReadyMu.Lock()
	ready := appReadyState
	appReadyMu.Unlock()
	return ready
}
func runAppWebView() {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	wvMu.Lock()
	appStarting = true
	wvMu.Unlock()

	w := webview.NewWithOptions(webview.WebViewOptions{
		Debug:         false,
		AutoFocus:     true,
		DataPath:      appDataPath(),
		WindowOptions: webview.WindowOptions{Title: appTitle, Width: 1360, Height: 860, Center: true},
	})
	if w == nil {
		wvMu.Lock()
		appStarting = false
		wvMu.Unlock()
		return
	}
	defer w.Destroy()

	h := uintptr(w.Window())
	wvMu.Lock()
	wv = w
	hwnd = h
	appStarting = false
	wvMu.Unlock()

	installWindowHook(h)
	setWindowIcon(h)
	procShowWindow.Call(h, swHide)

	w.Bind("__mwsToggleFullscreen", func() bool { return toggleFullscreen() })
	w.Bind("__mwsAppReady", func() {
		setAppReady()
	})
	w.Init(appBridgeScript)
	w.Navigate(appURL)

	time.AfterFunc(1800*time.Millisecond, func() {
		w.Dispatch(func() {
			w.Eval(appBridgeScript)
			applyPendingSection(w)
		})
	})

	w.Run()

	wvMu.Lock()
	if wv == w {
		wv = nil
		hwnd = 0
	}
	appStarting = false
	wvMu.Unlock()
	oldWndProc = 0
}

func ensureIntroImage() error {
	introImageOnce.Do(func() {
		raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(introImageB64))
		if err != nil {
			introImageErr = err
			return
		}
		img, _, err := image.Decode(bytes.NewReader(raw))
		if err != nil {
			introImageErr = err
			return
		}
		b := img.Bounds()
		introImageW = b.Dx()
		introImageH = b.Dy()
		if introImageW <= 0 || introImageH <= 0 {
			introImageErr = fmt.Errorf("invalid intro image dimensions")
			return
		}
		introPixels = make([]byte, introImageW*introImageH*4)
		for y := 0; y < introImageH; y++ {
			for x := 0; x < introImageW; x++ {
				r, g, bl, _ := img.At(b.Min.X+x, b.Min.Y+y).RGBA()
				i := (y*introImageW + x) * 4
				introPixels[i] = byte(bl >> 8)
				introPixels[i+1] = byte(g >> 8)
				introPixels[i+2] = byte(r >> 8)
				introPixels[i+3] = 0
			}
		}
	})
	return introImageErr
}

func ensureIntroClass() error {
	introClassOnce.Do(func() {
		instance, _, _ := procGetModuleHandle.Call(0)
		className, _ := syscall.UTF16PtrFromString("MawangSchedulerNativeIntroV080")
		cursor, _, _ := procLoadCursor.Call(0, 32512)
		wc := wndClassEx{
			CbSize:     uint32(unsafe.Sizeof(wndClassEx{})),
			WndProc:    introWndProc,
			Instance:   instance,
			Cursor:     cursor,
			ClassName:  className,
		}
		r, _, err := procRegisterClassEx.Call(uintptr(unsafe.Pointer(&wc)))
		if r == 0 {
			introClassErr = fmt.Errorf("RegisterClassExW failed: %v", err)
		}
	})
	return introClassErr
}

func requestIntroSkip() {
	session := currentIntro()
	if session == nil {
		return
	}
	session.skipOnce.Do(func() {
		close(session.skipCh)
	})
}

func introSkipped(session *introSession) bool {
	if session == nil {
		return false
	}
	select {
	case <-session.skipCh:
		return true
	default:
		return false
	}
}

func setIntroAlpha(session *introSession, photo, title byte) {
	if session == nil {
		return
	}
	session.mu.Lock()
	session.photoAlpha = photo
	session.titleAlpha = title
	h := session.hwnd
	session.mu.Unlock()
	if h != 0 {
		procInvalidateRect.Call(h, 0, 0)
	}
}

func fadeIntro(session *introSession, photo bool, from, to byte, duration time.Duration, stopOnSkip bool) bool {
	steps := int(duration / (33 * time.Millisecond))
	if steps < 1 {
		steps = 1
	}
	for i := 0; i <= steps; i++ {
		if exiting {
			return true
		}
		if stopOnSkip && introSkipped(session) {
			return true
		}
		v := int(from) + (int(to)-int(from))*i/steps
		session.mu.Lock()
		p := session.photoAlpha
		t := session.titleAlpha
		session.mu.Unlock()
		if photo {
			p = byte(v)
		} else {
			t = byte(v)
		}
		setIntroAlpha(session, p, t)
		time.Sleep(33 * time.Millisecond)
	}
	return false
}

func waitIntro(session *introSession, d time.Duration, stopOnSkip bool) bool {
	deadline := time.Now().Add(d)
	for time.Now().Before(deadline) {
		if exiting {
			return true
		}
		if stopOnSkip && introSkipped(session) {
			return true
		}
		time.Sleep(25 * time.Millisecond)
	}
	return false
}

func waitForAppReady(session *introSession) bool {
	for !exiting {
		if isAppReady() {
			return true
		}
		if introSkipped(session) {
			setIntroAlpha(session, 0, 255)
		}
		time.Sleep(80 * time.Millisecond)
	}
	return false
}

func animateNativeIntro(session *introSession) {
	setIntroAlpha(session, 0, 0)

	// Slow photo fade in, hold, and fade out.
	if fadeIntro(session, true, 0, 255, 1600*time.Millisecond, true) {
		setIntroAlpha(session, 0, 255)
		if waitForAppReady(session) {
			fadeIntro(session, false, 255, 0, 420*time.Millisecond, false)
			procPostMessage.Call(session.hwnd, wmAppIntroFinish, 0, 0)
		}
		return
	}
	if waitIntro(session, 1700*time.Millisecond, true) {
		setIntroAlpha(session, 0, 255)
		if waitForAppReady(session) {
			fadeIntro(session, false, 255, 0, 420*time.Millisecond, false)
			procPostMessage.Call(session.hwnd, wmAppIntroFinish, 0, 0)
		}
		return
	}
	if fadeIntro(session, true, 255, 0, 1600*time.Millisecond, true) {
		setIntroAlpha(session, 0, 255)
		if waitForAppReady(session) {
			fadeIntro(session, false, 255, 0, 420*time.Millisecond, false)
			procPostMessage.Call(session.hwnd, wmAppIntroFinish, 0, 0)
		}
		return
	}

	// Title fades in slowly and never disappears until the hidden web app is past login.
	if fadeIntro(session, false, 0, 255, 1600*time.Millisecond, true) {
		setIntroAlpha(session, 0, 255)
	}
	if !introSkipped(session) {
		waitIntro(session, 1800*time.Millisecond, true)
	}
	if !waitForAppReady(session) {
		return
	}

	if introSkipped(session) {
		fadeIntro(session, false, 255, 0, 420*time.Millisecond, false)
	} else {
		fadeIntro(session, false, 255, 0, 1500*time.Millisecond, false)
	}
	procPostMessage.Call(session.hwnd, wmAppIntroFinish, 0, 0)
}

func paintNativeIntro(h uintptr) {
	session := currentIntro()
	if session == nil || session.hwnd != h {
		return
	}
	var ps paintStruct
	hdc, _, _ := procBeginPaint.Call(h, uintptr(unsafe.Pointer(&ps)))
	if hdc == 0 {
		return
	}
	defer procEndPaint.Call(h, uintptr(unsafe.Pointer(&ps)))

	var rc rect
	procGetClientRect.Call(h, uintptr(unsafe.Pointer(&rc)))
	cw := int(rc.Right - rc.Left)
	ch := int(rc.Bottom - rc.Top)
	if cw <= 0 || ch <= 0 {
		return
	}

	procPatBlt.Call(hdc, 0, 0, uintptr(cw), uintptr(ch), blackness)

	session.mu.Lock()
	photoAlpha := session.photoAlpha
	titleAlpha := session.titleAlpha
	session.mu.Unlock()

	if photoAlpha > 0 && len(introPixels) > 0 {
		frame := introPixels
		if photoAlpha < 255 {
			frame = make([]byte, len(introPixels))
			for i := 0; i < len(introPixels); i += 4 {
				frame[i] = byte(int(introPixels[i]) * int(photoAlpha) / 255)
				frame[i+1] = byte(int(introPixels[i+1]) * int(photoAlpha) / 255)
				frame[i+2] = byte(int(introPixels[i+2]) * int(photoAlpha) / 255)
			}
		}
		imgAR := float64(introImageW) / float64(introImageH)
		winAR := float64(cw) / float64(ch)
		dx, dy, dw, dh := 0, 0, cw, ch
		if winAR > imgAR {
			dh = int(float64(cw) / imgAR)
			dy = (ch - dh) / 2
		} else {
			dw = int(float64(ch) * imgAR)
			dx = (cw - dw) / 2
		}
		bmi := bitmapInfo{Header: bitmapInfoHeader{
			Size:        uint32(unsafe.Sizeof(bitmapInfoHeader{})),
			Width:       int32(introImageW),
			Height:      -int32(introImageH),
			Planes:      1,
			BitCount:    32,
			Compression: 0,
		}}
		procSetStretchBltMode.Call(hdc, stretchHalftone)
		procStretchDIBits.Call(
			hdc,
			uintptr(dx), uintptr(dy), uintptr(dw), uintptr(dh),
			0, 0, uintptr(introImageW), uintptr(introImageH),
			uintptr(unsafe.Pointer(&frame[0])),
			uintptr(unsafe.Pointer(&bmi)),
			0,
			srcCopy,
		)
	}

	if titleAlpha > 0 {
		v := uint32(titleAlpha)
		color := v | v<<8 | v<<16
		procSetBkMode.Call(hdc, bkModeTransparent)
		procSetTextColor.Call(hdc, uintptr(color))

		mainFace, _ := syscall.UTF16PtrFromString("Segoe UI")
		mainFont, _, _ := procCreateFont.Call(
			uintptr(int32(-ch/8)), 0, 0, 0, fwSemibold, 0, 0, 0,
			1, 0, 0, 5, 0, uintptr(unsafe.Pointer(mainFace)),
		)
		if mainFont != 0 {
			old, _, _ := procSelectObject.Call(hdc, mainFont)
			textPtr, _ := syscall.UTF16PtrFromString("Mawang Scheduler")
			r := rect{Left: 0, Top: int32(ch/2 - ch/10), Right: int32(cw), Bottom: int32(ch/2 + ch/12)}
			procDrawText.Call(hdc, uintptr(unsafe.Pointer(textPtr)), ^uintptr(0), uintptr(unsafe.Pointer(&r)), dtCenter|dtVCenter|dtSingleLine)
			procSelectObject.Call(hdc, old)
			procDeleteObject.Call(mainFont)
		}

		subFace, _ := syscall.UTF16PtrFromString("Malgun Gothic")
		subFont, _, _ := procCreateFont.Call(
			uintptr(int32(-ch/30)), 0, 0, 0, fwSemibold, 0, 0, 0,
			1, 0, 0, 5, 0, uintptr(unsafe.Pointer(subFace)),
		)
		if subFont != 0 {
			old, _, _ := procSelectObject.Call(hdc, subFont)
			textPtr, _ := syscall.UTF16PtrFromString("마왕스케줄러")
			r := rect{Left: 0, Top: int32(ch/2 + ch/11), Right: int32(cw), Bottom: int32(ch/2 + ch/5)}
			procDrawText.Call(hdc, uintptr(unsafe.Pointer(textPtr)), ^uintptr(0), uintptr(unsafe.Pointer(&r)), dtCenter|dtVCenter|dtSingleLine)
			procSelectObject.Call(hdc, old)
			procDeleteObject.Call(subFont)
		}
	}
}

func showMainAfterIntro(session *introSession) {
	if session == nil || !isAppReady() {
		return
	}
	wvMu.Lock()
	h := hwnd
	aw := wv
	wvMu.Unlock()
	if h == 0 || aw == nil {
		return
	}

	procShowWindow.Call(session.hwnd, swHide)

	startupMu.Lock()
	startupLocked = false
	startupMu.Unlock()

	stateMu.Lock()
	lastMaximized = true
	lastStateValid = true
	stateMu.Unlock()

	procShowWindow.Call(h, swMaximize)
	procSetForegroundWindow.Call(h)
	procDestroyWindow.Call(session.hwnd)
}

func nativeIntroWndProc(h uintptr, msg uint32, wparam, lparam uintptr) uintptr {
	switch msg {
	case wmPaint:
		paintNativeIntro(h)
		return 0
	case wmEraseBkgnd:
		return 1
	case wmKeyDown:
		if wparam == vkEscape || wparam == vkSpace || wparam == vkReturn {
			requestIntroSkip()
		}
		return 0
	case wmLButtonDown, wmRButtonDown, wmMButtonDown:
		requestIntroSkip()
		return 0
	case wmClose:
		// Borderless intro has no close button. Alt+F4 is intentionally ignored.
		return 0
	case wmAppIntroFinish:
		showMainAfterIntro(currentIntro())
		return 0
	case wmAppIntroAbort:
		procShowWindow.Call(h, swHide)
		procDestroyWindow.Call(h)
		return 0
	case wmDestroy:
		procPostQuitMessage.Call(0)
		return 0
	}
	r, _, _ := procDefWindowProc.Call(h, uintptr(msg), wparam, lparam)
	return r
}

func runNativeIntro() {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	if ensureIntroClass() != nil {
		return
	}
	_ = ensureIntroImage()

	instance, _, _ := procGetModuleHandle.Call(0)
	className, _ := syscall.UTF16PtrFromString("MawangSchedulerNativeIntroV080")
	title, _ := syscall.UTF16PtrFromString(appTitle)
	h, _, _ := procCreateWindowEx.Call(
		wsExTopmost,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(title)),
		wsPopup,
		0, 0, 100, 100,
		0, 0, instance, 0,
	)
	if h == 0 {
		return
	}

	session := &introSession{hwnd: h, skipCh: make(chan struct{})}
	introMu.Lock()
	activeIntro = session
	introMu.Unlock()

	mon, _, _ := procMonitorFromWindow.Call(h, monitorNearest)
	mi := monitorInfo{CbSize: uint32(unsafe.Sizeof(monitorInfo{}))}
	if mon != 0 {
		procGetMonitorInfo.Call(mon, uintptr(unsafe.Pointer(&mi)))
		r := mi.RcMonitor
		procSetWindowPos.Call(h, 0, uintptr(r.Left), uintptr(r.Top), uintptr(r.Right-r.Left), uintptr(r.Bottom-r.Top), swpFrameChanged|swpNoOwnerZOrder)
	}
	procShowWindow.Call(h, swShow)
	procSetForegroundWindow.Call(h)

	// Start hidden WebView only after the native intro is already on screen.
	startApp()
	go animateNativeIntro(session)

	var m winMsg
	for {
		r, _, _ := procGetMessage.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if int32(r) <= 0 {
			break
		}
		procTranslateMessage.Call(uintptr(unsafe.Pointer(&m)))
		procDispatchMessage.Call(uintptr(unsafe.Pointer(&m)))
	}

	introMu.Lock()
	if activeIntro == session {
		activeIntro = nil
	}
	introMu.Unlock()
}

func applyPendingSection(w webview.WebView) {
	pendingMu.Lock()
	p := pendingSection
	pendingSection = ""
	pendingMu.Unlock()
	if p == "" {
		return
	}
	parts := strings.SplitN(p, "\x1f", 2)
	label := ""
	if len(parts) > 1 {
		label = parts[1]
	}
	js := fmt.Sprintf("window.__mwsDesktopOpenSection && window.__mwsDesktopOpenSection(%s,%s)", jsString(parts[0]), jsString(label))
	w.Eval(js)
}

func openSection(tab, labels string) {
	pendingMu.Lock()
	pendingSection = tab + "\x1f" + labels
	pendingMu.Unlock()

	showWindow()

	wvMu.Lock()
	w := wv
	wvMu.Unlock()
	if w == nil {
		return
	}
	time.AfterFunc(180*time.Millisecond, func() {
		w.Dispatch(func() { applyPendingSection(w) })
	})
}

func jsString(s string) string {
	b, _ := json.Marshal(s)
	return string(b)
}

func acquireSingleton() bool {
	name, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopNativeMutexV080N")
	m, _, err := procCreateMutex.Call(0, 0, uintptr(unsafe.Pointer(name)))
	if m == 0 {
		return true
	}
	if errno, ok := err.(syscall.Errno); ok && errno == syscall.ERROR_ALREADY_EXISTS {
		evName, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopShowEventV080N")
		ev, _, _ := procOpenEvent.Call(0x0002, 0, uintptr(unsafe.Pointer(evName)))
		if ev != 0 {
			procSetEvent.Call(ev)
			procCloseHandle.Call(ev)
		}
		procCloseHandle.Call(m)
		return false
	}
	return true
}

func handleExecutableRelaunch() {
	if currentIntro() != nil {
		showIntroWindow()
		return
	}
	if !isAppReady() {
		showWindow()
		return
	}

	hideWindow()
	startupMu.Lock()
	startupLocked = true
	startupMu.Unlock()
	go runNativeIntro()
}
func watchShowEvent() {
	evName, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopShowEventV080N")
	ev, _, _ := procCreateEvent.Call(0, 0, 0, uintptr(unsafe.Pointer(evName)))
	if ev == 0 {
		return
	}
	defer procCloseHandle.Call(ev)
	for !exiting {
		r, _, _ := procWaitForSingleObject.Call(ev, 1000)
		if r == 0 {
			handleExecutableRelaunch()
		}
	}
}

func keyDown(vk uintptr) bool {
	r, _, _ := procGetAsyncKeyState.Call(vk)
	return r&0x8000 != 0
}

func watchAltEnter() {
	pressed := false
	for !exiting {
		now := keyDown(vkMenu) && keyDown(vkReturn)
		if now && !pressed {
			showWindow()
		}
		pressed = now
		time.Sleep(45 * time.Millisecond)
	}
}

func onReady() {
	systray.SetIcon(iconBytes)
	systray.SetTitle(appTitle)
	systray.SetTooltip(appTitle)
	systray.SetOnClick(func(menu systray.IMenu) {})
	systray.SetOnDClick(func(menu systray.IMenu) { showWindow() })
	systray.SetOnRClick(func(menu systray.IMenu) { _ = menu.ShowMenu() })

	mDashboard := systray.AddMenuItem("데시보드", "대시보드 열기")
	mCalendar := systray.AddMenuItem("갤린더", "캘린더 열기")
	mContacts := systray.AddMenuItem("연락처", "연락처 열기")
	mFriends := systray.AddMenuItem("친구찾기", "친구찾기 열기")
	mNotebook := systray.AddMenuItem("수첩", "수첩 열기")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("종료", "Mawang Scheduler 종료")

	mDashboard.Click(func() { openSection("dashboard", "대시보드|데시보드") })
	mCalendar.Click(func() { openSection("calendar", "캘린더|갤린더") })
	mContacts.Click(func() { openSection("contacts", "연락처") })
	mFriends.Click(func() { openSection("friendFinder", "친구찾기|친구 찾기") })
	mNotebook.Click(func() { openSection("memos", "수첩|메모|메모장") })
	mQuit.Click(func() {
		exiting = true

		wvMu.Lock()
		aw := wv
		wvMu.Unlock()
		if aw != nil {
			aw.Terminate()
		}

		session := currentIntro()
		if session != nil && session.hwnd != 0 {
			procShowWindow.Call(session.hwnd, swHide)
			procPostMessage.Call(session.hwnd, wmAppIntroAbort, 0, 0)
		}

		systray.Quit()
	})

	go watchShowEvent()
	go watchAltEnter()
	go runNativeIntro()
}

func onExit() {
	exiting = true
}

func main() {
	runtime.LockOSThread()
	if !acquireSingleton() {
		return
	}
	systray.Run(onReady, onExit)
}

func setWindowIcon(h uintptr) {
	if h == 0 || len(iconBytes) == 0 {
		return
	}
	big := iconFromIco(iconBytes, 32, 32)
	small := iconFromIco(iconBytes, 16, 16)
	if big != 0 {
		procSendMessage.Call(h, wmSetIcon, iconBig, big)
	}
	if small != 0 {
		procSendMessage.Call(h, wmSetIcon, iconSmall, small)
	}
}

func iconFromIco(data []byte, wantW, wantH int) uintptr {
	if len(data) < 6 {
		return 0
	}
	count := int(binary.LittleEndian.Uint16(data[4:6]))
	if len(data) < 6+count*16 {
		return 0
	}
	best := -1
	bestScore := int(^uint(0) >> 1)
	for i := 0; i < count; i++ {
		off := 6 + i*16
		w := int(data[off])
		if w == 0 {
			w = 256
		}
		h := int(data[off+1])
		if h == 0 {
			h = 256
		}
		size := int(binary.LittleEndian.Uint32(data[off+8:]))
		imgOff := int(binary.LittleEndian.Uint32(data[off+12:]))
		if imgOff+size > len(data) || size <= 0 {
			continue
		}
		score := abs(w-wantW) + abs(h-wantH)
		if score < bestScore {
			bestScore = score
			best = i
		}
	}
	if best < 0 {
		return 0
	}
	off := 6 + best*16
	size := int(binary.LittleEndian.Uint32(data[off+8:]))
	imgOff := int(binary.LittleEndian.Uint32(data[off+12:]))
	p := unsafe.Pointer(&data[imgOff])
	r, _, _ := procCreateIconFromRes.Call(uintptr(p), uintptr(size), 1, 0x00030000, 0, 0, 0)
	return r
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
