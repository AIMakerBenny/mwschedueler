//go:build windows

package main

import (
	"embed"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"sort"
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
	wmClose          = 0x0010
	wmSysCommand     = 0x0112
	scMinimize       = 0xF020
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
	vkMenu           = 0x12
	vkReturn         = 0x0D
	wmSetIcon        = 0x0080
	wmDestroy        = 0x0002
	wmPaint          = 0x000F
	wmEraseBkgnd     = 0x0014
	wmTimer          = 0x0113
	wmKeyDown        = 0x0100
	wmLButtonDown    = 0x0201
	wmAppStopIntro   = 0x8001
	vkEscape         = 0x1B
	vkSpace          = 0x20
	iconSmall        = 0
	iconBig          = 1
	wsPopup          = 0x80000000
	wsExTopmost      = 0x00000008
	wsExToolWindow   = 0x00000080
	wsExLayered      = 0x00080000
	lwaAlpha         = 0x00000002
	dtCenter         = 0x00000001
	dtVCenter        = 0x00000004
	dtSingleLine     = 0x00000020
	transparentBk    = 1
	fontWeightBold   = 700
	smCxScreen       = 0
	smCyScreen       = 1
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
	RgbReserved [32]byte
}

type wndClassEx struct {
	CbSize     uint32
	Style      uint32
	WndProc    uintptr
	ClsExtra   int32
	WndExtra   int32
	Instance   uintptr
	Icon       uintptr
	Cursor     uintptr
	Background uintptr
	MenuName   *uint16
	ClassName  *uint16
	IconSm     uintptr
}

type gdiplusStartupInput struct {
	Version                  uint32
	DebugEventCallback       uintptr
	SuppressBackgroundThread int32
	SuppressExternalCodecs   int32
}

type introSession struct {
	mu          sync.Mutex
	baseHwnd    uintptr
	imageHwnd   uintptr
	textHwnd    uintptr
	image       uintptr
	gdipToken   uintptr
	started     time.Time
	textShownAt time.Time
	fadeOutAt   time.Time
	phase       int
	skip        bool
	stopping    bool
}

//go:embed assets/mawang.ico
var iconBytes []byte

//go:embed assets/intro-parts/*.txt
var introAssetParts embed.FS

