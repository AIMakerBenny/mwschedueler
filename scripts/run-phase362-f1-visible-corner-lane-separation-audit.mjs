import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase362F1VisibleCornerLaneSeparationAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION362='phase362-f1-visible-corner-lane-separation';",
    'const VISIBLE_CORNER_SEPARATION_V362=Object.freeze({',
    'visualWidthScale:5.8',
    'trackStrokeWidth:150',
    'laneVisualMultiplier:1.10',
    'nearLaneMeters:42',
    'nearLanePenalty:48',
    'const nearPressureV362=Array.from({length:count},()=>0);',
    'nearPressureV362[lane]*VISIBLE_CORNER_SEPARATION_V362.nearLanePenalty',
    'const result=Math.max(-limit+.06,Math.min(limit-.06,laneTarget+nudge));',
    '*VISIBLE_CORNER_SEPARATION_V362.visualWidthScale;',
    'function qaVisibleCornerLaneSeparationV362(){',
    'window.mwsF1QaVisibleCornerLaneSeparationV362=qaVisibleCornerLaneSeparationV362;',
    'window.__mwsF1RacingV362=VERSION362;'
  ])if(!core.includes(token))issues.push('Phase 362 core missing: '+token);
  const chooseStart=core.indexOf('function chooseCornerLaneIndexV361('),chooseEnd=core.indexOf('function updateCornerLaneOccupancyV361(',chooseStart),chooseSource=chooseStart>=0&&chooseEnd>chooseStart?core.slice(chooseStart,chooseEnd):'';
  if(/\b(?:raceProgress|progress)\s*=/.test(chooseSource))issues.push('Phase 362 proximity lane selection mutates progress');
  const lineStart=core.indexOf('function lineOffsetMetersV197('),lineEnd=core.indexOf('function phaseSpeedTargetV270(',lineStart),lineSource=lineStart>=0&&lineEnd>lineStart?core.slice(lineStart,lineEnd):'';
  if(lineSource.includes('V362')||lineSource.includes('VISIBLE_CORNER_SEPARATION_V362'))issues.push('Phase 362 leaked into physical racing line');
  for(const token of ['#f1RacingRaceTrackGlowV188{stroke-width:150}', '.f1-racing-race-lane-guide-v360{stroke:rgba(226,232,240,.46);stroke-width:1.25}'])if(!css.includes(token))issues.push('Phase 362 CSS missing: '+token);
  for(const token of ['Phase 362 runtime did not propagate to Recovery H browser','Phase 362 visible lane separation QA failed','laneSeparationV362:laneSeparation362||null'])if(!diag.includes(token))issues.push('Phase 362 Recovery H missing: '+token);
  for(const token of ['node --check scripts/run-phase362-f1-visible-corner-lane-separation-audit.mjs','[phase362] F1 visible corner lane separation','window.__mwsF1RacingV362=VERSION362;','stroke-width:150'])if(!workflow.includes(token))issues.push('Phase 362 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase362-f1-visible-corner-lane-separation-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:362,name:'f1-visible-corner-lane-separation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase362F1VisibleCornerLaneSeparationAudit();
