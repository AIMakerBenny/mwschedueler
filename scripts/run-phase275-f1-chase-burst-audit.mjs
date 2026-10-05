import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase275F1ChaseBurstAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phases=[...index.matchAll(/recovery=N1&phase=(\d+)/g)].map(m=>Number(m[1]));if(!phases.some(v=>v>=275))issues.push('Phase 275 asset cache missing');
 for(const token of ["const VERSION275='phase275-chase-burst';",'const CHASE_BURST_CONFIG_V275=Object.freeze({','function chaseBurstEligibilityV275(','function updateChaseBurstV275(','function chaseBurstEffectV275(','function qaChaseBurstV275(){','updateChaseBurstV275(stepMs);',"endChaseBurstV275(vehicle,'pass-completed')",'maxTarget+=chaseBurstEffect.targetSpeedBonusKph+chaseBurstEffect.battleBiasBonusKph;','window.mwsF1QaChaseBurstV275=qaChaseBurstV275;','window.__mwsF1RacingV275=VERSION275;'])if(!racing.includes(token))issues.push('Phase 275 runtime missing: '+token);
 for(const token of ['Phase 275 chase burst QA failed','Phase 275 burst eligibility invalid','Phase 275 long-run benchmark failed'])if(!live.includes(token))issues.push('Phase 275 Recovery H missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:275,name:'f1-chase-burst',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase275F1ChaseBurstAudit();
