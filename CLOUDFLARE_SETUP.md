# MAWANG Scheduler V5.5 Cloudflare Production

This branch is the official Cloudflare production copy based on the tested V5.5 Cloudflare build.

## Architecture

- Static website: Cloudflare Workers Static Assets
- Shared workspace data: Cloudflare D1
- Contact / workspace images: Cloudflare R2 Standard
- Browser cache: IndexedDB, part-by-part version cache
- Admin authentication only: existing Supabase Auth + `admin_profiles`

The heavy workspace payload and images do not use Supabase after Cloudflare bootstrap/migration. Supabase remains only for the existing admin login and admin-account management.

## Production deployment

1. Cloudflare Dashboard -> Workers & Pages -> Create application -> Import a repository.
2. Connect GitHub and select `AIMakerBenny/mwschedueler`.
3. Select production branch `cloudflare-production`.
4. Set the Worker/project name to `mawang-scheduler`.
5. Leave Build command empty.
6. Deploy command: `npx wrangler deploy` or `npm run deploy`.
7. Keep Cloudflare Access disabled unless the site should be restricted to approved users.
8. Deploy.

The configuration provisions these bindings:

- `ASSETS`: Worker Static Assets
- `DB`: Cloudflare D1
- `IMAGES`: Cloudflare R2

## First launch

The first `/api/manifest` request creates the D1 schema and copies the current public `workspace_parts` from Supabase into D1 once. Existing Supabase managed image URLs are rewritten to same-origin `/media/...` URLs.

Images migrate lazily: the first time an old image is requested, the Worker fetches that image once from the old Supabase image endpoint, writes it to R2, and serves future requests from R2.

## High-resolution images

R2 object keys are:

- Contact image: `contacts/<contact-id>`
- Workspace/tag/minigame image: `workspace/<asset-key>`

Images may also be replaced directly in the R2 dashboard with larger WebP/PNG/JPEG files. The normal in-app image upload flow externalizes uploaded image data into R2 and stores only the resulting `/media/...` URL in D1.

## API checks

- `/api/health`
- `/api/manifest`
- `/api/parts/contacts`
- `/api/rebootstrap` for admin-only forced refresh from current Supabase public workspace

## Safety

- `main` remains untouched.
- The existing Vercel deployment remains untouched.
- The old `cloudflare-v5.5-test` Worker remains available as a test environment.
- Supabase production workspace is not deleted or modified by Cloudflare bootstrap.
- Cloudflare workspace saves write to D1/R2. Supabase is used only for existing Admin authentication and admin-account management.
