from pathlib import Path

root = Path(__file__).resolve().parent
main = (root / "main.go").read_text(encoding="utf-8")
intro = (root / "intro_windows.go").read_text(encoding="utf-8")

checks = {
    "Alt Enter combo": "keyDown(vkMenu) && keyDown(vkReturn)" in main,
    "Alt Enter toggles fullscreen": "state := toggleFullscreen()" in main,
    "windowed mode forced maximized": "procShowWindow.Call(h, swMaximize)" in main,
    "no small window restore path": "savedRect" not in main and "wasMaximized" not in main,
    "fullscreen button sync": "syncFullscreenUI(state)" in main,
    "single visible title phrase": 'UTF16PtrFromString("Mawang")' in intro and 'UTF16PtrFromString("Scheduler")' in intro,
    "no Korean intro title": "마왕 스케줄러" not in intro,
    "fresh animation state": "wordmarkPhase atomic.Uint32" in intro,
    "fresh animation function": "func animateFreshWordmark" in intro,
    "fresh slide reveal": "18 * (1000 - phase) / 1000" in intro,
    "fresh center separator": "separatorH := 52 * phase / 1000" in intro,
    "fresh side rails": "railW := 92 * phase / 1000" in intro and "leftRail" in intro and "rightRail" in intro,
    "old effect state removed": "effectStep" not in intro,
    "old effect loop removed": "animateIntroTextEffect" not in intro,
    "old glow removed": "glowOffsets" not in intro and "innerOffsets" not in intro,
    "old spark removed": "sparkRc" not in intro and "sparkBrush" not in intro,
    "old precision line removed": "maxLineW" not in intro and "coreRc" not in intro,
    "old label removed": "MAWANG  DESKTOP" not in intro,
    "old shadow removed": "shadowRc" not in intro,
    "intro skip retained": "requestIntroSkip" in intro and "introVKSpace" in intro and "introVKReturn" in intro and "introVKEscape" in intro,
    "black shield handoff retained": "fadeWindowAlpha(s, s.shieldHwnd, 255, 0, introMainFadeIn)" in intro,
}

failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS " if ok else "FAIL ") + name)

if failed:
    raise SystemExit("Phase 10 desktop audit failed: " + ", ".join(failed))

print(f"Phase 10 desktop audit passed: {len(checks)} checks")
