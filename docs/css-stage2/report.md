# Stage 2: CSS source inventory and conflict candidates

Baseline: bfe8529df667a5b6b4b731ff999fc1711068a850. Static audit only. No CSS or application runtime changed. All tracked CSS plus index.html and all JS/MJS under assets/ and src/ read. No network access to production.

## Summary

| Metric | Value |
| --- | --- |
| baseline | bfe8529df667a5b6b4b731ff999fc1711068a850 |
| cssFiles | 68 |
| sourceFiles | 106 |
| staticLinks | 64 |
| inlineBlocks | 19 |
| staticBytes | 1124210 |
| staticRules | 7511 |
| staticSelectors | 8420 |
| staticDeclarations | 27252 |
| staticImportant | 5320 |
| allRules | 7760 |
| allDeclarations | 28324 |
| allImportant | 5600 |
| initialRepeated | 814 |
| initialExact | 51 |
| initialExactExtra | 53 |
| initialConflict | 1202 |
| initialCrossFile | 173 |
| allRepeated | 826 |
| allExact | 51 |
| allConflict | 1229 |
| dynamicInjectionFiles | 21 |
| warnings | 0 |

## Domain priorities (overlapping; do not sum)

| Area | Selector instances | Files | Repeated selector/context pairs | Exact duplicate groups | Differing declaration groups | Cross-file differing groups |
| --- | --- | --- | --- | --- | --- | --- |
| sidebar | 414 | 18 | 59 | 12 | 120 | 20 |
| calendar | 769 | 24 | 40 | 3 | 45 | 14 |
| shell | 260 | 25 | 12 | 1 | 15 | 8 |
| f1 | 1066 | 22 | 77 | 3 | 87 | 46 |
| contacts | 546 | 12 | 91 | 6 | 154 | 36 |

## CSS not linked in initial HTML

| File | Literal references in runtime source | Disposition |
| --- | --- | --- |
| assets/achievement-gallery-v1621.css | assets/post-login-runtime-v130.js x1 | Do not delete until runtime usage/imports are verified |
| assets/calendar-drag-layout-fix.css | assets/device-ui.js x1 | Do not delete until runtime usage/imports are verified |
| assets/mobile-drawer-v130.css | assets/post-login-runtime-v130.js x1 | Do not delete until runtime usage/imports are verified |
| assets/workspace-ui-v176.css | assets/post-login-runtime-v130.js x1 | Do not delete until runtime usage/imports are verified |

## Highest-volume conflicts

