// R5-b49: real Majoku Ring only. Two deterministic 12-car NORMAL 10-lap
// browser races using the existing unmodified unified physics and pit lifecycle.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const dir='artifacts/r5-b49-majoku';
fs.mkdirSync(dir,{recursive:true});
const scenarios=[1,2],cases=[];
for(const [index,seed] of scenarios.entries()){
 const output=dir+'/seed'+seed+'-normal10.json';
 const result=spawnSync(process.execPath,[path.join(here,'qa-f1-v12-r5b3-normal-auto-pit.mjs')],{
  encoding:'utf8',timeout:360000,maxBuffer:4*1024*1024,
  env:{...process.env,MWS_R5B3_TRACK:'majoku-ring-v1',MWS_R5B3_SEED:String(seed),
   MWS_R5B3_PORT:String(8940+index),MWS_R5B3_OUTPUT:output,
   MWS_R5B3_PROFILE_SCENARIO:'NATURAL'}
 });
 for(const line of String(result.stdout||'').split('\n').filter(x=>x.includes('R5-b3')||x.includes('"status":"PASS"')).slice(-5))console.log(line);
 if(result.error||result.status!==0||!fs.existsSync(output)){
  throw Error('Majoku full 10-lap seed '+seed+' failed: '+String(result.error||result.stderr||result.stdout).slice(-4000));
 }
 const report=JSON.parse(fs.readFileSync(output,'utf8'));
 assert.equal(report.status,'PASS');
 assert.equal(report.track,'majoku-ring-v1');
 assert.equal(report.mode,'NORMAL');
 assert.equal(report.laps,10);
 assert.equal(report.seedId,String(seed));
 assert.equal(report.setupCreatedAt,report.seededIso);
 assert.equal(report.profileScenario,'NATURAL');
 assert.equal(report.state,'FINISHING');
 assert.equal(report.finishedRows?.length,12);
 assert(report.finishedRows.every(r=>r.lapTimesMs?.length===10&&r.finishMs>0));
 assert.equal(report.physics?.collisionStops,0);
 assert.deepEqual(report.physics?.invalid,[]);
 assert.deepEqual(report.continuityErrors,[]);
 assert(report.samples?.length>25,'Missing actual 5-second race gap samples');
 const rows=report.finishedRows,initial=report.initialOrder;
 const winner=rows[0],second=rows[1];
 cases.push({track:report.track,seed,mode:report.mode,lapCount:report.laps,
  fullRace:true,finishers:rows.length,raceSimSeconds:report.simulatedSeconds,
  finishSpreadSeconds:(rows.at(-1).finishMs-winner.finishMs)/1000,
  firstToSecondFinishGapSeconds:(second.finishMs-winner.finishMs)/1000,
  winnerId:winner.id,runnerUpId:second.id,
  gridLeaderId:initial[0],gridLeaderWon:initial[0]===winner.id,
  passes:report.physics.passes,rawCrossings:report.physics.rawCrossings,
  pitRequests:report.pitRequests.length,
  completedPitStops:rows.reduce((n,r)=>n+r.pits,0),
  collisionStops:report.physics.collisionStops,
  outcomeFile:output});
 console.log(JSON.stringify({phase:'R5-b49',status:'CASE_PASS',seed,
  winner:winner.id,passes:report.physics.passes,
  pitStops:cases.at(-1).completedPitStops,
  finishSpreadSeconds:cases.at(-1).finishSpreadSeconds}));
}
const summary={phase:'R5-b49',status:'PASS',scope:'Majoku Ring only; true browser NORMAL 10 laps, 12 drivers, seeds 1 and 2',
 physicsUnchanged:true,otherTracksUntouched:true,cases,
 limits:['Two deterministic seeds cannot certify balance of every race',
  'Initial six SOFT, three MEDIUM and three HARD tyre allocations are deliberate fixtures',
  'Observed race outcomes do not identify causal effects']};
fs.writeFileSync(dir+'/summary.json',JSON.stringify(summary,null,2));
assert.equal(cases.length,2);
assert(cases.every(r=>r.finishers===12&&r.collisionStops===0));
console.log(JSON.stringify({phase:'R5-b49',status:'PASS',races:cases.length,
 passes:cases.reduce((n,c)=>n+c.passes,0),output:dir+'/summary.json'}));
