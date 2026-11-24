# Public media CDN cutover checklist

The candidate is disabled by default. Do not set MWS_PUBLIC_MEDIA_CDN_ORIGIN to the existing development r2.dev URL or to a Workers route.

Before enabling:
1. Confirm the exact public R2 bucket, object inventory and visibility policy. Do not make a mixed private/public bucket public. Use an audited existing public origin, or a dedicated public bucket with verified copies and an upload/delete synchronization plan.
2. Connect a production custom domain to the public R2 origin. Permit only the intended public image paths and safe image content types; do not expose admin data, backups, or unpublished media.
3. Configure GET/HEAD CORS for the scheduler origin (achievement images are read as blobs). Configure caching for immutable versioned contact images and purge when necessary. Verify image MIME types and original bytes.
4. Set MWS_PUBLIC_MEDIA_CDN_ORIGIN to the validated HTTPS origin through the deployment configuration, with no path, query or credentials. The Worker injects the origin into HTML; no config lookup request is needed.
5. Compare a cold browser visit before and after activation, check contact/achievement image success, errors and fallbacks. Verify R2 operations separately from Worker invocations. Keep the canonical /media paths in saved data.
6. Rollback: unset MWS_PUBLIC_MEDIA_CDN_ORIGIN and redeploy; no data migration or client database change is required.

The legacy /media route remains authoritative for missing objects, unversioned contacts, manual verification and writes. Only the public contact object path with an explicit version/token and the public achievement object path are eligible for direct reads. The local browser fixture exercises a mock CDN and a missing-object fallback without contacting the real bucket.
