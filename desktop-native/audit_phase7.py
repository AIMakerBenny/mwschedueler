from pathlib import Path

root = Path(__file__).resolve().parent
intro = (root / "intro_windows.go").read_text(encoding="utf-8")
main = (root / "main.go").read_text(encoding="utf-8")

checks = {
    "desktop branch app URL intact": 'appURL   = "https://mawang-scheduler.majoku.workers.dev/"' in main,
    "phase6 black shield retained": 'shieldHwnd' in intro and 'introBlackBeforeMain' in intro,
    "readiness handoff retained": 'waitStartupReadyOrSkip(s, 8*time.Second)' in intro,
    "modern title font": 'Segoe UI Semibold' in intro and 'introFontSemibold' in intro,
        "modern minimal title": 'Mawang Scheduler' in intro and 'MAWANG  DESKTOP' not in intro,
    "English wordmark": 'Mawang Scheduler' in intro,
        "accent rule": 'introCreateSolidBrush' in intro and 'introFillRect' in intro,
    "no legacy title shadow": 'shadowRc' not in intro,
    "separate title font lifetime": 'titleFont' in intro and 'introDeleteObject.Call(s.titleFont)' in intro,
        "image intro retained": '//go:embed assets/mawang-intro.jpg' in intro,
    "main reveal retained": 'fadeWindowAlpha(s, s.shieldHwnd, 255, 0, introMainFadeIn)' in intro,
}

failed=[name for name,ok in checks.items() if not ok]
for name,ok in checks.items():
    print(("PASS " if ok else "FAIL ")+name)
if failed:
    raise SystemExit("Phase 7 intro wordmark audit failed: "+", ".join(failed))
print(f"Phase 7 intro wordmark audit passed: {len(checks)} checks")
