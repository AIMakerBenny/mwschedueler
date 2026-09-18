//go:build windows

package main

import (
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

	"github.com/getlantern/systray"
	webview "github.com/jchv/go-webview2"
)

const (
	appURL   = "https://mawang-scheduler.majoku.workers.dev/"
	appTitle = "Mawang Scheduler"
)

const (
	swHide           = 0
	swShow           = 5
	swRestore        = 9
	swMaximize       = 3
	wmClose          = 0x0010
	wmSysCommand     = 0x0112
	wmKeyDown        = 0x0100
	scMinimize       = 0xF020
	vkF11            = 0x7A
	gwlpWndProc      = -4
	gwlStyle         = -16
	wsCaption        = 0x00C00000
	wsThickFrame     = 0x00040000
	wsMinBox         = 0x00020000
	wsMaxBox         = 0x00010000
	wsSysMenu        = 0x00080000
	swpFrameChanged  = 0x0020
	swpNoOwnerZOrder = 0x0200
	monitorNearest   = 2
)

type rect struct{ Left, Top, Right, Bottom int32 }
type monitorInfo struct {
	CbSize    uint32
	RcMonitor rect
	RcWork    rect
	DwFlags   uint32
}

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
	pendingMu      sync.Mutex
	pendingSection string
)

const desktopBridgeScript = `(function(){
  if(window.__mwsDesktopBridgeInstalled)return;
  window.__mwsDesktopBridgeInstalled=true;
  function norm(s){return String(s||'').replace(/\\s+/g,'').toLowerCase();}
  window.__mwsDesktopOpenSection=function(tab,labels){
    var tries=0, wanted=String(tab||''), names=String(labels||'').split('|').map(norm).filter(Boolean);
    function go(){
      tries++;
      try{
        if(typeof window.setTab==='function' && wanted){ window.setTab(wanted); return true; }
      }catch(e){}
      try{
        var buttons=[].slice.call(document.querySelectorAll('[data-tab]'));
        var btn=buttons.find(function(b){return String(b.dataset.tab||'')===wanted;});
        if(!btn && names.length){btn=buttons.find(function(b){var t=norm(b.textContent);return names.some(function(n){return t.indexOf(n)>=0;});});}
        if(btn){btn.click();return true;}
      }catch(e){}
      if(tries<40)setTimeout(go,500);
      return false;
    }
    go();
  };
  document.addEventListener('keydown',function(e){
    if(e.key==='F11'){
      e.preventDefault();e.stopPropagation();
      try{window.__mwsToggleFullscreen();}catch(_){}
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
		procShowWindow.Call(h, swHide)
		return 0
	case wmSysCommand:
		if wparam&0xFFF0 == scMinimize {
			procShowWindow.Call(h, swHide)
			return 0
		}
	case wmKeyDown:
		if wparam == vkF11 {
			toggleFullscreen()
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

func showWindow() {
	wvMu.Lock()
	h := hwnd
	w := wv
	wvMu.Unlock()
	if h == 0 || w == nil {
		go runWebView()
		return
	}
	procShowWindow.Call(h, swRestore)
	procShowWindow.Call(h, swShow)
	procSetForegroundWindow.Call(h)
}

func hideWindow() {
	wvMu.Lock()
	h := hwnd
	wvMu.Unlock()
	if h != 0 {
		procShowWindow.Call(h, swHide)
	}
}

func toggleFullscreen() {
	fsMu.Lock()
	defer fsMu.Unlock()
	wvMu.Lock()
	h := hwnd
	wvMu.Unlock()
	if h == 0 {
		return
	}
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
	w.Bind("__mwsToggleFullscreen", func() { toggleFullscreen() })
	w.Init(desktopBridgeScript)

	h := uintptr(w.Window())
	wvMu.Lock()
	wv = w
	hwnd = h
	wvMu.Unlock()
	installWindowHook(h)
	procShowWindow.Call(h, swMaximize)
	w.Navigate(appURL)

	time.AfterFunc(1800*time.Millisecond, func() {
		w.Dispatch(func() { w.Eval(desktopBridgeScript); applyPendingSection(w) })
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

func onReady() {
	systray.SetIcon(makeTrayIcon())
	systray.SetTitle(appTitle)
	systray.SetTooltip(appTitle)

	mDashboard := systray.AddMenuItem("데시보드", "대시보드 열기")
	mCalendar := systray.AddMenuItem("갤린더", "캘린더 열기")
	mContacts := systray.AddMenuItem("연락처", "연락처 열기")
	mFriends := systray.AddMenuItem("친구찾기", "친구찾기 열기")
	mNotebook := systray.AddMenuItem("수첩", "수첩 열기")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("종료", "Mawang Scheduler 종료")

	go watchShowEvent()
	go runWebView()

	go func() {
		for {
			select {
			case <-mDashboard.ClickedCh:
				openSection("dashboard", "대시보드|데시보드")
			case <-mCalendar.ClickedCh:
				openSection("calendar", "캘린더|갤린더")
			case <-mContacts.ClickedCh:
				openSection("contacts", "연락처")
			case <-mFriends.ClickedCh:
				openSection("friendFinder", "친구찾기|친구 찾기")
			case <-mNotebook.ClickedCh:
				openSection("memos", "수첩|메모|메모장")
			case <-mQuit.ClickedCh:
				exiting = true
				wvMu.Lock()
				w := wv
				wvMu.Unlock()
				if w != nil {
					w.Terminate()
				}
				systray.Quit()
				return
			}
		}
	}()
}

func onExit() { exiting = true }

func main() {
	runtime.LockOSThread()
	if !acquireSingleton() {
		return
	}
	systray.Run(onReady, onExit)
}

func makeTrayIcon() []byte {
	const w, h = 16, 16
	xorSize := w * h * 4
	andStride := ((w + 31) / 32) * 4
	andSize := andStride * h
	dibSize := 40 + xorSize + andSize
	total := 6 + 16 + dibSize
	b := make([]byte, total)
	binary.LittleEndian.PutUint16(b[0:], 0)
	binary.LittleEndian.PutUint16(b[2:], 1)
	binary.LittleEndian.PutUint16(b[4:], 1)
	b[6] = w
	b[7] = h
	b[8] = 0
	b[9] = 0
	binary.LittleEndian.PutUint16(b[10:], 1)
	binary.LittleEndian.PutUint16(b[12:], 32)
	binary.LittleEndian.PutUint32(b[14:], uint32(dibSize))
	binary.LittleEndian.PutUint32(b[18:], 22)
	off := 22
	binary.LittleEndian.PutUint32(b[off+0:], 40)
	binary.LittleEndian.PutUint32(b[off+4:], w)
	binary.LittleEndian.PutUint32(b[off+8:], h*2)
	binary.LittleEndian.PutUint16(b[off+12:], 1)
	binary.LittleEndian.PutUint16(b[off+14:], 32)
	binary.LittleEndian.PutUint32(b[off+20:], uint32(xorSize))
	pix := off + 40
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			i := pix + (y*w+x)*4
			dx, dy := x-7, y-7
			inside := dx*dx+dy*dy <= 47
			if inside {
				b[i+0] = 32
				b[i+1] = 40
				b[i+2] = 48
				b[i+3] = 255
			} else {
				b[i+3] = 0
			}
		}
	}
	return b
}
