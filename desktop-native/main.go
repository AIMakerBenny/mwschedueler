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

const desktopBridgeScriptB64 = "KGZ1bmN0aW9uKCl7CiAgaWYod2luZG93Ll9fbXdzRGVza3RvcEJyaWRnZUluc3RhbGxlZClyZXR1cm47CiAgd2luZG93Ll9fbXdzRGVza3RvcEJyaWRnZUluc3RhbGxlZD10cnVlOwogIHZhciBtYXNjb3RTcmM9X19NQVNDT1RfU1JDX187CiAgZnVuY3Rpb24gbm9ybShzKXtyZXR1cm4gU3RyaW5nKHN8fCcnKS5yZXBsYWNlKC9cXHMrL2csJycpLnRvTG93ZXJDYXNlKCk7fQogIGZ1bmN0aW9uIHN5bmNGdWxsc2NyZWVuQnV0dG9uKGZ1bGwpewogICAgdmFyIGI9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ213c0Rlc2t0b3BGdWxsc2NyZWVuQnV0dG9uJyk7CiAgICBpZihiKWIudGV4dENvbnRlbnQ9ZnVsbD8n7LC966qo65OcJzon7KCE7LK07ZmU66m0JzsKICB9CiAgd2luZG93Ll9fbXdzRGVza3RvcFN5bmNGdWxsc2NyZWVuPXN5bmNGdWxsc2NyZWVuQnV0dG9uOwogIHdpbmRvdy5fX213c0Rlc2t0b3BPcGVuU2VjdGlvbj1mdW5jdGlvbih0YWIsbGFiZWxzKXsKICAgIHZhciB0cmllcz0wLHdhbnRlZD1TdHJpbmcodGFifHwnJyksbmFtZXM9U3RyaW5nKGxhYmVsc3x8JycpLnNwbGl0KCd8JykubWFwKG5vcm0pLmZpbHRlcihCb29sZWFuKTsKICAgIGZ1bmN0aW9uIGdvKCl7CiAgICAgIHRyaWVzKys7CiAgICAgIHRyeXsKICAgICAgICB2YXIgYnV0dG9ucz1bXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXRhYl0nKSk7CiAgICAgICAgdmFyIGJ0bj1idXR0b25zLmZpbmQoZnVuY3Rpb24oYil7cmV0dXJuIFN0cmluZyhiLmRhdGFzZXQudGFifHwnJyk9PT13YW50ZWQ7fSk7CiAgICAgICAgaWYoIWJ0biYmbmFtZXMubGVuZ3RoKXtidG49YnV0dG9ucy5maW5kKGZ1bmN0aW9uKGIpe3ZhciB0PW5vcm0oYi50ZXh0Q29udGVudCk7cmV0dXJuIG5hbWVzLnNvbWUoZnVuY3Rpb24obil7cmV0dXJuIHQuaW5kZXhPZihuKT49MDt9KTt9KTt9CiAgICAgICAgaWYoYnRuKXtidG4uY2xpY2soKTtyZXR1cm4gdHJ1ZTt9CiAgICAgICAgdmFyIHNlY3Rpb249d2FudGVkP2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKHdhbnRlZCk6bnVsbDsKICAgICAgICBpZihzZWN0aW9uJiZ0eXBlb2Ygd2luZG93LnNldFRhYj09PSdmdW5jdGlvbicpe3dpbmRvdy5zZXRUYWIod2FudGVkKTtyZXR1cm4gdHJ1ZTt9CiAgICAgIH1jYXRjaChlKXt9CiAgICAgIGlmKHRyaWVzPDQwKXNldFRpbWVvdXQoZ28sNTAwKTsKICAgICAgcmV0dXJuIGZhbHNlOwogICAgfQogICAgZ28oKTsKICB9OwogIGZ1bmN0aW9uIGluc3RhbGxEZXNrdG9wQ2hyb21lKCl7CiAgICBpZihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbXdzRGVza3RvcENocm9tZVN0eWxlJykpcmV0dXJuOwogICAgdmFyIHN0eWxlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7CiAgICBzdHlsZS5pZD0nbXdzRGVza3RvcENocm9tZVN0eWxlJzsKICAgIHN0eWxlLnRleHRDb250ZW50PScjbXdzRGVza3RvcEZ1bGxzY3JlZW5CdXR0b257aGVpZ2h0OjMwcHg7cGFkZGluZzowIDEwcHg7Ym9yZGVyLXJhZGl1czo4cHg7Zm9udC1zaXplOjExcHg7Zm9udC13ZWlnaHQ6ODAwO3doaXRlLXNwYWNlOm5vd3JhcDttYXJnaW4tcmlnaHQ6MnB4fSNtd3NEZXNrdG9wSW50cm97cG9zaXRpb246Zml4ZWQ7aW5zZXQ6MDt6LWluZGV4OjIxNDc0ODM2NDc7YmFja2dyb3VuZDpyYWRpYWwtZ3JhZGllbnQoY2lyY2xlIGF0IDI1JSA0NiUsI2ZmZiAwLCNmZmY4ZmIgMzQlLCNmNWY3ZmYgNzIlLCNlZWYzZmYgMTAwJSk7b3ZlcmZsb3c6aGlkZGVuO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtvcGFjaXR5OjE7dHJhbnNpdGlvbjpvcGFjaXR5IC40OHMgZWFzZX0jbXdzRGVza3RvcEludHJvLm13cy1pbnRyby1vdXR7b3BhY2l0eTowO3BvaW50ZXItZXZlbnRzOm5vbmV9Lm13cy1pbnRyby1tYXNjb3R7cG9zaXRpb246YWJzb2x1dGU7d2lkdGg6bWluKDQ2dncsNTIwcHgpO21heC1oZWlnaHQ6NzJ2aDtvYmplY3QtZml0OmNvbnRhaW47dHJhbnNmb3JtOnRyYW5zbGF0ZVgoMCkgc2NhbGUoLjk2KTtmaWx0ZXI6ZHJvcC1zaGFkb3coMCAyMnB4IDMwcHggcmdiYSg0Niw2NSwxMTAsLjE2KSk7dHJhbnNpdGlvbjp0cmFuc2Zvcm0gMS4wMnMgY3ViaWMtYmV6aWVyKC4xNiwuODQsLjIyLDEpfSNtd3NEZXNrdG9wSW50cm8ubXdzLWludHJvLXBoYXNlMiAubXdzLWludHJvLW1hc2NvdHt0cmFuc2Zvcm06dHJhbnNsYXRlWChjbGFtcCgtMzEwcHgsLTIzdncsLTE3MHB4KSkgc2NhbGUoLjkpfS5td3MtaW50cm8tY29weXtwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjU0JTt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGUoNDJweCwtNTAlKTtvcGFjaXR5OjA7dHJhbnNpdGlvbjpvcGFjaXR5IC43OHMgZWFzZSAuMTRzLHRyYW5zZm9ybSAuOTJzIGN1YmljLWJlemllciguMTYsLjg0LC4yMiwxKSAuMDhzO2NvbG9yOiMxMTE4Mjc7dGV4dC1hbGlnbjpsZWZ0fS5td3MtaW50cm8tcGhhc2UyIC5td3MtaW50cm8tY29weXtvcGFjaXR5OjE7dHJhbnNmb3JtOnRyYW5zbGF0ZSgwLC01MCUpfS5td3MtaW50cm8ta2lja2Vye2ZvbnQ6ODAwIDEycHgvMSBTZWdvZSBVSSxzYW5zLXNlcmlmO2xldHRlci1zcGFjaW5nOi4zNGVtO2NvbG9yOiM1Nzk1ZDI7bWFyZ2luLWJvdHRvbToxNHB4fS5td3MtaW50cm8tdGl0bGV7Zm9udDo5MDAgY2xhbXAoMzRweCw1LjF2dyw3NHB4KS8uOTIgU2Vnb2UgVUksc2Fucy1zZXJpZjtsZXR0ZXItc3BhY2luZzotLjA1NWVtfS5td3MtaW50cm8tdGl0bGUgc3BhbntkaXNwbGF5OmJsb2NrO2NvbG9yOiNkNzliYTV9Lm13cy1pbnRyby1saW5le3dpZHRoOjA7aGVpZ2h0OjRweDtib3JkZXItcmFkaXVzOjk5OXB4O2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDkwZGVnLCM1ZDliZDcsI2Q5OWNhNik7bWFyZ2luLXRvcDoyMHB4O3RyYW5zaXRpb246d2lkdGggLjlzIGVhc2UgLjQ1c30ubXdzLWludHJvLXBoYXNlMiAubXdzLWludHJvLWxpbmV7d2lkdGg6bWluKDMzMHB4LDI4dncpfS5td3MtaW50cm8tc2tpcHtwb3NpdGlvbjphYnNvbHV0ZTtib3R0b206MjhweDtsZWZ0OjUwJTt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtNTAlKTtmb250OjYwMCAxMXB4LzEgU2Vnb2UgVUksc2Fucy1zZXJpZjtsZXR0ZXItc3BhY2luZzouMDhlbTtjb2xvcjojODc5MWE2O29wYWNpdHk6Ljc4fUBtZWRpYShtYXgtd2lkdGg6ODUwcHgpey5td3MtaW50cm8tbWFzY290e3dpZHRoOm1pbig3MHZ3LDQzMHB4KX0jbXdzRGVza3RvcEludHJvLm13cy1pbnRyby1waGFzZTIgLm13cy1pbnRyby1tYXNjb3R7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTIzdncpIHNjYWxlKC44Mil9Lm13cy1pbnRyby1jb3B5e2xlZnQ6NDklfS5td3MtaW50cm8tdGl0bGV7Zm9udC1zaXplOmNsYW1wKDMwcHgsN3Z3LDU0cHgpfX0nOwogICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7CiAgICB2YXIgY2xvY2s9ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnRvcGJhciAuY2xvY2snKTsKICAgIHZhciBzeW5jPWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50b3BiYXIgLnN5bmMtc3RhdHVzJyk7CiAgICBpZihjbG9jayYmIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtd3NEZXNrdG9wRnVsbHNjcmVlbkJ1dHRvbicpKXsKICAgICAgdmFyIGI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7CiAgICAgIGIudHlwZT0nYnV0dG9uJztiLmlkPSdtd3NEZXNrdG9wRnVsbHNjcmVlbkJ1dHRvbic7Yi5jbGFzc05hbWU9J2dob3N0JztiLnRleHRDb250ZW50PSfsoITssrTtmZTrqbQnO2IudGl0bGU9J+yghOyytO2ZlOuptCDsoITtmZgnOwogICAgICBiLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyxmdW5jdGlvbigpe3RyeXtQcm9taXNlLnJlc29sdmUod2luZG93Ll9fbXdzVG9nZ2xlRnVsbHNjcmVlbigpKS50aGVuKGZ1bmN0aW9uKHYpe3N5bmNGdWxsc2NyZWVuQnV0dG9uKCEhdik7fSk7fWNhdGNoKF8pe319KTsKICAgICAgaWYoc3luYyljbG9jay5pbnNlcnRCZWZvcmUoYixzeW5jKTtlbHNlIGNsb2NrLmluc2VydEJlZm9yZShiLGNsb2NrLmZpcnN0Q2hpbGQpOwogICAgfQogIH0KICBmdW5jdGlvbiBtb3VudEludHJvKCl7CiAgICB0cnl7aWYoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSgnbXdzRGVza3RvcEludHJvU2hvd25WMDMnKSlyZXR1cm47c2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgnbXdzRGVza3RvcEludHJvU2hvd25WMDMnLCcxJyk7fWNhdGNoKF8pe30KICAgIHZhciByb290PWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO3Jvb3QuaWQ9J213c0Rlc2t0b3BJbnRybyc7cm9vdC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCdNYXdhbmcgU2NoZWR1bGVyIOyLnOyekSDtmZTrqbQnKTsKICAgIHZhciBpbWc9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7aW1nLmNsYXNzTmFtZT0nbXdzLWludHJvLW1hc2NvdCc7aW1nLnNyYz1tYXNjb3RTcmM7aW1nLmFsdD0nTWF3YW5nIG1hc2NvdCc7cm9vdC5hcHBlbmRDaGlsZChpbWcpOwogICAgdmFyIGNvcHk9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7Y29weS5jbGFzc05hbWU9J213cy1pbnRyby1jb3B5JzsKICAgIHZhciBraWNrZXI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7a2lja2VyLmNsYXNzTmFtZT0nbXdzLWludHJvLWtpY2tlcic7a2lja2VyLnRleHRDb250ZW50PSdNQUpPS1UgV09SS1NQQUNFJztjb3B5LmFwcGVuZENoaWxkKGtpY2tlcik7CiAgICB2YXIgdGl0bGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7dGl0bGUuY2xhc3NOYW1lPSdtd3MtaW50cm8tdGl0bGUnO3RpdGxlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCdNYXdhbmcnKSk7dmFyIGxpbmUyPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtsaW5lMi50ZXh0Q29udGVudD0nU2NoZWR1bGVyJzt0aXRsZS5hcHBlbmRDaGlsZChsaW5lMik7Y29weS5hcHBlbmRDaGlsZCh0aXRsZSk7CiAgICB2YXIgbGluZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtsaW5lLmNsYXNzTmFtZT0nbXdzLWludHJvLWxpbmUnO2NvcHkuYXBwZW5kQ2hpbGQobGluZSk7cm9vdC5hcHBlbmRDaGlsZChjb3B5KTsKICAgIHZhciBza2lwPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO3NraXAuY2xhc3NOYW1lPSdtd3MtaW50cm8tc2tpcCc7c2tpcC50ZXh0Q29udGVudD0nQ0xJQ0sgT1IgU1BBQ0UgVE8gU0tJUCc7cm9vdC5hcHBlbmRDaGlsZChza2lwKTsKICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocm9vdCk7CiAgICB2YXIgZW5kZWQ9ZmFsc2UsbWluRG9uZT1mYWxzZSxhcHBSZWFkeT1mYWxzZTsKICAgIGZ1bmN0aW9uIGVuZCgpe2lmKGVuZGVkKXJldHVybjtlbmRlZD10cnVlO3Jvb3QuY2xhc3NMaXN0LmFkZCgnbXdzLWludHJvLW91dCcpO3NldFRpbWVvdXQoZnVuY3Rpb24oKXtyb290LnJlbW92ZSgpO30sNTIwKTt3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsb25LZXksdHJ1ZSk7fQogICAgZnVuY3Rpb24gb25LZXkoZSl7aWYoZS5jb2RlPT09J1NwYWNlJ3x8ZS5rZXk9PT0nICcpe2UucHJldmVudERlZmF1bHQoKTtlbmQoKTt9fQogICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsZW5kKTt3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsb25LZXksdHJ1ZSk7CiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7cm9vdC5jbGFzc0xpc3QuYWRkKCdtd3MtaW50cm8tcGhhc2UyJyk7fSw2MjApOwogICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ213czphcHAtcmVhZHknLGZ1bmN0aW9uKCl7YXBwUmVhZHk9dHJ1ZTtpZihtaW5Eb25lKWVuZCgpO30se29uY2U6dHJ1ZX0pOwogICAgc2V0VGltZW91dChmdW5jdGlvbigpe21pbkRvbmU9dHJ1ZTt2YXIgZ2F0ZT1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbXdzQWNjZXNzR2F0ZScpO3ZhciBnYXRlVmlzaWJsZT1nYXRlJiZnZXRDb21wdXRlZFN0eWxlKGdhdGUpLmRpc3BsYXkhPT0nbm9uZScmJmdldENvbXB1dGVkU3R5bGUoZ2F0ZSkudmlzaWJpbGl0eSE9PSdoaWRkZW4nO2lmKGFwcFJlYWR5fHxnYXRlVmlzaWJsZSllbmQoKTt9LDMwMDApOwogICAgc2V0VGltZW91dChlbmQsNjgwMCk7CiAgfQogIGZ1bmN0aW9uIGJvb3QoKXtpbnN0YWxsRGVza3RvcENocm9tZSgpO21vdW50SW50cm8oKTt9CiAgaWYoZG9jdW1lbnQucmVhZHlTdGF0ZT09PSdsb2FkaW5nJylkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJyxib290LHtvbmNlOnRydWV9KTtlbHNlIGJvb3QoKTsKICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbXdzOmFwcC1yZWFkeScsaW5zdGFsbERlc2t0b3BDaHJvbWUpOwogIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLGZ1bmN0aW9uKGUpewogICAgaWYoZS5rZXk9PT0nRjExJyl7CiAgICAgIGUucHJldmVudERlZmF1bHQoKTtlLnN0b3BQcm9wYWdhdGlvbigpOwogICAgICB0cnl7UHJvbWlzZS5yZXNvbHZlKHdpbmRvdy5fX213c1RvZ2dsZUZ1bGxzY3JlZW4oKSkudGhlbihmdW5jdGlvbih2KXtzeW5jRnVsbHNjcmVlbkJ1dHRvbighIXYpO30pO31jYXRjaChfKXt9CiAgICB9CiAgfSx0cnVlKTsKfSkoKTs="

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
