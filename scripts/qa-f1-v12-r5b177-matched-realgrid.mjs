// R5-b177: compare genuine current 10-lap browser races against frozen seed 1/2 races.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const attemptStats=d=>{
 const events=d.real20ms?.attackLedger?.events||[];
 const ended=new Map();let quickRetries=0;
 for(const e of events){
  const key=String(e.driver)+'|'+String(e.target);
  if(e.type==='START'){
   if(ended.has(key)&&e.ms-ended.get(key)>=0&&e.ms-ended.get(key)<=1000)quickRetries++;
  }else if(['DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED','SUCCESS'].includes(e.type)){
   ended.set(key,e.ms);
  }
 }
 return {starts:events.filter(e=>e.type==='START').length,
  disengaged:events.filter(e=>e.type==='DISENGAGED_UNCONFIRMED').length,
  targetChanged:events.filter(e=>e.type==='TARGET_CHANGED').length,quickRetries};
};
const rows=[];
for(const seed of [1,2]){
 const before=load('artifacts/r5-b177-baseline/seed'+seed+'-observed10.json');
 const after=load('artifacts/r5-b177-current/seed'+seed+'-observed10.json');
 for(const d of [before,after]){
  assert.equal(d.track,'majoku-ring-v1');assert.equal(d.mode,'NORMAL');assert.equal(d.laps,10);
 }
 assert.equal(after.status,'PASS','real browser must pass');
 assert.equal(after.state,'FINISHING','ten laps must finish');
 assert.equal(after.physics?.collisionStops,0,'collision stops forbidden');
 assert.equal(after.rejectedStep,null,'rejected swept-physics step forbidden');
 assert.equal(after.pageErrors?.length,0,'browser JS runtime errors forbidden');
 assert.equal(after.continuityErrors?.length,0,'physical position continuity forbidden');
 assert.equal(after.pitPlanViolations?.length,0,'autonomous pit-plan violations forbidden');
 assert.equal(after.finishedRows?.length,12,'all twelve cars must finish');
 const metrics=d=>({passes:d.physics?.passes,leaderChanges:d.acceptedCompetition?.leaderChanges,
  rankReorders:d.acceptedCompetition?.rankReorders,collisionStops:d.physics?.collisionStops,...attemptStats(d)});
 const b=metrics(before),a=metrics(after);
 rows.push({seed,baseline:b,modified:a,delta:Object.fromEntries(Object.keys(a).map(k=>[k,a[k]-b[k]]))});
}
fs.mkdirSync('artifacts/r5-b177-current',{recursive:true});
fs.writeFileSync('artifacts/r5-b177-current/comparison.json',JSON.stringify({phase:'R5-b177',basis:'two matched genuine Chromium 12-car ten-lap races, seeds 1 and 2',rows,improvementNotAssumed:true},null,2));
process.stdout.write(JSON.stringify(rows,null,2)+'\\n');
