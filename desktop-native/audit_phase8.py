from pathlib import Path

root = Path(__file__).resolve().parent
main = (root / "main.go").read_text(encoding="utf-8")
intro = (root / "intro_windows.go").read_text(encoding="utf-8")

checks = {
    "default fullscreen helper": "func ensureStartupFullscreen()" in main,
    "default fullscreen enabled before reveal": "procShowWindow.Call(h, swHide)\n\tensureStartupFullscreen()" in main,
    "fullscreen state bridge": '__mwsGetFullscreen' in main,
    "fullscreen button state sync": 'Promise.resolve(window.__mwsGetFullscreen())' in main,
    "space skip": "introVKSpace" in intro and "introWMKeyDown" in intro,
    "enter skip": "introVKReturn" in intro and "introWMKeyDown" in intro,
    "escape skip": "introVKEscape" in intro and "introWMKeyDown" in intro,
    "click skip": "introWMLButtonDown" in intro and "introWMRButtonDown" in intro and "introWMMButtonDown" in intro,
    "single stage skip channel": "skipCh" in intro and "make(chan struct{}, 1)" in intro,
    "skippable image stage": "runImageIntroStage" in intro and "fadeIntroStage" in intro,
    "skippable text stage": "runTextIntroStage" in intro and "waitStartupReadyOrSkip" in intro,
    "immediate image to title transition": "introBlackAfterImage" not in intro and "time.Sleep(40 * time.Millisecond)" not in intro,
    "single English wordmark only": 'UTF16PtrFromString("Mawang")' in intro and 'UTF16PtrFromString("Scheduler")' in intro and '마왕 스케줄러' not in intro,
    "fresh separator": "separatorH := 52 * phase / 1000" in intro,
    "fresh side rails": "railW := 92 * phase / 1000" in intro,
    "image fade in shortened": "introImageFadeIn     = 950 * time.Millisecond" in intro,
    "image hold shortened": "introImageHold       = 1100 * time.Millisecond" in intro,
    "image fade out shortened": "introImageFadeOut    = 750 * time.Millisecond" in intro,
    "main fade shortened": "introMainFadeIn      = 340 * time.Millisecond" in intro,
    "black before main retained": "introBlackBeforeMain = 250 * time.Millisecond" in intro,
    "main handoff retained": "fadeWindowAlpha(s, s.shieldHwnd, 255, 0, introMainFadeIn)" in intro,
}

failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS " if ok else "FAIL ") + name)

if failed:
    raise SystemExit("Phase 8 intro audit failed: " + ", ".join(failed))

print(f"Phase 8 intro audit passed: {len(checks)} checks")
