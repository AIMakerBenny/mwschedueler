// R5-b177: deterministic tests of the actual live unified AI lane chooser.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const start=source.indexOf('function unifiedChooseLaneV11(row,rows,now,width){');
const sentinel=source.indexOf('// Target-aware diagnostics only.',start);
const stop=source.lastIndexOf('}',sentinel);
assert.ok(start>=0&&sentinel>start&&stop>start,'live unifiedChooseLaneV11 source must exist');
const chooser=source.slice(start,stop+1);
function evaluate({blocked=false,pit=false,lost=false,nearestChanged=false,exitDuel=false,sideBySide=false,now=1,followerSpeed=30,opponentSpeed=28,specialPower=0,opponentGap=42,lateralY=-2}={}){
 const v={id:'me',pitRequested:pit,pitState:'TRACK',racingLineMode:'IDEAL',
  unifiedAiStateV11:sideBySide?'SIDE_BY_SIDE':exitDuel?'EXIT_DUEL':'PLAN_ATTACK',unifiedAiTargetV11:'ahead',
  unifiedIntentUntilV11:4,unifiedLaneTargetV11:2};
 const me={id:'me',ref:v,pit:'TRACK',v:followerSpeed,y:lateralY};
 const target={id:'ahead',ref:{},pit:lost?'PIT_LANE':'TRACK',finished:false,v:opponentSpeed,y:0};
 const rows=nearestChanged?[me,{id:'new',pit:'TRACK',finished:false,v:28,y:0},target]:[me,target];
 let scans=0;
 const ctx={UNIFIED_ENGINE_V11:{physicalWidth:2,physicalLength:5.2,clearance:.30},
  unifiedClampV11:(x,a,b)=>Math.min(b,Math.max(a,x)),
  unifiedIdealLaneV11:()=>0,unifiedPitAvoidanceV12:()=>null,
  unifiedGapV11:(a,b)=>b.id==='new'?18:b.id==='ahead'?opponentGap:0,
  unifiedMergeTargetV11:(row,y)=>blocked&&y===2?{target:row.y,blocked:['obstacle']}:{target:y,blocked:[]},
  unifiedAttackCorridorV12:()=>{scans++;return {target:-3,candidates:4,blocked:[]}},
  unifiedRatingV11:()=>0,unifiedSkillPowerV11:()=>specialPower,unifiedLateralClearanceV11:()=>2.5,
  lineOffsetMetersV197:()=>0,unifiedPitLaneIntentV12:()=>3,
  unifiedPitMergeTargetV12:(row,y)=>({target:y,blocked:[]})};
 vm.runInNewContext(chooser,ctx);
 const lane=ctx.unifiedChooseLaneV11(me,rows,now,12);
 return {lane,state:v.unifiedAiStateV11,target:v.unifiedAiTargetV11,scans};
}
test('unblocked held attack remains unchanged',()=>{
 const x=evaluate();assert.equal(x.lane,2);assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,0);
});
test('blocked held attack immediately finds a new safe corridor',()=>{
 const x=evaluate({blocked:true});assert.equal(x.lane,-3);assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.target,'ahead');assert.equal(x.scans,1);
});
test('a pit request cancels held attack intent',()=>{
 const x=evaluate({pit:true});assert.equal(x.state,'PIT');assert.equal(x.lane,3);
});
test('pit-lane opponent is not held as an active attack',()=>{
 const x=evaluate({lost:true});assert.equal(x.state,'CRUISE');assert.equal(x.scans,0);
});
test('new immediate opponent replaces stale held target',()=>{
 const x=evaluate({nearestChanged:true});assert.equal(x.target,'new');assert.equal(x.scans,1);
});

