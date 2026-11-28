# Stage 30: approved calendar artwork and focus regression

The original generated photographic-style landscape was exported as calendar-scene-art-v2.jpg, 1280x720, 181694 bytes, SHA-256 fa8b8abee3cd70e71b49cb21480c867e3f756606ea6cc0ec214137ea4fcaf800. The GitHub connector in this session cannot transfer a local binary path directly. The asset is NOT yet committed; the existing procedural PNG remains active. To apply, place the exact JPEG in the working checkout or run node scripts/import-calendar-scene-v2.mjs --import /path/to/calendar-scene-art-v2.jpg, then node scripts/render-calendar-scene-v1.mjs --check. Commit the asset, updated CSS and index together. No runtime image fetch is added. PNG fallback checks remain in place.

Stage 29: contact geometry and integrated UI repair passed. Wide, QHD and ultrawide visual QA failed the real focus linkage assertion (hover, clearing, geometry passed). Stage 30 reconciles activeElement during linkage, defers focusout reconciliation until focus commits, and explicitly emulates active-window focus in the isolated visual browser only. Tests still require actual focus and linked states. The new result is pending; do not classify the issue as resolved before the run.

## Stage 34 asset integration

The exact approved JPEG was transferred from the attached lossless Base64 text, with the Git blob identity verified as `09564f1dc3aff41af7e19650285a3cf9bd186b56`. The embedded CSS uses the identical bytes and the calendar carries the `data-calendar-scene="photo"` grading marker. This supersedes the earlier transfer blocker. Fresh visual, performance and regression QA are required before production deployment.
