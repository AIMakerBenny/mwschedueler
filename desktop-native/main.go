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
	gwlStyle         = -16
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
	procGetAsyncKeyState     = user32.NewProc("GetAsyncKeyState")
	procSendMessage          = user32.NewProc("SendMessageW")
	procCreateIconFromRes    = user32.NewProc("CreateIconFromResourceEx")
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
	startupMu      sync.Mutex
	startupLocked  = true
)

const desktopBridgeScript = `(function(){
  if(window.__mwsDesktopBridgeInstalled)return;
  window.__mwsDesktopBridgeInstalled=true;

  var rootEl=document.documentElement;
  if(rootEl){
    rootEl.classList.add('mws-preintro-lock');
    rootEl.style.background='#000';
  }
  var guard=document.createElement('style');
  guard.id='mwsDesktopPreIntroGuard';
  guard.textContent='html.mws-preintro-lock,html.mws-preintro-lock body{background:#000!important}html.mws-preintro-lock body>*:not(#mwsDesktopIntro){visibility:hidden!important}html.mws-preintro-lock #mwsDesktopIntro{visibility:visible!important}';
  (document.head||document.documentElement).appendChild(guard);

  var introSrc='data:image/webp;base64,__INTRO_B64__';

  function norm(v){return String(v||'').replace(/\\s+/g,'').toLowerCase();}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function easeOut(v){v=clamp(v,0,1);return 1-Math.pow(1-v,3);}
  function easeIn(v){v=clamp(v,0,1);return v*v;}

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
  }

  function mountIntro(){
    if(document.getElementById('mwsDesktopIntro'))return;

    var style=document.createElement('style');
    style.id='mwsDesktopIntroStyle';
    style.textContent='#mwsDesktopIntro{position:fixed;inset:0;z-index:2147483647;background:#000;overflow:hidden;cursor:default;opacity:1;transition:opacity .68s ease}#mwsDesktopIntro.mws-intro-out{opacity:0;pointer-events:none}#mwsDesktopIntroCanvas{position:absolute;inset:0;width:100%;height:100%;display:block}.mws-v05-title{position:absolute;left:50%;top:50%;transform:translate(-50%,-42%) scale(.97);width:min(92vw,1200px);text-align:center;color:#fff;opacity:0;filter:blur(10px);transition:opacity 1.75s ease,transform 2.05s cubic-bezier(.16,.84,.22,1),filter 1.65s ease;pointer-events:none}.mws-v05-title.show{opacity:1;filter:blur(0);transform:translate(-50%,-50%) scale(1)}.mws-v05-title-main{font:900 clamp(42px,6.4vw,104px)/.94 Segoe UI,Arial,sans-serif;letter-spacing:-.055em;text-shadow:0 0 28px rgba(151,196,255,.18),0 12px 45px rgba(0,0,0,.8)}.mws-v05-title-ko{margin-top:20px;font:700 clamp(16px,1.65vw,28px)/1.2 Segoe UI,Malgun Gothic,sans-serif;letter-spacing:.34em;color:#d9dce6;opacity:.92}.mws-v05-title-line{width:0;height:2px;margin:25px auto 0;background:linear-gradient(90deg,transparent,#88b9ff 22%,#e1a0d0 78%,transparent);transition:width 1.45s ease .55s}.mws-v05-title.show .mws-v05-title-line{width:min(440px,44vw)}.mws-v05-skip{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);font:600 10px/1 Segoe UI,Arial,sans-serif;letter-spacing:.16em;color:#5f6572;user-select:none}';
    document.head.appendChild(style);

    var root=document.createElement('div');
    root.id='mwsDesktopIntro';
    root.setAttribute('aria-label','Mawang Scheduler 시작 화면');

    var canvas=document.createElement('canvas');
    canvas.id='mwsDesktopIntroCanvas';
    root.appendChild(canvas);

    var title=document.createElement('div');
    title.className='mws-v05-title';
    var main=document.createElement('div');
    main.className='mws-v05-title-main';
    main.textContent='Mawang Scheduler';
    var ko=document.createElement('div');
    ko.className='mws-v05-title-ko';
    ko.textContent='마왕스케줄러';
    var line=document.createElement('div');
    line.className='mws-v05-title-line';
    title.appendChild(main);
    title.appendChild(ko);
    title.appendChild(line);
    root.appendChild(title);

    var skip=document.createElement('div');
    skip.className='mws-v05-skip';
    skip.textContent='CLICK OR SPACE TO SKIP';
    root.appendChild(skip);

    document.body.appendChild(root);

    try{Promise.resolve(window.__mwsIntroMounted());}catch(_){}

    var ended=false;
    var raf=0;
    var titleTimer=0;
    var endTimer=0;
    var particles=[];
    var ctx=canvas.getContext('2d',{alpha:false});
    var image=new Image();
    var startedAt=0;
    var vw=0,vh=0,dpr=1,display={x:0,y:0,w:0,h:0};

    function resize(){
      vw=Math.max(1,window.innerWidth||1280);
      vh=Math.max(1,window.innerHeight||720);
      dpr=Math.min(1.35,window.devicePixelRatio||1);
      canvas.width=Math.floor(vw*dpr);
      canvas.height=Math.floor(vh*dpr);
      canvas.style.width=vw+'px';
      canvas.style.height=vh+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      if(image.naturalWidth){
        var maxW=vw*.9,maxH=vh*.78,ratio=image.naturalWidth/image.naturalHeight;
        var w=maxW,h=w/ratio;
        if(h>maxH){h=maxH;w=h*ratio;}
        display={x:(vw-w)/2,y:(vh-h)/2,w:w,h:h};
      }
    }

    function buildParticles(){
      particles=[];
      resize();
      var step=10;
      var sxScale=display.w/image.naturalWidth;
      var syScale=display.h/image.naturalHeight;
      for(var sy=0;sy<image.naturalHeight;sy+=step){
        for(var sx=0;sx<image.naturalWidth;sx+=step){
          var sw=Math.min(step,image.naturalWidth-sx);
          var sh=Math.min(step,image.naturalHeight-sy);
          var tx=display.x+sx*sxScale;
          var ty=display.y+sy*syScale;
          var dw=sw*sxScale+0.45;
          var dh=sh*syScale+0.45;
          var edge=sx/image.naturalWidth;
          particles.push({
            sx:sx,sy:sy,sw:sw,sh:sh,tx:tx,ty:ty,dw:dw,dh:dh,
            fromX:tx+(Math.random()-.5)*(270+180*Math.random()),
            fromY:ty+(Math.random()-.5)*(190+150*Math.random()),
            fromR:(Math.random()-.5)*1.35,
            assembleDelay:Math.random()*380,
            disDelay:(1-edge)*820+Math.random()*260,
            dx:120+Math.random()*320,
            dy:-180+Math.random()*330,
            rot:(Math.random()-.5)*4.4,
            gravity:80+Math.random()*180
          });
        }
      }
    }

    function draw(now){
      if(ended)return;
      if(!startedAt)startedAt=now;
      var t=now-startedAt;
      ctx.fillStyle='#000';
      ctx.fillRect(0,0,vw,vh);

      var assembleStart=160,assembleDur=1750;
      var dissolveStart=3000,dissolveDur=2250;

      for(var i=0;i<particles.length;i++){
        var p=particles[i],x=p.tx,y=p.ty,r=0,a=1,scale=1;
        if(t<dissolveStart){
          var aq=clamp((t-assembleStart-p.assembleDelay)/assembleDur,0,1);
          var ae=easeOut(aq);
          x=p.fromX+(p.tx-p.fromX)*ae;
          y=p.fromY+(p.ty-p.fromY)*ae;
          r=p.fromR*(1-ae);
          a=aq;
          scale=.45+.55*ae;
        }else{
          var dq=clamp((t-dissolveStart-p.disDelay)/dissolveDur,0,1);
          var de=easeIn(dq);
          x=p.tx+p.dx*de;
          y=p.ty+p.dy*de+p.gravity*dq*dq;
          r=p.rot*de;
          a=1-Math.pow(dq,.82);
          scale=1-.38*dq;
        }
        if(a<=.012)continue;
        ctx.save();
        ctx.globalAlpha=a;
        ctx.translate(x+p.dw/2,y+p.dh/2);
        ctx.rotate(r);
        ctx.scale(scale,scale);
        ctx.drawImage(image,p.sx,p.sy,p.sw,p.sh,-p.dw/2,-p.dh/2,p.dw,p.dh);
        ctx.restore();
      }
      raf=requestAnimationFrame(draw);
    }

    function finish(){
      if(ended)return;
      ended=true;
      cancelAnimationFrame(raf);
      clearTimeout(titleTimer);
      clearTimeout(endTimer);
      root.classList.add('mws-intro-out');
      setTimeout(function(){
        root.remove();
        document.documentElement.classList.remove('mws-preintro-lock');
        var g=document.getElementById('mwsDesktopPreIntroGuard');
        if(g)g.remove();
      },700);
      window.removeEventListener('keydown',onKey,true);
      window.removeEventListener('resize',resize);
    }

    function onKey(e){
      if(e.code==='Space'||e.key===' '){
        e.preventDefault();
        finish();
      }
    }

    root.addEventListener('click',finish);
    window.addEventListener('keydown',onKey,true);
    window.addEventListener('resize',resize);

    image.onload=function(){
      buildParticles();
      requestAnimationFrame(draw);
      titleTimer=setTimeout(function(){title.classList.add('show');},4300);
      endTimer=setTimeout(finish,7900);
    };
    image.onerror=function(){
      title.classList.add('show');
      endTimer=setTimeout(finish,3600);
    };
    image.src=introSrc;
  }

  function boot(){
    installDesktopChrome();
    mountIntro();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }

  window.addEventListener('mws:app-ready',installDesktopChrome);

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

func desktopBridgeScriptForPage() string {
	return strings.Replace(desktopBridgeScript, "__INTRO_B64__", strings.TrimSpace(introImageB64), 1)
}

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

func showWindow() {
	startupMu.Lock()
	locked := startupLocked
	startupMu.Unlock()
	if locked {
		return
	}
	wvMu.Lock()
	h := hwnd
	w := wv
	wvMu.Unlock()
	if h == 0 || w == nil {
		go runWebView()
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

func runWebView() {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	w := webview.NewWithOptions(webview.WebViewOptions{
		Debug:         false,
		AutoFocus:     true,
		DataPath:      appDataPath(),
		WindowOptions: webview.WindowOptions{Title: appTitle, Width: 1360, Height: 860, Center: true},
	})
	if w == nil {
		return
	}
	defer w.Destroy()

	h := uintptr(w.Window())
	wvMu.Lock()
	wv = w
	hwnd = h
	wvMu.Unlock()
	installWindowHook(h)
	setWindowIcon(h)
	procShowWindow.Call(h, swHide)

	var revealOnce sync.Once
	w.Bind("__mwsToggleFullscreen", func() bool { return toggleFullscreen() })
	w.Bind("__mwsIntroMounted", func() {
		revealOnce.Do(func() {
			startupMu.Lock()
			startupLocked = false
			startupMu.Unlock()
			stateMu.Lock()
			lastMaximized = true
			lastStateValid = true
			stateMu.Unlock()
			procShowWindow.Call(h, swMaximize)
			procSetForegroundWindow.Call(h)
		})
	})

	bridge := desktopBridgeScriptForPage()
	w.Init(bridge)
	w.Navigate(appURL)

	time.AfterFunc(1800*time.Millisecond, func() {
		w.Dispatch(func() {
			w.Eval(bridge)
			applyPendingSection(w)
		})
	})
	w.Run()

	wvMu.Lock()
	if wv == w {
		wv = nil
		hwnd = 0
	}
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
	showWindow()
	pendingMu.Lock()
	pendingSection = tab + "\x1f" + labels
	pendingMu.Unlock()
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

func jsString(s string) string { b, _ := json.Marshal(s); return string(b) }

func acquireSingleton() bool {
	name, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopNativeMutex")
	m, _, err := procCreateMutex.Call(0, 0, uintptr(unsafe.Pointer(name)))
	if m == 0 {
		return true
	}
	if errno, ok := err.(syscall.Errno); ok && errno == syscall.ERROR_ALREADY_EXISTS {
		evName, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopShowEvent")
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

func watchShowEvent() {
	evName, _ := syscall.UTF16PtrFromString("MawangSchedulerDesktopShowEvent")
	ev, _, _ := procCreateEvent.Call(0, 0, 0, uintptr(unsafe.Pointer(evName)))
	if ev == 0 {
		return
	}
	defer procCloseHandle.Call(ev)
	for !exiting {
		r, _, _ := procWaitForSingleObject.Call(ev, 1000)
		if r == 0 {
			showWindow()
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
		w := wv
		wvMu.Unlock()
		if w != nil {
			w.Terminate()
		}
		systray.Quit()
	})

	go watchShowEvent()
	go watchAltEnter()
	go runWebView()
}

func onExit() { exiting = true }

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
