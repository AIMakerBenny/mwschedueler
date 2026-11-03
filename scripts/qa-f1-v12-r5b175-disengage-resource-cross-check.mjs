import assert from 'node:assert/strict';
import fs from 'node:fs';
// R5-b175 - co-observed exact resource disadvantages by genuine outcome.
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const replay=read('replay.json'),a=read('b173-disengage-resource-deltas.json'),
 b=read('b174-resource-relative-at-minus20.json');
for(const x of [replay,a,b])assert.equal(x.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
const kinds=['DISENGAGED_UNCONFIRMED','TARGET_CHANGED','SUCCESS','PIT_INTERRUPTED'];
const labels=['BOTH_DISADVANTAGES','ONLY_LOW_ENERGY','ONLY_WORN_TYRES','NEITHER','UNKNOWN'];
const num=x=>typeof x==='number'&&Number.isFinite(x);
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');
 assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.physics.collisionStops,0);
 const aa=a.cases.find(x=>x.seed===seed),bb=b.cases.find(x=>x.seed===seed);
 assert(aa&&bb);
 const byId=new Map(aa.rows.map(x=>[x.attemptId,x]));
 const grouped=Object.fromEntries(kinds.map(k=>[k,{
  attempts:0,byResourceClass:Object.fromEntries(labels.map(v=>[v,{
   attempts:0,negativeClosing:0,positiveClosing:0,gapExpanded:0,
   gapShrank:0,closingSpeedFell:0,energyOutputFell:0
  }]))}]));
 const rows=[];
 for(const r of bb.rows){
  const prev=byId.get(r.attemptId);assert(prev);
  assert.equal(prev.type,r.terminalReason);
  const group=grouped[r.terminalReason];assert(group);group.attempts++;
  const energy=r.driverMinusTargetActualEnergyOutputKW;
  const tyre=r.driverMinusTargetTyreWearFraction;
  const speed=r.closingSpeedMps;
  const known=num(energy)&&num(tyre)&&num(speed)&&prev.availableExactPre200AndPre20;
  const label=!known?'UNKNOWN':energy<0&&tyre>0?'BOTH_DISADVANTAGES':
   energy<0?'ONLY_LOW_ENERGY':tyre>0?'ONLY_WORN_TYRES':'NEITHER';
  const cell=group.byResourceClass[label];cell.attempts++;
  cell.negativeClosing+=Number(num(speed)&&speed<=0);
  cell.positiveClosing+=Number(num(speed)&&speed>0);
  const d=prev.knownDeltas;
  cell.gapExpanded+=Number(num(d?.signedTrackProgressGapMeters)&&
   d.signedTrackProgressGapMeters>1e-7);
  cell.gapShrank+=Number(num(d?.signedTrackProgressGapMeters)&&
   d.signedTrackProgressGapMeters< -1e-7);
  cell.closingSpeedFell+=Number(num(d?.relativeClosingSpeedMps)&&
   d.relativeClosingSpeedMps< -1e-8);
  cell.energyOutputFell+=Number(num(d?.driverEnergyDeployKW)&&
   d.driverEnergyDeployKW< -1e-8);
  rows.push({attemptId:r.attemptId,reason:r.terminalReason,class:label,
   closingSpeedMps:speed,safePassingLaneEstablished:false});
 }
 assert.equal(rows.length,aa.rapidSameTargetRetryStarts);
 assert.equal(rows.length,bb.rapidStarts);
 for(const [kind,g]of Object.entries(grouped)){
  assert.equal(g.attempts,aa.byEndReason[kind].attempts);
  assert.equal(g.attempts,bb.byOutcome[kind].attempts);
  assert.equal(Object.values(g.byResourceClass).reduce((n,x)=>n+x.attempts,0),g.attempts);
  for(const x of Object.values(g.byResourceClass)){
   assert(x.negativeClosing+x.positiveClosing<=x.attempts);
   assert(x.gapExpanded+x.gapShrank<=x.attempts);
  }
 }
 cases.push({seed,quickRetries:rows.length,byOriginalOutcome:grouped,
  rows,collisionStops:0,physicsPasses:race.physics.passes});
 console.log(JSON.stringify({phase:'R5-b175',status:'CASE_PASS',seed,
  disengage:grouped.DISENGAGED_UNCONFIRMED.attempts,
  unknown:grouped.DISENGAGED_UNCONFIRMED.byResourceClass.UNKNOWN.attempts,
  neither:grouped.DISENGAGED_UNCONFIRMED.byResourceClass.NEITHER.attempts}));
}
const result={phase:'R5-b175',status:'PASS',track:'majoku-ring-v1',
 sourceRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 readOnly:true,physicsModified:false,causalityProven:false,
 collisionClearanceProven:false,cases};
fs.writeFileSync(dir+'b175-disengage-resource-cross-check.json',JSON.stringify(result,null,2));
