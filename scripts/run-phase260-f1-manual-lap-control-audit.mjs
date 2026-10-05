import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase260F1ManualLapControlAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<260)issues.push('Phase 260 asset cache missing');

  for(const token of [
    "const VERSION260='phase260-manual-lap-control';",
    'const F1_LAP_MIN_V260=3;',
    'const F1_LAP_MAX_V260=99;',
    'let lapOverrideActiveV260=false;',
    'function clampLapCountV260(',
    'function recommendedLapsV260(',
    'function syncLapControlV260(){',
    'function setLapCountV260(',
    'function restoreRecommendedLapsV260(',
    'function bindLapControlV260(){',
    'function qaLapControlV260(){',
    'totalLaps:selectedTotalLapsRecoveryD',
    'lapOverride:lapOverrideActiveV260',
    'window.mwsF1SetLapCountV260=setLapCountV260;',
    'window.mwsF1QaLapControlV260=qaLapControlV260;',
    'window.__mwsF1RacingV260=VERSION260;'
  ])if(!racing.includes(token))issues.push('Phase 260 runtime missing: '+token);

  for(const token of [
    'id="f1RacingLapControlV260"',
    'id="f1RacingLapsMinusV260"',
    'id="f1RacingLapsInputV260"',
    'min="3" max="99"',
    'id="f1RacingLapsPlusV260"',
    'id="f1RacingLapsRestoreV260"'
  ])if(!index.includes(token))issues.push('Phase 260 setup UI missing: '+token);

  if(!css.includes('.f1-racing-lap-control-v260'))issues.push('Phase 260 lap-control CSS missing');

  for(const token of [
    'f1.totalLaps=Math.max(3,Math.min(99',
    'f1.lapOverride=Boolean(f1.lapOverride);',
    'lapOverride:Boolean(f1.lapOverride)',
    "Object.prototype.hasOwnProperty.call(patch,'lapOverride')"
  ])if(!app.includes(token))issues.push('Phase 260 persistence missing: '+token);

  for(const token of [
    "__mwsF1RacingV260==='phase260-manual-lap-control'",
    'Phase 260 lap-control QA failed',
    'Phase 260 minimum lap clamp failed',
    'Phase 260 maximum lap clamp failed',
    'Phase 260 race snapshot did not retain custom laps',
    'Phase 260 headline remaining laps mismatch'
  ])if(!live.includes(token))issues.push('Phase 260 Recovery H browser QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:260,name:'f1-manual-lap-control',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase260F1ManualLapControlAudit();
