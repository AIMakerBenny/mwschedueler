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
	vkMenu           = 0x12
	vkReturn         = 0x0D
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

type introSession struct {
	w    webview.WebView
	hwnd uintptr
	done sync.Once
}

//go:embed assets/mawang.ico
var iconBytes []byte

//go:embed assets/mawang-intro.b64
var introImageB64 string

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

	introMu     sync.Mutex
	activeIntro *introSession

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

const introHTMLTemplate = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mawang Scheduler</title>
<style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}
body{user-select:none}
#stage{position:fixed;inset:0;background:#000;overflow:hidden}
#photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:0;transform:scale(1.01);transition:opacity .72s ease,transform 1s ease}
#stage.photo-in #photo{opacity:1;transform:scale(1)}
#stage.photo-out #photo{opacity:0}
#title{position:absolute;left:50%;top:50%;width:min(92vw,1280px);text-align:center;color:#fff;opacity:0;filter:blur(9px);transform:translate(-50%,-44%) scale(.98);transition:opacity .82s ease,filter .82s ease,transform 1s cubic-bezier(.2,.8,.2,1)}
#stage.title-in #title{opacity:1;filter:blur(0);transform:translate(-50%,-50%) scale(1)}
#stage.title-out #title{opacity:0;filter:blur(5px);transform:translate(-50%,-53%) scale(1.01)}
#titleMain{font:900 clamp(46px,6.6vw,108px)/.95 "Segoe UI",Arial,sans-serif;letter-spacing:-.055em;text-shadow:0 0 34px rgba(130,185,255,.18),0 16px 48px rgba(0,0,0,.84)}
#titleKo{margin-top:20px;font:700 clamp(17px,1.55vw,27px)/1.2 "Segoe UI","Malgun Gothic",sans-serif;letter-spacing:.30em;color:#dfe1e9}
#line{width:0;height:2px;margin:25px auto 0;background:linear-gradient(90deg,transparent,#8dbdff 24%,#e0a1d7 76%,transparent);transition:width 1s ease .18s}
#stage.title-in #line{width:min(440px,44vw)}
#status{position:absolute;left:50%;bottom:25px;transform:translateX(-50%);font:600 10px/1 "Segoe UI","Malgun Gothic",sans-serif;letter-spacing:.14em;color:rgba(255,255,255,.30);opacity:0;transition:opacity .45s ease}
#stage.waiting #status{opacity:1}
</style>
</head>
<body>
<div id="stage">
  <img id="photo" alt="">
  <div id="title">
    <div id="titleMain">Mawang Scheduler</div>
    <div id="titleKo">마왕스케줄러</div>
    <div id="line"></div>
  </div>
  <div id="status">STARTING...</div>
