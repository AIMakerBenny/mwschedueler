import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

function runNode(file,issues){
  const run=spawnSync(process.execPath,[file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' failed: '+String(run.stderr||run.stdout||'').trim());
  return run.status===0;
}

export function runPhase295F1FinalRegressionGate(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const patch=fs.readFileSync('assets/f1-racing-r291-r295.js','utf8');
  const cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const recovery=fs.readFileSync('scripts/run-recovery-h-f1-live-qa-audit.mjs','utf8');

  for(const token of [
    "const VERSION295='phase295-f1-final-regression-gate';",
    'function qaFinalRegressionV295(){',
    'window.mwsF1QaFinalRegressionV295=qaFinalRegressionV295;',
    'window.__mwsF1RacingV295=VERSION295;'
  ])if(!patch.includes(token))issues.push('Phase 295 runtime marker missing: '+token);

  for(const ext of ['js','css']){
    const cacheMatch=index.match(new RegExp('assets/f1-racing-r291-r295\\.'+ext+'\\?phase=(\\d+)'));
    if(!cacheMatch||Number(cacheMatch[1])<295)issues.push('Phase 295 cache-bust missing or regressed below 295 for '+ext);
  }

  for(const token of [
    "import {runPhase295F1FinalRegressionGate} from './run-phase295-f1-final-regression-gate.mjs';",
    'export function runPhase295FullIntegrationAudit()'
  ])if(!cumulative.includes(token))issues.push('Phase 295 cumulative chain missing: '+token);
  const currentMatch=cumulative.match(/runCurrentFullIntegrationAudit\(\)\{return runPhase(\d+)FullIntegrationAudit\(\);\}/);
  if(!currentMatch||Number(currentMatch[1])<295)issues.push('Phase 295 cumulative current entrypoint is missing or regressed below Phase 295');

  if(cumulative.includes('\\nimport ')||cumulative.includes('};\\nexport function'))issues.push('Cumulative audit contains literal \\n sequence');

  for(const token of [
    'node --check scripts/run-phase295-f1-final-regression-gate.mjs',
    'node --check assets/f1-racing-r291-r295.js',
    '- name: Recovery H F1 live browser QA',
    'run: node scripts/diagnose-recovery-h-f1-live.mjs'
  ])if(!workflow.includes(token))issues.push('Phase 295 production workflow missing: '+token);

  for(const token of [
    "window.__mwsF1RacingV295==='phase295-f1-final-regression-gate'",
    'window.mwsF1QaFinalRegressionV295?.()',
    'Phase 291 finish must keep the race screen active',
    'f1RacingFinishOverlayV291'
  ])if(!diag.includes(token))issues.push('Phase 295 live browser scenario missing: '+token);

  for(const token of [
    "window.__mwsF1RacingV295==='phase295-f1-final-regression-gate'",
    'window.mwsF1QaFinalRegressionV295?.()'
  ])if(!recovery.includes(token))issues.push('Phase 295 Recovery H contract missing: '+token);

  for(const file of [
    'assets/f1-racing-r291-r295.js',
    'scripts/diagnose-recovery-h-f1-live.mjs',
    'scripts/run-recovery-h-f1-live-qa-audit.mjs'
  ]){
    const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  }

  for(const file of [
    'scripts/run-phase291-f1-finish-podium-result-overlay-audit.mjs',
    'scripts/run-phase292-f1-integrated-desktop-qa-audit.mjs',
    'scripts/run-phase293-f1-production-audit-gate.mjs',
    'scripts/run-phase294-f1-recovery-h-final-overlay-audit.mjs',
    'scripts/run-recovery-h-f1-live-qa-audit.mjs'
  ])runNode(file,issues);

  const result={phase:295,name:'f1-final-regression-gate',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase295F1FinalRegressionGate();
