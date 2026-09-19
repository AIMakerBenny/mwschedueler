from pathlib import Path

root = Path(__file__).resolve().parent
main = (root / "main.go").read_text(encoding="utf-8")
intro = (root / "intro_windows.go").read_text(encoding="utf-8")

checks = {
    "Alt Enter detects combo": "keyDown(vkMenu) && keyDown(vkReturn)" in main,
    "Alt Enter toggles fullscreen": "state := toggleFullscreen()" in main,
    "Alt Enter syncs button state": "syncFullscreenUI(state)" in main,
    "Alt Enter focuses current window": "procSetForegroundWindow.Call(h)" in main,
    "windowed mode maximizes": "procShowWindow.Call(h, swMaximize)" in main,
    "small restore state removed": "savedRect" not in main and "wasMaximized" not in main,
    "default fullscreen retained": "ensureStartupFullscreen()" in main,
    "single wordmark only": 'Mawang Scheduler' in intro and '마왕 스케줄러' not in intro,
    "fresh wordmark effect state": "wordmarkPhase atomic.Uint32" in intro,
    "fresh wordmark effect loop": "func animateFreshWordmark" in intro,
    "fresh effect starts on text switch": "go animateFreshWordmark(s)" in intro,
    "split modern title": 'UTF16PtrFromString("Mawang")' in intro and 'UTF16PtrFromString("Scheduler")' in intro,
    "center separator": "separatorRc" in intro,
    "side rails": "leftRail" in intro and "rightRail" in intro,
    "stage skip retained": "requestIntroSkip" in intro and "introVKSpace" in intro and "introVKReturn" in intro and "introVKEscape" in intro,
    "image to text immediate transition retained": "introBlackAfterImage" not in intro and "introWMSwitchText" in intro,
    "main handoff retained": "fadeWindowAlpha(s, s.shieldHwnd, 255, 0, introMainFadeIn)" in intro,
}

failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS " if ok else "FAIL ") + name)

if failed:
    raise SystemExit("Phase 9 desktop audit failed: " + ", ".join(failed))

print(f"Phase 9 desktop audit passed: {len(checks)} checks")
