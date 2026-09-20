import fs from 'node:fs';

export function runPhase107ContactImageMigrationAndCacheRevisionAudit(){
  const issues=[];
  const warnings=[];
  const auth=fs.readFileSync('src/cf-v111-auth.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "const CONTACT_MEDIA_REVISION='2';",
    "revision=kind==='contact'?",
    "const CONTACT_REMOTE_IMAGE_HOSTS=new Set(['profile.img.sooplive.co.kr']);",
    'function trustedRemoteContactImageUrl(value)',
    'function detectContactImageContentType(bytes)',
    'async function storeRemoteContactImage(env,key,remoteUrl,saveContext=null)',
    "source:'mws-remote-profile'",
    'async function migrateTrustedRemoteContactRefs(env,raw)',
    'async function canonicalizeManagedContactRefs(env,raw)',
    'async function canonicalManagedContactUrl(env,id,fallback=',
    'const remote=await migrateTrustedRemoteContactRefs(env,legacy.contacts);',
    'const managed=await canonicalizeManagedContactRefs(env,remote.contacts);',
    "else if(id&&trustedRemoteContactImageUrl(item.image))item.image=await storeRemoteContactImage(env,id,item.image,saveContext)",
    "else if(id&&String(item.image||'').startsWith('/media/contact/'))item.image=await canonicalManagedContactUrl(env,id,item.image)"
  ]){
    if(!auth.includes(token))issues.push('contact migration/cache revision guard missing: '+token);
  }

  for(const token of [
    'unmanagedContactImages',
    'namedContactImageAudit',
    "if(unmanagedImages.length)throw new Error('Unmanaged contact image references remain in production storage')",
    "if(mediaImages.some(row=>!/[?&]r=2(?:&|$)/.test(row.image)))throw new Error('Managed contact image revision is stale')",
    "if(images.length!==mediaImages.length)throw new Error('Not every stored contact image is managed by same-origin media')"
  ]){
    if(!workflow.includes(token))issues.push('production Phase 107 verification missing: '+token);
  }

  const summary={phase:107,name:'contact-image-migration-cache-revision',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase107ContactImageMigrationAndCacheRevisionAudit();