test('R5-b178 rejected duel does not immediately retry same opponent inside existing intent window',()=>{
 const x=evaluate({exitDuel:true});assert.equal(x.state,'EXIT_DUEL');assert.equal(x.lane,2);assert.equal(x.scans,0);
});
test('R5-b178 expired duel retries and pit/target changes bypass stale hold',()=>{
 const expired=evaluate({exitDuel:true,now:5}),pit=evaluate({exitDuel:true,pit:true}),changed=evaluate({exitDuel:true,nearestChanged:true});
 assert.equal(expired.state,'PLAN_ATTACK');assert.equal(expired.scans,1);
 assert.equal(pit.state,'PIT');assert.equal(changed.target,'new');assert.equal(changed.scans,1);
});

test('R5-b179 slower fresh follower does not launch a speculative attack',()=>{
 const x=evaluate({now:5,followerSpeed:27.8,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.scans,0);
});
test('R5-b179 positive closing and active special can each initiate a new attack',()=>{
 const closing=evaluate({now:5,followerSpeed:28.5,opponentSpeed:28});
 const special=evaluate({now:5,followerSpeed:27.8,opponentSpeed:28,specialPower:300000});
 assert.equal(closing.state,'PLAN_ATTACK');assert.equal(closing.scans,1);
 assert.equal(special.state,'PLAN_ATTACK');assert.equal(special.scans,1);
});

// R5-b180: exercise the real candidate scorer, not a simulated second engine.
const corridorStart=source.indexOf('function unifiedAttackCorridorV12(');
const corridorSentinel=source.indexOf('// R5-b26:',corridorStart);
const corridorEnd=source.lastIndexOf('}',corridorSentinel);
assert.ok(corridorStart>=0&&corridorEnd>corridorStart);
const corridorSource=source.slice(corridorStart,corridorEnd+1);
function corridorChoice(preferredLane=null){
 const me={id:'me',ref:{},pit:'TRACK',y:0,v:30},ahead={id:'ahead',ref:{},pit:'TRACK',y:0,v:28,finished:false};
 const ctx={UNIFIED_ENGINE_V11:{physicalLength:5.2,physicalWidth:2},
  unifiedClampV11:(v,a,b)=>Math.max(a,Math.min(v,b)),
  unifiedIdealLaneV11:()=>0,unifiedLateralClearanceV11:()=>2,
  unifiedMergeTargetV11:(row,target)=>({target,blocked:[]}),
  unifiedGapV11:()=>35};
 vm.runInNewContext(corridorSource,ctx);
 return ctx.unifiedAttackCorridorV12(me,ahead,[me,ahead],12,preferredLane);
}
test('R5-b180 favors an already committed safe attack side rather than flapping',()=>{
 const defaultSide=corridorChoice(),heldSide=corridorChoice(-3);
 // Current physically safe default is outside right; a previously committed
 // left-side attack should select a safe left lane, not flip to that default.
 assert.ok(defaultSide.target>0);assert.ok(heldSide.target<0);
 assert.ok(heldSide.candidates>0);assert.equal(heldSide.reason,'CLEAR');
});

test('R5-b181 a physically separate side-by-side car keeps its current opponent through crossing',()=>{
 const x=evaluate({sideBySide:true,nearestChanged:true,opponentGap:-2,lateralY:-3});
 assert.equal(x.target,'ahead');assert.equal(x.state,'SIDE_BY_SIDE');assert.equal(x.scans,0);
});
test('R5-b181 does not keep an unsafe, unseparated or pit-bound crossing',()=>{
 const unseparated=evaluate({sideBySide:true,nearestChanged:true,opponentGap:-2});
 const blocked=evaluate({sideBySide:true,nearestChanged:true,opponentGap:-2,lateralY:-3,blocked:true});
 const pit=evaluate({sideBySide:true,nearestChanged:true,opponentGap:-2,lateralY:-3,pit:true});
 assert.equal(unseparated.target,'new');assert.equal(unseparated.scans,1);
 assert.equal(blocked.target,'new');assert.equal(blocked.scans,1);
 assert.equal(pit.state,'PIT');
});