| Area | Selector | Condition | Property | Locations (up to 12) |
| --- | --- | --- | --- | --- |
| sidebar | body.sidebar-pinned .logo | root | width | assets/app-core.css:2763 = auto; assets/app-core.css:3032 = auto !important; assets/app-core.css:3639 = 118px !important; assets/app-core.css:3907 = 118px !important; assets/app-core.css:4578 = 118px !important |
| sidebar | body.sidebar-pinned .logo | root | min-width | assets/app-core.css:2763 = 115px !important; assets/app-core.css:3032 = 115px !important; assets/app-core.css:3639 = 118px !important; assets/app-core.css:3907 = 118px !important; assets/app-core.css:4578 = 118px !important |
| sidebar | body.sidebar-pinned .app | root | grid-template-columns | index.html#mws-first-paint-guard:11 = 220px minmax(0,1fr); assets/app-core.css:2418 = 220px minmax(0,1fr) !important; assets/app-core.css:2704 = 220px minmax(0,1fr) !important; assets/app-core.css:3017 = 220px minmax(0,1fr) !important |
| sidebar | .sidebar | root | padding | assets/app-core.css:45 = 18px 14px; assets/app-core.css:2413 = 14px 10px !important; assets/app-core.css:2709 = 12px 8px !important; assets/app-core.css:4499 = 12px 8px !important |
| sidebar | .sidebar | root | transition | assets/app-core.css:45 = background .2s; assets/app-core.css:2413 = width .18s ease,background .2s,border-color .2s !important; assets/app-core.css:2709 = none !important; assets/app-core.css:2969 = width .15s cubic-bezier(.18,.82,.22,1),     min-width .15s cubic-bezier(.18,.82,.22,1),     box-shadow .15s ease,     background .15s ease !important |
| calendar | #calendar .calendar-topbar-v4 .calendar-view-tab-v172 | root | min-width | assets/calendar-toolbar-v4.css:20 = 77px; assets/calendar-timeline-v1.css:47 = 68px; assets/calendar-details-v1.css:133 = 48px !important |
| calendar | .calendar | root | gap | assets/app-core.css:79 = 6px; assets/app-core.css:1506 = 7px |
| calendar | .mini-event | root | padding | assets/app-core.css:87 = 5px 6px; assets/app-core.css:1513 = 6px 7px |
| calendar | .mini-event | root | margin | assets/app-core.css:87 = 4px 0; assets/app-core.css:1513 = 5px 0 |
| calendar | .mini-event | root | white-space | assets/app-core.css:87 = nowrap; assets/app-core.css:1513 = normal |
| shell | .app | root | grid-template-columns | index.html#mws-first-paint-guard:10 = 72px minmax(0,1fr); assets/app-core.css:44 = 220px 1fr; assets/app-core.css:2412 = 72px minmax(0,1fr) !important; assets/app-core.css:2701 = 64px minmax(0,1fr) !important; assets/app-core.css:2965 = 64px minmax(0,1fr) !important |
| shell | body.sidebar-pinned .app | root | grid-template-columns | index.html#mws-first-paint-guard:11 = 220px minmax(0,1fr); assets/app-core.css:2418 = 220px minmax(0,1fr) !important; assets/app-core.css:2704 = 220px minmax(0,1fr) !important; assets/app-core.css:3017 = 220px minmax(0,1fr) !important |
| shell | .app | root | min-height | index.html#mws-first-paint-guard:10 = 100dvh; assets/app-core.css:44 = 100vh |
| shell | .app | root | transition | assets/app-core.css:2412 = grid-template-columns .18s ease; assets/app-core.css:2965 = grid-template-columns .15s cubic-bezier(.2,.78,.2,1) !important |
| shell | body.f1-racing-immersive .app | root | height | assets/f1-racing-v1.css:732 = 100vh !important; assets/f1-racing-v1.css:824 = 100dvh !important |
| f1 | #f1RacingViewRaceV185 .f1-racing-race-header-v188 | root | padding | assets/f1-racing-v1.css:407 = 8px 10px !important; assets/f1-racing-v1.css:533 = 5px 8px !important; assets/f1-racing-v1.css:570 = 3px 6px !important |
| f1 | #f1RacingViewRaceV185 .f1-racing-race-header-v188 strong | root | font-size | assets/f1-racing-v1.css:412 = 14px !important; assets/f1-racing-v1.css:535 = 12px !important; assets/f1-racing-v1.css:572 = 11px !important |
| f1 | #f1RacingViewRaceV185 .f1-racing-race-status-v188 span | root | min-width | assets/f1-racing-v1.css:418 = 78px !important; assets/f1-racing-v1.css:536 = 66px !important; assets/f1-racing-v1.css:573 = 56px !important |
| f1 | #f1RacingViewRaceV185 .f1-racing-race-status-v188 span | root | padding | assets/f1-racing-v1.css:418 = 5px 7px !important; assets/f1-racing-v1.css:536 = 3px 6px !important; assets/f1-racing-v1.css:573 = 2px 5px !important |
| f1 | #f1RacingViewRaceV185 .f1-racing-workspace-toolbar-recovery-e | root | padding | assets/f1-racing-v1.css:423 = 5px 7px !important; assets/f1-racing-v1.css:538 = 3px 5px !important; assets/f1-racing-v1.css:576 = 2px 4px !important |
| contacts | #contacts .contact-card | root | min-height | assets/app-core.css:5245 = 132px; assets/app-core.css:5582 = 160px !important; assets/app-core.css:5725 = 160px !important; assets/contact-card-readable-layout-v1.css:20 = 180px !important |
| contacts | #contacts .contact-card | root | overflow | assets/app-core.css:5245 = visible; assets/app-core.css:5582 = hidden !important; assets/app-core.css:5725 = hidden !important; assets/contact-card-readable-layout-v1.css:20 = hidden !important |
| contacts | .contact-modalbox | root | max-height | assets/app-core.css:1411 = min(820px,92vh); assets/app-core.css:4699 = calc(100dvh - 24px) !important; assets/app-core.css:5336 = calc(100dvh - 18px) !important |
| contacts | #contacts .contact-grid | root | grid-template-columns | assets/app-core.css:5244 = repeat(auto-fill,minmax(335px,1fr)); assets/app-core.css:5581 = repeat(auto-fill,minmax(335px,1fr)); assets/app-core.css:5718 = repeat(auto-fill,minmax(330px,1fr)) !important |
| contacts | #contacts .contact-grid | root | gap | assets/app-core.css:5244 = 13px; assets/app-core.css:5581 = 13px; assets/app-core.css:5718 = 14px !important |

