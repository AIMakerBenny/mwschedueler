//go:build windows

package main

import (
	"bytes"
	_ "embed"
	"fmt"
	"image/jpeg"
	"runtime"
	"sync"
	"syscall"
	"time"
	"unsafe"
)

const (
	introClassName             = "MawangSchedulerIntroResetV100"
	introWMDestroy             = 0x0002
	introWMPaint               = 0x000F
	introWMClose               = 0x0010
	introWMEraseBkgnd          = 0x0014
	introWMSwitchText          = 0x8001
	introWMFinish              = 0x8002
	introWSPopup               = 0x80000000
	introWSExTopmost           = 0x00000008
	introWSExToolWindow        = 0x00000080
	introWSExLayered           = 0x00080000
	introLWAAlpha              = 0x00000002
	introSMCXScreen            = 0
	introSMCYScreen            = 1
	introBLACKNESS             = 0x00000042
	introDIBRGBColors          = 0
	introSRCCOPY               = 0x00CC0020
	introStretchHalftone       = 4
	introBkTransparent         = 1
	introDTCenter              = 0x00000001
	introDTVCenter             = 0x00000004
	introDTSingleLine          = 0x00000020
	introFontSemibold          = 600
	introModeImage       uint8 = 0
	introModeText        uint8 = 1
)

const (
	introImageFadeIn  = 1100 * time.Millisecond
	introImageHold    = 1200 * time.Millisecond
	introImageFadeOut = 1000 * time.Millisecond
	introTextFadeIn   = 1000 * time.Millisecond
	introTextHold     = 1250 * time.Millisecond
	introTextFadeOut  = 900 * time.Millisecond
)

//go:embed assets/mawang-intro.jpg
var introJPEG []byte

type introPoint struct {
	X int32
	Y int32
}

type introMsg struct {
	Hwnd     uintptr
	Message  uint32
	WParam   uintptr
	LParam   uintptr
	Time     uint32
	Pt       introPoint
	LPrivate uint32
}

type introPaintStruct struct {
	Hdc       uintptr
	Erase     int32
	Paint     rect
	Restore   int32
	IncUpdate int32
	Reserved  [32]byte
}

type introWndClassEx struct {
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
	IconSmall  uintptr
}

