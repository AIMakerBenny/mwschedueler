# MAWANG Scheduler - MWS Version 1.0.0

This directory is the clean application root for the reset MWS release.

It does not load any legacy V5.x, CF V5.7.x, TEST, PREDEPLOY, repair-runtime, or MWS 1.0.1/1.0.2 frontend files.

The application keeps only the existing persistent data contract so current D1 workspace data and R2 media remain usable:
- Cloudflare D1: scheduler data
- Cloudflare R2: images/media
- Supabase Auth: Admin authentication only

Frontend files loaded by `index.html`:
- `styles.css`
- `app.js`
- `planner.js`
- `planner-stickers.js`
- `minigames.js`

Worker entrypoint: `src/mws-clean.js`

Version label: `MWS Version 1.0.0`
