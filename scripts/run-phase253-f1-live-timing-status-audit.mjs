import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase253F1LiveTimingStatusAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<253)issues.push('Phase 253 asset cache missing');

  for(const token of [
    "const VERSION253='phase253-live-timing-race-status';",
    'function timingTyreLabelV253(',
    'function timingPitLabelV253(',
    'function timingBattleLabelV253(',
    'function syncLiveTimingStatusV253(',
    'data-f1-status-tyre-v253',
    'data-f1-status-pit-v253',
    'data-f1-status-battle-v253',
    'syncLiveTimingStatusV253(row,vehicle);',
    'function qaLiveTimingStatusV253(){',
    'window.mwsF1QaLiveTimingStatusV253=qaLiveTimingStatusV253;',
    'window.__mwsF1RacingV253=VERSION253;'
  ])if(!racing.includes(token))issues.push('Phase 253 runtime missing: '+token);

  for(const token of [
    '/* Phase 253: compact Live Timing race status badges */',
    '.f1-racing-driver-state-v253',
    '[data-f1-status-tyre-v253]',
    '[data-f1-status-pit-v253]',
    '[data-f1-status-battle-v253]'
  ])if(!css.includes(token))issues.push('Phase 253 CSS missing: '+token);

  for(const token of [
    'mwsF1QaLiveTimingStatusV253',
    'Phase 253 Live Timing status QA failed',
    'Phase 253 timing tyre badge geometry invalid'
  ])if(!live.includes(token))issues.push('Phase 253 Recovery H browser QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:253,name:'f1-live-timing-race-status',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase253F1LiveTimingStatusAudit();
