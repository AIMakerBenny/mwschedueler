//go:build windows

package main

import (
	"bytes"
	_ "embed"
	"fmt"
	"image/jpeg"
	"runtime"
	"sync"
	"sync/atomic"
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
	introWMKeyDown             = 0x0100
	introWMSysKeyDown          = 0x0104
	introWMLButtonDown         = 0x0201
	introWMRButtonDown         = 0x0204
	introWMMButtonDown         = 0x0207
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
	introDTRight               = 0x00000002
	introDTVCenter             = 0x00000004
	introDTSingleLine          = 0x00000020
	introVKReturn              = 0x0D
	introVKEscape              = 0x1B
	introVKSpace               = 0x20
	introFontMedium            = 500
	introModeImage       uint8 = 0
	introModeText        uint8 = 1
)

const (
	introImageFadeIn     = 950 * time.Millisecond
	introImageHold       = 1100 * time.Millisecond
	introImageFadeOut    = 750 * time.Millisecond
	introTextFadeIn      = 800 * time.Millisecond
	introTextHold        = 1000 * time.Millisecond
	introTextFadeOut     = 800 * time.Millisecond
	introBlackBeforeMain = 250 * time.Millisecond
	introMainFadeIn      = 340 * time.Millisecond
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
	titleFont     uintptr
	wordmarkPhase atomic.Uint32
	skipCh        chan struct{}
	done      chan struct{}
	destroyed bool
	mainShown bool
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

func createIntroTitleFont(screenH int) (uintptr, error) {
	titleH := screenH / 13
	if titleH < 56 {
		titleH = 56
	}
	if titleH > 86 {
		titleH = 86
	}
	return createIntroFont("Segoe UI", titleH, introFontMedium)
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

func requestIntroSkip(s *introSession) {
	if s == nil || s.destroyed || s.skipCh == nil {
		return
	}
	select {
	case s.skipCh <- struct{}{}:
	default:
	}
}

func clearIntroSkip(s *introSession) {
	if s == nil || s.skipCh == nil {
		return
	}
	for {
		select {
		case <-s.skipCh:
		default:
			return
		}
	}
}

func fadeIntroStage(s *introSession, from, to byte, duration time.Duration) (alive, skipped bool) {
	if s == nil || s.hwnd == 0 {
		return false, false
	}
	start := time.Now()
	for {
		if exiting || s.destroyed {
			return false, false
		}
		select {
		case <-s.skipCh:
			setIntroAlpha(s.hwnd, to)
			return true, true
		default:
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
	return true, false
}

func waitIntroStage(s *introSession, duration time.Duration) (alive, skipped bool) {
	if s == nil {
		return false, false
	}
	timer := time.NewTimer(duration)
	defer timer.Stop()
	for {
		if exiting || s.destroyed {
			return false, false
		}
		select {
		case <-s.skipCh:
			return true, true
		case <-timer.C:
			return true, false
		case <-time.After(20 * time.Millisecond):
		}
	}
}

func waitStartupReadyOrSkip(s *introSession, timeout time.Duration) bool {
	timer := time.NewTimer(timeout)
	defer timer.Stop()
	select {
	case <-startupWebReady:
		return true
	case <-s.skipCh:
		logDesktop("startup intro readiness wait skipped by user")
		return true
	case <-timer.C:
		logDesktop("startup WebView readiness timed out after %s", timeout)
		return true
	}
}

func runImageIntroStage(s *introSession) bool {
	clearIntroSkip(s)
	alive, skipped := fadeIntroStage(s, 0, 255, introImageFadeIn)
	if !alive {
		return false
	}
	if skipped {
		setIntroAlpha(s.hwnd, 0)
		return true
	}
	alive, skipped = waitIntroStage(s, introImageHold)
	if !alive {
		return false
	}
	if skipped {
		setIntroAlpha(s.hwnd, 0)
		return true
	}
	alive, _ = fadeIntroStage(s, 255, 0, introImageFadeOut)
	if !alive {
		return false
	}
	setIntroAlpha(s.hwnd, 0)
	return true
}

func runTextIntroStage(s *introSession) bool {
	clearIntroSkip(s)
	alive, skipped := fadeIntroStage(s, 0, 255, introTextFadeIn)
	if !alive {
		return false
	}
	if skipped {
		setIntroAlpha(s.hwnd, 0)
		return waitStartupReadyOrSkip(s, 8*time.Second)
	}
	alive, skipped = waitIntroStage(s, introTextHold)
	if !alive {
		return false
	}
	if skipped {
		setIntroAlpha(s.hwnd, 0)
		return waitStartupReadyOrSkip(s, 8*time.Second)
	}
	if !waitStartupReadyOrSkip(s, 8*time.Second) {
		return false
	}
	alive, _ = fadeIntroStage(s, 255, 0, introTextFadeOut)
	if !alive {
		return false
	}
	setIntroAlpha(s.hwnd, 0)
	return true
}

func animateFreshWordmark(s *introSession) {
	if s == nil || s.hwnd == 0 {
		return
	}
	start := time.Now()
	const duration = 700 * time.Millisecond
	for {
		if exiting || s.destroyed || s.mode != introModeText {
			return
		}
		elapsed := time.Since(start)
		p := smoothIntro(float64(elapsed) / float64(duration))
		s.wordmarkPhase.Store(uint32(p * 1000))
		introInvalidateRect.Call(s.hwnd, 0, 0)
		if elapsed >= duration {
			s.wordmarkPhase.Store(1000)
			introInvalidateRect.Call(s.hwnd, 0, 0)
			return
		}
		time.Sleep(16 * time.Millisecond)
	}
}

func animateIntro(s *introSession) {
	if !runImageIntroStage(s) {
		return
	}

	// Switch paint content while fully transparent, then begin the title fade immediately.
	if r, _, err := introPostMessage.Call(s.hwnd, introWMSwitchText, 0, 0); r == 0 {
		logDesktop("intro switch message failed: %v", err)
		return
	}
	if !runTextIntroStage(s) {
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

	if s.mode == introModeText && s.titleFont != 0 {
		introSetBkMode.Call(hdc, introBkTransparent)

		phase := int(s.wordmarkPhase.Load())
		if phase < 0 {
			phase = 0
		}
		if phase > 1000 {
			phase = 1000
		}

		centerX := s.width / 2
		centerY := s.height/2 + (18 * (1000 - phase) / 1000)
		contentW := s.width
		if contentW > 1180 {
			contentW = 1180
		}
		left := (s.width - contentW) / 2
		right := left + contentW
		gap := 13

		old, _, _ := introSelectObject.Call(hdc, s.titleFont)

		mawang, _ := syscall.UTF16PtrFromString("Mawang")
		scheduler, _ := syscall.UTF16PtrFromString("Scheduler")
		mawangRc := rect{Left: int32(left), Top: int32(centerY - 55), Right: int32(centerX - gap), Bottom: int32(centerY + 55)}
		schedulerRc := rect{Left: int32(centerX + gap), Top: int32(centerY - 55), Right: int32(right), Bottom: int32(centerY + 55)}

		introSetTextColor.Call(hdc, 0x00F8F8F8)
		introDrawText.Call(
			hdc,
			uintptr(unsafe.Pointer(mawang)),
			^uintptr(0),
			uintptr(unsafe.Pointer(&mawangRc)),
			introDTRight|introDTVCenter|introDTSingleLine,
		)

		schedulerTone := byte(188 + (48*phase)/1000)
		schedulerColor := uintptr(schedulerTone) | uintptr(schedulerTone-8)<<8 | uintptr(schedulerTone+8)<<16
		introSetTextColor.Call(hdc, schedulerColor)
		introDrawText.Call(
			hdc,
			uintptr(unsafe.Pointer(scheduler)),
			^uintptr(0),
			uintptr(unsafe.Pointer(&schedulerRc)),
			introDTVCenter|introDTSingleLine,
		)

		if old != 0 && old != ^uintptr(0) {
			introSelectObject.Call(hdc, old)
		}

		separatorH := 52 * phase / 1000
		if separatorH > 0 {
			separatorRc := rect{
				Left:   int32(centerX),
				Top:    int32(centerY - separatorH/2),
				Right:  int32(centerX + 1),
				Bottom: int32(centerY + separatorH/2),
			}
			separatorBrush, _, _ := introCreateSolidBrush.Call(0x00D77AA8)
			if separatorBrush != 0 {
				introFillRect.Call(hdc, uintptr(unsafe.Pointer(&separatorRc)), separatorBrush)
				introDeleteObject.Call(separatorBrush)
			}
		}

		railW := 92 * phase / 1000
		if railW > 0 {
			railY := centerY + 69
			leftRail := rect{
				Left:   int32(centerX - 24 - railW),
				Top:    int32(railY),
				Right:  int32(centerX - 24),
				Bottom: int32(railY + 1),
			}
			rightRail := rect{
				Left:   int32(centerX + 24),
				Top:    int32(railY),
				Right:  int32(centerX + 24 + railW),
				Bottom: int32(railY + 1),
			}
			railBrush, _, _ := introCreateSolidBrush.Call(0x00684A78)
			if railBrush != 0 {
				introFillRect.Call(hdc, uintptr(unsafe.Pointer(&leftRail)), railBrush)
				introFillRect.Call(hdc, uintptr(unsafe.Pointer(&rightRail)), railBrush)
				introDeleteObject.Call(railBrush)
			}
		}
	}
}

func introWndProc(h uintptr, msg uint32, wparam, lparam uintptr) uintptr {
	s := currentIntro()
	switch msg {
	case introWMKeyDown, introWMSysKeyDown:
		if wparam == introVKSpace || wparam == introVKReturn || wparam == introVKEscape {
			requestIntroSkip(s)
			return 0
		}
	case introWMLButtonDown, introWMRButtonDown, introWMMButtonDown:
		requestIntroSkip(s)
		return 0
	case introWMPaint:
		paintIntro(s, h)
		return 0
	case introWMEraseBkgnd:
		return 1
	case introWMSwitchText:
		if s != nil && s.hwnd == h {
			s.mode = introModeText
			s.wordmarkPhase.Store(0)
			introInvalidateRect.Call(h, 0, 0)
			introUpdateWindow.Call(h)
			go animateFreshWordmark(s)
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
	titleFont, err := createIntroTitleFont(int(h))
	if err != nil {
		failIntroStart(err)
		return
	}

	shieldHwnd, err := createIntroWindow(int(w), int(h))
	if err != nil {
		introDeleteObject.Call(titleFont)
		failIntroStart(err)
		return
	}
	hwnd, err := createIntroWindow(int(w), int(h))
	if err != nil {
		introDestroyWindow.Call(shieldHwnd)
		introDeleteObject.Call(titleFont)
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
		titleFont: titleFont,
		skipCh:    make(chan struct{}, 1),
		done:         make(chan struct{}),
	}
	if !setCurrentIntro(s) {
		introDestroyWindow.Call(hwnd)
		introDestroyWindow.Call(shieldHwnd)
		introDeleteObject.Call(titleFont)
		failIntroStart(fmt.Errorf("another intro session is already active"))
		return
	}
	defer func() {
		if s.titleFont != 0 {
			introDeleteObject.Call(s.titleFont)
			s.titleFont = 0
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
