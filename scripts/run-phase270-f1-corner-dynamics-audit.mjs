import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase270F1CornerDynamicsAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const geometry=fs.readFileSync('assets/f1-track-geometry-v2.js','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phases=[...index.matchAll(/recovery=N1&phase=(\d+)/g)].map(m=>Number(m[1]));
  if(!phases.some(v=>v>=270))issues.push('Phase 270 asset cache missing');

  for(const token of [
    "const VERSION270='phase270-f1-corner-line-exit-acceleration';",
    'const CORNER_DYNAMICS_V270=Object.freeze({',
    'function idealRacingLineOffsetV270(',
    'function phaseSpeedTargetV270(',
    "phaseInfo.phase==='EXIT'",
    'exitAccelerationMultiplier:1.38',
    'function qaCornerDynamicsV270(){',
    'window.mwsF1QaCornerDynamicsV270=qaCornerDynamicsV270;',
    'window.__mwsF1RacingV270=VERSION270;'
  ])if(!racing.includes(token))issues.push('Phase 270 racing runtime missing: '+token);

  for(const token of [
    'const directional=[];',
    'confirmed&&leftLength>=minSamples&&rightLength>=minSamples',
    'function exitRawLimitV270(',
    "phaseInfo?.phase!=='EXIT'",
    "root.__mwsF1CornerDynamicsV270='direction-split-exit-recovery-v1';"
  ])if(!geometry.includes(token))issues.push('Phase 270 geometry missing: '+token);

  for(const token of [
    'Phase 270 corner dynamics QA failed',
    'Phase 270 exit acceleration did not recover after apex'
  ])if(!live.includes(token))issues.push('Phase 270 Recovery H missing: '+token);

  for(const file of ['assets/f1-racing-v1.js','assets/f1-track-geometry-v2.js']){
    const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  }

  const result={phase:270,name:'f1-corner-line-exit-acceleration',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase270F1CornerDynamicsAudit();
