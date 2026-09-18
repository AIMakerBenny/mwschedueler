//go:build windows

package main

import (
	_ "embed"
	"encoding/binary"
	"encoding/json"
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
	vkReturn         = 0x0D
	vkMenu           = 0x12
	wmSetIcon        = 0x0080
	iconSmall        = 0
	iconBig          = 1
)
type rect struct{ Left, Top, Right, Bottom int32 }

type monitorInfo struct {
	CbSize    uint32
	RcMonitor rect
	RcWork    rect
	DwFlags   uint32
}

//go:embed assets/mawang.ico
var iconBytes []byte


var (
	user32                  = syscall.NewLazyDLL("user32.dll")
	kernel32                = syscall.NewLazyDLL("kernel32.dll")
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


	appStartOnce  sync.Once
	appReadyMu    sync.Mutex
	appReadyState bool

	startupMu     sync.Mutex
	startupLocked = true
)

const appBridgeScript = `(function(){
  if(window.__mwsDesktopBridgeInstalled)return;
  window.__mwsDesktopBridgeInstalled=true;

  function norm(v){return String(v||'').replace(/\\s+/g,'').toLowerCase();}

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

  var lastReady=null;
  var checkTimer=0;

  function gateIsVisible(){
    var body=document.body;
    var gate=document.getElementById('mwsAccessGate');
    if(!body||!gate)return true;
    if(body.classList.contains('mws-gated'))return true;
    if(!gate.classList.contains('hidden'))return true;
    var gs=getComputedStyle(gate);
    return gs.display!=='none'&&gs.visibility!=='hidden'&&Number(gs.opacity||1)!==0;
  }

  function loginIsReady(){
    var gate=document.getElementById('mwsAccessGate');
    if(!gate||!gateIsVisible())return false;
    return !!(
      gate.querySelector('.mws-login-shell') &&
      document.getElementById('mwsModeAdmin') &&
      document.getElementById('mwsModePublic') &&
      document.getElementById('mwsLoginForm') &&
      document.getElementById('mwsLoginSubmit')
    );
  }

  function shellIsReady(){
    var body=document.body;
    if(!body)return false;
    var mode=String(body.dataset.mwsMode||'');
    if(mode!=='admin'&&mode!=='public')return false;
    return !!(
      document.querySelector('.app') &&
      document.querySelector('.topbar') &&
      document.querySelector('.sidebar') &&
      document.getElementById('dashboard') &&
      document.getElementById('calendar') &&
      document.querySelector('.section.active')
    );
  }

  function reportReady(next){
    next=!!next;
    if(lastReady===next)return;
    lastReady=next;
    try{
      if(next)Promise.resolve(window.__mwsAppReady());
      else Promise.resolve(window.__mwsAppNotReady());
    }catch(_){}
  }

  function checkReady(){
    clearTimeout(checkTimer);
    installDesktopChrome();
    var ready=false;
    try{ready=loginIsReady()||(!gateIsVisible()&&shellIsReady());}catch(_){ready=false;}
    reportReady(ready);
    if(!ready)checkTimer=setTimeout(checkReady,250);
  }

  window.addEventListener('mws:app-ready',checkReady);
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(checkReady,150);},{once:true});
  }else{
    setTimeout(checkReady,150);
  }

  try{
    var observer=new MutationObserver(function(){setTimeout(checkReady,0);});
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','data-mws-mode']});
  }catch(_){}

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

var desktopLogMu sync.Mutex

func logDesktop(format string, args ...interface{}) {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	dir := filepath.Join(base, "MawangSchedulerDesktop")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return
	}
	desktopLogMu.Lock()
	defer desktopLogMu.Unlock()
	f, err := os.OpenFile(filepath.Join(dir, "desktop.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0600)
	if err != nil {
		return
	}
	defer f.Close()
	_, _ = fmt.Fprintf(f, "%s "+format+"\n", append([]interface{}{time.Now().Format(time.RFC3339)}, args...)...)
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

func setAppReadyState(ready bool) {
	appReadyMu.Lock()
	changed := appReadyState != ready
	appReadyState = ready
	appReadyMu.Unlock()
	if changed {
		notifyIntroReadiness()
	}
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
		logDesktop("WebView2 creation failed")
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

	if err := w.Bind("__mwsToggleFullscreen", func() bool { return toggleFullscreen() }); err != nil {
		logDesktop("WebView bind __mwsToggleFullscreen failed: %v", err)
	}
	if err := w.Bind("__mwsAppReady", func() { setAppReadyState(true) }); err != nil {
		logDesktop("WebView bind __mwsAppReady failed: %v", err)
	}
	if err := w.Bind("__mwsAppNotReady", func() { setAppReadyState(false) }); err != nil {
		logDesktop("WebView bind __mwsAppNotReady failed: %v", err)
	}
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
	name, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopNativeMutexV100C")
	m, _, err := procCreateMutex.Call(0, 0, uintptr(unsafe.Pointer(name)))
	if m == 0 {
		return true
	}
	if errno, ok := err.(syscall.Errno); ok && errno == syscall.ERROR_ALREADY_EXISTS {
		evName, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopShowEventV100C")
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
	evName, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopShowEventV100C")
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
		closeIntroForExit()

		wvMu.Lock()
		aw := wv
		wvMu.Unlock()
		if aw != nil {
			aw.Terminate()
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
