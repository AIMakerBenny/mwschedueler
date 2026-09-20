import fs from 'node:fs';

export function runPhase105ContactProfileImagePersistenceAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const auth=fs.readFileSync('src/cf-v111-auth.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const wrangler=fs.readFileSync('wrangler.jsonc','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "let pendingContactImageDataUrl='';",
    'function contactImageMimeFromFile(file)',
    'function normalizeContactImageDataUrl(value,file)',
    'function readContactImageFile(file)',
    'function verifyContactImageDecodable(dataUrl)',
    "const raw=pendingContactImageDataUrl||await readContactImageFile(file);",
    "if(!/^data:image\\/(?:jpeg|png|webp);base64,/i.test(candidate.image))",
    'async function compressContactImage(dataUrl,maxSize=1024,quality=.9)',
    "createImageBitmap(blob,{imageOrientation:'from-image'})"
  ]){
    if(!core.includes(token))issues.push('contact profile upload pipeline missing: '+token);
  }

  const saveStart=core.indexOf("document.getElementById('saveContactBtn').onclick=async()=>{");
  const saveEnd=core.indexOf("\ndocument.getElementById('deleteContactBtn').onclick=",saveStart);
  const saveBody=saveStart>=0&&saveEnd>saveStart?core.slice(saveStart,saveEnd):'';
  if(!saveBody)issues.push('saveContact button handler not found');
  if(saveBody){
    const fileIndex=saveBody.indexOf("const file=pendingContactImageFile||document.getElementById('ctImage').files?.[0]||null;");
    const decodeIndex=saveBody.indexOf('candidate.image=await compressContactImage(raw);');
    const saveIndex=saveBody.indexOf("saveData('연락처 저장')");
    if(fileIndex<0||decodeIndex<0||fileIndex>decodeIndex)issues.push('profile file is not resolved before image conversion');
    if(decodeIndex<0||saveIndex<0||decodeIndex>saveIndex)issues.push('profile image conversion is not completed before contact save');
  }

  for(const token of [
    'function isLegacyR2ContactUrl(env,value)',
    'async function canonicalizeLegacyR2ContactRefs(env,raw)',
    'const canonicalized=await canonicalizeLegacyR2ContactRefs(env,recovered.contacts);',
    "headers.set('cache-control','public, max-age=31536000, immutable')",
    "headers.set('x-mws-image-policy','original-bytes-no-reencode')"
  ]){
    if(!auth.includes(token))issues.push('contact media persistence guard missing: '+token);
  }

  if(!wrangler.includes('"/media/*"'))issues.push('/media/* is not configured for Worker-first routing');
  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:10[8-9]|1[1-9][0-9]|[2-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search108');

  for(const token of [
    'legacyR2DirectRefs:legacyRefs.length',
    'validManagedMedia',
    'invalidManagedMedia',
    'missingManagedMedia',
    "policy==='original-bytes-no-reencode'",
    '/max-age=31536000/i.test(cacheControl)',
    '/immutable/i.test(cacheControl)',
    "if(dataImages.length)throw new Error('Contact Data URLs remain in production storage')",
    "if(legacyRefs.length)throw new Error('Legacy direct R2 contact image references remain in production storage')",
    "if(invalidManagedMedia)throw new Error('Managed contact media failed Content-Type, byte-signature or cache-policy validation')"
  ]){
    if(!workflow.includes(token))issues.push('production profile image verification missing: '+token);
  }

  const summary={phase:105,name:'contact-profile-image-persistence',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase105ContactProfileImagePersistenceAudit();
