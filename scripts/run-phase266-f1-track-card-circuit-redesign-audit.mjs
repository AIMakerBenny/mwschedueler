import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase266F1TrackCardCircuitRedesignAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<266)issues.push('Phase 266 asset cache missing');

  for(const token of [
    "const VERSION266='phase266-f1-track-card-circuit-redesign';",
    'const TRACK_CARD_CHARACTER_V266=Object.freeze({',
    "'majoku-ring-v1':Object.freeze({label:'BALANCED'",
    "'castle-street-circuit-v1':Object.freeze({label:'TECHNICAL'",
    "'blue-coast-speedway-v1':Object.freeze({label:'HIGH-SPEED FLOW'",
    "'mawang-speed-park-v1':Object.freeze({label:'LONG STRAIGHT'",
    "'royal-street-circuit-v1':Object.freeze({label:'NARROW STREET'",
    "'infinity-eight-circuit-v1':Object.freeze({label:'CROSSOVER'",
    "'highland-flow-ring-v1':Object.freeze({label:'SWEEPING'",
    'function trackSpeedTierV266(',
    'function trackCardCharacterV266(',
    'function trackCardHtmlV266(',
    'function qaTrackCardsV266(){',
    'data-f1-speed-tier-v266',
    'LENGTH',
    'TOP SPEED',
    'OVERTAKE',
    'window.mwsF1QaTrackCardsV266=qaTrackCardsV266;',
    'window.__mwsF1RacingV266=VERSION266;'
  ])if(!racing.includes(token))issues.push('Phase 266 runtime missing: '+token);

  for(const token of [
    '/* Phase 266: F1 technical circuit selection cards */',
    '.f1-racing-track-card-v266',
    '.f1-racing-track-card-silhouette-v266 path',
    'stroke-width:5.2',
    'stroke-linecap:square',
    '.f1-racing-track-card-tech-v266'
  ])if(!css.includes(token))issues.push('Phase 266 CSS missing: '+token);

  for(const token of [
    'Phase 266 track card QA failed',
    'trackCards266.length===7',
    'f1-racing-track-card-silhouette-v266 path',
    "['LOW','MID','HIGH']"
  ])if(!live.includes(token))issues.push('Phase 266 Recovery H QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:266,name:'f1-track-card-circuit-redesign',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase266F1TrackCardCircuitRedesignAudit();
