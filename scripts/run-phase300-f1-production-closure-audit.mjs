import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase300F1ProductionClosureAudit(){
  const issues=[],warnings=[],rows=[];
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const recovery=fs.readFileSync('scripts/run-recovery-h-f1-live-qa-audit.mjs','utf8');

  const phaseFiles=[
    'scripts/run-phase296-f1-future-safe-cache-audit.mjs',
    'scripts/run-phase297-f1-late-chain-recheck-audit.mjs',
    'scripts/run-phase298-f1-production-workflow-recheck-audit.mjs',
    'scripts/run-phase299-f1-recovery-h-contract-recheck-audit.mjs'
  ];
  for(const file of phaseFiles){
    const run=spawnSync(process.execPath,[file],{encoding:'utf8'});
    rows.push({file,status:run.status,stdout:String(run.stdout||'').trim().slice(-1000)});
    if(run.status!==0)issues.push(file+' failed: '+String(run.stderr||run.stdout||'').trim());
  }

  for(const token of [
    'node --check scripts/run-phase296-f1-future-safe-cache-audit.mjs',
    'node --check scripts/run-phase297-f1-late-chain-recheck-audit.mjs',
    'node --check scripts/run-phase298-f1-production-workflow-recheck-audit.mjs',
    'node --check scripts/run-phase299-f1-recovery-h-contract-recheck-audit.mjs',
    'node --check scripts/run-phase300-f1-production-closure-audit.mjs',
    '- name: Recovery H F1 live browser QA',
    'run: node scripts/diagnose-recovery-h-f1-live.mjs'
  ])if(!workflow.includes(token))issues.push('Phase 300 production workflow missing: '+token);

  for(const token of [
    "import {runPhase300F1ProductionClosureAudit} from './run-phase300-f1-production-closure-audit.mjs';",
    'export function runPhase300FullIntegrationAudit()',
    'runCurrentFullIntegrationAudit(){return runPhase300FullIntegrationAudit();}'
  ])if(!cumulative.includes(token))issues.push('Phase 300 cumulative chain missing: '+token);

  if(cumulative.includes('\\nimport ')||cumulative.includes('};\\nexport function'))issues.push('Phase 300 cumulative audit contains literal \\n sequence');

  const finalAsset=index.match(/assets\/f1-racing-r291-r295\.js\?phase=(\d+)/);
  if(!finalAsset||Number(finalAsset[1])<295)issues.push('Phase 300 final F1 runtime asset cache is stale');

  for(const token of [
    "window.__mwsF1RacingV295==='phase295-f1-final-regression-gate'",
    'window.mwsF1QaFinalRegressionV295?.()',
    'f1RacingFinishOverlayV291'
  ])if(!recovery.includes(token))issues.push('Phase 300 Recovery H final contract missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','scripts/run-current-full-integration-audit.mjs'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('Phase 300 cumulative audit syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:300,name:'f1-production-closure',rows,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase300F1ProductionClosureAudit();
