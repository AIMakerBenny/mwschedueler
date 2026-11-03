// R5-b177: deterministic tests of the actual live unified AI lane chooser.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const match=source.match(/function unifiedChooseLaneV11\\(row,rows,now,width\\)\\{[\\s\\S]*?\\n\\}\\n(?=\\/\\/ Target-aware diagnostics)/);
assert.ok(match,'live unifiedChooseLaneV11 source must exist');
function evaluate({blocked=false,pit=false,lost=false,nearestChanged=false}={}){
 const v={id:'me',pitRequested:pit,pitState:'TRACK',racingLineMode:'IDEAL',
  unifiedAiStateV11:'PLAN_ATTACK',unifiedAiTargetV11:'ahead',
  unifiedIntentUntilV11:4,unifiedLaneTargetV11:2};
 const me={id:'me',ref:v,pit:'TRACK',v:30,y:-2};
 const target={id:'ahead',ref:{},pit:lost?'PIT_LANE':'TRACK',finished:false,v:28,y:0};
 const rows=nearestChanged?[me,{id:'new',pit:'TRACK',finished:false,v:28,y:0},target]:[me,target];
 let scans=0;
 const ctx={UNIFIED_ENGINE_V11:{physicalWidth:2},
  unifiedClampV11:(x,a,b)=>Math.min(b,Math.max(a,x)),
  unifiedIdealLaneV11:()=>0,unifiedPitAvoidanceV12:()=>null,
  unifiedGapV11:(a,b)=>b.id==='new'?18:b.id==='ahead'?42:0,
  unifiedMergeTargetV11:(row,y)=>blocked&&y===2?{target:row.y,blocked:['obstacle']}:{target:y,blocked:[]},
  unifiedAttackCorridorV12:()=>{scans++;return {target:-3,candidates:4,blocked:[]}},
  unifiedRatingV11:()=>0,unifiedSkillPowerV11:()=>0,unifiedLateralClearanceV11:()=>2.5,
  lineOffsetMetersV197:()=>0,unifiedPitLaneIntentV12:()=>3,
  unifiedPitMergeTargetV12:(row,y)=>({target:y,blocked:[]})};
 vm.runInNewContext(match[0],ctx);
 const lane=ctx.unifiedChooseLaneV11(me,rows,1,12);
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
