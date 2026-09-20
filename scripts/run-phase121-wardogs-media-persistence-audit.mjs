import fs from 'node:fs';

export function runPhase121WardogsMediaPersistenceAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const media=fs.readFileSync('assets/wardogs-media-v1.js','utf8');
  const auth=fs.readFileSync('src/cf-v111-auth.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!index.includes('assets/wardogs-media-v1.js?v=1.0.0-phase121'))issues.push('WARDOGS media runtime is not loaded by index');

  for(const token of [
    "const DB_NAME='mws_wardogs_media_v1';",
    'const MAX_BYTES=32*1024*1024;',
    "const STORE='media';",
    "function cloudUrl(id){return '/media/wardogs/'",
    "function cloudApiUrl(id){return '/api/wardogs-media/'",
    "if(!(blob instanceof Blob))throw new TypeError('WARDOGS media must be a Blob');",
    "if(blob.size>MAX_BYTES)throw new Error('WARDOGS media exceeds 32MB');",
    "if(!type.startsWith('image/'))throw new Error('WARDOGS media must be an image');",
    "const previous=await tryGetLocal(id);",
    "if(previous)await withStore('readwrite',store=>store.put(previous));",
    "else await withStore('readwrite',store=>store.delete(id));",
    "for(const card of window.mwsWardogsDataV119?.get?.()?.cards||[])",
    "window.mwsWardogsMediaV1=Object.freeze({",
    'maxBytes:MAX_BYTES'
  ])if(!media.includes(token))issues.push('WARDOGS media client foundation missing: '+token);

  if(/localStorage|FileReader|readAsDataURL|data:image/i.test(media))issues.push('WARDOGS media client must not persist media through localStorage/Base64/DataURL');
  if(/canvas|toDataURL|toBlob\s*\(/i.test(media))warnings.push('WARDOGS media client contains image transformation code; confirm original-byte policy');

  for(const token of [
    'const WARDOGS_MEDIA_MAX_BYTES=32*1024*1024;',
    "function validWardogsMediaId(value)",
    "function wardogsMediaKey(id){return `wardogs/${id}`}",
    'async function handleWardogsMediaRead(request,env,id)',
    'async function handleWardogsMediaWrite(request,env,id)',
    "headers.set('x-mws-image-policy','original-bytes-no-reencode');",
    "if(!type.startsWith('image/'))return json({error:'WARDOGS media must be an image'},415);",
    "if(declared>WARDOGS_MEDIA_MAX_BYTES)return json({error:'WARDOGS media exceeds 32MB'},413);",
    "customMetadata:{source:'wardogs-card',uploadedBy:String(admin.id||'')}",
    "const wardogsApi=path.match(/^\\/api\\/wardogs-media\\/([^/]+)$/);",
    "const wardogsMedia=path.match(/^\\/media\\/wardogs\\/([^/]+)$/);"
  ])if(!auth.includes(token))issues.push('WARDOGS R2 media backend missing: '+token);

  for(const token of [
    'run-phase121-wardogs-media-persistence-audit.mjs',
    'assets/wardogs-media-v1.js?v=1.0.0-phase121',
    'mws_wardogs_media_v1',
    '/api/wardogs-media/',
    '/media/wardogs/',
    'Invalid WARDOGS media id',
    'Admin authorization required',
    'original-bytes-no-reencode'
  ])if(!workflow.includes(token))issues.push('production Phase 121 verification missing: '+token);

  const summary={phase:121,name:'wardogs-media-persistence',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase121WardogsMediaPersistenceAudit();
