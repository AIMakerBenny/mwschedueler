import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase393F1LateStintPitAudit(){
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
   cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8'),issues=[],warnings=[];
 for(const token of ['function lateStintPitDeferralV393(', 'function qaLateStintPitDeferralV393()', 'window.mwsF1QaLateStintPitDeferralV393=qaLateStintPitDeferralV393','FINAL_STINT_LIVE_WEAR_ECONOMY_V393','lateStintPitDeferralV393(vehicle,context,finalStintEconomicsV374)'])
   if(!core.includes(token))issues.push('missing runtime '+token);
 if(!diag.includes('Phase 393 late stint pit economics Chromium QA failed')||!diag.includes('lateStintPitV393:lateStint393||null'))issues.push('missing browser QA');
 if(!cum.includes('runPhase393F1LateStintPitAudit()')||!cum.includes('runPhase393FullIntegrationAudit()'))issues.push('missing cumulative audit');
 if(!core.includes("const shouldPit=(decision==='BOX_NOW'||decision==='UNDERCUT'||decision==='COVER_UNDERCUT')&&(wearReady||criticalTyre)&&!safeTyre;"))issues.push('original 40 percent guard changed');
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
   const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(check.status!==0)issues.push('syntax '+file+' '+String(check.stderr).slice(0,350));
 }
 const result={phase:393,name:'f1-late-stint-wear-economics',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase393F1LateStintPitAudit();