var (
	user32                  = syscall.NewLazyDLL("user32.dll")
	kernel32                = syscall.NewLazyDLL("kernel32.dll")
	gdi32                   = syscall.NewLazyDLL("gdi32.dll")
	gdiplus                 = syscall.NewLazyDLL("gdiplus.dll")
	procShowWindow          = user32.NewProc("ShowWindow")
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
	procRegisterClassEx     = user32.NewProc("RegisterClassExW")
	procCreateWindowEx      = user32.NewProc("CreateWindowExW")
	procDefWindowProc       = user32.NewProc("DefWindowProcW")
	procGetMessage          = user32.NewProc("GetMessageW")
	procTranslateMessage    = user32.NewProc("TranslateMessage")
	procDispatchMessage     = user32.NewProc("DispatchMessageW")
	procPostQuitMessage     = user32.NewProc("PostQuitMessage")
	procDestroyWindow       = user32.NewProc("DestroyWindow")
	procPostMessage         = user32.NewProc("PostMessageW")
	procSetTimer            = user32.NewProc("SetTimer")
	procKillTimer           = user32.NewProc("KillTimer")
	procInvalidateRect      = user32.NewProc("InvalidateRect")
	procBeginPaint          = user32.NewProc("BeginPaint")
	procEndPaint            = user32.NewProc("EndPaint")
	procFillRect            = user32.NewProc("FillRect")
	procGetClientRect       = user32.NewProc("GetClientRect")
	procSetLayeredAlpha     = user32.NewProc("SetLayeredWindowAttributes")
	procGetSystemMetrics    = user32.NewProc("GetSystemMetrics")
	procDrawText            = user32.NewProc("DrawTextW")
	procCreateSolidBrush    = gdi32.NewProc("CreateSolidBrush")
	procDeleteObject        = gdi32.NewProc("DeleteObject")
	procCreateFont          = gdi32.NewProc("CreateFontW")
	procSelectObject        = gdi32.NewProc("SelectObject")
	procSetBkMode           = gdi32.NewProc("SetBkMode")
	procSetTextColor        = gdi32.NewProc("SetTextColor")
	procGdiplusStartup      = gdiplus.NewProc("GdiplusStartup")
	procGdiplusShutdown     = gdiplus.NewProc("GdiplusShutdown")
	procGdipLoadImage       = gdiplus.NewProc("GdipLoadImageFromFile")
	procGdipDisposeImage    = gdiplus.NewProc("GdipDisposeImage")
	procGdipCreateGraphics  = gdiplus.NewProc("GdipCreateFromHDC")
	procGdipDeleteGraphics  = gdiplus.NewProc("GdipDeleteGraphics")
	procGdipGraphicsClear   = gdiplus.NewProc("GdipGraphicsClear")
	procGdipDrawImageRectI  = gdiplus.NewProc("GdipDrawImageRectI")
	procGdipGetImageWidth   = gdiplus.NewProc("GdipGetImageWidth")
	procGdipGetImageHeight  = gdiplus.NewProc("GdipGetImageHeight")
	procGdipInterpolation   = gdiplus.NewProc("GdipSetInterpolationMode")
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

	introMu        sync.Mutex
	activeIntro    *introSession
	introWndProcCB = syscall.NewCallback(introWndProc)
	introAssetOnce sync.Once
	introAssetPath string
	introAssetErr  error

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

func ensureIntroAsset() (string, error) {
	introAssetOnce.Do(func() {
		names, err := fs.Glob(introAssetParts, "assets/intro-parts/*.txt")
		if err != nil || len(names) == 0 {
			introAssetErr = fmt.Errorf("intro asset parts unavailable")
			return
		}
		sort.Strings(names)
		var encoded strings.Builder
		for _, name := range names {
			part, err := introAssetParts.ReadFile(name)
			if err != nil {
				introAssetErr = err
				return
			}
			encoded.WriteString(strings.TrimSpace(string(part)))
		}
		raw, err := base64.StdEncoding.DecodeString(encoded.String())
		if err != nil {
			introAssetErr = err
			return
		}
		if len(raw) < 4 || raw[0] != 0xFF || raw[1] != 0xD8 || raw[len(raw)-2] != 0xFF || raw[len(raw)-1] != 0xD9 {
			introAssetErr = fmt.Errorf("intro jpeg validation failed")
			return
		}
		base := os.Getenv("LOCALAPPDATA")
		if base == "" {
			base = os.TempDir()
		}
		dir := filepath.Join(base, "MawangSchedulerDesktop")
		if err := os.MkdirAll(dir, 0700); err != nil {
			introAssetErr = err
			return
		}
		path := filepath.Join(dir, "mawang-intro-native.jpg")
		if err := os.WriteFile(path, raw, 0600); err != nil {
			introAssetErr = err
			return
		}
		introAssetPath = path
	})
	return introAssetPath, introAssetErr
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
	if session == nil {
		return
	}
	session.mu.Lock()
	target := session.imageHwnd
	if session.phase >= 1 {
		target = session.textHwnd
	}
	base := session.baseHwnd
	session.mu.Unlock()
	if base != 0 {
		procShowWindow.Call(base, swShow)
	}
	if target != 0 {
		procShowWindow.Call(target, swShow)
		procSetForegroundWindow.Call(target)
	}
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

func registerIntroClass() error {
	className, _ := syscall.UTF16PtrFromString("MawangSchedulerNativeIntroV080")
	instance, _, _ := procGetModuleHandle.Call(0)
	wc := wndClassEx{
		CbSize:    uint32(unsafe.Sizeof(wndClassEx{})),
		WndProc:   introWndProcCB,
		Instance:  instance,
		ClassName: className,
	}
	r, _, err := procRegisterClassEx.Call(uintptr(unsafe.Pointer(&wc)))
	if r == 0 {
		if errno, ok := err.(syscall.Errno); !ok || errno != syscall.Errno(1410) {
			return fmt.Errorf("register intro class: %v", err)
		}
	}
	return nil
}

func createIntroWindow(exStyle, style uintptr, width, height int32) uintptr {
	className, _ := syscall.UTF16PtrFromString("MawangSchedulerNativeIntroV080")
	title, _ := syscall.UTF16PtrFromString(appTitle)
	instance, _, _ := procGetModuleHandle.Call(0)
	h, _, _ := procCreateWindowEx.Call(
		exStyle,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(title)),
		style,
		0, 0, uintptr(width), uintptr(height),
		0, 0, instance, 0,
	)
	return h
}

func setIntroAlpha(h uintptr, alpha int) {
	if h == 0 {
		return
	}
	if alpha < 0 {
		alpha = 0
	}
	if alpha > 255 {
		alpha = 255
	}
	procSetLayeredAlpha.Call(h, 0, uintptr(alpha), lwaAlpha)
}

func introEase(t float64) float64 {
	if t < 0 {
		t = 0
	}
	if t > 1 {
		t = 1
	}
	return t * t * (3 - 2*t)
}

func introAlpha(t time.Duration, duration time.Duration, reverse bool) int {
	if duration <= 0 {
		if reverse {
			return 0
		}
		return 255
	}
	v := introEase(float64(t) / float64(duration))
	if reverse {
		v = 1 - v
	}
	return int(v * 255)
}

func loadNativeIntroImage(path string) (uintptr, uintptr, error) {
	var token uintptr
	input := gdiplusStartupInput{Version: 1}
	status, _, _ := procGdiplusStartup.Call(
		uintptr(unsafe.Pointer(&token)),
		uintptr(unsafe.Pointer(&input)),
		0,
	)
	if status != 0 || token == 0 {
		return 0, 0, fmt.Errorf("gdiplus startup failed: %d", status)
	}
	wide, err := syscall.UTF16PtrFromString(path)
	if err != nil {
		procGdiplusShutdown.Call(token)
		return 0, 0, err
	}
	var image uintptr
	status, _, _ = procGdipLoadImage.Call(uintptr(unsafe.Pointer(wide)), uintptr(unsafe.Pointer(&image)))
	if status != 0 || image == 0 {
		procGdiplusShutdown.Call(token)
		return 0, 0, fmt.Errorf("intro image load failed: %d", status)
	}
	return token, image, nil
}

func paintBlack(hdc uintptr, r *rect) {
	brush, _, _ := procCreateSolidBrush.Call(0)
	if brush != 0 {
		procFillRect.Call(hdc, uintptr(unsafe.Pointer(r)), brush)
		procDeleteObject.Call(brush)
	}
}

func paintIntroImage(session *introSession, hdc uintptr, r rect) {
	paintBlack(hdc, &r)
	if session == nil || session.image == 0 {
		return
	}
	var graphics uintptr
	status, _, _ := procGdipCreateGraphics.Call(hdc, uintptr(unsafe.Pointer(&graphics)))
	if status != 0 || graphics == 0 {
		return
	}
	defer procGdipDeleteGraphics.Call(graphics)
	procGdipGraphicsClear.Call(graphics, 0xFF000000)
	procGdipInterpolation.Call(graphics, 7)

	var iw, ih uint32
	procGdipGetImageWidth.Call(session.image, uintptr(unsafe.Pointer(&iw)))
	procGdipGetImageHeight.Call(session.image, uintptr(unsafe.Pointer(&ih)))
	cw := r.Right - r.Left
	ch := r.Bottom - r.Top
	if iw == 0 || ih == 0 || cw <= 0 || ch <= 0 {
		return
	}
	imageRatio := float64(iw) / float64(ih)
	clientRatio := float64(cw) / float64(ch)
	dx, dy := int32(0), int32(0)
	dw, dh := cw, ch
	if imageRatio > clientRatio {
		dw = int32(float64(ch) * imageRatio)
		dx = (cw - dw) / 2
	} else {
		dh = int32(float64(cw) / imageRatio)
		dy = (ch - dh) / 2
	}
	procGdipDrawImageRectI.Call(session.image, uintptr(dx), uintptr(dy), uintptr(dw), uintptr(dh))
}

func createIntroFont(height int32, face string) uintptr {
	name, _ := syscall.UTF16PtrFromString(face)
	h, _, _ := procCreateFont.Call(
		uintptr(height), 0, 0, 0,
		fontWeightBold, 0, 0, 0,
		1, 0, 0, 5, 0,
		uintptr(unsafe.Pointer(name)),
	)
	return h
}

func drawCenteredText(hdc uintptr, text string, r rect, font uintptr, color uintptr) {
	if font == 0 {
		return
	}
	old, _, _ := procSelectObject.Call(hdc, font)
	defer procSelectObject.Call(hdc, old)
	procSetBkMode.Call(hdc, transparentBk)
	procSetTextColor.Call(hdc, color)
	wide, _ := syscall.UTF16PtrFromString(text)
	procDrawText.Call(
		hdc,
		uintptr(unsafe.Pointer(wide)),
		uintptr(^uint32(0)),
		uintptr(unsafe.Pointer(&r)),
		dtCenter|dtVCenter|dtSingleLine,
	)
}

func paintIntroText(hdc uintptr, r rect) {
	paintBlack(hdc, &r)
	w := r.Right - r.Left
	h := r.Bottom - r.Top
	if w <= 0 || h <= 0 {
		return
	}

	mainSize := -h / 9
	if mainSize > -64 {
		mainSize = -64
	}
	if mainSize < -132 {
		mainSize = -132
	}
	koSize := -h / 32
	if koSize > -22 {
		koSize = -22
	}
	if koSize < -38 {
		koSize = -38
	}

	mainFont := createIntroFont(mainSize, "Segoe UI")
	koFont := createIntroFont(koSize, "Malgun Gothic")
	if mainFont != 0 {
		defer procDeleteObject.Call(mainFont)
	}
	if koFont != 0 {
		defer procDeleteObject.Call(koFont)
	}

	center := h / 2
	mainRect := rect{Left: 0, Top: center - h/8, Right: w, Bottom: center + h/30}
	koRect := rect{Left: 0, Top: center + h/18, Right: w, Bottom: center + h/7}
	drawCenteredText(hdc, "Mawang Scheduler", mainRect, mainFont, 0x00FFFFFF)
	drawCenteredText(hdc, "마왕스케줄러", koRect, koFont, 0x00E5E5E5)
}

func introWndProc(h uintptr, msg uint32, wparam, lparam uintptr) uintptr {
	session := currentIntro()
	switch msg {
	case wmPaint:
		var ps paintStruct
		hdc, _, _ := procBeginPaint.Call(h, uintptr(unsafe.Pointer(&ps)))
		if hdc != 0 {
			var r rect
			procGetClientRect.Call(h, uintptr(unsafe.Pointer(&r)))
			if session != nil && h == session.imageHwnd {
				paintIntroImage(session, hdc, r)
			} else if session != nil && h == session.textHwnd {
				paintIntroText(hdc, r)
			} else {
				paintBlack(hdc, &r)
			}
			procEndPaint.Call(h, uintptr(unsafe.Pointer(&ps)))
		}
		return 0
	case wmEraseBkgnd:
		return 1
	case wmLButtonDown:
		if session != nil {
			requestIntroSkip(session)
		}
		return 0
	case wmKeyDown:
		if session != nil && (wparam == vkEscape || wparam == vkSpace || wparam == vkReturn) {
			requestIntroSkip(session)
			return 0
		}
	case wmTimer:
		if session != nil && h == session.baseHwnd {
			updateNativeIntro(session)
			return 0
		}
	case wmAppStopIntro:
		if session != nil {
			stopIntroOnThread(session)
		}
		return 0
	case wmDestroy:
		if session != nil && h == session.baseHwnd {
			procPostQuitMessage.Call(0)
		}
		return 0
	}
	r, _, _ := procDefWindowProc.Call(h, uintptr(msg), wparam, lparam)
	return r
}

func requestIntroSkip(session *introSession) {
	if session == nil {
		return
	}
	session.mu.Lock()
	session.skip = true
	if session.phase == 0 {
		session.phase = 1
		session.textShownAt = time.Now()
		image := session.imageHwnd
		text := session.textHwnd
		session.mu.Unlock()
		if image != 0 {
			procShowWindow.Call(image, swHide)
		}
		if text != 0 {
			setIntroAlpha(text, 255)
			procShowWindow.Call(text, swShow)
			procSetForegroundWindow.Call(text)
		}
		return
	}
	session.mu.Unlock()
}

func beginIntroText(session *introSession, now time.Time) {
	session.mu.Lock()
	if session.phase != 0 {
		session.mu.Unlock()
		return
	}
	session.phase = 1
	session.textShownAt = now
	image := session.imageHwnd
	text := session.textHwnd
	session.mu.Unlock()

	if image != 0 {
		procShowWindow.Call(image, swHide)
	}
	if text != 0 {
		setIntroAlpha(text, 0)
		procShowWindow.Call(text, swShow)
		procSetForegroundWindow.Call(text)
		procInvalidateRect.Call(text, 0, 0)
	}
}

func updateNativeIntro(session *introSession) {
	if session == nil || exiting {
		return
	}
	now := time.Now()
	session.mu.Lock()
	phase := session.phase
	skip := session.skip
	started := session.started
	textShown := session.textShownAt
	fadeOutAt := session.fadeOutAt
	imageHwnd := session.imageHwnd
	textHwnd := session.textHwnd
	session.mu.Unlock()

	const (
		imageFadeIn  = 1500 * time.Millisecond
		imageHold    = 2200 * time.Millisecond
		imageFadeOut = 1500 * time.Millisecond
		textFadeIn   = 1600 * time.Millisecond
		textHold     = 1300 * time.Millisecond
		textFadeOut  = 1500 * time.Millisecond
	)

	if phase == 0 {
		elapsed := now.Sub(started)
		if skip {
			beginIntroText(session, now)
			return
		}
		switch {
		case elapsed < imageFadeIn:
			setIntroAlpha(imageHwnd, introAlpha(elapsed, imageFadeIn, false))
		case elapsed < imageFadeIn+imageHold:
			setIntroAlpha(imageHwnd, 255)
		case elapsed < imageFadeIn+imageHold+imageFadeOut:
			setIntroAlpha(imageHwnd, introAlpha(elapsed-(imageFadeIn+imageHold), imageFadeOut, true))
		default:
			beginIntroText(session, now)
		}
		return
	}

	if phase == 1 {
		elapsed := now.Sub(textShown)
		if skip {
			setIntroAlpha(textHwnd, 255)
		} else if elapsed < textFadeIn {
			setIntroAlpha(textHwnd, introAlpha(elapsed, textFadeIn, false))
		} else {
			setIntroAlpha(textHwnd, 255)
		}

		if isAppReady() && (skip || elapsed >= textFadeIn+textHold) {
			session.mu.Lock()
			if session.phase == 1 {
				session.phase = 2
				session.fadeOutAt = now
			}
			session.mu.Unlock()
		}
		return
	}

	if phase == 2 {
		duration := textFadeOut
		if skip {
			duration = 420 * time.Millisecond
		}
		elapsed := now.Sub(fadeOutAt)
		setIntroAlpha(textHwnd, introAlpha(elapsed, duration, true))
		if elapsed >= duration {
			completeNativeIntro(session)
		}
	}
}

func completeNativeIntro(session *introSession) {
	if session == nil {
		return
	}
	session.mu.Lock()
	if session.stopping {
		session.mu.Unlock()
		return
	}
	session.stopping = true
	base := session.baseHwnd
	image := session.imageHwnd
	text := session.textHwnd
	session.mu.Unlock()

	procKillTimer.Call(base, 1)
	if image != 0 {
		procShowWindow.Call(image, swHide)
	}
	if text != 0 {
		procShowWindow.Call(text, swHide)
	}
	if base != 0 {
		procShowWindow.Call(base, swHide)
	}

	startupMu.Lock()
	startupLocked = false
	startupMu.Unlock()

	stateMu.Lock()
	lastMaximized = true
	lastStateValid = true
	stateMu.Unlock()

	showWindow()

	if image != 0 {
		procDestroyWindow.Call(image)
	}
	if text != 0 {
		procDestroyWindow.Call(text)
	}
	if base != 0 {
		procDestroyWindow.Call(base)
	}
}

func stopIntroOnThread(session *introSession) {
	if session == nil {
		return
	}
	session.mu.Lock()
	if session.stopping {
		session.mu.Unlock()
		return
	}
	session.stopping = true
	base := session.baseHwnd
	image := session.imageHwnd
	text := session.textHwnd
	session.mu.Unlock()

	if base != 0 {
		procKillTimer.Call(base, 1)
		procShowWindow.Call(base, swHide)
	}
	if image != 0 {
		procShowWindow.Call(image, swHide)
		procDestroyWindow.Call(image)
	}
	if text != 0 {
		procShowWindow.Call(text, swHide)
		procDestroyWindow.Call(text)
	}
	if base != 0 {
		procDestroyWindow.Call(base)
	}
}

func stopNativeIntro() {
	session := currentIntro()
	if session == nil {
		return
	}
	session.mu.Lock()
	base := session.baseHwnd
	image := session.imageHwnd
	text := session.textHwnd
	session.mu.Unlock()
	if image != 0 {
		procShowWindow.Call(image, swHide)
	}
	if text != 0 {
		procShowWindow.Call(text, swHide)
	}
	if base != 0 {
		procShowWindow.Call(base, swHide)
		procPostMessage.Call(base, wmAppStopIntro, 0, 0)
	}
}

func runIntroWindow() {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	introMu.Lock()
	if activeIntro != nil {
		introMu.Unlock()
		return
	}
	introMu.Unlock()

	if err := registerIntroClass(); err != nil {
		startApp()
		return
	}

	imagePath, assetErr := ensureIntroAsset()
	var token, image uintptr
	if assetErr == nil {
		token, image, _ = loadNativeIntroImage(imagePath)
	}

	width, _, _ := procGetSystemMetrics.Call(smCxScreen)
	height, _, _ := procGetSystemMetrics.Call(smCyScreen)
	if width == 0 || height == 0 {
		width, height = 1920, 1080
	}

	base := createIntroWindow(wsExTopmost|wsExToolWindow, wsPopup, int32(width), int32(height))
	imageWnd := createIntroWindow(wsExTopmost|wsExToolWindow|wsExLayered, wsPopup, int32(width), int32(height))
	textWnd := createIntroWindow(wsExTopmost|wsExToolWindow|wsExLayered, wsPopup, int32(width), int32(height))
	if base == 0 || imageWnd == 0 || textWnd == 0 {
		if image != 0 {
			procGdipDisposeImage.Call(image)
		}
		if token != 0 {
			procGdiplusShutdown.Call(token)
		}
		startApp()
		return
	}

	session := &introSession{
		baseHwnd:  base,
		imageHwnd: imageWnd,
		textHwnd:  textWnd,
		image:     image,
		gdipToken: token,
		started:   time.Now(),
		phase:     0,
	}
	introMu.Lock()
	activeIntro = session
	introMu.Unlock()

	setIntroAlpha(imageWnd, 0)
	setIntroAlpha(textWnd, 0)
	procShowWindow.Call(base, swShow)
	procShowWindow.Call(imageWnd, swShow)
	procSetForegroundWindow.Call(imageWnd)
	procInvalidateRect.Call(imageWnd, 0, 0)
	procSetTimer.Call(base, 1, 16, 0)

	// The actual Scheduler WebView starts hidden at the same time as the native intro.
	startApp()

	var m winMsg
	for !exiting {
		r, _, _ := procGetMessage.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if int32(r) <= 0 {
			break
		}
		procTranslateMessage.Call(uintptr(unsafe.Pointer(&m)))
		procDispatchMessage.Call(uintptr(unsafe.Pointer(&m)))
	}

	if image != 0 {
		procGdipDisposeImage.Call(image)
	}
	if token != 0 {
		procGdiplusShutdown.Call(token)
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
	name, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopNativeMutexV080")
	m, _, err := procCreateMutex.Call(0, 0, uintptr(unsafe.Pointer(name)))
	if m == 0 {
		return true
	}
	if errno, ok := err.(syscall.Errno); ok && errno == syscall.ERROR_ALREADY_EXISTS {
		evName, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopShowEventV080")
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
	hideWindow()
	startupMu.Lock()
	startupLocked = true
	startupMu.Unlock()
	go runIntroWindow()
}
func watchShowEvent() {
	evName, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopShowEventV080")
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

		stopNativeIntro()
		systray.Quit()
	})

	go watchShowEvent()
	go watchAltEnter()
	go runIntroWindow()
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