type introBitmapInfoHeader struct {
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

type introBitmapInfo struct {
	Header introBitmapInfoHeader
	Colors [1]uint32
}

type introSession struct {
	hwnd      uintptr
	width     int
	height    int
	mode      uint8
	imageBGRA []byte
	imageW    int
	imageH    int
	font      uintptr
	done      chan struct{}
	destroyed bool
}

var (
	introUser32                = syscall.NewLazyDLL("user32.dll")
	introKernel32              = syscall.NewLazyDLL("kernel32.dll")
	introGDI32                 = syscall.NewLazyDLL("gdi32.dll")
	introRegisterClassEx       = introUser32.NewProc("RegisterClassExW")
	introCreateWindowEx        = introUser32.NewProc("CreateWindowExW")
	introDefWindowProc         = introUser32.NewProc("DefWindowProcW")
	introGetMessage            = introUser32.NewProc("GetMessageW")
	introTranslateMessage      = introUser32.NewProc("TranslateMessage")
	introDispatchMessage       = introUser32.NewProc("DispatchMessageW")
	introPostMessage           = introUser32.NewProc("PostMessageW")
	introDestroyWindow         = introUser32.NewProc("DestroyWindow")
	introPostQuitMessage       = introUser32.NewProc("PostQuitMessage")
	introBeginPaint            = introUser32.NewProc("BeginPaint")
	introEndPaint              = introUser32.NewProc("EndPaint")
	introInvalidateRect        = introUser32.NewProc("InvalidateRect")
	introUpdateWindow          = introUser32.NewProc("UpdateWindow")
	introSetLayeredWindowAttrs = introUser32.NewProc("SetLayeredWindowAttributes")
	introLoadCursor            = introUser32.NewProc("LoadCursorW")
	introGetSystemMetrics      = introUser32.NewProc("GetSystemMetrics")
	introGetModuleHandle       = introKernel32.NewProc("GetModuleHandleW")
	introPatBlt                = introGDI32.NewProc("PatBlt")
	introStretchDIBits         = introGDI32.NewProc("StretchDIBits")
	introSetStretchBltMode     = introGDI32.NewProc("SetStretchBltMode")
	introCreateFont            = introGDI32.NewProc("CreateFontW")
	introSelectObject          = introGDI32.NewProc("SelectObject")
	introDeleteObject          = introGDI32.NewProc("DeleteObject")
	introSetBkMode             = introGDI32.NewProc("SetBkMode")
	introSetTextColor          = introGDI32.NewProc("SetTextColor")
	introDrawText              = introUser32.NewProc("DrawTextW")

	introClassOnce sync.Once
	introClassErr  error
	introWndProcCB = syscall.NewCallback(introWndProc)
	introMu        sync.Mutex
	activeIntro    *introSession
)

func currentIntro() *introSession {
	introMu.Lock()
	s := activeIntro
	introMu.Unlock()
	return s
}

func setCurrentIntro(s *introSession) bool {
	introMu.Lock()
	defer introMu.Unlock()
	if activeIntro != nil {
		return false
	}
	activeIntro = s
	return true
}

func clearCurrentIntro(s *introSession) {
	introMu.Lock()
	if activeIntro == s {
		activeIntro = nil
	}
	introMu.Unlock()
}

func showIntroWindow() {
	s := currentIntro()
	if s == nil || s.hwnd == 0 || s.destroyed {
		return
	}
	procShowWindow.Call(s.hwnd, swShow)
	procSetForegroundWindow.Call(s.hwnd)
}

func ensureIntroClass() error {
	introClassOnce.Do(func() {
		instance, _, err := introGetModuleHandle.Call(0)
		if instance == 0 {
			introClassErr = fmt.Errorf("GetModuleHandleW failed: %v", err)
			return
		}
		className, err := syscall.UTF16PtrFromString(introClassName)
		if err != nil {
			introClassErr = err
			return
		}
		cursor, _, _ := introLoadCursor.Call(0, 32512)
		wc := introWndClassEx{
			CbSize:    uint32(unsafe.Sizeof(introWndClassEx{})),
			WndProc:   introWndProcCB,
			Instance:  instance,
			Cursor:    cursor,
			ClassName: className,
		}
		r, _, callErr := introRegisterClassEx.Call(uintptr(unsafe.Pointer(&wc)))
		if r == 0 {
			if errno, ok := callErr.(syscall.Errno); !ok || errno != syscall.Errno(1410) {
				introClassErr = fmt.Errorf("RegisterClassExW failed: %v", callErr)
			}
		}
	})
	return introClassErr
}

func decodeIntroImage() ([]byte, int, int, error) {
	img, err := jpeg.Decode(bytes.NewReader(introJPEG))
	if err != nil {
		return nil, 0, 0, fmt.Errorf("intro JPEG decode failed: %w", err)
	}
	b := img.Bounds()
	w, h := b.Dx(), b.Dy()
	if w <= 0 || h <= 0 {
		return nil, 0, 0, fmt.Errorf("intro JPEG has invalid dimensions")
	}
	pixels := make([]byte, w*h*4)
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			r, g, bl, _ := img.At(b.Min.X+x, b.Min.Y+y).RGBA()
			i := (y*w + x) * 4
			pixels[i] = byte(bl >> 8)
			pixels[i+1] = byte(g >> 8)
			pixels[i+2] = byte(r >> 8)
			pixels[i+3] = 0
		}
	}
	return pixels, w, h, nil
}

func fitIntroImage(screenW, screenH, imageW, imageH int) (x, y, width, height int) {
	if screenW <= 0 || screenH <= 0 || imageW <= 0 || imageH <= 0 {
		return
	}
	imageAR := float64(imageW) / float64(imageH)
	screenAR := float64(screenW) / float64(screenH)
	if screenAR > imageAR {
		height = screenH
		width = int(float64(height)*imageAR + 0.5)
		x = (screenW - width) / 2
	} else {
		width = screenW
		height = int(float64(width)/imageAR + 0.5)
		y = (screenH - height) / 2
	}
	return
}

func createIntroFont(screenH int) (uintptr, error) {
	height := screenH / 18
	if height < 42 {
		height = 42
	}
	if height > 84 {
		height = 84
	}
	face, _ := syscall.UTF16PtrFromString("Malgun Gothic")
	font, _, err := introCreateFont.Call(
		uintptr(int32(-height)), 0, 0, 0,
		introFontSemibold,
		0, 0, 0, 1, 0, 0, 5, 0,
		uintptr(unsafe.Pointer(face)),
	)
	if font == 0 {
		return 0, fmt.Errorf("CreateFontW failed: %v", err)
	}
	return font, nil
}

func setIntroAlpha(h uintptr, alpha byte) {
	if h == 0 {
		return
	}
	if r, _, err := introSetLayeredWindowAttrs.Call(h, 0, uintptr(alpha), introLWAAlpha); r == 0 {
		logDesktop("SetLayeredWindowAttributes failed: %v", err)
	}
}

