import fs from 'node:fs';

export function runPhase109ParticipantAvatarStabilityAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'function participantAvatarHTMLV109(c,eager=false)',
    'window.mwsParticipantAvatarLoadedV109=img=>',
    'window.mwsRecoverParticipantAvatarV109=img=>',
    'participantAvatarHTMLV109(c,true)',
    'participantAvatarHTMLV109(c,false)',
    'window.mwsRecoverParticipantAvatarV109=img=>window.mwsRecoverContactMediaImageV110(img)'
  ])if(!app.includes(token))issues.push('participant avatar stability guard missing: '+token);

  for(const token of [
    'window.openPostAsContentSchedule=async postId=>{',
    "document.body.dataset.mwsMode==='admin'&&typeof window.mwsV55SaveNow==='function'",
    'const normalizedSaved=await Promise.resolve(window.mwsV55SaveNow());',
    'assets/app-core.js?v=1.3.0-search112'
  ])if(!index.includes(token))issues.push('post contact image normalization guard missing: '+token);

  if(index.includes('assets/app-core.js?v=1.3.0-search109'))issues.push('stale app-core cache key remains');
  for(const token of [
    'run-phase109-participant-avatar-stability-audit.mjs',
    'function participantAvatarHTMLV109(c,eager=false)',
    'window.openPostAsContentSchedule=async postId=>{'
  ])if(!workflow.includes(token))issues.push('production Phase 109 verification missing: '+token);

  const summary={phase:109,name:'participant-avatar-stability',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase109ParticipantAvatarStabilityAudit();
