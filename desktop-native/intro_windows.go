//go:build windows

package main

import (
	"fmt"
	"runtime"
	"sync"
	"syscall"
	"time"
	"unsafe"
)

const (
	introClassName          = "MawangSchedulerNativeIntroV090"
	introTimerID            = 1
	introTimerMS            = 33
	introWMAppFinish        = 0x8001
	introWMAppAbort         = 0x8002
	introWMAppReadiness     = 0x8003
	introWMDestroy          = 0x0002
	introWMPaint            = 0x000F
	introWMClose            = 0x0010
	introWMEraseBkgnd       = 0x0014
	introWMTimer            = 0x0113
	introWMKeyDown          = 0x0100
	introWMLButtonDown      = 0x0201
	introWMRButtonDown      = 0x0204
	introWMMButtonDown      = 0x0207
	introVKReturn           = 0x0D
	introVKEscape           = 0x1B
	introVKSpace            = 0x20
	introWSPopup            = 0x80000000
	introWSExTopmost        = 0x00000008
	introWSExToolWindow     = 0x00000080
	introSWPFrameChanged    = 0x0020
	introSWPNoOwnerZOrder   = 0x0200
	introSMCXScreen         = 0
	introSMCYScreen         = 1
	introMonitorNearest     = 2
)

const (
	introImageFadeInDuration  = 1800 * time.Millisecond
	introImageHoldDuration    = 1700 * time.Millisecond
	introImageFadeOutDuration = 1700 * time.Millisecond
	introTitleFadeInDuration  = 1800 * time.Millisecond
	introTitleHoldDuration    = 1500 * time.Millisecond
	introTitleFadeOutDuration = 1200 * time.Millisecond
	introSkipTitleHold        = 300 * time.Millisecond
	introSkipFadeOutDuration  = 450 * time.Millisecond
)

type introPhase uint8

const (
	introPhaseImageFadeIn introPhase = iota
	introPhaseImageHold
	introPhaseImageFadeOut
	introPhaseTitleFadeIn
	introPhaseTitleHold
	introPhaseTitleWait
	introPhaseTitleFadeOut
	introPhaseFinished
)

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
	Hdc      uintptr
	Erase    int32
	Paint    rect
	Restore  int32
	IncUpdate int32
	Reserved [32]byte
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

type introSession struct {
	hwnd         uintptr
	renderer     *introRenderer
	phase        introPhase
	phaseStarted time.Time
	photoAlpha   byte
	titleAlpha   byte
	skipped      bool
	finishing    bool
	firstPaint   bool
	done         chan struct{}
}

var (
	introUser32              = syscall.NewLazyDLL("user32.dll")
	introKernel32            = syscall.NewLazyDLL("kernel32.dll")
	introRegisterClassEx     = introUser32.NewProc("RegisterClassExW")
	introCreateWindowEx      = introUser32.NewProc("CreateWindowExW")
	introDefWindowProc       = introUser32.NewProc("DefWindowProcW")
	introGetMessage          = introUser32.NewProc("GetMessageW")
	introTranslateMessage    = introUser32.NewProc("TranslateMessage")
	introDispatchMessage     = introUser32.NewProc("DispatchMessageW")
	introPostMessage         = introUser32.NewProc("PostMessageW")
	introDestroyWindow       = introUser32.NewProc("DestroyWindow")
	introPostQuitMessage     = introUser32.NewProc("PostQuitMessage")
	introBeginPaint          = introUser32.NewProc("BeginPaint")
	introEndPaint            = introUser32.NewProc("EndPaint")
	introInvalidateRect      = introUser32.NewProc("InvalidateRect")
	introUpdateWindow        = introUser32.NewProc("UpdateWindow")
	introSetTimer            = introUser32.NewProc("SetTimer")
	introKillTimer           = introUser32.NewProc("KillTimer")
	introLoadCursor          = introUser32.NewProc("LoadCursorW")
	introGetSystemMetrics    = introUser32.NewProc("GetSystemMetrics")
	introIsWindow            = introUser32.NewProc("IsWindow")
	introIsWindowVisible     = introUser32.NewProc("IsWindowVisible")
	introGetModuleHandle     = introKernel32.NewProc("GetModuleHandleW")

	introClassOnce sync.Once
	introClassErr  error
	introWndProcCB = syscall.NewCallback(nativeIntroWndProc)

	introMu       sync.Mutex
	activeIntro   *introSession
	introStarting bool
)

