# MAWANG Scheduler TEST V5.5 CF

This branch is an isolated Cloudflare test copy of the current TEST V5.5 production code.

## Architecture

- Static website: Cloudflare Workers Static Assets
- Shared workspace data: Cloudflare D1
- Contact / workspace images: Cloudflare R2
- Browser cache: IndexedDB, part-by-part version cache
- Admin authentication only: existing Supabase Auth + `admin_profiles`

The heavy workspace payload and images no longer use Supabase after Cloudflare bootstrap/migration. Supabase remains only for the existing admin login and admin-account management in this test build.

## One-time deployment

1. Cloudflare Dashboard -> Workers & Pages -> Create application -> Import a repository.
2. Connect GitHub and select `AIMakerBenny/mwschedueler`.
3. Select production branch `cloudflare-v5.5-test`.
4. Deploy command: `npm run deploy`.
5. Cloudflare reads `wrangler.jsonc` and automatically provisions the `DB` D1 binding and `IMAGES` R2 binding when supported by the account.
6. Deploy.

The Worker name is `mawang-scheduler-v55-test`.

## First launch

The first `/api/manifest` request creates the D1 schema and copies the current public `workspace_parts` from Supabase into D1 once. Existing Supabase managed image URLs are rewritten to same-origin `/media/...` URLs.

Images migrate lazily: the first time an old image is requested, the Worker fetches that image once from the old Supabase image endpoint, writes it to R2, and serves future requests from R2.

## High-resolution manual image replacement

R2 object keys are:

- Contact image: `contacts/<contact-id>`
- Workspace/tag/minigame image: `workspace/<asset-key>`

You may replace an object directly in the R2 dashboard with a larger WebP/PNG/JPEG file. Manually replaced files use a short cache policy unless they carry the managed version metadata, so replacements can refresh without waiting for a one-year immutable cache.

The normal in-app image upload flow is also supported. When a saved contact/tag/minigame image arrives as a `data:image/...` value, the Cloudflare Worker externalizes it into R2 and stores only a versioned `/media/...` URL in D1.

## API checks

- `/api/health` -> D1/R2 backend status
- `/api/manifest` -> tiny part-version manifest
- `/api/parts/contacts` -> one workspace part
- `/api/rebootstrap` -> admin-only forced refresh from current Supabase public workspace

## Safety

- `main` is untouched.
- Vercel production is untouched.
- Supabase production workspace is not deleted or modified by the Cloudflare bootstrap.
- Cloudflare saves only write to Cloudflare D1/R2. Supabase is used only to validate the existing Admin session and manage Admin accounts.