## Static inventory

| Order | File | Load | Bytes | Rule blocks | Declarations | !important | Warnings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | index.html#mws-first-paint-guard | inline | 1322 | 15 | 49 | 2 | 0 |
| 1 | index.html#mws-calendar-startup-v2-style | inline | 317 | 2 | 8 | 0 | 0 |
| 2 | assets/mawang-cursor-v1.css | link | 4347 | 32 | 128 | 22 | 0 |
| 3 | assets/legacy-hub-v1.css | link | 1965 | 17 | 66 | 1 | 0 |
| 4 | assets/app-core.css | link | 372075 | 2610 | 9789 | 1461 | 0 |
| 5 | assets/calendar-broadcast-duration-v1.css | link | 1171 | 5 | 25 | 0 | 0 |
| 6 | assets/calendar-continuous-series-v1.css | link | 2144 | 13 | 47 | 4 | 0 |
| 7 | assets/calendar-content-groups-v2.css | link | 12458 | 81 | 354 | 53 | 0 |
| 8 | assets/calendar-group-recovery-v1.css | link | 1758 | 14 | 60 | 1 | 0 |
| 9 | assets/event-sidebar-tabs-v5.css | link | 3850 | 28 | 99 | 9 | 0 |
| 10 | assets/calendar-toolbar-v4.css | link | 5711 | 45 | 140 | 3 | 0 |
| 11 | assets/calendar-timeline-v1.css | link | 8694 | 66 | 248 | 10 | 0 |
| 12 | assets/calendar-stable-layout-v1.css | link | 3188 | 10 | 48 | 43 | 0 |
| 13 | assets/calendar-responsive-cards-v1.css | link | 3570 | 16 | 61 | 13 | 0 |
| 14 | assets/sidebar-rail-scrollbar-v1.css | link | 2869 | 8 | 29 | 27 | 0 |
| 15 | assets/f1-racing-v1.css | link | 81022 | 611 | 2129 | 218 | 0 |
| 16 | assets/f1-racing-r283-r287.css | link | 6021 | 48 | 135 | 22 | 0 |
| 17 | assets/f1-racing-r288-r290.css | link | 5284 | 24 | 47 | 38 | 0 |
| 18 | assets/f1-racing-r291-r295.css | link | 5815 | 40 | 154 | 1 | 0 |
| 19 | assets/f1-racing-r303.css | link | 5952 | 32 | 112 | 61 | 0 |
| 20 | assets/f1-racing-r305.css | link | 8004 | 34 | 65 | 28 | 0 |
| 21 | assets/f1-racing-r306.css | link | 686 | 4 | 10 | 5 | 0 |
| 22 | assets/f1-racing-r307.css | link | 912 | 4 | 17 | 1 | 0 |
| 23 | assets/f1-racing-r308.css | link | 4130 | 25 | 97 | 33 | 0 |
| 24 | assets/f1-racing-r309.css | link | 621 | 4 | 13 | 4 | 0 |
| 25 | assets/f1-racing-r313.css | link | 4852 | 35 | 167 | 13 | 0 |
| 26 | assets/f1-racing-r319.css | link | 5239 | 26 | 117 | 111 | 0 |
| 27 | assets/f1-racing-r324.css | link | 3185 | 15 | 84 | 84 | 0 |
| 28 | assets/f1-racing-r330-r333.css | link | 4871 | 25 | 70 | 70 | 0 |
| 29 | assets/f1-racing-r335-r341.css | link | 7412 | 30 | 113 | 27 | 0 |
| 30 | assets/f1-racing-r342.css | link | 1305 | 5 | 17 | 14 | 0 |
| 31 | assets/f1-racing-r343-r345.css | link | 861 | 6 | 17 | 7 | 0 |
| 32 | assets/f1-racing-r401.css | link | 3067 | 20 | 85 | 2 | 0 |
| 33 | index.html#mws-cloud-access-style | inline | 3829 | 39 | 154 | 1 | 0 |
| 34 | index.html#mws-test-v53-version-style | inline | 364 | 3 | 14 | 1 | 0 |
| 35 | assets/mawang-premium-v1621.css | link | 20179 | 93 | 333 | 133 | 0 |
| 36 | assets/wardogs-v1.css | link | 22131 | 153 | 552 | 9 | 0 |
| 37 | assets/bsandong-v1.css | link | 7645 | 80 | 260 | 3 | 0 |
| 38 | assets/wardogs-intro-v1.css | link | 5161 | 34 | 109 | 1 | 0 |
| 39 | assets/wardogs-manager-v1.css | link | 16334 | 128 | 445 | 8 | 0 |
| 40 | assets/career-timeline.css | link | 19808 | 185 | 653 | 26 | 0 |
| 41 | assets/sidebar-stable-v1.css | link | 1598 | 9 | 31 | 15 | 0 |
| 42 | assets/calendar-historical-v1.css | link | 1194 | 12 | 38 | 1 | 0 |
| 43 | index.html#mws-nav-first-paint | inline | 710 | 6 | 17 | 0 | 0 |
| 44 | index.html#v415-post-schedule-style | inline | 2815 | 21 | 76 | 0 | 0 |
| 45 | index.html#v418-random-gacha-style | inline | 16956 | 106 | 426 | 5 | 0 |
| 46 | index.html#v419-gacha-auto-style | inline | 2231 | 14 | 56 | 0 | 0 |
| 47 | index.html#v500-public-post-gacha-style | inline | 2219 | 16 | 59 | 14 | 0 |
| 48 | index.html#v520-public-session-style | inline | 259 | 2 | 3 | 3 | 0 |
| 49 | index.html#v510-post-source-removal-style | inline | 185 | 1 | 1 | 1 | 0 |
| 50 | index.html#v530-ui-enhancement-style | inline | 8752 | 52 | 190 | 36 | 0 |
| 51 | index.html#v540-ui-style | inline | 9014 | 52 | 224 | 79 | 0 |
| 52 | index.html#v550-style | inline | 5724 | 38 | 151 | 22 | 0 |
| 53 | index.html#v560-ui-style | inline | 14106 | 57 | 209 | 22 | 0 |
| 54 | index.html#mws-v57-style | inline | 4496 | 28 | 130 | 6 | 0 |
| 55 | index.html#mws-v572-predeploy-style | inline | 1680 | 11 | 41 | 3 | 0 |
| 56 | index.html#mws-v574-style | inline | 1972 | 15 | 64 | 21 | 0 |
| 57 | assets/device-ui.css | link | 12198 | 80 | 251 | 133 | 0 |
| 58 | assets/ui-frame-presets.css | link | 25056 | 161 | 425 | 418 | 0 |
| 59 | assets/calendar-space-efficiency-v1.css | link | 4391 | 11 | 30 | 27 | 0 |
| 60 | assets/contact-card-readable-layout-v1.css | link | 4127 | 22 | 84 | 74 | 0 |
| 61 | assets/workspace-clean-v1.css | link | 21076 | 132 | 354 | 163 | 0 |
| 62 | assets/calendar-details-v1.css | link | 40822 | 232 | 823 | 319 | 0 |
| 63 | assets/posts-responsive-layout-v2.css | link | 13259 | 107 | 408 | 49 | 0 |
| 64 | assets/mobile-calendar-v130.css | link | 25611 | 112 | 538 | 313 | 0 |
| 65 | assets/achievement-exhibition-v1.css | link | 25822 | 153 | 540 | 73 | 0 |
| 66 | assets/calendar-search-v173.css | link | 9280 | 64 | 268 | 2 | 0 |
| 67 | assets/contact-directory-v177.css | link | 19679 | 122 | 434 | 135 | 0 |
| 68 | assets/modal-motion-v1.css | link | 3243 | 20 | 48 | 6 | 0 |
| 69 | assets/ladder-wizard-v1.css | link | 24389 | 161 | 706 | 133 | 0 |
| 70 | assets/announcement-carousel-v1.css | link | 5361 | 43 | 158 | 32 | 0 |
| 71 | index.html#mws-public-entry-style | inline | 3028 | 24 | 96 | 34 | 0 |
| 72 | assets/ui-interactions-v1.css | link | 17260 | 83 | 137 | 62 | 0 |
| 73 | assets/content-applications-v1.css | link | 43625 | 334 | 1127 | 66 | 0 |
| 74 | assets/calendar-people-view-v1.css | link | 5787 | 43 | 184 | 1 | 0 |
| 75 | assets/contact-frequency-v1.css | link | 6080 | 54 | 206 | 1 | 0 |
| 76 | assets/calendar-day-expand-v1.css | link | 1082 | 2 | 20 | 16 | 0 |
| 77 | assets/mawang-archive-v1.css | link | 19090 | 169 | 620 | 9 | 0 |
| 78 | assets/sidebar-compact-v1.css | link | 10903 | 50 | 179 | 113 | 0 |
| 79 | assets/topbar-context-v1.css | link | 6503 | 37 | 160 | 83 | 0 |
| 80 | assets/mawang-archive-header-v1.css | link | 3964 | 26 | 103 | 35 | 0 |
| 81 | assets/workspace-density-v1.css | link | 14202 | 83 | 230 | 203 | 0 |
| 82 | assets/mawang-archive-finish-v1.css | link | 14332 | 81 | 287 | 22 | 0 |
| 83 | assets/achievement-gallery-v1621.css | not-linked | 23831 | 178 | 694 | 9 | 0 |
| 84 | assets/calendar-drag-layout-fix.css | not-linked | 1449 | 4 | 20 | 20 | 0 |
| 85 | assets/mobile-drawer-v130.css | not-linked | 14754 | 32 | 252 | 250 | 0 |
| 86 | assets/workspace-ui-v176.css | not-linked | 3544 | 35 | 106 | 1 | 0 |

