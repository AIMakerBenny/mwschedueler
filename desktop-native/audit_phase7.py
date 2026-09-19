from pathlib import Path

root = Path(__file__).resolve().parent
intro = (root / "intro_windows.go").read_text(encoding="utf-8")
main = (root / "main.go").read_text(encoding="utf-8")

checks = {
    "desktop branch app URL intact": 'appURL   = "https://mawang-scheduler.majoku.workers.dev/"' in main,
    "black shield retained": 'shieldHwnd' in intro and 'introBlackBeforeMain' in intro,
    "readiness handoff retained": 'waitStartupReadyOrSkip(s, 8*time.Second)' in intro,
    "single title font": 'Segoe UI' in intro and 'introFontMedium' in intro,
    "single wordmark": 'Mawang Scheduler' in intro and '마왕 스케줄러' not in intro and 'MAWANG  DESKTOP' not in intro,
    "fresh wordmark phase": 'wordmarkPhase atomic.Uint32' in intro,
    "fresh animation": 'func animateFreshWordmark' in intro,
    "image intro retained": '//go:embed assets/mawang-intro.jpg' in intro,
    "main reveal retained": 'fadeWindowAlpha(s, s.shieldHwnd, 255, 0, introMainFadeIn)' in intro,
}

failed=[name for name,ok in checks.items() if not ok]
for name,ok in checks.items():
    print(("PASS " if ok else "FAIL ")+name)
if failed:
    raise SystemExit("Phase 7 intro audit failed: "+", ".join(failed))
print(f"Phase 7 intro audit passed: {len(checks)} checks")
