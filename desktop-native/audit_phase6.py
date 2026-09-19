from pathlib import Path

root = Path(__file__).resolve().parent
main = (root / "main.go").read_text(encoding="utf-8")
intro = (root / "intro_windows.go").read_text(encoding="utf-8")

checks = {
    "live web app URL": 'appURL   = "https://mawang-scheduler.majoku.workers.dev/"' in main,
    "persistent WebView2 profile": 'filepath.Join(base, "MawangSchedulerDesktop", "WebView2")' in main,
    "close hides to tray": 'case wmClose:' in main and 'procShowWindow.Call(h, swHide)' in main,
    "minimize hides to tray": 'wparam&0xFFF0 == scMinimize' in main,
    "tray double click restores": 'systray.SetOnDClick(func(menu systray.IMenu) { showWindow() })' in main,
    "tray right click menu": 'systray.SetOnRClick(func(menu systray.IMenu) { _ = menu.ShowMenu() })' in main,
    "dashboard tray route": 'openSection("dashboard"' in main,
    "calendar tray route": 'openSection("calendar"' in main,
    "contacts tray route": 'openSection("contacts"' in main,
    "friend finder tray route": 'openSection("friendFinder"' in main,
    "notebook tray route": 'openSection("memos"' in main,
    "Alt Enter restore": 'keyDown(vkMenu) && keyDown(vkReturn)' in main and 'showWindow()' in main,
    "F11 fullscreen": "if(e.key==='F11')" in main and '__mwsToggleFullscreen' in main,
    "desktop fullscreen button": 'mwsDesktopFullscreenButton' in main,
    "startup shell lock": 'startupLocked' in main and '= true' in main,
    "startup readiness binding": '__mwsDesktopStartupReady' in main,
    "login gate readiness": 'loginGateReady' in main,
    "authenticated shell readiness": 'appShellReady' in main,
    "readiness channel": 'startupWebReady' in main,
    "single intro implementation source": (root / "intro_windows.go").exists(),
    "no obsolete split renderer": not (root / "intro_render_windows.go").exists(),
    "embedded exact intro JPEG": '//go:embed assets/mawang-intro.jpg' in intro,
    "black shield window": 'shieldHwnd' in intro,
    "shield starts opaque": 'setIntroAlpha(shieldHwnd, 255)' in intro,
    "content starts transparent": 'setIntroAlpha(hwnd, 0)' in intro,
    "image fade in": 'fadeIntro(s, 0, 255, introImageFadeIn)' in intro,
    "image fade out": 'fadeIntro(s, 255, 0, introImageFadeOut)' in intro,
    "immediate image to text transition": 'introBlackAfterImage' not in intro and 'introWMSwitchText' in intro,
    "intro title content": 'Mawang Scheduler' in intro and '마왕 스케줄러' in intro,
    "text fade in": 'fadeIntro(s, 0, 255, introTextFadeIn)' in intro,
    "title waits for WebView": 'waitForStartupWebReady(8 * time.Second)' in intro,
    "title fade out": 'fadeIntro(s, 255, 0, introTextFadeOut)' in intro,
    "black pause before main": 'time.Sleep(introBlackBeforeMain)' in intro,
    "main stays hidden until intro handoff": 'releaseStartupLock()' in intro and 'showWindow()' in intro,
    "main reveal transition": 'fadeWindowAlpha(s, s.shieldHwnd, 255, 0, introMainFadeIn)' in intro,
    "shield paints black": 'if h == s.shieldHwnd' in intro and 'introPatBlt.Call' in intro,
    "handoff destroys shield": 'introDestroyWindow.Call(s.shieldHwnd)' in intro,
    "handoff destroys content": 'introDestroyWindow.Call(h)' in intro,
    "fallback preserves app access": 'if !exiting && !s.mainShown' in intro,
}

failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS " if ok else "FAIL ") + name)

if failed:
    raise SystemExit("Phase 6 desktop transition audit failed: " + ", ".join(failed))

print(f"Phase 6 desktop transition audit passed: {len(checks)} checks")
