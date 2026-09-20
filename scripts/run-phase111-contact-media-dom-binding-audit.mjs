import fs from 'node:fs';

export function runPhase111ContactMediaDomBindingAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'function mwsBindContactMediaImageV111(img)',
    "img.dataset.mwsContactBoundV111='1';",
    "img.addEventListener('error',()=>window.mwsRecoverContactMediaImageV110(img));",
    "img.complete&&img.naturalWidth===0",
    'function mwsScanContactMediaImagesV111(root=document)',
    "querySelectorAll('img[src*=\"/media/contact/\"]')",
    'const observer=new MutationObserver(records=>',
    "observer.observe(document.documentElement,{childList:true,subtree:true});",
    "window.addEventListener('mawang:datachange'",
    "window.addEventListener('mws:app-ready'"
  ])if(!app.includes(token))issues.push('contact media DOM binding missing: '+token);

  if(app.includes("document.addEventListener('error',event=>")&&app.includes('__mwsContactMediaRecoveryV110')){
    issues.push('legacy document-level V110 image error capture remains alongside V111 binder');
  }
  if(!index.includes('assets/app-core.js?v=1.3.0-search115'))issues.push('app-core cache revision is not search115');

  for(const token of [
    'run-phase111-contact-media-dom-binding-audit.mjs',
    'mwsBindContactMediaImageV111',
    'mwsScanContactMediaImagesV111',
    'search115'
  ])if(!workflow.includes(token))issues.push('production Phase 111 verification missing: '+token);

  const summary={phase:111,name:'contact-media-dom-binding',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase111ContactMediaDomBindingAudit();
