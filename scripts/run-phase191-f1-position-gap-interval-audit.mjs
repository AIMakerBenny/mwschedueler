import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase191F1PositionGapIntervalAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/f1-racing-v1.css?v=1.0.0-phase180-shell&p=',
    'assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=',
    '<span>격차</span><span>앞차</span><span>타이어</span>'
  ])if(!index.includes(token))issues.push('Phase 191 HTML missing: '+token);

  for(const token of [
    "const VERSION191='phase191-position-gap-interval';",
    'function computeRaceStandingsV191(){',
    'Number(b.raceProgress||0)-Number(a.raceProgress||0)',
    'gapProgress',
    'intervalProgress',
    'gapSeconds:index===0?0:gapProgress*leaderLapMs/1000',
    'intervalSeconds:index===0?0:intervalProgress*previousLapMs/1000',
    'function formatRaceDeltaV191(progress,seconds,isLeader=false){',
    "if(isLeader)return '선두';",
    "return '+'+laps+'랩';",
    'function updateRaceStandingsV191(){',
    "row.dataset.position=String(standing.position);",
    "pos.textContent='P'+String(standing.position).padStart(2,'0');",
    "row.classList.remove('podium','p1','p2','p3');",
    "row.classList.add('podium','p'+standing.position);",
    "vehicle.marker.classList.toggle('leader',standing.position===1);",
    'data-f1-gap',
    'data-f1-interval',
    'window.mwsF1ComputeRaceStandingsV191=computeRaceStandingsV191;',
    'window.__mwsF1RacingV191=VERSION191;'
  ])if(!js.includes(token))issues.push('Phase 191 standings runtime missing: '+token);

  if(!js.includes('updateRaceStandingsV191();\n  return true;'))issues.push('Standings are not connected to the 100 ms telemetry refresh');
  if(js.includes('f1RacingTimingListV188.appendChild')||js.includes('f1RacingTimingListV188.prepend'))warnings.push('Phase 191 should compute official ranking without introducing the Phase 192 row-reorder animation early');

  for(const token of [
    'grid-template-columns:46px minmax(150px,1.3fr) 48px 62px 56px 88px 88px 72px 66px 58px 66px 66px 66px',
    '.f1-racing-timing-row-v188 .gap,.f1-racing-timing-row-v188 .interval{',
    '.f1-racing-race-vehicle-v189.leader .car-halo{'
  ])if(!css.includes(token))issues.push('Phase 191 standings CSS missing: '+token);

  for(const token of [
    'node --check scripts/run-phase191-f1-position-gap-interval-audit.mjs',
    "echo '[phase191] F1 official position gap and interval'"
  ])if(!workflow.includes(token))issues.push('Phase 191 workflow verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:191,name:'f1-position-gap-interval',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase191F1PositionGapIntervalAudit();