## Runtime CSS creation sites

| File | Locations |
| --- | --- |
| assets/boss-manager-v121.js | 81 createElement('style') |
| assets/boss-raid-v116.js | 67 createElement('style') |
| assets/cf-static-bootstrap-v1.js | 43 createElement('style') |
| assets/cf-static-boss-manager-v1.js | 81 createElement('style') |
| assets/cloud-runtime-loader-v130.js | 47 createElement('style') |
| assets/cloud-v1.1-loader.js | 43 createElement('style') |
| assets/contact-runtime-v130.js | 31 createElement('style') |
| assets/content-planner-host.js | 12 createElement('style') |
| assets/f1-racing-v1.js | 2821 createElement('style') |
| assets/friend-finder-v120.js | 210 createElement('style') |
| assets/majoku-sidebar-v113.js | 21 createElement('style') |
| assets/mobile-access-tools-v130.js | 15 createElement('style') |
| assets/mobile-calendar-quick-add-v130.js | 19 createElement('style') |
| assets/online-v5-loader.js | 15 createElement('style') |
| assets/perf-runtime-base.js | 11 createElement('style') |
| assets/perf-runtime.js | 166 createElement('style') |
| assets/soop-contact-autofill-v1.js | 19 createElement('style') |
| assets/steam-game-v111.js | 205 createElement('style') |
| assets/today-people-wheel-v117.js | 13 createElement('style') |
| assets/tools.js | 43 createElement('style') |
| assets/ui-fixes-v121.js | 11 createElement('style') |

