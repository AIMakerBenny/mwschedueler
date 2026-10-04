import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase197F1RacingLineAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const track=fs.readFileSync('assets/f1-track-v1.js','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of ['assets/f1-track-v1.js?v=1.0.0-phase197-line-meta','assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=197'])if(!index.includes(token))issues.push('Phase 197 asset link missing: '+token);
  for(const token of ['visualTrackWidthSvg:26','racingLineMarginMeters:1.5',"root.__mwsF1TrackRacingLineMetaV197='track-width-line-offset-v1';"])if(!track.includes(token))issues.push('Phase 197 track line metadata missing: '+token);
  for(const token of [
    "const VERSION197='phase197-racing-line-track-width';",
    "const F1_LINE_MODES_V197=Object.freeze(['IDEAL','ATTACK_INSIDE','DEFENSIVE_INSIDE','OUTSIDE','PIT_LINE']);",
    "racingLineMode:'IDEAL',lateralOffsetMeters:0",
    'function lineOffsetMetersV197(vehicle){',
    "if(mode==='ATTACK_INSIDE')",
    "if(mode==='DEFENSIVE_INSIDE')",
    "if(mode==='OUTSIDE')",
    "if(mode==='PIT_LINE')",
    "if(phaseInfo.phase==='APPROACH'||phaseInfo.phase==='BRAKING')",
    "if(phaseInfo.phase==='APEX')",
    'function raceLinePointV197(path,progress,offsetMeters){',
    'function setVehicleRacingLineV197(driverId,mode){',
    'vehicle.lateralOffsetMeters=lineOffsetMetersV197(vehicle);',
    'const point=raceLinePointV197(path,vehicle.progress,vehicle.lateralOffsetMeters);',
    "marker.dataset.lineMode=vehicle.racingLineMode||'IDEAL';",
    'window.mwsF1SetVehicleRacingLineV197=setVehicleRacingLineV197;',
    'window.__mwsF1RacingV197=VERSION197;'
  ])if(!racing.includes(token))issues.push('Phase 197 racing line runtime missing: '+token);

  for(const token of ['node --check scripts/run-phase197-f1-racing-line-audit.mjs',"echo '[phase197] F1 racing line and track width'"])if(!workflow.includes(token))issues.push('Phase 197 workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:197,name:'f1-racing-line-track-width',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase197F1RacingLineAudit();