</div>
<script>
(function(){
  var stage=document.getElementById('stage');
  var photo=document.getElementById('photo');
  var titleReady=false;
  var ending=false;
  var finished=false;
  var pollTimer=0;
  var imageSrc='data:image/webp;base64,__INTRO_B64__';

  function appIsReady(){
    try{
      Promise.resolve(window.__mwsIsAppReady()).then(function(ready){
        if(ready){
          if(titleReady)beginHandoff();
        }else if(titleReady){
          stage.classList.add('waiting');
        }
      }).catch(function(){});
    }catch(_){}
  }

  function beginHandoff(){
    if(ending||finished)return;
    ending=true;
    clearInterval(pollTimer);
    stage.classList.remove('waiting');
    stage.classList.add('title-out');
    setTimeout(function(){
      if(finished)return;
      finished=true;
      try{window.__mwsIntroDone();}catch(_){}
    },760);
  }

  function showTitle(){
    stage.classList.add('photo-out');
    setTimeout(function(){
      stage.classList.add('title-in');
      setTimeout(function(){
        titleReady=true;
        appIsReady();
      },1400);
    },620);
  }

  function skip(){
    if(ending||finished)return;
    stage.classList.add('photo-out');
    stage.classList.add('title-in');
    titleReady=true;
    appIsReady();
  }

  stage.addEventListener('click',skip,true);
  window.addEventListener('keydown',function(e){
    if(e.code==='Space'||e.key===' '||e.key==='Escape'){
      e.preventDefault();
      skip();
    }
  },true);

  photo.onload=function(){
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){stage.classList.add('photo-in');});
    });
    setTimeout(showTitle,2500);
  };
  photo.onerror=showTitle;
  photo.src=imageSrc;

  pollTimer=setInterval(appIsReady,150);
})();
</script>
</body>
</html>`

func appDataPath() string {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	dir := filepath.Join(base, "MawangSchedulerDesktop", "WebView2")
	_ = os.MkdirAll(dir, 0700)
	return dir
}

func introDataPath() string {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	dir := filepath.Join(base, "MawangSchedulerDesktop", "IntroWebView2")
	_ = os.MkdirAll(dir, 0700)
	return dir
}

func introHTML() string {
	return strings.Replace(introHTMLTemplate, "__INTRO_B64__", strings.TrimSpace(introImageB64), 1)
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

func hideIntroNative() {
	session := currentIntro()
	if session != nil && session.hwnd != 0 {
		procShowWindow.Call(session.hwnd, swHide)
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

func makeIntroBorderless(h uintptr) {
	if h == 0 {
		return
	}
	style, _, _ := procGetWindowLongPtr.Call(h, ^uintptr(15))
	style &^= wsCaption | wsThickFrame | wsMinBox | wsMaxBox | wsSysMenu
	procSetWindowLongPtr.Call(h, ^uintptr(15), style)
	mon, _, _ := procMonitorFromWindow.Call(h, monitorNearest)
	mi := monitorInfo{CbSize: uint32(unsafe.Sizeof(monitorInfo{}))}
	if mon != 0 {
		procGetMonitorInfo.Call(mon, uintptr(unsafe.Pointer(&mi)))
		r := mi.RcMonitor
		procSetWindowPos.Call(h, 0, uintptr(r.Left), uintptr(r.Top), uintptr(r.Right-r.Left), uintptr(r.Bottom-r.Top), swpFrameChanged|swpNoOwnerZOrder)
	}
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

func runIntroWindow() {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	w := webview.NewWithOptions(webview.WebViewOptions{
		Debug:         false,
		AutoFocus:     true,
		DataPath:      introDataPath(),
		WindowOptions: webview.WindowOptions{Title: appTitle, Width: 1280, Height: 720, Center: true},
	})
	if w == nil {
		startApp()
		return
	}
	defer w.Destroy()

	session := &introSession{w: w, hwnd: uintptr(w.Window())}
	introMu.Lock()
	activeIntro = session
	introMu.Unlock()

	setWindowIcon(session.hwnd)

	w.Bind("__mwsIsAppReady", func() bool {
		return isAppReady()
	})
	w.Bind("__mwsIntroDone", func() {
		go finishIntro(session)
	})

	w.SetHtml(introHTML())
	makeIntroBorderless(session.hwnd)
	procShowWindow.Call(session.hwnd, swShow)
	procSetForegroundWindow.Call(session.hwnd)

	startApp()
	w.Run()

	introMu.Lock()
	if activeIntro == session {
		activeIntro = nil
	}
	introMu.Unlock()
}

func finishIntro(session *introSession) {
	if session == nil {
		return
	}
	session.done.Do(func() {
		if exiting || !isAppReady() {
			return
		}

		wvMu.Lock()
		h := hwnd
		aw := wv
		wvMu.Unlock()
		if h == 0 || aw == nil {
			return
		}

		// Always remove the intro from the screen before exposing the app.
		if session.hwnd != 0 {
			procShowWindow.Call(session.hwnd, swHide)
		}

		startupMu.Lock()
		startupLocked = false
		startupMu.Unlock()

		stateMu.Lock()
		lastMaximized = true
		lastStateValid = true
		stateMu.Unlock()

		procShowWindow.Call(h, swMaximize)
		procSetForegroundWindow.Call(h)

		session.w.Dispatch(func() {
			session.w.Terminate()
		})
	})
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
	name, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopNativeMutexV071")
	m, _, err := procCreateMutex.Call(0, 0, uintptr(unsafe.Pointer(name)))
	if m == 0 {
		return true
	}
	if errno, ok := err.(syscall.Errno); ok && errno == syscall.ERROR_ALREADY_EXISTS {
		evName, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopShowEventV071")
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
	go runIntroWindow()
}
func watchShowEvent() {
	evName, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopShowEventV071")
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
		if session != nil {
			if session.hwnd != 0 {
				procShowWindow.Call(session.hwnd, swHide)
			}
			session.w.Dispatch(func() { session.w.Terminate() })
		}

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
