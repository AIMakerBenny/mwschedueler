# MAWANG Scheduler — CF MWS V 1.0.17

Production target: Cloudflare Workers (`mawang-scheduler`)

## V1.0.17
- Custom Content Planner emoticons are persisted through the existing Cloudflare workspace data path.
- Uploaded emoticon image bytes are externalized to the configured R2 workspace bucket before the authenticated save writes metadata to D1.
- The emoticon manager loads the existing contact metadata part before editing and waits for the cloud save to finish after add/delete.
- Removed the stale, non-executing legacy cloud JSON block from the main HTML.

## Release rule
Each release continues directly from the immediately previous production release. Do not layer old release branches, temporary runtime overlays, or one-off patch scripts into production.
