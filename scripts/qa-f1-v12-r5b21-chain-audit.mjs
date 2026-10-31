// R5-b21 - independent read-only audit of accepted Blue Coast slowdown evidence.
// Consumes the completed R5-b9 paired race artifact. Does not run or alter physics.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const seed=Number(process.env.MWS_R5B9_SEED||1);
assert([1,2].includes(seed),'R5-b21 seed must be 1 or 2');
const file='artifacts/f1-v12-r5b9-blue-coast-seed'+seed+'.json';
const data=JSON.parse(fs.readFileSync(file,'utf8'));
assert.equal(data.status,'PASS','R5-b21 needs a completed PASS race, not partial evidence');
assert.equal(data.seed,seed);
const target='r5b3-driver-3';
const accepted=data.baseline?.acceptedCauses;
const snapshots=data.baseline?.peerChainFrames;
const summary=data.rootCauseTelemetry;
const chains=data.rootChains;
const peer=data.peerChain;
assert(Array.isArray(accepted)&&accepted.length>20,'Missing accepted 20ms commands');
assert(Array.isArray(snapshots)&&snapshots.length>20,'Missing 100ms multi-vehicle snapshots');
assert(summary&&chains&&peer,'Missing stage R5-b18/R5-b19 summaries');

const near=(a,b,epsilon=.0000001)=>{
 assert(Number.isFinite(a)&&Number.isFinite(b),'Missing numeric comparison');
 assert(Math.abs(a-b)<=epsilon,'Mismatch: '+a+' versus '+b);
};
const isSlow=x=>x.pit==='TRACK'&&x.speedKph<95;
const slowAccepted=accepted.filter(isSlow);
const constrained=slowAccepted.filter(x=>x.reason==='PREDICTED_TRAFFIC'&&x.limiter);
near(summary.slowTrackSeconds,slowAccepted.length*.02);
near(summary.predictedTrafficLimitedSlowSeconds,constrained.length*.02);
near(summary.lowTargetSlowSeconds,slowAccepted.filter(x=>x.targetKph<95).length*.02);
assert.equal(summary.acceptedSteps,accepted.length);
const peerCount=new Map();
for(const x of constrained){
 assert(Number.isFinite(x.limiter.gapMeters)&&
        Number.isFinite(x.limiter.beforeLimitKph)&&
        Number.isFinite(x.limiter.afterLimitKph),
        'Malformed physically binding peer');
 assert(x.limiter.afterLimitKph<=x.limiter.beforeLimitKph+1e-6,
        'A reported traffic speed cap must not accelerate a vehicle');
 const name=x.limiter.peer+' ['+x.limiter.peerState+']';
 peerCount.set(name,(peerCount.get(name)||0)+1);
}
for(const item of summary.limitingPeers){
 assert.equal(peerCount.get(item.peer)||0,item.steps,
  'Limiting-peer accepted-step frequency disagreement: '+item.peer);
 near(item.seconds,item.steps*.02);
}
assert.equal([...peerCount.values()].reduce((a,b)=>a+b,0),constrained.length);

function follow(frame){
 const byId=new Map(frame.cars.map(x=>[x.id,x])),visited=new Set();
 let id=target,terminal='UNKNOWN',depth=0;
 for(let i=0;i<=frame.cars.length;i++){
  const car=byId.get(id);
  if(!car){terminal='MISSING_PEER';break;}
  if(visited.has(id)){terminal='CYCLE';break;}
  visited.add(id);depth++;
  if(car.reason!=='PREDICTED_TRAFFIC'||!car.limiter?.peer){
   terminal=car.pit!=='TRACK'?'PIT_STATE':
    car.targetKph<95?'LOW_SPEED_TARGET':'FREE_OR_NO_TRAFFIC_LIMIT';
   break;
  }
  id=car.limiter.peer;
 }
 assert(depth>=1&&depth<=frame.cars.length,'Impossible dependency depth');
 return {terminal,depth};
}
const lowFrames=snapshots.filter(f=>isSlow(f.cars.find(c=>c.id===target)||{}));
const terminalTotals=new Map(),depthTotals=new Map();
for(const frame of lowFrames){
 const q=follow(frame);
 terminalTotals.set(q.terminal,(terminalTotals.get(q.terminal)||0)+1);
 depthTotals.set(q.depth,(depthTotals.get(q.depth)||0)+1);
}
assert.equal(chains.slowAcceptedSnapshots,lowFrames.length);
for(const row of chains.terminalDistribution)
 assert.equal(row.frames,terminalTotals.get(row.terminal)||0,'Terminal classification mismatch');
for(const row of chains.chainDepthDistribution)
 assert.equal(row.frames,depthTotals.get(row.depth)||0,'Dependency-depth mismatch');
assert.equal([...terminalTotals.values()].reduce((a,b)=>a+b,0),lowFrames.length);
assert.equal([...depthTotals.values()].reduce((a,b)=>a+b,0),lowFrames.length);

// Different sample resolutions must NOT be forced to report the same peer
// at the nearest timestamp. Report the offset and actual peer instead.
const stopAt=summary.slowestAccepted?.t;
let atStop=null;
if(Number.isFinite(stopAt)&&lowFrames.length)
 atStop=lowFrames.reduce((a,f)=>!a||Math.abs(f.t-stopAt)<Math.abs(a.t-stopAt)?f:a,null);
const sampledPeer=atStop?.cars.find(c=>c.id===target)?.limiter?.peer||null;
const delta=atStop?Math.abs(atStop.t-stopAt):null;
if(atStop){
 assert(delta<=.12,'Nearest 100ms frame too far from 20ms stop');
 near(delta,chains.nearStopSampleDeltaSeconds,1e-5);
 assert.equal(sampledPeer,chains.observedPrimaryPeerAtStop);
}
if(seed===2){
 assert(slowAccepted.length>0&&constrained.length>0,
  'Reference Blue Coast seed 2 no longer contains measurable slowdown');
 assert(summary.limitingPeers.some(p=>p.peer==='r5b3-driver-10 [TRACK]'),
  'Prior Driver 10 main-track binding is missing - compare race before changing reference');
}
const audit={phase:'R5-b21',seed,status:'PASS',matchedSampling:{
 twentyMsSteps:accepted.length,hundredMsFrames:snapshots.length,
 nearestStopSampleDeltaSeconds:delta,nearestStopPeer:sampledPeer},
 slowdown:{slowSeconds:summary.slowTrackSeconds,trafficLimitedSeconds:summary.predictedTrafficLimitedSlowSeconds,
 topLimitingPeers:summary.limitingPeers.slice(0,4)},
 chains:{slowSnapshots:chains.slowAcceptedSnapshots,terminalDistribution:chains.terminalDistribution,
 depthDistribution:chains.chainDepthDistribution},
 caveat:'Observational trace consistency only. No claim of counterfactual causation or successful physical balance fix.'};
fs.writeFileSync('artifacts/f1-v12-r5b21-chain-audit-seed'+seed+'.json',JSON.stringify(audit,null,2));
console.log(JSON.stringify(audit));