func smoothIntro(t float64) float64 {
	if t < 0 {
		t = 0
	}
	if t > 1 {
		t = 1
	}
	return t * t * (3 - 2*t)
}

func fadeIntro(s *introSession, from, to byte, duration time.Duration) bool {
	if s == nil || s.hwnd == 0 {
		return false
	}
	start := time.Now()
	for {
		if exiting || s.destroyed {
			return false
		}
		elapsed := time.Since(start)
		p := smoothIntro(float64(elapsed) / float64(duration))
		v := float64(from) + (float64(to)-float64(from))*p
		if v < 0 {
			v = 0
		}
		if v > 255 {
			v = 255
		}
		setIntroAlpha(s.hwnd, byte(v+0.5))
		if elapsed >= duration {
			break
		}
		time.Sleep(16 * time.Millisecond)
	}
	setIntroAlpha(s.hwnd, to)
	return true
}

func animateIntro(s *introSession) {
	if !fadeIntro(s, 0, 255, introImageFadeIn) {
		return
	}
	time.Sleep(introImageHold)
	if !fadeIntro(s, 255, 0, introImageFadeOut) {
		return
	}
	if r, _, err := introPostMessage.Call(s.hwnd, introWMSwitchText, 0, 0); r == 0 {
		logDesktop("intro switch message failed: %v", err)
		return
	}
	time.Sleep(80 * time.Millisecond)
	if !fadeIntro(s, 0, 255, introTextFadeIn) {
		return
	}
	time.Sleep(introTextHold)
	if !fadeIntro(s, 255, 0, introTextFadeOut) {
		return
	}
	if r, _, err := introPostMessage.Call(s.hwnd, introWMFinish, 0, 0); r == 0 {
		logDesktop("intro finish message failed: %v", err)
	}
}

func paintIntro(s *introSession, h uintptr) {
	if s == nil || s.hwnd != h {
		return
	}
	var ps introPaintStruct
	hdc, _, err := introBeginPaint.Call(h, uintptr(unsafe.Pointer(&ps)))
	if hdc == 0 {
		logDesktop("BeginPaint for intro failed: %v", err)
		return
	}
	defer introEndPaint.Call(h, uintptr(unsafe.Pointer(&ps)))

	introPatBlt.Call(hdc, 0, 0, uintptr(s.width), uintptr(s.height), introBLACKNESS)

	if s.mode == introModeImage && len(s.imageBGRA) > 0 {
		x, y, drawW, drawH := fitIntroImage(s.width, s.height, s.imageW, s.imageH)
		bmi := introBitmapInfo{Header: introBitmapInfoHeader{
			Size:        uint32(unsafe.Sizeof(introBitmapInfoHeader{})),
			Width:       int32(s.imageW),
			Height:      -int32(s.imageH),
			Planes:      1,
			BitCount:    32,
			Compression: 0,
		}}
		introSetStretchBltMode.Call(hdc, introStretchHalftone)
		introStretchDIBits.Call(
			hdc,
			uintptr(x), uintptr(y), uintptr(drawW), uintptr(drawH),
			0, 0, uintptr(s.imageW), uintptr(s.imageH),
			uintptr(unsafe.Pointer(&s.imageBGRA[0])),
			uintptr(unsafe.Pointer(&bmi)), introDIBRGBColors, introSRCCOPY,
		)
		return
	}

	if s.mode == introModeText && s.font != 0 {
		old, _, _ := introSelectObject.Call(hdc, s.font)
		if old != 0 && old != ^uintptr(0) {
			defer introSelectObject.Call(hdc, old)
		}
		introSetBkMode.Call(hdc, introBkTransparent)
		introSetTextColor.Call(hdc, 0x00FFFFFF)
		text, _ := syscall.UTF16PtrFromString("Mawang Scheduler 마왕 스케줄러")
		rc := rect{Left: 0, Top: 0, Right: int32(s.width), Bottom: int32(s.height)}
		introDrawText.Call(
			hdc,
			uintptr(unsafe.Pointer(text)),
			^uintptr(0),
			uintptr(unsafe.Pointer(&rc)),
			introDTCenter|introDTVCenter|introDTSingleLine,
		)
	}
}

