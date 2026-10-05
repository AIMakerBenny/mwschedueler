import {spawnSync} from 'node:child_process';
export function runPhase297F1LateChainRecheckAudit(){
 const issues=[],warnings=[],rows=[];
 for(const phase of [291,292,293,294,295,296]){
  const files={
   291:'scripts/run-phase291-f1-finish-podium-result-overlay-audit.mjs',
   292:'scripts/run-phase292-f1-integrated-desktop-qa-audit.mjs',
   293:'scripts/run-phase293-f1-production-audit-gate.mjs',
   294:'scripts/run-phase294-f1-recovery-h-final-overlay-audit.mjs',
   295:'scripts/run-phase295-f1-final-regression-gate.mjs',
   296:'scripts/run-phase296-f1-future-safe-cache-audit.mjs'
  };
  const file=files[phase],run=spawnSync(process.execPath,[file],{encoding:'utf8'});
  rows.push({phase,file,status:run.status,stdout:String(run.stdout||'').trim().slice(-1200)});
  if(run.status!==0)issues.push('Phase '+phase+' late-chain audit failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:297,name:'f1-late-chain-recheck',rows,issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase297F1LateChainRecheckAudit();
