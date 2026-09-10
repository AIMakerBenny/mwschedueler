# MAWANG Scheduler V5.5 Cloudflare Production

This branch is the official Cloudflare production branch.

## Cost-minimized release policy

Cloudflare preview deployments are not used for normal development.

Development flow:

1. If a test is needed, make and test a standalone/local HTML build first.
2. Do not push temporary test builds or test branches to Cloudflare.
3. After the local HTML is approved, commit the finished change directly to `cloudflare-production`.
4. Cloudflare then performs one production build/deploy only.
5. Keep `Builds for non-production branches` disabled in the Cloudflare project unless a cloud preview is specifically needed.
6. The Preview workers.dev URL may also remain disabled for normal operation.

This minimizes unnecessary Cloudflare builds and avoids maintaining a second paid-resource test environment.

## Version policy

Use the smallest version increment for normal updates.

- Current official baseline: `V5.5` / package version `5.5.0`
- Next small update: `V5.5.1`
- Then: `V5.5.2`, `V5.5.3`, and so on
- Move to `V5.6` only for a substantial feature/architecture release or when explicitly requested.

Do not create a separate Cloudflare test version merely to test a normal UI/function change. Local HTML is the default test method.

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
8. Disable `Builds for non-production branches` for the normal low-cost workflow.
9. Deploy.

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

- `main` remains untouched unless explicitly requested.
- The existing Vercel deployment remains untouched unless explicitly requested.
- The old `cloudflare-v5.5-test` branch/Worker is legacy test infrastructure and is not part of the normal release flow.
- Supabase production workspace is not deleted or modified by Cloudflare bootstrap.
- Cloudflare workspace saves write to D1/R2. Supabase is used only for existing Admin authentication and admin-account management.
