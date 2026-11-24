# MWS engineering and visual quality contract

This repository is both a functional scheduler and a broadcast-facing visual experience. Functional and visual quality are equal release requirements.

## Design before code

For every user-facing change, consider the full screen, not only the requested button. Define the user task, information priority, viewport constraints, visual language, component states, motion behavior and accessibility before touching styles. Preserve existing behavior, data, media and permissions.

- Make content, participant images and actionable information visually primary. Remove redundant titles, permanent explanatory blocks, unnecessary external exits and decorative text.
- Choose the visual treatment for the function. Calendar, ranking, character archive, timeline, mini-games and contact management should have shared foundations but not identical generic card grids.
- Use the existing theme variables for colors, and include contrast, typography, alignment, spacing, depth, lighting, hover, focus, pressed, loading, empty, error and success states.
- A change is incomplete when it merely adds flat buttons or CSS to the requested element while neighboring controls remain inconsistent.

## Motion and interaction

- Plan entry, exit, reordering, value updates, selection and loading together with the implementation. Motion must explain state changes or improve affordance, not run continuously for decoration.
- Do not animate unchanged data on polling or tab switches. Do not reset ranking FLIP layouts or change transform ownership of calendar drag, overlays, tool boards or game canvases.
- Respect the page's data-mws-motion preference and prefers-reduced-motion. Touch devices must never depend on hover.
- Keep short pointer feedback responsive and preserve the coordinates of hit targets while moving. Avoid topbar or dialog clipping, extra compositing layers and unnecessary forced layout.

## Source and integration

- Before editing, inspect the remote HEAD of cloudflare-production and nearby CSS/JS ownership. Changes made after an earlier handoff take priority.
- Do not pile higher-specificity !important fixes over contradictory rules. Resolve the competing declarations, scope styles to components and account for stylesheet load order.
- Do not alter data persistence, public/admin access, event dimensions, network request timing or app routing just to achieve a visual effect.
- Any new animation or visual state must include a stable state, transition, rollback or failure behavior, accessible focus style, and a reduced-motion equivalent.

## Verification gate

Code review and unit tests alone do not establish visual completion. Every significant UI change must include real Chromium QA and, when possible, screenshots or recordings of the actual changed states.

1. Verify desktop 1366x768, 1920x1080 and 2560x1440 plus representative mobile portrait and landscape.
2. Verify normal, hover, focus, pressed, active, empty, loading, failure, completion and reduced-motion states relevant to the change.
3. Inspect entry, mid-transition and settled frames for clipping, jumps, overlapping hit targets, horizontal overflow and layout reflow.
4. Exercise all existing related interactions. Ensure semantic state, data values, sorting, drag/drop, saved content and current navigation are preserved.
5. Check perceived responsiveness, unnecessary render loops and event listener ownership.
6. Describe what was actually tested and what remains unverified. Never mark an unobserved design as visually complete.

## Release protocol

Make broad redesigns in reviewable slices. Keep production unchanged until candidate Chromium checks pass and representative screenshots have been reviewed. Separate source changes, passing automated checks, actual browser observation and production deployment in the completion report.