## Interpretation and next stages

Stage 3: sidebar and shell. Establish a single owner for desktop rail geometry and state, preserving pinned/unpinned/expanded, keyboard, mobile, zoom, frame and theme variants. Examine app-core, sidebar-stable, sidebar-compact, sidebar-rail-scrollbar, workspace-clean, workspace-density, mawang-premium, ui-frame-presets and inline rules.

Stage 4: calendar. Separate toolbar, month geometry, group dock, copy tray, drag and hover, and mobile rules. Preserve six-week months and all existing interactions.

Stage 5: specialized / legacy styles. F1, Wardogs, minigames, gallery, post, alternate frames. Non-initial reference is not proof of unused code. No automatic removal based on filenames or version suffixes.

Stage 6: startup and request budget. Keep current API sequence. No production traffic for tests.

## Limitations and acceptance gates

Counts are syntactic candidates, not proof of visual defects. Selector and at-rule condition comparison is literal (apart from comments and edge whitespace); values preserve whitespace. Keyframes and descriptor at-rules are inventoried, not counted as ordinary selector declarations. Exact groups count selector+condition+ordered declaration list, not removable whole rules. Multiple declarations may be deliberate fallbacks. Different selectors matching the same element, specificity, shorthand/longhand, CSS variables, runtime-generated styles, nesting and equivalent media expressions require separate browser analysis. Literal references are not a runtime usage trace. Runtime CSS sites are identified but their generated contents are not parsed. No deletion is certified at stage 2.

Before deletion compare computed styles, geometry, screenshots and interactions in offline Chromium at 1366x768, 1920x1080, 2560x1440, 390x844; public/admin; pinned/unpinned; light/dark and applicable frame/zoom settings; cold/warm startup. Use real pointer and keyboard events. Re-run offline Worker request budget and distinguish pre-existing failures. Roll back any unexplained differences. No blanket deletion of !important or duplicated rules.
