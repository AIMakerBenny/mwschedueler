from pathlib import Path

root = Path(__file__).resolve().parent
main = (root / "main.go").read_text(encoding="utf-8")
intro = (root / "intro_windows.go").read_text(encoding="utf-8")

checks = {
    "F11 uses common fullscreen toggle": "if(e.key==='F11')" in main and "__mwsToggleFullscreen" in main,
    "Alt Enter uses common fullscreen toggle": "keyDown(vkMenu) && keyDown(vkReturn)" in main and "state := toggleFullscreen()" in main,
    "borderless enters monitor bounds": "r := mi.RcMonitor" in main and "wsCaption | wsThickFrame | wsMinBox | wsMaxBox | wsSysMenu" in main,
    "windowed uses work area": "r := mi.RcWork" in main,
    "windowed always maximized": "procShowWindow.Call(h, swMaximize)" in main,
    "showWindow only fullscreen or maximized": "if isFS" in main and "procShowWindow.Call(h, swShow)" in main and "procShowWindow.Call(h, swMaximize)" in main,
    "restore before style transition": "procShowWindow.Call(h, swRestore)" in main,
    "no arbitrary saved rectangle": "savedRect" not in main and "lastRect" not in main,
    "no arbitrary maximized history": "wasMaximized" not in main and "lastMaximized" not in main,
    "no window state persistence helper": "rememberWindowState" not in main,
    "no zero size transition": "procSetWindowPos.Call(h, 0, 0, 0, 0, 0" not in main,
    "default borderless fullscreen retained": "ensureStartupFullscreen()" in main,
    "intro remains single wordmark": 'UTF16PtrFromString("Mawang")' in intro and 'UTF16PtrFromString("Scheduler")' in intro,
    "intro skip retained": "requestIntroSkip" in intro,
}

failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS " if ok else "FAIL ") + name)

if failed:
    raise SystemExit("Phase 11 desktop mode audit failed: " + ", ".join(failed))

print(f"Phase 11 desktop mode audit passed: {len(checks)} checks")
