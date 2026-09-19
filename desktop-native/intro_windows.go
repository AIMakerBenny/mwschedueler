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
	introFontRegular           = 400
	introFontSemibold          = 600
	introFontBold              = 700
	introFontExtraBold         = 800
	introModeImage       uint8 = 0
	introModeText        uint8 = 1
)

const (
	introImageFadeIn     = 1000 * time.Millisecond
	introImageHold       = 1200 * time.Millisecond
	introImageFadeOut    = 800 * time.Millisecond
	introBlackAfterImage = 250 * time.Millisecond
	introTextFadeIn      = 800 * time.Millisecond
	introTextHold        = 1000 * time.Millisecond
	introTextFadeOut     = 800 * time.Millisecond
	introBlackBeforeMain = 250 * time.Millisecond
	introMainFadeIn      = 350 * time.Millisecond
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
	hwnd       uintptr
	shieldHwnd uintptr
	width      int
	height     int
	mode       uint8
	imageBGRA  []byte
	imageW     int
	imageH     int
	titleFont    uintptr
	subtitleFont uintptr
	labelFont    uintptr
	done         chan struct{}
	destroyed  bool
	mainShown  bool
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
	introCreateSolidBrush      = introGDI32.NewProc("CreateSolidBrush")
	introFillRect              = introUser32.NewProc("FillRect")
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
	if s.shieldHwnd != 0 {
		procShowWindow.Call(s.shieldHwnd, swShow)
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

func createIntroFont(faceName string, height, weight int) (uintptr, error) {
	face, _ := syscall.UTF16PtrFromString(faceName)
	font, _, err := introCreateFont.Call(
		uintptr(int32(-height)), 0, 0, 0,
		uintptr(weight),
		0, 0, 0, 1, 0, 0, 5, 0,
		uintptr(unsafe.Pointer(face)),
	)
	if font == 0 {
		return 0, fmt.Errorf("CreateFontW %s failed: %v", faceName, err)
	}
	return font, nil
}

func createIntroFonts(screenH int) (title, subtitle, label uintptr, err error) {
	titleH := screenH / 11
	if titleH < 58 {
		titleH = 58
	}
	if titleH > 104 {
		titleH = 104
	}
	subtitleH := screenH / 30
	if subtitleH < 27 {
		subtitleH = 27
	}
	if subtitleH > 42 {
		subtitleH = 42
	}
	labelH := screenH / 55
	if labelH < 16 {
		labelH = 16
	}
	if labelH > 22 {
		labelH = 22
	}

	title, err = createIntroFont("Segoe UI Semibold", titleH, introFontExtraBold)
	if err != nil {
		return
	}
	subtitle, err = createIntroFont("Malgun Gothic", subtitleH, introFontSemibold)
	if err != nil {
		introDeleteObject.Call(title)
		title = 0
		return
	}
	label, err = createIntroFont("Segoe UI", labelH, introFontBold)
	if err != nil {
		introDeleteObject.Call(title)
		introDeleteObject.Call(subtitle)
		title, subtitle = 0, 0
		return
	}
	return
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

func fadeWindowAlpha(s *introSession, h uintptr, from, to byte, duration time.Duration) bool {
	if s == nil || h == 0 {
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
		setIntroAlpha(h, byte(v+0.5))
		if elapsed >= duration {
			break
		}
		time.Sleep(16 * time.Millisecond)
	}
	setIntroAlpha(h, to)
	return true
}

func fadeIntro(s *introSession, from, to byte, duration time.Duration) bool {
	if s == nil {
		return false
	}
	return fadeWindowAlpha(s, s.hwnd, from, to, duration)
}

func animateIntro(s *introSession) {
	if !fadeIntro(s, 0, 255, introImageFadeIn) {
		return
	}
	time.Sleep(introImageHold)

	if !fadeIntro(s, 255, 0, introImageFadeOut) {
		return
	}
	time.Sleep(introBlackAfterImage)

	if r, _, err := introPostMessage.Call(s.hwnd, introWMSwitchText, 0, 0); r == 0 {
		logDesktop("intro switch message failed: %v", err)
		return
	}
	time.Sleep(40 * time.Millisecond)

	if !fadeIntro(s, 0, 255, introTextFadeIn) {
		return
	}
	time.Sleep(introTextHold)

	waitForStartupWebReady(8 * time.Second)

	if !fadeIntro(s, 255, 0, introTextFadeOut) {
		return
	}
	time.Sleep(introBlackBeforeMain)

	releaseStartupLock()
	s.mainShown = true
	showWindow()

	if s.shieldHwnd != 0 {
		if !fadeWindowAlpha(s, s.shieldHwnd, 255, 0, introMainFadeIn) {
			return
		}
	}

	if r, _, err := introPostMessage.Call(s.hwnd, introWMFinish, 0, 0); r == 0 {
		logDesktop("intro finish message failed: %v", err)
	}
}

func paintIntro(s *introSession, h uintptr) {
	if s == nil {
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

	if h == s.shieldHwnd {
		return
	}
	if h != s.hwnd {
		return
	}

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

	if s.mode == introModeText && s.titleFont != 0 && s.subtitleFont != 0 && s.labelFont != 0 {
		introSetBkMode.Call(hdc, introBkTransparent)

		centerY := s.height / 2
		contentW := s.width
		if contentW > 1260 {
			contentW = 1260
		}
		left := (s.width - contentW) / 2
		right := left + contentW

		// Quiet premium label above the main title.
		label, _ := syscall.UTF16PtrFromString("MAWANG  DESKTOP")
		labelRc := rect{Left: int32(left), Top: int32(centerY - 118), Right: int32(right), Bottom: int32(centerY - 78)}
		old, _, _ := introSelectObject.Call(hdc, s.labelFont)
		introSetTextColor.Call(hdc, 0x00FF7C9E)
		introDrawText.Call(hdc, uintptr(unsafe.Pointer(label)), ^uintptr(0), uintptr(unsafe.Pointer(&labelRc)), introDTCenter|introDTVCenter|introDTSingleLine)
		if old != 0 && old != ^uintptr(0) {
			introSelectObject.Call(hdc, old)
		}

		// Main wordmark with a restrained violet shadow for depth.
		title, _ := syscall.UTF16PtrFromString("MAWANG SCHEDULER")
		titleRc := rect{Left: int32(left), Top: int32(centerY - 80), Right: int32(right), Bottom: int32(centerY + 26)}
		shadowRc := titleRc
		shadowRc.Left += 2
		shadowRc.Top += 3
		shadowRc.Right += 2
		shadowRc.Bottom += 3
		old, _, _ = introSelectObject.Call(hdc, s.titleFont)
		introSetTextColor.Call(hdc, 0x00623A72)
		introDrawText.Call(hdc, uintptr(unsafe.Pointer(title)), ^uintptr(0), uintptr(unsafe.Pointer(&shadowRc)), introDTCenter|introDTVCenter|introDTSingleLine)
		introSetTextColor.Call(hdc, 0x00FFFFFF)
		introDrawText.Call(hdc, uintptr(unsafe.Pointer(title)), ^uintptr(0), uintptr(unsafe.Pointer(&titleRc)), introDTCenter|introDTVCenter|introDTSingleLine)
		if old != 0 && old != ^uintptr(0) {
			introSelectObject.Call(hdc, old)
		}

		// Accent rule creates a clear visual break between English and Korean.
		lineW := s.width / 8
		if lineW < 150 {
			lineW = 150
		}
		if lineW > 260 {
			lineW = 260
		}
		lineLeft := (s.width - lineW) / 2
		lineRc := rect{Left: int32(lineLeft), Top: int32(centerY + 31), Right: int32(lineLeft + lineW), Bottom: int32(centerY + 33)}
		brush, _, _ := introCreateSolidBrush.Call(0x00FF7C9E)
		if brush != 0 {
			introFillRect.Call(hdc, uintptr(unsafe.Pointer(&lineRc)), brush)
			introDeleteObject.Call(brush)
		}

		// Korean name stays understated so the English wordmark remains dominant.
		subtitle, _ := syscall.UTF16PtrFromString("마왕 스케줄러")
		subtitleRc := rect{Left: int32(left), Top: int32(centerY + 45), Right: int32(right), Bottom: int32(centerY + 105)}
		old, _, _ = introSelectObject.Call(hdc, s.subtitleFont)
		introSetTextColor.Call(hdc, 0x00C9C5D3)
		introDrawText.Call(hdc, uintptr(unsafe.Pointer(subtitle)), ^uintptr(0), uintptr(unsafe.Pointer(&subtitleRc)), introDTCenter|introDTVCenter|introDTSingleLine)
		if old != 0 && old != ^uintptr(0) {
			introSelectObject.Call(hdc, old)
		}
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
			if s.shieldHwnd != 0 {
				procShowWindow.Call(s.shieldHwnd, swHide)
				introDestroyWindow.Call(s.shieldHwnd)
				s.shieldHwnd = 0
			}
			procShowWindow.Call(h, swHide)
			introDestroyWindow.Call(h)
		}
		return 0
	case introWMClose:
		if exiting && s != nil && s.hwnd == h {
			if s.shieldHwnd != 0 {
				introDestroyWindow.Call(s.shieldHwnd)
				s.shieldHwnd = 0
			}
			introDestroyWindow.Call(h)
		}
		return 0
	case introWMDestroy:
		if s != nil {
			if s.shieldHwnd == h {
				s.shieldHwnd = 0
				return 0
			}
			if s.hwnd == h {
				s.destroyed = true
				introPostQuitMessage.Call(0)
				return 0
			}
		}
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
	titleFont, subtitleFont, labelFont, err := createIntroFonts(int(h))
	if err != nil {
		failIntroStart(err)
		return
	}

	shieldHwnd, err := createIntroWindow(int(w), int(h))
	if err != nil {
		introDeleteObject.Call(titleFont)
		introDeleteObject.Call(subtitleFont)
		introDeleteObject.Call(labelFont)
		failIntroStart(err)
		return
	}
	hwnd, err := createIntroWindow(int(w), int(h))
	if err != nil {
		introDestroyWindow.Call(shieldHwnd)
		introDeleteObject.Call(titleFont)
		introDeleteObject.Call(subtitleFont)
		introDeleteObject.Call(labelFont)
		failIntroStart(err)
		return
	}

	s := &introSession{
		hwnd:         hwnd,
		shieldHwnd:   shieldHwnd,
		width:        int(w),
		height:       int(h),
		mode:         introModeImage,
		imageBGRA:    pixels,
		imageW:       imageW,
		imageH:       imageH,
		titleFont:    titleFont,
		subtitleFont: subtitleFont,
		labelFont:    labelFont,
		done:         make(chan struct{}),
	}
	if !setCurrentIntro(s) {
		introDestroyWindow.Call(hwnd)
		introDestroyWindow.Call(shieldHwnd)
		introDeleteObject.Call(titleFont)
		introDeleteObject.Call(subtitleFont)
		introDeleteObject.Call(labelFont)
		failIntroStart(fmt.Errorf("another intro session is already active"))
		return
	}
	defer func() {
		if s.titleFont != 0 {
			introDeleteObject.Call(s.titleFont)
			s.titleFont = 0
		}
		if s.subtitleFont != 0 {
			introDeleteObject.Call(s.subtitleFont)
			s.subtitleFont = 0
		}
		if s.labelFont != 0 {
			introDeleteObject.Call(s.labelFont)
			s.labelFont = 0
		}
		clearCurrentIntro(s)
		close(s.done)
		if !exiting && !s.mainShown {
			releaseStartupLock()
			showWindow()
		}
	}()

	setIntroAlpha(shieldHwnd, 255)
	setIntroAlpha(hwnd, 0)

	procShowWindow.Call(shieldHwnd, swShow)
	introInvalidateRect.Call(shieldHwnd, 0, 0)
	introUpdateWindow.Call(shieldHwnd)

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
