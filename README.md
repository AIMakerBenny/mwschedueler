# MAWANG Scheduler

MAWANG Scheduler web app.

- Production frontend: Cloudflare Workers Static Assets
- Production branch: `cloudflare-production`
- `index.html` is the production entry point
- Current release: CF MWS V1.0.12
- Primary system timezone: Korea Standard Time `Asia/Seoul`
- Shared workspace data is loaded incrementally from the Cloudflare backend
- Public uses the same app features in a non-persistent session sandbox
- Theme, background, global text scale, per-page text scale, resolution and other presentation preferences are device-local

## CF MWS V1.0.12

- Content Planner Save now creates or updates the matching proposal archive entry automatically
- The separate proposal submission button was removed from the planner header
- The working canvas now keeps a thin 10 px margin on the right and bottom edges

## CF MWS V1.0.11

- Normalizes app date and time presentation to Korea Standard Time
- Cleans up the Content Planner top-right action button layout
- Preloads the `miniGames` data part before Tier Game, 2D Matrix Chart, and Relationship Map render, preventing initially blank tool state and delayed saved-list visibility
- Adjusts Content Planner fullscreen layout to a 76 percent workspace and 24 percent right column
- Adjusts the fullscreen right column split to 44 percent controls and 56 percent blank lower area

## Production deployment

Pushes to `cloudflare-production` are built by the connected Cloudflare Workers production project `mawang-scheduler`.
