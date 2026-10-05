import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase188F1RaceControlFrameAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'class="f1-racing-view-v185 f1-racing-race-control-v188"',
    'id="f1RacingRaceTrackNameV188"',
    'id="f1RacingRaceStatusV188"',
    'id="f1RacingRaceLapV188"',
    'id="f1RacingTimingListV188"',
    'id="f1RacingRaceTrackSvgV188"',
    'id="f1RacingRaceVehicleLayerV188"',
    'id="f1RacingCommentaryLogV188"',
    '실시간 순위',
    '경기 해설'
  ])if(!index.includes(token))issues.push('Phase 188 Race Control UI missing: '+token);
  const obsoletePanelsSuperseded=js.includes("const VERSION249='phase249-remove-obsolete-race-panels';");
  if(obsoletePanelsSuperseded){
    for(const token of ['id="f1RacingTeamRadioV188"','id="f1RacingSpeedTrapV188"'])if(index.includes(token))issues.push('Phase 249 superseded Phase 188 placeholder remains: '+token);
  }else{
    for(const token of ['id="f1RacingTeamRadioV188"','id="f1RacingSpeedTrapV188"','팀 라디오','스피드 트랩'])if(!index.includes(token))issues.push('Phase 188 legacy Race Control UI missing: '+token);
  }

  for(const token of [
    "const VERSION188='phase188-race-control-frame';",
    'function driverCodeV188(driver){',
    'function timingRowV188(driver,index){',
    'function renderRaceControlV188(){',
    "if(list)list.innerHTML=snapshot.drivers.map(timingRowV188).join('');",
    "if(path)path.setAttribute('d',snapshot.track.path||'');",
    'window.mwsF1RenderRaceControlV188=renderRaceControlV188;',
    'window.__mwsF1RacingV188=VERSION188;'
  ])if(!js.includes(token))issues.push('Phase 188 runtime missing: '+token);

  if(!js.includes("if(!setScreenStateV185('RACE'))return false;\n  renderRaceControlV188();"))issues.push('Explicit race start does not render Race Control from the active snapshot');

  for(const token of [
    '.f1-racing-race-control-v188{',
    '.f1-racing-live-timing-v188',
    '.f1-racing-timing-row-v188.p1:before',
    '.f1-racing-timing-row-v188.p2:before',
    '.f1-racing-timing-row-v188.p3:before',
    '.f1-racing-race-grid-v188{',
    '.f1-racing-commentary-log-v188{'
  ])if(!css.includes(token))issues.push('Phase 188 CSS missing: '+token);

  for(const token of [
    'node --check scripts/run-phase188-f1-race-control-frame-audit.mjs',
    "echo '[phase188] F1 Race Control base frame'"
  ])if(!workflow.includes(token))issues.push('Phase 188 production verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:188,name:'f1-race-control-frame',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase188F1RaceControlFrameAudit();
