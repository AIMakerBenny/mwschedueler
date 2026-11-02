// R5-b51: matched full-game 10-lap pace-only counterfactuals on Majoku.
// Other ratings, genuine start grid, initial tyre allocation, physics, pit
// economics and the complete race engine remain untouched. Browser test only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const dir='artifacts/r5-b51-majoku';
fs.mkdirSync(dir,{recursive:true});
const base=JSON.parse(fs.readFileSync('artifacts/r5-b49-majoku/summary.json','utf8'));
assert.equal(base.status,'PASS');
assert.deepEqual(base.cases.map(x=>x.seed),[1,2]);
const pairs=[];
for(const [index,original] of base.cases.entries()){
 const seed=original.seed,output=dir+'/seed'+seed+'-equal-pace75.json';
 const run=spawnSync(process.execPath,[path.join(here,'qa-f1-v12-r5b3-normal-auto-pit.mjs')],{
  encoding:'utf8',timeout:360000,maxBuffer:4*1024*1024,
  env:{...process.env,MWS_R5B3_TRACK:'majoku-ring-v1',MWS_R5B3_SEED:String(seed),
   MWS_R5B3_PORT:String(8960+index),MWS_R5B3_OUTPUT:output,
   MWS_R5B3_PROFILE_SCENARIO:'EQUAL_PACE_75'}
 });
 for(const line of String(run.stdout||'').split('\n').filter(x=>x.includes('R5-b3')||x.includes('"status":"PASS"')).slice(-4))console.log(line);
 if(run.error||run.status!==0||!fs.existsSync(output))
  throw Error('Majoku matched equal-pace seed '+seed+' failed: '+String(run.error||run.stderr||run.stdout).slice(-4000));
 const baseline=JSON.parse(fs.readFileSync(original.outcomeFile,'utf8'));
 const experiment=JSON.parse(fs.readFileSync(output,'utf8'));
 assert.equal(baseline.status,'PASS');assert.equal(experiment.status,'PASS');
 assert.equal(baseline.profileScenario,'NATURAL');
 assert.equal(experiment.profileScenario,'EQUAL_PACE_75');
 assert.equal(experiment.track,'majoku-ring-v1');
 assert.equal(experiment.seedId,String(seed));
 assert.equal(experiment.seededIso,baseline.seededIso,'Comparison starts are not same seeded timestamp');
 assert.equal(experiment.setupCreatedAt,baseline.setupCreatedAt,'Grid seed changed');
 assert.equal(experiment.laps,10);assert.equal(experiment.mode,'NORMAL');
 assert.equal(experiment.state,'FINISHING');
 assert.equal(experiment.finishedRows?.length,12);
 assert(experiment.finishedRows.every(r=>r.finishMs>0&&r.lapTimesMs?.length===10));
 assert.equal(experiment.physics.collisionStops,0);assert.deepEqual(experiment.physics.invalid,[]);
 assert.deepEqual(experiment.continuityErrors,[]);
 assert.deepEqual(experiment.initialOrder,baseline.initialOrder,'Starting grid changed');
 assert.deepEqual(experiment.startingCompounds,baseline.startingCompounds,'Starting tyres changed');
 assert.deepEqual(experiment.originalProfiles,baseline.originalProfiles,'Non-pace starting driver attributes changed');
 assert.deepEqual(baseline.appliedProfiles,baseline.originalProfiles);
 let altered=0;
 for(const [id,profile] of Object.entries(baseline.originalProfiles)){
  const applied=experiment.appliedProfiles?.[id];
  assert(applied,'Missing matched-driver profile '+id);
  const expectedProfile={...profile,pace:75};
  assert.deepEqual(applied,expectedProfile,'Other driver rating changed for '+id);
  if(profile.pace!==75)altered++;
 }
 const baseWinner=baseline.finishedRows[0],equalWinner=experiment.finishedRows[0];
 const baseById=new Map(baseline.finishedRows.map(r=>[r.id,r]));
 const rankShifts=experiment.finishedRows.map(row=>({id:row.id,
  originalPace:baseline.originalProfiles[row.id]?.pace,
  baselineRank:baseById.get(row.id)?.position,
  equalPaceRank:row.position,
  changeInFinishSeconds:(row.finishMs-(baseById.get(row.id)?.finishMs||0))/1000}));
 const result={seed,scenario:'same seeded initial race vs equal-only-pace75',
  completeTenLapRace:true,drivers:12,profilesChanged:altered,
  gridSame:true,otherRatingsSame:true,tyresSameAtStart:true,
  baseline:{winner:baseWinner.id,passes:baseline.physics.passes,
   frontGapSeconds:(baseline.finishedRows[1].finishMs-baseWinner.finishMs)/1000,
   finishSpreadSeconds:(baseline.finishedRows.at(-1).finishMs-baseWinner.finishMs)/1000,
   pitStops:baseline.finishedRows.reduce((n,r)=>n+r.pits,0)},
  equalPace:{winner:equalWinner.id,passes:experiment.physics.passes,
   frontGapSeconds:(experiment.finishedRows[1].finishMs-equalWinner.finishMs)/1000,
   finishSpreadSeconds:(experiment.finishedRows.at(-1).finishMs-equalWinner.finishMs)/1000,
   pitStops:experiment.finishedRows.reduce((n,r)=>n+r.pits,0)},
  rankShifts,sourceFiles:{baseline:original.outcomeFile,equalPace:output}};
 pairs.push(result);
 console.log(JSON.stringify({phase:'R5-b51',status:'CASE_PASS',seed,
  naturalWinner:result.baseline.winner,equalPaceWinner:result.equalPace.winner,
  gridSame:result.gridSame,changedProfiles:altered}));
}
const report={phase:'R5-b51',status:'PASS',track:'majoku-ring-v1',
 intervention:'Only pace normalized to 75 before the first genuine 20ms race step',
 completeMatchedPairs:pairs.length,pairs,
 limits:['Changed pace can alter genuine pit timing, incident opportunities, ERS delivery and racing paths downstream',
  'Two paired seeds do not guarantee generality or separate all strategic factors',
  'Experimental profile modification exists only in Playwright test, never public game source']};
assert.equal(pairs.length,2);
fs.writeFileSync(dir+'/paired-pace.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({phase:'R5-b51',status:'PASS',matchedPairs:pairs.length,artifact:dir+'/paired-pace.json'}));
