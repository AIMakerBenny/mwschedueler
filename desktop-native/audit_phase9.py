from pathlib import Path

root = Path(__file__).resolve().parent
main = (root / "main.go").read_text(encoding="utf-8")
intro = (root / "intro_windows.go").read_text(encoding="utf-8")

checks = {
    "Alt Enter detects combo": "keyDown(vkMenu) && keyDown(vkReturn)" in main,
    "Alt Enter toggles fullscreen": "state := toggleFullscreen()" in main,
    "Alt Enter restores and focuses window": "showWindow()" in main,
    "Alt Enter syncs button state": "syncFullscreenUI(state)" in main,
    "fullscreen sync helper": "func syncFullscreenUI(state bool)" in main,
    "default fullscreen retained": "ensureStartupFullscreen()" in main,
    "single intro text only": 'Mawang Scheduler' in intro and '마왕 스케줄러' not in intro and 'MAWANG  DESKTOP' not in intro,
    "animated intro effect state": "effectStep atomic.Uint32" in intro,
    "animated effect loop": "func animateIntroTextEffect" in intro,
    "effect starts on text switch": "go animateIntroTextEffect(s)" in intro,
    "layered violet halo": "glowOffsets" in intro and "innerOffsets" in intro,
    "crisp white wordmark": "0x00FFFDFE" in intro,
    "animated precision line": "maxLineW := s.width / 6" in intro and "phase := int(s.effectStep.Load())" in intro,
    "moving highlight segment": "sparkRc" in intro,
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
