import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase317F1FutureSafeClosureAudit(){
 const issues=[],warnings=[];
 const p303=fs.readFileSync('scripts/run-phase303-f1-feedback-stabilization-audit.mjs','utf8');
 const p312=fs.readFileSync('scripts/run-phase312-f1-final-production-closure-audit.mjs','utf8');
 const current=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 for(const token of ["gachaSupersedesShuffle=base.includes","Phase 313 Gacha starting grid QA failed","Phase 313 P-grid dock is not on the right side"])if(!p303.includes(token))issues.push('Phase 317 Phase303 future-safe closure missing: '+token);
 for(const token of ["const currentPhase=Number(current.match(","if(currentPhase<312)"])if(!p312.includes(token))issues.push('Phase 317 Phase312 future-safe closure missing: '+token);
 for(const token of ["import {runPhase317F1FutureSafeClosureAudit} from './run-phase317-f1-future-safe-closure-audit.mjs';","export function runPhase317FullIntegrationAudit()","runCurrentFullIntegrationAudit(){return runPhase317FullIntegrationAudit();"])if(!current.includes(token))issues.push('Phase 317 cumulative chain missing: '+token);
 if(!workflow.includes('node --check scripts/run-phase317-f1-future-safe-closure-audit.mjs'))issues.push('Phase 317 workflow syntax check missing');
 for(const file of ['scripts/run-phase303-f1-feedback-stabilization-audit.mjs','scripts/run-phase312-f1-final-production-closure-audit.mjs','scripts/run-current-full-integration-audit.mjs','scripts/run-phase317-f1-future-safe-closure-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:317,name:'f1-future-safe-closure',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase317F1FutureSafeClosureAudit();
