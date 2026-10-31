// R5-b23: independent upstream slowdown provenance and onset audit.
// Operates on an authentic completed Blue Coast 10-lap race artifact.
// No changes to race physics, cars, rankings, or pit policy.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const seed=Number(process.env.MWS_R5B9_SEED||1);
assert([1,2].includes(seed),'Seed must be 1 or 2');
const input='artifacts/f1-v12-r5b9-blue-coast-seed'+seed+'.json';
const result=JSON.parse(fs.readFileSync(input,'utf8'));
assert.equal(result.status,'PASS','Completed Blue Coast paired race required');
assert.equal(result.seed,seed);
const frames=result.baseline?.peerChainFrames||[];
const peerChain=result.peerChain,rootChains=result.rootChains;
assert(frames.length>100&&peerChain&&rootChains,'Missing fresh R5-b22 accepted physical snapshots');
const target='r5b3-driver-3';
const primary=peerChain.principalPeerId;
const frequency=new Map(),sampledSlow=[],unattributed=[];
let firstPrimaryLow=null,firstTargetLow=null;
const isSlow=c=>c?.pit==='TRACK'&&Number(c.speedKph)<95;
const trace=frame=>{
 const byId=new Map(frame.cars.map(c=>[c.id,c])),visited=new Set(),nodes=[];
 let id=target,terminal='UNKNOWN';
 for(let i=0;i<=frame.cars.length;i++){
  const c=byId.get(id);
  if(!c){terminal='MISSING_PEER';break}
  if(visited.has(id)){terminal='CYCLE';break}
  visited.add(id);
  const next=c.reason==='PREDICTED_TRAFFIC'?c.limiter?.peer:null;
  nodes.push({id:c.id,speedKph:c.speedKph,targetKph:c.targetKph,
   pit:c.pit,reason:c.reason,limiter:next||null,wear:c.wear});
  if(!next){terminal=c.pit!=='TRACK'?'PIT_STATE':
   Number(c.targetKph)<95?'LOW_SPEED_TARGET':
   c.reason==='PREDICTED_TRAFFIC'?'UNATTRIBUTED':'FREE_OR_NO_TRAFFIC_LIMIT';break}
  id=next;
 }
 return {t:frame.t,terminal,depth:nodes.length,nodes};
};
for(const frame of frames){
 assert(Array.isArray(frame.cars)&&frame.cars.length===12,'Race should have 12 driver snapshots');
 const cars=new Map(frame.cars.map(c=>[c.id,c]));
 const current=cars.get(target),peer=primary?cars.get(primary):null;
 assert(current,'Target vehicle missing from accepted simulation');
 if(primary)assert(peer,'Primary peer missing from accepted simulation');
 if(!firstPrimaryLow&&isSlow(peer))firstPrimaryLow={t:frame.t,car:peer};
 if(!firstTargetLow&&isSlow(current))firstTargetLow={t:frame.t,car:current};
 for(const car of frame.cars){
  if(car.reason==='PREDICTED_TRAFFIC'&&!car.limiter?.peer)
   unattributed.push({t:frame.t,id:car.id,speedKph:car.speedKph});
  if(car.limiter?.peer&&car.reason==='PREDICTED_TRAFFIC'){
   const id=car.id+' -> '+car.limiter.peer+' ['+car.limiter.peerState+']';
   frequency.set(id,(frequency.get(id)||0)+1);
  }
 }
 if(isSlow(current))sampledSlow.push(trace(frame));
}
assert.equal(unattributed.length,0,
 'R5-b23 every constrained accepted driver must preserve the actual limiting peer');
assert.equal(sampledSlow.length,rootChains.slowAcceptedSnapshots,
 'R5-b23 audited slow frame count must equal race summary');
const terminalCounts=new Map();
const depthCounts=new Map();
for(const item of sampledSlow){
 terminalCounts.set(item.terminal,(terminalCounts.get(item.terminal)||0)+1);
 depthCounts.set(item.depth,(depthCounts.get(item.depth)||0)+1);
}
for(const term of rootChains.terminalDistribution)
 assert.equal(term.frames,terminalCounts.get(term.terminal)||0,
 'Upstream terminal mismatch: '+term.terminal);
for(const depth of rootChains.chainDepthDistribution)
 assert.equal(depth.frames,depthCounts.get(depth.depth)||0,
 'Upstream dependency depth mismatch: '+depth.depth);
assert.equal([...terminalCounts.values()].reduce((a,b)=>a+b,0),sampledSlow.length);
const primaryRows=primary?frames.map(f=>({t:f.t,car:f.cars.find(x=>x.id===primary)})):[],slowPrimary=primaryRows.filter(x=>isSlow(x.car));
const limitedPrimary=slowPrimary.filter(x=>x.car.reason==='PREDICTED_TRAFFIC');
if(seed===2){
 // R5-b27: a valid improvement can eliminate the earlier Driver 10 chain.
 if(firstPrimaryLow&&firstTargetLow)assert(
  Number.isFinite(firstTargetLow.t-firstPrimaryLow.t),
  'Missing physical onset timing');
 if(limitedPrimary.length)assert(limitedPrimary.every(x=>x.car.limiter?.peer),
  'R5-b22 upstream limiter capture incomplete');
 if(sampledSlow.length)assert(firstTargetLow,
  'Observed low target speed without a sampled onset');
}
const topEdges=[...frequency].sort((a,b)=>b[1]-a[1]).slice(0,16)
 .map(([edge,count])=>({edge,count,seconds:count*.1}));
const out={
 phase:'R5-b23',seed,status:'PASS',capture:{frames:frames.length,vehiclesPerFrame:12,
  unattributedCount:unattributed.length},
 onset:{primary,primaryLowAt:firstPrimaryLow?.t??null,targetLowAt:firstTargetLow?.t??null,
  primaryLeadSeconds:firstPrimaryLow&&firstTargetLow?
   firstTargetLow.t-firstPrimaryLow.t:null},
 primaryDuringSlow:{frames:slowPrimary.length,
  limitedFrames:limitedPrimary.length,
  firstLimited:limitedPrimary[0]||null,
  firstStopped:slowPrimary.find(x=>x.car.speedKph<5)||null},
 chains:{slowTargetFrames:sampledSlow.length,
  terminals:[...terminalCounts].sort((a,b)=>b[1]-a[1]).map(([kind,frames])=>({kind,frames})),
  depths:[...depthCounts].sort((a,b)=>a[0]-b[0]).map(([depth,frames])=>({depth,frames})),
  deepest:sampledSlow.reduce((best,x)=>!best||x.depth>best.depth?x:best,null),
  first:sampledSlow[0]||null},
 topEdges,
 caveat:'The constrained peer reported by the accepted solver is an observed dependency. This audit does not prove the root cause without an independently matched counterfactual.'
};
const path='artifacts/f1-v12-r5b23-upstream-provenance-seed'+seed+'.json';
fs.writeFileSync(path,JSON.stringify(out,null,2));
console.log(JSON.stringify({phase:out.phase,seed:out.seed,status:out.status,
 onset:out.onset,primaryDuringSlow:{frames:out.primaryDuringSlow.frames,
 limitedFrames:out.primaryDuringSlow.limitedFrames,
 firstLimited:out.primaryDuringSlow.firstLimited},
 chains:{slowTargetFrames:out.chains.slowTargetFrames,terminals:out.chains.terminals,
 depths:out.chains.depths,deepest:out.chains.deepest},
 topEdges:out.topEdges.slice(0,8),artifact:path}));
