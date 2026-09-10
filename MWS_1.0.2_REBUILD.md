# MWS Version 1.0.2 rebuild

## Baseline

This candidate is intentionally rebuilt from commit `57a9ebc862ee857c983cb930150e169127d40586`, the stable Cloudflare/D1/R2 version of the V5.5-era Scheduler. The historical V5.5 publish commit is `214f8cfff2d208c4099a0c8f7ab952162966e237`.

The existing Scheduler data model, contacts, calendar, posts, notebook, recent-people features, Korean-initial search, Cloudflare D1/R2 backend and direct-R2 media architecture are preserved. Production is not changed by this branch.

## MWS 1.0.2 changes

- Adds Content Planner as a Scheduler category immediately after 게시글 and before the following normal category.
- Planner modes are 기획 작성 and 기획안 확인 with larger mode buttons and no duplicated title inside the mode row.
- Removes canvas size controls. The working canvas is a continuous background that grows automatically as drawing/objects approach the edge.
- Disables middle-mouse panning/autoscroll while retaining wheel zoom.
- Removes lower-left planner status/help text.
- Backgrounds: white, ivory paper, chalkboard, dark board, light gray. Drawing remains active after background changes.
- Text boxes automatically grow vertically with their contents and remain movable after editing.
- Adds left/center/right text alignment.
- Free-font dropdown and brush/eraser size dropdown; selection/brush/eraser use icon controls.
- Color button opens common colors plus a custom color picker.
- Shapes use translucent placement preview and their actual SVG geometry resizes with the selection box.
- Stickers are custom SVG sticker-style assets rather than emoji and their actual artwork resizes with the selection box.
- Images are draggable and resizable from all four corners.
- Selected objects show MOVE plus an immediate red delete button.
- Removes timeline and checklist/checkbox tools, as requested in the latest specification.
- Memo tabs have individual delete buttons; deletion requires a local confirmation panel under the clicked button. The last memo cannot be removed.
- Save opens proposal metadata and participant selection using the existing Scheduler contact database.
- Admin planner saves use `/api/planner`; proposal JSON is stored in D1 and embedded image/video data is externalized to R2 first. Public editing remains local-only.
- Page text scaling now reflows calendar cells/events, recent-people views, ranking podium/cards, target list cards and Friend Finder names instead of only enlarging text inside fixed boxes.
- The canonical version is shown as one gray `MWS Version 1.0.2` line directly above SAVE; duplicate version badges are suppressed.

## Deployment status

Candidate branch only: `mws-1.0.2-rebuild-v55`.

Do not move `cloudflare-production` to this branch until the candidate is explicitly approved for deployment.
