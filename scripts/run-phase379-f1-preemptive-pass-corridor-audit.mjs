import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase379F1PreemptivePassCorridorAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8'),cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const token of ["const VERSION379='phase379-f1-preemptive-pass-corridor';",'function earlyPassWindowV379(','const windowV379=earlyPassWindowV379(gap,safeGap,closing);','function qaPreemptivePassCorridorV379(){','window.mwsF1QaPreemptivePassCorridorV379=qaPreemptivePassCorridorV379;','window.__mwsF1RacingV379=VERSION379;'])if(!core.includes(token))issues.push('Phase379 missing '+token);
 const src=core.slice(core.indexOf('function earlyPassWindowV379('),core.indexOf('function updatePassStateMachineV208(',core.indexOf('function earlyPassWindowV379(')));
 if(/\b(?:raceProgress|progress)\s*=/.test(src))issues.push('illegal progress edit');
 if(!src.includes("['STRAIGHT','APPROACH','BRAKING']")||!src.includes('windowV379.headwayProtected'))issues.push('early corner/safety gate missing');
 if(!diag.includes('Phase 379 preemptive pass QA failed')||!diag.includes('preemptivePassV379:preemptivePass379||null'))issues.push('live browser QA missing');
 if(!workflow.includes("echo '[phase379] F1 early safe corridor preemptive pass'")||!workflow.includes('node --check scripts/run-phase379-f1-preemptive-pass-corridor-audit.mjs'))issues.push('workflow missing');
 if(!cumulative.includes('export function runPhase379FullIntegrationAudit()'))issues.push('cumulative missing');
 for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase379-f1-preemptive-pass-corridor-audit.mjs']){
  const c=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
  if(c.status!==0)issues.push('syntax '+path+' '+String(c.stderr||c.stdout).slice(0,600));
 }
 const result={phase:379,name:'f1-preemptive-pass-corridor',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase379F1PreemptivePassCorridorAudit();
