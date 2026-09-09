# MAWANG Scheduler

MAWANG Scheduler web app.

- Static frontend hosted with Vercel
- Shared data and admin authentication handled by Supabase
- `index.html` is the production entry point
- Current release: v5.6
- Admin changes persist to the shared Supabase workspace
- Public uses the same app features in a non-persistent session sandbox
- Theme, background, global text scale, per-page text scale, resolution and other presentation preferences are device-local
- v5.4 adds complete Selected-card display after Gacha completion, glow and popup card viewing, larger Gacha contact names, compact speed and target controls, stronger sticky contact tags, page-specific text sizing, and the restored Marorong / 마로롱 rain easter egg
- v5.5 removes the stray bottom text, fixes the global sidebar in the viewport, reinforces the contact tag panel, adds a station URL visit button, rebuilds the Marorong / 마로롱 rain click effect, and expands the dashboard with schedule and operation insights
- v5.6 keeps the contact tag folder visible while scrolling, adds a clickable Profile Card popup from the contact profile image, and expands recent collaboration visual tiers from 5 to 10 with progressively stronger effects

2026-09-08 performance refactor: runtime hot paths and cacheable frontend assets were optimized without intentional UI or feature changes.

Pushes to `main` are deployed automatically through the connected Vercel project.