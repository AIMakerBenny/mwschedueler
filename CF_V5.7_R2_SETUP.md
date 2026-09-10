# MAWANG Scheduler CF V5.7 R2 Direct Media Setup

Production media base:

`https://pub-ff2081dd33384aa0865bb86b4514bbec.r2.dev`

CF V5.7 serves workspace data through the Worker API, but public images are returned to the browser as direct R2 URLs. There is no automatic fallback to the legacy `/media/* -> Worker -> R2` path.

## Expected request flow

- Static HTML/CSS/JS: Worker Static Assets
- Public workspace bootstrap: `/api/bootstrap`
- Contact images: `https://pub-ff2081dd33384aa0865bb86b4514bbec.r2.dev/contacts/<key>?v=<version>`
- Workspace images: `https://pub-ff2081dd33384aa0865bb86b4514bbec.r2.dev/workspace/<key>?v=<version>`
- Admin saves: `/api/save`

## R2 public access

The R2 bucket must keep Public Development URL enabled. The configured value in `wrangler.jsonc` is `MWS_R2_PUBLIC_BASE_URL`.

## CORS required for complete backup

Normal `<img>` display does not require the JavaScript CORS permission used by the backup feature. The CF V5.7 complete backup fetches R2 images in browser JavaScript and therefore requires an R2 CORS policy that allows GET from the production site.

Recommended policy:

```json
[
  {
    "AllowedOrigins": [
      "https://mawang-scheduler.majoku.workers.dev"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 86400
  }
]
```

If the application gets a custom production domain later, add that exact HTTPS origin to `AllowedOrigins`.

## Storage model

D1 continues to keep canonical internal media references such as `/media/contact/<key>?v=<version>`. CF V5.7 rewrites them to the configured R2 public base only in API responses. Admin saves convert direct R2 URLs back to canonical internal references before D1 storage, so changing the public media domain later does not require rewriting all D1 records.

## Request behavior

- Public shared data normally enters through one `/api/bootstrap` Worker request per page load/refresh.
- When the bootstrap ETag is unchanged, the browser reuses IndexedDB parts without issuing separate `/api/parts/*` requests.
- Profile/workspace images use the R2 public URL directly and do not intentionally call the Worker `/media/*` route.
- Admin autosaves are batched with a 2.5 second debounce. Manual SAVE remains immediate.

## Backup behavior

- `빠른 데이터 백업`: saves data and direct image URLs without downloading all R2 files.
- `완전 백업`: downloads every managed R2 image directly in the browser, embeds the actual image bytes as data URLs, and fails if any managed image cannot be retrieved.
- Because images are base64 encoded inside JSON, a complete JSON backup can be larger than the raw R2 image total.

## Image quality

Both individual profile uploads and folder profile updates are normalized to a maximum long edge of 1600 px and WebP quality 0.92 in CF V5.7.

## No fallback

If `MWS_R2_PUBLIC_BASE_URL` is missing or invalid, CF V5.7 API requests fail explicitly instead of silently falling back to Worker-served media.
