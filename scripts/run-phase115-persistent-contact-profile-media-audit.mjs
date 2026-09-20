import fs from 'node:fs';

export function runPhase115PersistentContactProfileMediaAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "const raw=String(img.getAttribute('src')||img.currentSrc||'').trim();",
    "const explicit=String(img.dataset.contactId||'').trim();",
    "if(!raw)return explicit;",
    "const match=url.pathname.match(/^\\/media\\/contact\\/([^/]+)$/);",
    "function mwsPersistentContactMediaFallbackV115(img,id)",
    "if(img.id==='ctHeaderAvatarImage')",
    "if(img.id==='ctImagePreview')",
    "if(mwsPersistentContactMediaFallbackV115(img,id))return true;",
    "mwsBindContactMediaImageV111(img);",
    "mwsBindContactMediaImageV111(headerImg);"
  ])if(!app.includes(token))issues.push('persistent contact profile media guard missing: '+token);

  if(app.includes("const raw=String(img.currentSrc||img.getAttribute('src')||'').trim();")){
    issues.push('contact media id still prefers stale currentSrc over the assigned src attribute');
  }

  const idFnCount=(app.match(/function\s+mwsContactMediaIdV110\s*\(/g)||[]).length;
  if(idFnCount!==1)issues.push('contact media id owner count is '+idFnCount+', expected 1');

  const persistentFnCount=(app.match(/function\s+mwsPersistentContactMediaFallbackV115\s*\(/g)||[]).length;
  if(persistentFnCount!==1)issues.push('persistent contact fallback owner count is '+persistentFnCount+', expected 1');

  if(!index.includes('id="ctHeaderAvatarImage"'))issues.push('persistent contact header image node missing');
  if(!index.includes('id="ctHeaderAvatarFallback"'))issues.push('persistent contact header fallback node missing');
  if(!index.includes('id="ctImagePreview"'))issues.push('persistent contact preview image node missing');
  if(!index.includes('id="ctImagePreviewPlaceholder"'))issues.push('persistent contact preview fallback node missing');

  if(!index.includes('assets/app-core.js?v=1.3.0-search115'))issues.push('app-core cache revision is not search115');

  for(const token of [
    'run-phase115-persistent-contact-profile-media-audit.mjs',
    'app-core.js?v=1.3.0-search115',
    'mwsPersistentContactMediaFallbackV115',
    "img.getAttribute('src')||img.currentSrc",
    'mwsBindContactMediaImageV111(headerImg)'
  ])if(!workflow.includes(token))issues.push('production Phase 115 verification missing: '+token);

  const summary={phase:115,name:'persistent-contact-profile-media',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase115PersistentContactProfileMediaAudit();