func currentIntro() *introSession {
	introMu.Lock()
	s := activeIntro
	introMu.Unlock()
	return s
}

func claimIntroStart() bool {
	introMu.Lock()
	defer introMu.Unlock()
	if introStarting || activeIntro != nil {
		return false
	}
	introStarting = true
	return true
}

func cancelIntroStart() {
	introMu.Lock()
	introStarting = false
	introMu.Unlock()
}

func publishIntro(s *introSession) bool {
	introMu.Lock()
	defer introMu.Unlock()
	if activeIntro != nil {
		introStarting = false
		return false
	}
	activeIntro = s
	introStarting = false
	return true
}

func clearIntro(s *introSession) {
	introMu.Lock()
	if activeIntro == s {
		activeIntro = nil
	}
	introStarting = false
	introMu.Unlock()
}

func showIntroWindow() {
	s := currentIntro()
	if s == nil || s.hwnd == 0 || s.finishing {
		return
	}
	ok, _, _ := introIsWindow.Call(s.hwnd)
	if ok == 0 {
		return
	}
	procShowWindow.Call(s.hwnd, swShow)
	if r, _, _ := procSetForegroundWindow.Call(s.hwnd); r == 0 {
		logDesktop("intro SetForegroundWindow was rejected")
	}
}

func notifyIntroReadiness() {
	s := currentIntro()
	if s == nil || s.hwnd == 0 {
		return
	}
	if r, _, err := introPostMessage.Call(s.hwnd, introWMAppReadiness, 0, 0); r == 0 {
		logDesktop("intro readiness PostMessage failed: %v", err)
	}
}

