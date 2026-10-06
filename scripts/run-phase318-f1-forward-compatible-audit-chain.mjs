import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase318F1ForwardCompatibleAuditChain(){
 const issues=[],warnings=[];
 const p316=fs.readFileSync('scripts/run-phase316-f1-feedback-production-closure-audit.mjs','utf8');
 const p317=fs.readFileSync('scripts/run-phase317-f1-future-safe-closure-audit.mjs','utf8');
 const current=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

 for(const token of ['const currentPhase316=Number(current.match(','if(currentPhase316<316)'])if(!p316.includes(token))issues.push('Phase 318 Phase316 future-safe token missing: '+token);
 for(const token of ['const currentPhase317=Number(current.match(','if(currentPhase317<317)'])if(!p317.includes(token))issues.push('Phase 318 Phase317 future-safe token missing: '+token);
 for(const token of [
  "import {runPhase318F1ForwardCompatibleAuditChain} from './run-phase318-f1-forward-compatible-audit-chain.mjs';",
  'export function runPhase318FullIntegrationAudit()'
 ])if(!current.includes(token))issues.push('Phase 318 cumulative chain missing: '+token);
 const currentPhase318=Number(current.match(/runCurrentFullIntegrationAudit\(\)\{return runPhase(\d+)FullIntegrationAudit\(\);?\}/)?.[1]||0);
 if(currentPhase318<318)issues.push('Phase 318 current integration phase below 318: '+currentPhase318);
 if(!workflow.includes('node --check scripts/run-phase318-f1-forward-compatible-audit-chain.mjs'))issues.push('Phase 318 workflow syntax check missing');
 for(const file of ['scripts/run-phase316-f1-feedback-production-closure-audit.mjs','scripts/run-phase317-f1-future-safe-closure-audit.mjs','scripts/run-current-full-integration-audit.mjs','scripts/run-phase318-f1-forward-compatible-audit-chain.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:318,name:'f1-forward-compatible-audit-chain',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase318F1ForwardCompatibleAuditChain();
