//go:build windows

package main

import (
	_ "embed"
	"encoding/base64"
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

//go:embed assets/mawang-mascot.webp
var mascotBytes []byte

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
)

const desktopBridgeScriptB64 = "KGZ1bmN0aW9uKCl7CiAgaWYod2luZG93Ll9fbXdzRGVza3RvcEJyaWRnZUluc3RhbGxlZClyZXR1cm47CiAgd2luZG93Ll9fbXdzRGVza3RvcEJyaWRnZUluc3RhbGxlZD10cnVlOwogIHZhciBtYXNjb3RTcmM9X19NQVNDT1RfU1JDX187CiAgZnVuY3Rpb24gbm9ybShzKXtyZXR1cm4gU3RyaW5nKHN8fCcnKS5yZXBsYWNlKC9cXHMrL2csJycpLnRvTG93ZXJDYXNlKCk7fQogIGZ1bmN0aW9uIHN5bmNGdWxsc2NyZWVuQnV0dG9uKGZ1bGwpewogICAgdmFyIGI9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ213c0Rlc2t0b3BGdWxsc2NyZWVuQnV0dG9uJyk7CiAgICBpZihiKWIudGV4dENvbnRlbnQ9ZnVsbD8n7LC966qo65OcJzon7KCE7LK07ZmU66m0JzsKICB9CiAgd2luZG93Ll9fbXdzRGVza3RvcFN5bmNGdWxsc2NyZWVuPXN5bmNGdWxsc2NyZWVuQnV0dG9uOwogIHdpbmRvdy5fX213c0Rlc2t0b3BPcGVuU2VjdGlvbj1mdW5jdGlvbih0YWIsbGFiZWxzKXsKICAgIHZhciB0cmllcz0wLHdhbnRlZD1TdHJpbmcodGFifHwnJyksbmFtZXM9U3RyaW5nKGxhYmVsc3x8JycpLnNwbGl0KCd8JykubWFwKG5vcm0pLmZpbHRlcihCb29sZWFuKTsKICAgIGZ1bmN0aW9uIGdvKCl7CiAgICAgIHRyaWVzKys7CiAgICAgIHRyeXsKICAgICAgICB2YXIgYnV0dG9ucz1bXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXRhYl0nKSk7CiAgICAgICAgdmFyIGJ0bj1idXR0b25zLmZpbmQoZnVuY3Rpb24oYil7cmV0dXJuIFN0cmluZyhiLmRhdGFzZXQudGFifHwnJyk9PT13YW50ZWQ7fSk7CiAgICAgICAgaWYoIWJ0biYmbmFtZXMubGVuZ3RoKXtidG49YnV0dG9ucy5maW5kKGZ1bmN0aW9uKGIpe3ZhciB0PW5vcm0oYi50ZXh0Q29udGVudCk7cmV0dXJuIG5hbWVzLnNvbWUoZnVuY3Rpb24obil7cmV0dXJuIHQuaW5kZXhPZihuKT49MDt9KTt9KTt9CiAgICAgICAgaWYoYnRuKXtidG4uY2xpY2soKTtyZXR1cm4gdHJ1ZTt9CiAgICAgICAgdmFyIHNlY3Rpb249d2FudGVkP2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKHdhbnRlZCk6bnVsbDsKICAgICAgICBpZihzZWN0aW9uJiZ0eXBlb2Ygd2luZG93LnNldFRhYj09PSdmdW5jdGlvbicpe3dpbmRvdy5zZXRUYWIod2FudGVkKTtyZXR1cm4gdHJ1ZTt9CiAgICAgIH1jYXRjaChlKXt9CiAgICAgIGlmKHRyaWVzPDQwKXNldFRpbWVvdXQoZ28sNTAwKTsKICAgICAgcmV0dXJuIGZhbHNlOwogICAgfQogICAgZ28oKTsKICB9OwogIGZ1bmN0aW9uIGluc3RhbGxEZXNrdG9wQ2hyb21lKCl7CiAgICBpZihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbXdzRGVza3RvcENocm9tZVN0eWxlJykpcmV0dXJuOwogICAgdmFyIHN0eWxlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7CiAgICBzdHlsZS5pZD0nbXdzRGVza3RvcENocm9tZVN0eWxlJzsKICAgIHN0eWxlLnRleHRDb250ZW50PScjbXdzRGVza3RvcEZ1bGxzY3JlZW5CdXR0b257aGVpZ2h0OjMwcHg7cGFkZGluZzowIDEwcHg7Ym9yZGVyLXJhZGl1czo4cHg7Zm9udC1zaXplOjExcHg7Zm9udC13ZWlnaHQ6ODAwO3doaXRlLXNwYWNlOm5vd3JhcDttYXJnaW4tcmlnaHQ6MnB4fSNtd3NEZXNrdG9wSW50cm97cG9zaXRpb246Zml4ZWQ7aW5zZXQ6MDt6LWluZGV4OjIxNDc0ODM2NDc7YmFja2dyb3VuZDojMDAwO292ZXJmbG93OmhpZGRlbjtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7b3BhY2l0eToxO3RyYW5zaXRpb246b3BhY2l0eSAuNjJzIGVhc2V9I213c0Rlc2t0b3BJbnRyby5td3MtaW50cm8tb3V0e29wYWNpdHk6MDtwb2ludGVyLWV2ZW50czpub25lfS5td3MtaW50cm8tbWFzY290e3Bvc2l0aW9uOmFic29sdXRlO3dpZHRoOm1pbig0NnZ3LDUyMHB4KTttYXgtaGVpZ2h0Ojcydmg7b2JqZWN0LWZpdDpjb250YWluO29wYWNpdHk6MDt0cmFuc2Zvcm06dHJhbnNsYXRlWCgwKSBzY2FsZSguOTYpO2ZpbHRlcjpkcm9wLXNoYWRvdygwIDIycHggMzRweCByZ2JhKDAsMCwwLC43MikpO3RyYW5zaXRpb246dHJhbnNmb3JtIDEuNjVzIGN1YmljLWJlemllciguMTYsLjg0LC4yMiwxKSxvcGFjaXR5IC4zNHMgZWFzZX0jbXdzRGVza3RvcEludHJvLm13cy1pbnRyby1waGFzZTIgLm13cy1pbnRyby1tYXNjb3R7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoY2xhbXAoLTMxMHB4LC0yM3Z3LC0xNzBweCkpIHNjYWxlKC45KX0ubXdzLWludHJvLWNvcHl7cG9zaXRpb246YWJzb2x1dGU7bGVmdDo1NCU7dG9wOjUwJTt0cmFuc2Zvcm06dHJhbnNsYXRlKDU4cHgsLTUwJSk7b3BhY2l0eTowO3RyYW5zaXRpb246b3BhY2l0eSAxLjg1cyBlYXNlIDEuMDVzLHRyYW5zZm9ybSAxLjk1cyBjdWJpYy1iZXppZXIoLjE2LC44NCwuMjIsMSkgLjkycztjb2xvcjojZjRmN2ZiO3RleHQtYWxpZ246bGVmdH0ubXdzLWludHJvLXBoYXNlMiAubXdzLWludHJvLWNvcHl7b3BhY2l0eToxO3RyYW5zZm9ybTp0cmFuc2xhdGUoMCwtNTAlKX0ubXdzLWludHJvLWtpY2tlcntmb250OjgwMCAxMnB4LzEgU2Vnb2UgVUksc2Fucy1zZXJpZjtsZXR0ZXItc3BhY2luZzouMzRlbTtjb2xvcjojNjlhZWYwO21hcmdpbi1ib3R0b206MTRweH0ubXdzLWludHJvLXRpdGxle2ZvbnQ6OTAwIGNsYW1wKDM0cHgsNS4xdncsNzRweCkvLjkyIFNlZ29lIFVJLHNhbnMtc2VyaWY7bGV0dGVyLXNwYWNpbmc6LS4wNTVlbTt0ZXh0LXNoYWRvdzowIDhweCAyOHB4IHJnYmEoMCwwLDAsLjU1KX0ubXdzLWludHJvLXRpdGxlIHNwYW57ZGlzcGxheTpibG9jaztjb2xvcjojZTFhMGFifS5td3MtaW50cm8tbGluZXt3aWR0aDowO2hlaWdodDo0cHg7Ym9yZGVyLXJhZGl1czo5OTlweDtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCg5MGRlZywjNWQ5YmQ3LCNlMWEwYWIpO21hcmdpbi10b3A6MjBweDt0cmFuc2l0aW9uOndpZHRoIDEuNDVzIGVhc2UgMi4wNXN9Lm13cy1pbnRyby1waGFzZTIgLm13cy1pbnRyby1saW5le3dpZHRoOm1pbigzMzBweCwyOHZ3KX0ubXdzLWludHJvLXNraXB7cG9zaXRpb246YWJzb2x1dGU7Ym90dG9tOjI4cHg7bGVmdDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTUwJSk7Zm9udDo2MDAgMTFweC8xIFNlZ29lIFVJLHNhbnMtc2VyaWY7bGV0dGVyLXNwYWNpbmc6LjA4ZW07Y29sb3I6IzY5NzM4NjtvcGFjaXR5Oi44Mn1AbWVkaWEobWF4LXdpZHRoOjg1MHB4KXsubXdzLWludHJvLW1hc2NvdHt3aWR0aDptaW4oNzB2dyw0MzBweCl9I213c0Rlc2t0b3BJbnRyby5td3MtaW50cm8tcGhhc2UyIC5td3MtaW50cm8tbWFzY290e3RyYW5zZm9ybTp0cmFuc2xhdGVYKC0yM3Z3KSBzY2FsZSguODIpfS5td3MtaW50cm8tY29weXtsZWZ0OjQ5JX0ubXdzLWludHJvLXRpdGxle2ZvbnQtc2l6ZTpjbGFtcCgzMHB4LDd2dyw1NHB4KX19JzsKICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpOwogICAgdmFyIGNsb2NrPWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50b3BiYXIgLmNsb2NrJyk7CiAgICB2YXIgc3luYz1kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudG9wYmFyIC5zeW5jLXN0YXR1cycpOwogICAgaWYoY2xvY2smJiFkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbXdzRGVza3RvcEZ1bGxzY3JlZW5CdXR0b24nKSl7CiAgICAgIHZhciBiPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpOwogICAgICBiLnR5cGU9J2J1dHRvbic7Yi5pZD0nbXdzRGVza3RvcEZ1bGxzY3JlZW5CdXR0b24nO2IuY2xhc3NOYW1lPSdnaG9zdCc7Yi50ZXh0Q29udGVudD0n7KCE7LK07ZmU66m0JztiLnRpdGxlPSfsoITssrTtmZTrqbQg7KCE7ZmYJzsKICAgICAgYi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsZnVuY3Rpb24oKXt0cnl7UHJvbWlzZS5yZXNvbHZlKHdpbmRvdy5fX213c1RvZ2dsZUZ1bGxzY3JlZW4oKSkudGhlbihmdW5jdGlvbih2KXtzeW5jRnVsbHNjcmVlbkJ1dHRvbighIXYpO30pO31jYXRjaChfKXt9fSk7CiAgICAgIGlmKHN5bmMpY2xvY2suaW5zZXJ0QmVmb3JlKGIsc3luYyk7ZWxzZSBjbG9jay5pbnNlcnRCZWZvcmUoYixjbG9jay5maXJzdENoaWxkKTsKICAgIH0KICB9CiAgZnVuY3Rpb24gbWFrZVRyYW5zcGFyZW50SW50cm9Qbmcoc3JjLGRvbmUpewogICAgdmFyIHNvdXJjZT1uZXcgSW1hZ2UoKTsKICAgIHNvdXJjZS5vbmxvYWQ9ZnVuY3Rpb24oKXsKICAgICAgdHJ5ewogICAgICAgIHZhciB3PXNvdXJjZS5uYXR1cmFsV2lkdGh8fHNvdXJjZS53aWR0aCxoPXNvdXJjZS5uYXR1cmFsSGVpZ2h0fHxzb3VyY2UuaGVpZ2h0OwogICAgICAgIHZhciBjPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO2Mud2lkdGg9dztjLmhlaWdodD1oOwogICAgICAgIHZhciBjdHg9Yy5nZXRDb250ZXh0KCcyZCcse3dpbGxSZWFkRnJlcXVlbnRseTp0cnVlfSk7Y3R4LmRyYXdJbWFnZShzb3VyY2UsMCwwLHcsaCk7CiAgICAgICAgdmFyIGZyYW1lPWN0eC5nZXRJbWFnZURhdGEoMCwwLHcsaCksZD1mcmFtZS5kYXRhLG49dypoLHNlZW49bmV3IFVpbnQ4QXJyYXkobikscXVldWU9bmV3IEludDMyQXJyYXkobiksaGVhZD0wLHRhaWw9MDsKICAgICAgICBmdW5jdGlvbiBiZyhwKXt2YXIgaT1wKjQscj1kW2ldLGc9ZFtpKzFdLGI9ZFtpKzJdLG14PU1hdGgubWF4KHIsZyxiKSxtbj1NYXRoLm1pbihyLGcsYik7cmV0dXJuIG1uPjIyOCYmKG14LW1uKTwyNDt9CiAgICAgICAgZnVuY3Rpb24gcHVzaChwKXtpZihwPDB8fHA+PW58fHNlZW5bcF18fCFiZyhwKSlyZXR1cm47c2VlbltwXT0xO3F1ZXVlW3RhaWwrK109cDt9CiAgICAgICAgZm9yKHZhciB4PTA7eDx3O3grKyl7cHVzaCh4KTtwdXNoKChoLTEpKncreCk7fQogICAgICAgIGZvcih2YXIgeT0xO3k8aC0xO3krKyl7cHVzaCh5KncpO3B1c2goeSp3K3ctMSk7fQogICAgICAgIHdoaWxlKGhlYWQ8dGFpbCl7CiAgICAgICAgICB2YXIgcD1xdWV1ZVtoZWFkKytdLHg9cCV3OwogICAgICAgICAgaWYocD49dylwdXNoKHAtdyk7aWYocDxuLXcpcHVzaChwK3cpO2lmKHg+MClwdXNoKHAtMSk7aWYoeDx3LTEpcHVzaChwKzEpOwogICAgICAgIH0KICAgICAgICBmb3IodmFyIHA9MDtwPG47cCsrKWlmKHNlZW5bcF0pZFtwKjQrM109MDsKICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGZyYW1lLDAsMCk7CiAgICAgICAgZG9uZShjLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJykpOwogICAgICB9Y2F0Y2goXyl7ZG9uZShzcmMpO30KICAgIH07CiAgICBzb3VyY2Uub25lcnJvcj1mdW5jdGlvbigpe2RvbmUoc3JjKTt9OwogICAgc291cmNlLnNyYz1zcmM7CiAgfQogIGZ1bmN0aW9uIG1vdW50SW50cm8oKXsKICAgIHRyeXtpZihzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCdtd3NEZXNrdG9wSW50cm9TaG93blYwMycpKXJldHVybjtzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCdtd3NEZXNrdG9wSW50cm9TaG93blYwMycsJzEnKTt9Y2F0Y2goXyl7fQogICAgdmFyIHJvb3Q9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7cm9vdC5pZD0nbXdzRGVza3RvcEludHJvJztyb290LnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsJ01hd2FuZyBTY2hlZHVsZXIg7Iuc7J6RIO2ZlOuptCcpOwogICAgdmFyIGltZz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtpbWcuY2xhc3NOYW1lPSdtd3MtaW50cm8tbWFzY290JztpbWcuYWx0PSdNYXdhbmcgbWFzY290Jztyb290LmFwcGVuZENoaWxkKGltZyk7CiAgICBtYWtlVHJhbnNwYXJlbnRJbnRyb1BuZyhtYXNjb3RTcmMsZnVuY3Rpb24ocG5nKXtpbWcub25sb2FkPWZ1bmN0aW9uKCl7aW1nLnN0eWxlLm9wYWNpdHk9JzEnO307aW1nLnNyYz1wbmc7fSk7CiAgICB2YXIgY29weT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtjb3B5LmNsYXNzTmFtZT0nbXdzLWludHJvLWNvcHknOwogICAgdmFyIGtpY2tlcj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtraWNrZXIuY2xhc3NOYW1lPSdtd3MtaW50cm8ta2lja2VyJztraWNrZXIudGV4dENvbnRlbnQ9J01BSk9LVSBXT1JLU1BBQ0UnO2NvcHkuYXBwZW5kQ2hpbGQoa2lja2VyKTsKICAgIHZhciB0aXRsZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTt0aXRsZS5jbGFzc05hbWU9J213cy1pbnRyby10aXRsZSc7dGl0bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJ01hd2FuZycpKTt2YXIgbGluZTI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO2xpbmUyLnRleHRDb250ZW50PSdTY2hlZHVsZXInO3RpdGxlLmFwcGVuZENoaWxkKGxpbmUyKTtjb3B5LmFwcGVuZENoaWxkKHRpdGxlKTsKICAgIHZhciBsaW5lPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO2xpbmUuY2xhc3NOYW1lPSdtd3MtaW50cm8tbGluZSc7Y29weS5hcHBlbmRDaGlsZChsaW5lKTtyb290LmFwcGVuZENoaWxkKGNvcHkpOwogICAgdmFyIHNraXA9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7c2tpcC5jbGFzc05hbWU9J213cy1pbnRyby1za2lwJztza2lwLnRleHRDb250ZW50PSdDTElDSyBPUiBTUEFDRSBUTyBTS0lQJztyb290LmFwcGVuZENoaWxkKHNraXApOwogICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyb290KTsKICAgIHZhciBlbmRlZD1mYWxzZSxtaW5Eb25lPWZhbHNlLGFwcFJlYWR5PWZhbHNlOwogICAgZnVuY3Rpb24gZW5kKCl7aWYoZW5kZWQpcmV0dXJuO2VuZGVkPXRydWU7cm9vdC5jbGFzc0xpc3QuYWRkKCdtd3MtaW50cm8tb3V0Jyk7c2V0VGltZW91dChmdW5jdGlvbigpe3Jvb3QucmVtb3ZlKCk7fSw1MjApO3dpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJyxvbktleSx0cnVlKTt9CiAgICBmdW5jdGlvbiBvbktleShlKXtpZihlLmNvZGU9PT0nU3BhY2UnfHxlLmtleT09PScgJyl7ZS5wcmV2ZW50RGVmYXVsdCgpO2VuZCgpO319CiAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyxlbmQpO3dpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJyxvbktleSx0cnVlKTsKICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtyb290LmNsYXNzTGlzdC5hZGQoJ213cy1pbnRyby1waGFzZTInKTt9LDkwMCk7CiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbXdzOmFwcC1yZWFkeScsZnVuY3Rpb24oKXthcHBSZWFkeT10cnVlO2lmKG1pbkRvbmUpZW5kKCk7fSx7b25jZTp0cnVlfSk7CiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7bWluRG9uZT10cnVlO3ZhciBnYXRlPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtd3NBY2Nlc3NHYXRlJyk7dmFyIGdhdGVWaXNpYmxlPWdhdGUmJmdldENvbXB1dGVkU3R5bGUoZ2F0ZSkuZGlzcGxheSE9PSdub25lJyYmZ2V0Q29tcHV0ZWRTdHlsZShnYXRlKS52aXNpYmlsaXR5IT09J2hpZGRlbic7aWYoYXBwUmVhZHl8fGdhdGVWaXNpYmxlKWVuZCgpO30sNTYwMCk7CiAgICBzZXRUaW1lb3V0KGVuZCw5NDAwKTsKICB9CiAgZnVuY3Rpb24gYm9vdCgpe2luc3RhbGxEZXNrdG9wQ2hyb21lKCk7bW91bnRJbnRybygpO30KICBpZihkb2N1bWVudC5yZWFkeVN0YXRlPT09J2xvYWRpbmcnKWRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLGJvb3Qse29uY2U6dHJ1ZX0pO2Vsc2UgYm9vdCgpOwogIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtd3M6YXBwLXJlYWR5JyxpbnN0YWxsRGVza3RvcENocm9tZSk7CiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsZnVuY3Rpb24oZSl7CiAgICBpZihlLmtleT09PSdGMTEnKXsKICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO2Uuc3RvcFByb3BhZ2F0aW9uKCk7CiAgICAgIHRyeXtQcm9taXNlLnJlc29sdmUod2luZG93Ll9fbXdzVG9nZ2xlRnVsbHNjcmVlbigpKS50aGVuKGZ1bmN0aW9uKHYpe3N5bmNGdWxsc2NyZWVuQnV0dG9uKCEhdik7fSk7fWNhdGNoKF8pe30KICAgIH0KICB9LHRydWUpOwp9KSgpOw=="

func desktopBridgeScript() string {
	raw, _ := base64.StdEncoding.DecodeString(desktopBridgeScriptB64)
	mascot := "data:image/webp;base64," + base64.StdEncoding.EncodeToString(mascotBytes)
	return strings.Replace(string(raw), "__MASCOT_SRC__", jsString(mascot), 1)
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
	w.Bind("__mwsToggleFullscreen", func() bool { return toggleFullscreen() })
	bridge := desktopBridgeScript()
	w.Init(bridge)

	h := uintptr(w.Window())
	wvMu.Lock()
	wv = w
	hwnd = h
	wvMu.Unlock()
	installWindowHook(h)
	setWindowIcon(h)
	procShowWindow.Call(h, swMaximize)
	stateMu.Lock()
	lastMaximized = true
	lastStateValid = true
	stateMu.Unlock()
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
