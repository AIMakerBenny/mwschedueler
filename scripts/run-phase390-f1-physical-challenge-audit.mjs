import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase390F1PhysicalChallengeAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const required of ['function fastPhysicalChallengeV390(', 'FAST_PHYSICAL_CHALLENGE_V390', 'function qaFastPhysicalChallengeV390(){', 'window.mwsF1QaFastPhysicalChallengeV390=qaFastPhysicalChallengeV390', 'physicalOnTrackPasses,passStateCompletions'])
   if(!core.includes(required))issues.push('missing core '+required);
 if(!diag.includes('Phase 390 fast physical challenge Chromium QA failed')||!diag.includes('fastPhysicalV390:fastPhysical390||null'))issues.push('missing browser QA');
 if(!cum.includes('runPhase390FullIntegrationAudit()')||!cum.includes('runPhase390F1PhysicalChallengeAudit()'))issues.push('missing integration');
 if(/\b(?:raceProgress|progress|finishPosition|travel)\s*=/.test(core.slice(core.indexOf('function fastPhysicalChallengeV390('),core.indexOf('const MULTICAR_CORRIDOR_V376'))))issues.push('coordinate mutation');
 for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
  const status=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
  if(status.status!==0)issues.push('syntax '+path+' '+String(status.stderr).slice(0,350));
 }
 const result={phase:390,name:'f1-fast-physical-challenge',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase390F1PhysicalChallengeAudit();