func ensureIntroClass() error {
	introClassOnce.Do(func() {
		instance, _, err := introGetModuleHandle.Call(0)
		if instance == 0 {
			introClassErr = fmt.Errorf("GetModuleHandleW failed: %v", err)
			return
		}
		className, convErr := syscall.UTF16PtrFromString(introClassName)
		if convErr != nil {
			introClassErr = convErr
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

func introMonitorRect() (rect, error) {
	wvMu.Lock()
	mainHwnd := hwnd
	wvMu.Unlock()
	if mainHwnd != 0 {
		mon, _, err := procMonitorFromWindow.Call(mainHwnd, introMonitorNearest)
		if mon != 0 {
			mi := monitorInfo{CbSize: uint32(unsafe.Sizeof(monitorInfo{}))}
			ok, _, infoErr := procGetMonitorInfo.Call(mon, uintptr(unsafe.Pointer(&mi)))
			if ok != 0 && mi.RcMonitor.Right > mi.RcMonitor.Left && mi.RcMonitor.Bottom > mi.RcMonitor.Top {
				return mi.RcMonitor, nil
			}
			if infoErr != syscall.Errno(0) {
				logDesktop("GetMonitorInfoW for intro failed: %v", infoErr)
			}
		} else if err != syscall.Errno(0) {
			logDesktop("MonitorFromWindow for intro failed: %v", err)
		}
	}
	w, _, wErr := introGetSystemMetrics.Call(introSMCXScreen)
	h, _, hErr := introGetSystemMetrics.Call(introSMCYScreen)
	if int32(w) <= 0 || int32(h) <= 0 {
		return rect{}, fmt.Errorf("GetSystemMetrics failed: width=%d height=%d errW=%v errH=%v", w, h, wErr, hErr)
	}
	return rect{Left: 0, Top: 0, Right: int32(w), Bottom: int32(h)}, nil
}

func createIntroWindow(bounds rect) (uintptr, error) {
	instance, _, err := introGetModuleHandle.Call(0)
	if instance == 0 {
		return 0, fmt.Errorf("GetModuleHandleW failed: %v", err)
	}
	className, _ := syscall.UTF16PtrFromString(introClassName)
	title, _ := syscall.UTF16PtrFromString(appTitle)
	h, _, callErr := introCreateWindowEx.Call(
		introWSExTopmost|introWSExToolWindow,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(title)),
		introWSPopup,
		uintptr(bounds.Left),
		uintptr(bounds.Top),
		uintptr(bounds.Right-bounds.Left),
		uintptr(bounds.Bottom-bounds.Top),
		0, 0, instance, 0,
	)
	if h == 0 {
		return 0, fmt.Errorf("CreateWindowExW failed: %v", callErr)
	}
	return h, nil
}

func setIntroVisual(s *introSession, photo, title byte) {
	if s == nil {
		return
	}
	if s.photoAlpha == photo && s.titleAlpha == title {
		return
	}
	s.photoAlpha = photo
	s.titleAlpha = title
	if s.hwnd != 0 {
		if r, _, err := introInvalidateRect.Call(s.hwnd, 0, 0); r == 0 {
			logDesktop("intro InvalidateRect failed: %v", err)
		}
	}
}

func smoothIntroProgress(elapsed, duration time.Duration) float64 {
	if duration <= 0 {
		return 1
	}
	t := float64(elapsed) / float64(duration)
	if t < 0 {
		t = 0
	}
	if t > 1 {
		t = 1
	}
	return t * t * (3 - 2*t)
}

func alphaFromProgress(p float64, reverse bool) byte {
	if reverse {
		p = 1 - p
	}
	if p < 0 {
		p = 0
	}
	if p > 1 {
		p = 1
	}
	return byte(p*255 + 0.5)
}

func enterIntroPhase(s *introSession, phase introPhase, now time.Time) {
	s.phase = phase
	s.phaseStarted = now
	switch phase {
	case introPhaseImageFadeIn:
		setIntroVisual(s, 0, 0)
	case introPhaseImageHold:
		setIntroVisual(s, 255, 0)
	case introPhaseImageFadeOut:
		setIntroVisual(s, 255, 0)
	case introPhaseTitleFadeIn:
		setIntroVisual(s, 0, 0)
	case introPhaseTitleHold, introPhaseTitleWait:
		setIntroVisual(s, 0, 255)
	case introPhaseTitleFadeOut:
		setIntroVisual(s, 0, 255)
	case introPhaseFinished:
		setIntroVisual(s, 0, 0)
	}
}

func requestIntroSkip(s *introSession) {
	if s == nil || s.finishing || s.phase == introPhaseFinished {
		return
	}
	if !s.skipped {
		s.skipped = true
		logDesktop("intro animation skipped by user input")
	}
	now := time.Now()
	if s.phase < introPhaseTitleHold {
		enterIntroPhase(s, introPhaseTitleHold, now)
		return
	}
	if s.phase == introPhaseTitleFadeIn {
		enterIntroPhase(s, introPhaseTitleHold, now)
	}
}

func tickIntro(s *introSession) {
	if s == nil || s.finishing {
		return
	}
	if exiting {
		abortIntro(s)
		return
	}
	now := time.Now()
	elapsed := now.Sub(s.phaseStarted)
	switch s.phase {
	case introPhaseImageFadeIn:
		if s.skipped {
			enterIntroPhase(s, introPhaseTitleHold, now)
			return
		}
		p := smoothIntroProgress(elapsed, introImageFadeInDuration)
		setIntroVisual(s, alphaFromProgress(p, false), 0)
		if elapsed >= introImageFadeInDuration {
			enterIntroPhase(s, introPhaseImageHold, now)
		}
	case introPhaseImageHold:
		if s.skipped {
			enterIntroPhase(s, introPhaseTitleHold, now)
			return
		}
		if elapsed >= introImageHoldDuration {
			enterIntroPhase(s, introPhaseImageFadeOut, now)
		}
	case introPhaseImageFadeOut:
		if s.skipped {
			enterIntroPhase(s, introPhaseTitleHold, now)
			return
		}
		p := smoothIntroProgress(elapsed, introImageFadeOutDuration)
		setIntroVisual(s, alphaFromProgress(p, true), 0)
		if elapsed >= introImageFadeOutDuration {
			enterIntroPhase(s, introPhaseTitleFadeIn, now)
		}
	case introPhaseTitleFadeIn:
		if s.skipped {
			enterIntroPhase(s, introPhaseTitleHold, now)
			return
		}
		p := smoothIntroProgress(elapsed, introTitleFadeInDuration)
		setIntroVisual(s, 0, alphaFromProgress(p, false))
		if elapsed >= introTitleFadeInDuration {
			enterIntroPhase(s, introPhaseTitleHold, now)
		}
	case introPhaseTitleHold:
		minHold := introTitleHoldDuration
		if s.skipped {
			minHold = introSkipTitleHold
		}
		if elapsed >= minHold {
			if isAppReady() {
				enterIntroPhase(s, introPhaseTitleFadeOut, now)
			} else {
				enterIntroPhase(s, introPhaseTitleWait, now)
			}
		}
	case introPhaseTitleWait:
		setIntroVisual(s, 0, 255)
		if isAppReady() {
			enterIntroPhase(s, introPhaseTitleFadeOut, now)
		}
	case introPhaseTitleFadeOut:
		if !isAppReady() {
			enterIntroPhase(s, introPhaseTitleWait, now)
			return
		}
		duration := introTitleFadeOutDuration
		if s.skipped {
			duration = introSkipFadeOutDuration
		}
		p := smoothIntroProgress(elapsed, duration)
		setIntroVisual(s, 0, alphaFromProgress(p, true))
		if elapsed >= duration {
			enterIntroPhase(s, introPhaseFinished, now)
			finishIntro(s)
		}
	}
}

func finishIntro(s *introSession) {
	if s == nil || s.finishing || !isAppReady() {
		return
	}
	wvMu.Lock()
	mainHwnd := hwnd
	mainWebView := wv
	wvMu.Unlock()
	if mainHwnd == 0 || mainWebView == nil {
		logDesktop("intro handoff blocked: main WebView is not available")
		return
	}
	s.finishing = true

	procShowWindow.Call(s.hwnd, swHide)
	if visible, _, _ := introIsWindowVisible.Call(s.hwnd); visible != 0 {
		logDesktop("intro hide verification failed")
	}

	startupMu.Lock()
	startupLocked = false
	startupMu.Unlock()

	showWindow()
	if visible, _, _ := introIsWindowVisible.Call(mainHwnd); visible == 0 {
		logDesktop("main window ShowWindow verification failed during intro handoff")
	}
	if r, _, _ := procSetForegroundWindow.Call(mainHwnd); r == 0 {
		logDesktop("main SetForegroundWindow was rejected during intro handoff")
	}
	if r, _, err := introDestroyWindow.Call(s.hwnd); r == 0 {
		s.finishing = false
		logDesktop("DestroyWindow for intro failed: %v", err)
		return
	}
	logDesktop("intro handoff complete")
}

func abortIntro(s *introSession) {
	if s == nil || s.finishing {
		return
	}
	s.finishing = true
	if s.hwnd != 0 {
		procShowWindow.Call(s.hwnd, swHide)
		if r, _, err := introDestroyWindow.Call(s.hwnd); r == 0 {
			logDesktop("DestroyWindow for intro abort failed: %v", err)
		}
	}
}

func paintIntro(s *introSession, h uintptr) {
	if s == nil || s.hwnd != h || s.renderer == nil {
		return
	}
	var ps introPaintStruct
	hdc, _, err := introBeginPaint.Call(h, uintptr(unsafe.Pointer(&ps)))
	if hdc == 0 {
		logDesktop("BeginPaint for intro failed: %v", err)
		return
	}
	if paintErr := s.renderer.present(hdc, s.photoAlpha, s.titleAlpha); paintErr != nil {
		logDesktop("intro render failed: %v", paintErr)
	} else {
		s.firstPaint = true
	}
	if r, _, endErr := introEndPaint.Call(h, uintptr(unsafe.Pointer(&ps))); r == 0 {
		logDesktop("EndPaint for intro failed: %v", endErr)
	}
}

func nativeIntroWndProc(h uintptr, msg uint32, wparam, lparam uintptr) uintptr {
	s := currentIntro()
	switch msg {
	case introWMPaint:
		paintIntro(s, h)
		return 0
	case introWMEraseBkgnd:
		return 1
	case introWMKeyDown:
		if wparam == introVKEscape || wparam == introVKSpace || wparam == introVKReturn {
			requestIntroSkip(s)
		}
		return 0
	case introWMLButtonDown, introWMRButtonDown, introWMMButtonDown:
		requestIntroSkip(s)
		return 0
	case introWMTimer:
		if wparam == introTimerID {
			tickIntro(s)
		}
		return 0
	case introWMAppReadiness:
		tickIntro(s)
		return 0
	case introWMAppFinish:
		finishIntro(s)
		return 0
	case introWMAppAbort:
		abortIntro(s)
		return 0
	case introWMClose:
		return 0
	case introWMDestroy:
		introKillTimer.Call(h, introTimerID)
		introPostQuitMessage.Call(0)
		return 0
	}
	r, _, _ := introDefWindowProc.Call(h, uintptr(msg), wparam, lparam)
	return r
}

func runNativeIntro() {
	if !claimIntroStart() {
		showIntroWindow()
		return
	}
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	if err := ensureIntroClass(); err != nil {
		logDesktop("native intro class initialization failed: %v", err)
		cancelIntroStart()
		return
	}
	bounds, err := introMonitorRect()
	if err != nil {
		logDesktop("native intro monitor selection failed: %v", err)
		cancelIntroStart()
		return
	}
	h, err := createIntroWindow(bounds)
	if err != nil {
		logDesktop("native intro window creation failed: %v", err)
		cancelIntroStart()
		return
	}

	width := int(bounds.Right - bounds.Left)
	height := int(bounds.Bottom - bounds.Top)
	renderer, renderErr := newIntroRenderer(width, height)
	if renderer == nil {
		logDesktop("native intro renderer initialization failed: %v", renderErr)
		introDestroyWindow.Call(h)
		cancelIntroStart()
		return
	}
	if renderErr != nil {
		logDesktop("native intro image validation warning: %v", renderErr)
	}

	s := &introSession{
		hwnd:         h,
		renderer:     renderer,
		phase:        introPhaseImageFadeIn,
		phaseStarted: time.Now(),
		done:         make(chan struct{}),
	}
	if !publishIntro(s) {
		renderer.close()
		introDestroyWindow.Call(h)
		showIntroWindow()
		return
	}
	defer func() {
		renderer.close()
		clearIntro(s)
		close(s.done)
	}()

	if r, _, posErr := procSetWindowPos.Call(
		h, 0,
		uintptr(bounds.Left), uintptr(bounds.Top),
		uintptr(bounds.Right-bounds.Left), uintptr(bounds.Bottom-bounds.Top),
		introSWPFrameChanged|introSWPNoOwnerZOrder,
	); r == 0 {
		logDesktop("SetWindowPos for intro failed: %v", posErr)
	}
	procShowWindow.Call(h, swShow)
	if r, _, fgErr := procSetForegroundWindow.Call(h); r == 0 {
		logDesktop("SetForegroundWindow for intro was rejected: %v", fgErr)
	}
	if r, _, invErr := introInvalidateRect.Call(h, 0, 0); r == 0 {
		logDesktop("initial intro InvalidateRect failed: %v", invErr)
	}
	if r, _, updateErr := introUpdateWindow.Call(h); r == 0 {
		logDesktop("initial intro UpdateWindow failed: %v", updateErr)
	}
	if !s.firstPaint {
		logDesktop("native intro first frame was not confirmed; WebView startup withheld")
	} else {
		logDesktop("native intro first frame confirmed; starting hidden WebView2")
		startApp()
	}

	timer, _, timerErr := introSetTimer.Call(h, introTimerID, introTimerMS, 0)
	if timer == 0 {
		logDesktop("SetTimer for intro failed: %v", timerErr)
		abortIntro(s)
	}

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
	if s == nil || s.hwnd == 0 {
		return
	}
	procShowWindow.Call(s.hwnd, swHide)
	if r, _, err := introPostMessage.Call(s.hwnd, introWMAppAbort, 0, 0); r == 0 {
		logDesktop("intro abort PostMessage failed: %v", err)
		return
	}
	select {
	case <-s.done:
	case <-time.After(1200 * time.Millisecond):
		logDesktop("intro destroy wait timed out during process exit")
	}
}
