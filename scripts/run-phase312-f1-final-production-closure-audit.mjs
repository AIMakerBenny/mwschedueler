import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase312F1FinalProductionClosureAudit(){
 const issues=[],warnings=[],rows=[];
 for(const file of ['scripts/run-phase310-f1-final-spec-closure-audit.mjs','scripts/run-phase311-f1-long-run-performance-audit.mjs']){
  const run=spawnSync(process.execPath,[file],{encoding:'utf8'});
  rows.push({file,status:run.status,stdout:String(run.stdout||'').trim().slice(-1200)});
  if(run.status!==0)issues.push('Final prerequisite audit failed: '+file+' '+String(run.stderr||run.stdout||'').trim());
 }
 const current=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

 for(const token of [
  'runPhase312F1FinalProductionClosureAudit',
  'runPhase312FullIntegrationAudit()'
 ])if(!current.includes(token))issues.push('Phase 312 cumulative closure missing: '+token);
 const currentPhase=Number(current.match(/runCurrentFullIntegrationAudit\(\)\{return runPhase(\d+)FullIntegrationAudit\(\);?\}/)?.[1]||0);
 if(currentPhase<312)issues.push('Phase 312 cumulative closure regressed below Phase 312: '+currentPhase);

 for(const token of [
  'node --check scripts/run-phase312-f1-final-production-closure-audit.mjs',
  '- name: Deploy to Cloudflare Workers',
  '- name: Recovery H F1 live browser QA',
  '- name: Verify live Worker',
  '- name: Report Cloudflare production status'
 ])if(!workflow.includes(token))issues.push('Phase 312 production workflow contract missing: '+token);

 for(const token of [
  'phase311FramePacing:framePacing311',
  "assert(errors.length===0,'Browser errors during Recovery H: '",
  'Phase 309 actual order changes too low',
  'Phase 308 track overlay HUD QA failed'
 ])if(!diag.includes(token))issues.push('Phase 312 live closure contract missing: '+token);

 const result={phase:312,name:'f1-final-production-closure',rows,issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase312F1FinalProductionClosureAudit();
