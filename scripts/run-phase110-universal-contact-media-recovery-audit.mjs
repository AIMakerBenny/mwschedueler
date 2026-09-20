import fs from 'node:fs';

export function runPhase110UniversalContactMediaRecoveryAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const mobile=fs.readFileSync('assets/mobile-calendar-day-detail-v130.js','utf8');
  const postLogin=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'function mwsContactMediaIdV110(img)',
    'function mwsContactFallbackNodeV110(img,id)',
    'window.mwsContactMediaLoadedV110=img=>',
    'window.mwsRecoverContactMediaImageV110=img=>',
    "img.dataset.mwsContactRecoveryV110='retry';",
    "img.style.visibility='hidden';",
    "img.removeAttribute('srcset');",
    '?fallback=110&cb=',
    "document.addEventListener('error',event=>",
    "document.addEventListener('load',event=>",
    'window.__mwsContactMediaRecoveryV110=true;'
  ])if(!app.includes(token))issues.push('universal contact media recovery missing: '+token);

  if(!index.includes('assets/app-core.js?v=1.3.0-search111'))issues.push('app-core cache revision is not search111');
  if(index.includes('assets/app-core.js?v=1.3.0-search110'))issues.push('stale app-core search110 reference remains');

  for(const token of [
    "target.dataset.mwsContactRecoveryV110==='retry'",
    "typeof window.mwsRecoverContactMediaImageV110==='function'",
    'window.mwsRecoverContactMediaImageV110(target)'
  ])if(!mobile.includes(token))issues.push('mobile contact recovery delegation missing: '+token);

  if(!postLogin.includes('mobile-calendar-day-detail-v130.js?v=1.3.0-perf35'))issues.push('mobile detail cache revision is not perf35');

  for(const token of [
    'run-phase110-universal-contact-media-recovery-audit.mjs',
    'mwsRecoverContactMediaImageV110',
    'search111',
    'perf35'
  ])if(!workflow.includes(token))issues.push('production Phase 110 verification missing: '+token);

  const summary={phase:110,name:'universal-contact-media-recovery',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase110UniversalContactMediaRecoveryAudit();
