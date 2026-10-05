import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase252F1SpectatorHighlightsAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<252)issues.push('Phase 252 asset cache missing');

  for(const token of [
    "const VERSION252='phase252-spectator-race-highlights';",
    'const SPECTATOR_BATTLE_STATES_V252=Object.freeze(',
    'const SPECTATOR_OVERTAKE_STATES_V252=Object.freeze(',
    'spectatorPassFlashUntilV252',
    'function positionDeltaStateV252(',
    'function syncPositionDeltaV252(',
    'function syncVehicleSpectatorClassesV252(',
    'function fastestLapStateV252(){',
    'function syncSpectatorHighlightsV252(){',
    'syncSpectatorHighlightsV252();',
    'function qaSpectatorHighlightsV252(){',
    'window.mwsF1QaSpectatorHighlightsV252=qaSpectatorHighlightsV252;',
    'window.__mwsF1RacingV252=VERSION252;'
  ])if(!racing.includes(token))issues.push('Phase 252 runtime missing: '+token);

  for(const token of [
    '/* Phase 252: spectator battle, overtake, position-change and fastest-lap emphasis */',
    '.battle-pulse-v252',
    '.overtake-attempt-v252',
    '.pass-flash-v252',
    '.fastest-lap-v252',
    'data-position-delta-v252',
    '.best.is-fastest-v252'
  ])if(!css.includes(token))issues.push('Phase 252 CSS missing: '+token);

  for(const token of [
    'mwsF1QaSpectatorHighlightsV252',
    'Phase 252 spectator highlight QA failed',
    'Phase 252 battle marker pulse was not rendered',
    'Phase 252 position change indicator missing',
    'Phase 252 fastest lap indicator missing'
  ])if(!live.includes(token))issues.push('Phase 252 Recovery H browser QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:252,name:'f1-spectator-race-highlights',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase252F1SpectatorHighlightsAudit();