func introWndProc(h uintptr, msg uint32, wparam, lparam uintptr) uintptr {
	s := currentIntro()
	switch msg {
	case introWMPaint:
		paintIntro(s, h)
		return 0
	case introWMEraseBkgnd:
		return 1
	case introWMSwitchText:
		if s != nil && s.hwnd == h {
			s.mode = introModeText
			introInvalidateRect.Call(h, 0, 0)
			introUpdateWindow.Call(h)
		}
		return 0
	case introWMFinish:
		if s != nil && s.hwnd == h {
			procShowWindow.Call(h, swHide)
			introDestroyWindow.Call(h)
		}
		return 0
	case introWMClose:
		if exiting {
			introDestroyWindow.Call(h)
		}
		return 0
	case introWMDestroy:
		if s != nil && s.hwnd == h {
			s.destroyed = true
		}
		introPostQuitMessage.Call(0)
		return 0
	}
	r, _, _ := introDefWindowProc.Call(h, uintptr(msg), wparam, lparam)
	return r
}

func createIntroWindow(width, height int) (uintptr, error) {
	instance, _, err := introGetModuleHandle.Call(0)
	if instance == 0 {
		return 0, fmt.Errorf("GetModuleHandleW failed: %v", err)
	}
	className, _ := syscall.UTF16PtrFromString(introClassName)
	title, _ := syscall.UTF16PtrFromString(appTitle)
	h, _, callErr := introCreateWindowEx.Call(
		introWSExTopmost|introWSExToolWindow|introWSExLayered,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(title)),
		introWSPopup,
		0, 0, uintptr(width), uintptr(height),
		0, 0, instance, 0,
	)
	if h == 0 {
		return 0, fmt.Errorf("CreateWindowExW failed: %v", callErr)
	}
	return h, nil
}

func failIntroStart(err error) {
	if err != nil {
		logDesktop("startup intro fallback: %v", err)
	}
	releaseStartupLock()
	if !exiting {
		showWindow()
	}
}

func runStartupIntro() {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	if err := ensureIntroClass(); err != nil {
		failIntroStart(err)
		return
	}
	w, _, wErr := introGetSystemMetrics.Call(introSMCXScreen)
	h, _, hErr := introGetSystemMetrics.Call(introSMCYScreen)
	if int(w) <= 0 || int(h) <= 0 {
		failIntroStart(fmt.Errorf("GetSystemMetrics failed: %v %v", wErr, hErr))
		return
	}

	pixels, imageW, imageH, err := decodeIntroImage()
	if err != nil {
		failIntroStart(err)
		return
	}
	font, err := createIntroFont(int(h))
	if err != nil {
		failIntroStart(err)
		return
	}

	hwnd, err := createIntroWindow(int(w), int(h))
	if err != nil {
		introDeleteObject.Call(font)
		failIntroStart(err)
		return
	}

	s := &introSession{
		hwnd:      hwnd,
		width:     int(w),
		height:    int(h),
		mode:      introModeImage,
		imageBGRA: pixels,
		imageW:    imageW,
		imageH:    imageH,
		font:      font,
		done:      make(chan struct{}),
	}
	if !setCurrentIntro(s) {
		introDestroyWindow.Call(hwnd)
		introDeleteObject.Call(font)
		failIntroStart(fmt.Errorf("another intro session is already active"))
		return
	}
	defer func() {
		if s.font != 0 {
			introDeleteObject.Call(s.font)
			s.font = 0
		}
		clearCurrentIntro(s)
		close(s.done)
		if !exiting {
			releaseStartupLock()
			showWindow()
		}
	}()

	setIntroAlpha(hwnd, 0)
	procShowWindow.Call(hwnd, swShow)
	procSetForegroundWindow.Call(hwnd)
	introInvalidateRect.Call(hwnd, 0, 0)
	introUpdateWindow.Call(hwnd)

	go animateIntro(s)

	var m introMsg
	for {
		r, _, getErr := introGetMessage.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if int32(r) == -1 {
			logDesktop("GetMessageW for intro failed: %v", getErr)
			break
		}
		if r == 0 {
			break
		}
		introTranslateMessage.Call(uintptr(unsafe.Pointer(&m)))
		introDispatchMessage.Call(uintptr(unsafe.Pointer(&m)))
	}
}

func closeIntroForExit() {
	s := currentIntro()
	if s == nil || s.hwnd == 0 || s.destroyed {
		return
	}
	if r, _, err := introPostMessage.Call(s.hwnd, introWMClose, 0, 0); r == 0 {
		logDesktop("intro exit message failed: %v", err)
		return
	}
	select {
	case <-s.done:
	case <-time.After(1200 * time.Millisecond):
		logDesktop("intro shutdown wait timed out")
	}
}
