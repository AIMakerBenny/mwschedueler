# MAWANG Scheduler CF V5.7 - R2 Direct Media Setup

CF V5.7 removes normal profile/workspace image delivery from the Worker request path.

## Required before production deploy

1. Open the R2 bucket bound as `IMAGES` (`mawang-scheduler-v55-test-images`).
2. Expose the bucket through an R2 Public Custom Domain or R2 public URL.
3. The public base URL must point at the bucket root where these existing object keys are reachable:
   - `contacts/<contact-id>`
   - `workspace/<asset-key>`
4. Configure R2 CORS so the MAWANG Scheduler site origin may `GET` the images. This is required for the browser-side self-contained backup feature.
5. Put the exact HTTPS base URL into Wrangler vars as `MWS_R2_PUBLIC_BASE_URL` before merging this branch to `cloudflare-production`.

Example only:

```jsonc
"vars": {
  "MWS_ENV": "cloudflare-production",
  "MWS_R2_PUBLIC_BASE_URL": "https://images.example.com"
}
```

Do not use the example domain in production.

## Request behavior

- Static HTML/CSS/JS: Static Assets, no Worker execution for normal asset hits.
- Public shared data: `/api/bootstrap`, normally one Worker request per page load/refresh.
- Cached unchanged bootstrap: one conditional bootstrap request; part reads are served from IndexedDB instead of generating one request per part.
- Profile/workspace images: direct R2 Custom Domain/CDN requests, not Worker `/media/*` requests.
- Admin saves: `/api/save` remains a Worker request.
- Legacy `/media/*` is intentionally disabled in CF V5.7. There is no automatic media fallback.

## Backup behavior

- `빠른 데이터 백업`: saves data and direct image URLs without downloading all R2 files.
- `완전 백업`: downloads every managed R2 image directly in the browser, embeds the actual image bytes as data URLs, and fails if any managed image cannot be retrieved.
- Because images are base64 encoded inside JSON, a complete JSON backup can be larger than the raw R2 image total.

## Image quality

Both individual profile uploads and folder profile updates are normalized to a maximum long edge of 1600 px and WebP quality 0.92 in CF V5.7.

## Safety

CF V5.7 intentionally refuses API operation when `MWS_R2_PUBLIC_BASE_URL` is missing. This prevents a silent return to the old `/media/* -> Worker -> R2` path and makes a configuration mistake obvious before production use.
