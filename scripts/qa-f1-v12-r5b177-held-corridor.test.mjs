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
function evaluate({blocked=false,pit=false,lost=false,nearestChanged=false,exitDuel=false,sideBySide=false,now=1,followerSpeed=30,opponentSpeed=28,specialPower=0,opponentGap=42,lateralY=-2,laneTarget=2,pitBoundTarget=false,oldBlockerGone=false,oldBlockerPresent=false,noSafeCorridor=false,narrowCorridor=false,namedBlockedCorridor=false,priorExitGap=null,newOpponentGap=18,blockPlannerTarget=false,priorRejectedLane=null,obstacleLateral=0,obstaclePit='PIT_LANE',obstacleGap=4}={}){
 const v={id:'me',pitRequested:pit,pitState:'TRACK',racingLineMode:'IDEAL',
  unifiedAiStateV11:sideBySide?'SIDE_BY_SIDE':exitDuel?'EXIT_DUEL':'PLAN_ATTACK',unifiedAiTargetV11:'ahead',
  unifiedIntentUntilV11:4,unifiedLaneTargetV11:laneTarget,
  unifiedRejectedGapV12:priorExitGap,unifiedRejectedAttackLaneV12:priorRejectedLane,
  unifiedMergeBlockedV11:oldBlockerGone?['gone']:oldBlockerPresent?['obstacle']:[]};
 const me={id:'me',ref:v,pit:'TRACK',v:followerSpeed,y:lateralY};
 const target={id:'ahead',ref:{pitRequested:pitBoundTarget},pit:lost?'PIT_LANE':'TRACK',finished:false,v:opponentSpeed,y:0};
 const rows=nearestChanged?[me,{id:'new',pit:'TRACK',finished:false,v:28,y:0},target]:[me,target];
 if(oldBlockerPresent)rows.push({id:'obstacle',ref:{pitRequested:false},pit:obstaclePit,finished:false,v:15,y:obstacleLateral});
 let scans=0,preferredLaneSeen=null;
 const ctx={UNIFIED_ENGINE_V11:{physicalWidth:2,physicalLength:5.2,clearance:.30},
  unifiedClampV11:(x,a,b)=>Math.min(b,Math.max(a,x)),
  unifiedIdealLaneV11:()=>0,unifiedPitAvoidanceV12:()=>null,
  unifiedGapV11:(a,b)=>b.id==='new'?newOpponentGap:b.id==='ahead'?opponentGap:b.id==='obstacle'?obstacleGap:0,
  unifiedMergeTargetV11:(row,y)=>(blocked&&y===2||blockPlannerTarget&&y===-3)?
   {target:row.y,blocked:['obstacle']}:{target:y,blocked:[]},
  unifiedAttackCorridorV12:(row,peer,grid,width,preferredLane)=>{
   scans++;preferredLaneSeen=preferredLane;
   return narrowCorridor?{target:null,candidates:0,blocked:[],reason:'NARROW_TRACK'}:
    namedBlockedCorridor?{target:null,candidates:4,blocked:['obstacle'],reason:'BLOCKED'}:
    noSafeCorridor?{target:null,candidates:4,blocked:[],reason:'BLOCKED'}:
    {target:-3,candidates:4,blocked:[],reason:'CLEAR'};
  }, 
  unifiedRatingV11:()=>0,unifiedSkillPowerV11:()=>specialPower,unifiedLateralClearanceV11:()=>2.5,
  lineOffsetMetersV197:()=>0,unifiedPitLaneIntentV12:()=>3,
  unifiedPitMergeTargetV12:(row,y)=>({target:y,blocked:[]})};
 vm.runInNewContext(chooser,ctx);
 const lane=ctx.unifiedChooseLaneV11(me,rows,now,12);
 return {lane,state:v.unifiedAiStateV11,target:v.unifiedAiTargetV11,scans,preferredLane:preferredLaneSeen,blockedIDs:[...v.unifiedMergeBlockedV11],rejectedLane:v.unifiedRejectedAttackLaneV12};
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
function corridorChoice(preferredLane=null,gap=35,rowY=0,rivalSpeed=28){
 const me={id:'me',ref:{},pit:'TRACK',y:rowY,v:30},ahead={id:'ahead',ref:{},pit:'TRACK',y:0,v:rivalSpeed,finished:false};
 const ctx={UNIFIED_ENGINE_V11:{physicalLength:5.2,physicalWidth:2},
  unifiedClampV11:(v,a,b)=>Math.max(a,Math.min(v,b)),
  unifiedIdealLaneV11:()=>0,unifiedLateralClearanceV11:()=>2,
  unifiedMergeTargetV11:(row,target)=>({target,blocked:[]}),
  unifiedGapV11:()=>gap};
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

test('R5-b182 rejected duel retains a legitimate center-line target of exactly zero',()=>{
 const x=evaluate({exitDuel:true,laneTarget:0,lateralY:-2});
 assert.equal(x.lane,0);assert.equal(x.state,'EXIT_DUEL');assert.equal(x.scans,0);
});
test('R5-b182 rejected duel with unset target safely stays on its actual lane',()=>{
 const x=evaluate({exitDuel:true,laneTarget:null,lateralY:-2});
 assert.equal(x.lane,-2);assert.equal(x.state,'EXIT_DUEL');assert.equal(x.scans,0);
});

test('R5-b183 lateral separation at 15m remains a planned attack, not side by side',()=>{
 const x=evaluate({now:5,opponentGap:15,lateralY:-3});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.target,'ahead');
});
test('R5-b183 true physical adjacency still permits side-by-side racing',()=>{
 const x=evaluate({now:5,opponentGap:7,lateralY:-3});
 assert.equal(x.state,'SIDE_BY_SIDE');assert.equal(x.target,'ahead');
});

test('R5-b184 slow approach at a distant target remains FOLLOW rather than speculative PLAN_ATTACK',()=>{
 const x=evaluate({now:5,opponentGap:100,followerSpeed:30.5,opponentSpeed:30});
 assert.equal(x.state,'FOLLOW');assert.equal(x.scans,0);
});
test('R5-b184 real distant closure, existing near duel, and special each remain eligible',()=>{
 const closing=evaluate({now:5,opponentGap:100,followerSpeed:35,opponentSpeed:30});
 const near=evaluate({now:5,opponentGap:42,followerSpeed:30,opponentSpeed:28});
 const special=evaluate({now:5,opponentGap:100,followerSpeed:29,opponentSpeed:30,specialPower:300000});
 for(const x of [closing,near,special]){assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);}
});

test('R5-b185 pending pit entry is never retained as an on-track attack opponent',()=>{
 const x=evaluate({pitBoundTarget:true});
 assert.equal(x.target,'');assert.equal(x.state,'CRUISE');assert.equal(x.scans,0);
});
test('R5-b185 nearest actual racing car can be targeted when old opponent enters pit',()=>{
 const x=evaluate({pitBoundTarget:true,nearestChanged:true});
 assert.equal(x.target,'new');assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);
});

test('R5-b186 stale planned pass exits to FOLLOW when opponent moves faster',()=>{
 const x=evaluate({followerSpeed:27,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.scans,0);
});
test('R5-b186 still-valid closure or active special keeps the existing safe held lane',()=>{
 const ordinary=evaluate({followerSpeed:30,opponentSpeed:28});
 const special=evaluate({followerSpeed:27,opponentSpeed:28,specialPower:300000});
 for(const x of [ordinary,special]){assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.lane,2);assert.equal(x.scans,0);}
});

test('R5-b187 stale side-by-side label at long gap resumes ordinary planning',()=>{
 const x=evaluate({sideBySide:true,opponentGap:42,lateralY:-3});
 assert.equal(x.target,'ahead');assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);
});
test('R5-b187 actual side-by-side adjacency retains the physically protected lane',()=>{
 const x=evaluate({sideBySide:true,opponentGap:7,lateralY:-3});
 assert.equal(x.state,'SIDE_BY_SIDE');assert.equal(x.lane,2);assert.equal(x.scans,0);
});

test('R5-b188 null or unset prior lane never turns into a fabricated center preference',()=>{
 const unset=evaluate({now:5,laneTarget:null});
 assert.equal(unset.state,'PLAN_ATTACK');assert.equal(unset.preferredLane,null);
});
test('R5-b188 a genuine finite prior attack lane is still preferred',()=>{
 const existing=evaluate({now:5,laneTarget:-3});
 assert.equal(existing.state,'PLAN_ATTACK');assert.equal(existing.preferredLane,-3);
});

test('R5-b189 physically impossible final-second merge is rejected before planning',()=>{
 const late=corridorChoice(null,10,0,29);
 assert.equal(late.target,null);assert.equal(late.reason,'BLOCKED');
});
test('R5-b189 already separated car retains a feasible short safe lane adjustment',()=>{
 const ready=corridorChoice(null,10,-2.5,29);
 assert.ok(ready.target!==null);assert.ok(ready.target<0);assert.equal(ready.reason,'CLEAR');
});

test('R5-b190 superseded by R5-b194: 42m tiny closing no longer sustains a 420s attack',()=>{
 const x=evaluate({now:5,opponentGap:42,followerSpeed:28.1,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.scans,0);
});
test('R5-b190 do not prolong a futile distant pursuit or large speed deficit',()=>{
 const far=evaluate({now:5,opponentGap:100,followerSpeed:28.1,opponentSpeed:28});
 const slow=evaluate({now:5,opponentGap:42,followerSpeed:27.5,opponentSpeed:28});
 for(const x of [far,slow]){assert.equal(x.state,'FOLLOW');assert.equal(x.scans,0);}
});

test('R5-b191 held plan with missing target defaults to actual chassis lane',()=>{
 const x=evaluate({laneTarget:null,lateralY:-2});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.lane,-2);assert.equal(x.scans,0);
});
test('R5-b191 valid held center-line target zero remains zero',()=>{
 const x=evaluate({laneTarget:0,lateralY:-2});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.lane,0);assert.equal(x.scans,0);
});

test('R5-b192 missing side-by-side hold target does not steer to artificial center',()=>{
 const x=evaluate({sideBySide:true,nearestChanged:true,opponentGap:-2,lateralY:-3,laneTarget:null});
 assert.equal(x.state,'SIDE_BY_SIDE');assert.equal(x.target,'ahead');assert.equal(x.lane,-3);assert.equal(x.scans,0);
});
test('R5-b192 explicitly selected center target still remains a valid crossing hold',()=>{
 const x=evaluate({sideBySide:true,nearestChanged:true,opponentGap:-2,lateralY:-3,laneTarget:0});
 assert.equal(x.state,'SIDE_BY_SIDE');assert.equal(x.target,'ahead');assert.equal(x.lane,0);assert.equal(x.scans,0);
});

test('R5-b194 42m and only 0.1m/s closing is not a sustainable attack',()=>{
 const x=evaluate({now:5,opponentGap:42,followerSpeed:28.1,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.scans,0);
});
test('R5-b194 within 9m immediate physical contest allows small-speed continuity at intent expiry',()=>{
 const x=evaluate({now:5,opponentGap:9,followerSpeed:27.95,opponentSpeed:28});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);
});

test('R5-b195 vanished collision blocker immediately releases stale EXIT_DUEL to fresh safe scan',()=>{
 const x=evaluate({exitDuel:true,oldBlockerGone:true});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);assert.equal(x.lane,-3);
});
test('R5-b195 still-physical blocker preserves existing EXIT_DUEL cooldown',()=>{
 const x=evaluate({exitDuel:true,oldBlockerPresent:true});
 assert.equal(x.state,'EXIT_DUEL');assert.equal(x.scans,0);assert.equal(x.lane,2);
});

test('R5-b196 after vanished blocker an EXIT_DUEL plan does not prefer its rejected old corridor',()=>{
 const x=evaluate({exitDuel:true,oldBlockerGone:true,laneTarget:-3});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);assert.equal(x.preferredLane,null);
});
test('R5-b196 unblocked ongoing PLAN_ATTACK still preserves valid same-opponent corridor',()=>{
 const x=evaluate({now:5,laneTarget:-3});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);assert.equal(x.preferredLane,-3);
});

test('R5-b198 existing laterally separate near pass survives small speed deficit',()=>{
 const x=evaluate({now:5,opponentGap:18,followerSpeed:27.8,opponentSpeed:28,lateralY:-3});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.target,'ahead');assert.equal(x.scans,1);
});
test('R5-b198 do not grant old attack hysteresis to new opponent after target switch',()=>{
 const blocked=evaluate({now:5,opponentGap:18,followerSpeed:27.8,opponentSpeed:28,lateralY:-1});
 const other=evaluate({now:5,nearestChanged:true,opponentGap:42,followerSpeed:27.8,opponentSpeed:28,lateralY:-3});
 assert.equal(blocked.state,'FOLLOW');assert.equal(blocked.scans,0);
 assert.equal(other.state,'FOLLOW');assert.equal(other.target,'new');assert.equal(other.scans,0);
});

test('R5-b206 near-contact 8m attack does not scan impossible lateral corridor',()=>{
 const x=evaluate({now:5,opponentGap:8,lateralY:-3,followerSpeed:28.5,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.scans,0);
});
test('R5-b202 still permits a separated prepared attack just past the physical preparation floor',()=>{
 const x=evaluate({now:5,opponentGap:9,lateralY:-3,followerSpeed:28.5,opponentSpeed:28});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);
});
test('R5-b206 unseparated near opponent follows without unsafe corridor attempts',()=>{
 const x=evaluate({now:5,opponentGap:8,lateralY:-1,followerSpeed:28.5,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.scans,0);
});

test('R5-b200 authored same-lane no-op attack triggers safe corridor replanning',()=>{
 const x=evaluate({now:1,opponentGap:42,lateralY:-1,laneTarget:-1,followerSpeed:30,opponentSpeed:28});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);assert.equal(x.lane,-3);
});
test('R5-b200 actual separated car keeps its authored safe lane',()=>{
 const x=evaluate({now:1,opponentGap:42,lateralY:-3,laneTarget:-3,followerSpeed:30,opponentSpeed:28});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,0);assert.equal(x.lane,-3);
});

test('R5-b201 physically unavailable but un-attributed passing lane enters temporary EXIT_DUEL rather than repeat attack',()=>{
 const x=evaluate({now:5,noSafeCorridor:true});
 assert.equal(x.state,'EXIT_DUEL');assert.equal(x.target,'ahead');assert.equal(x.scans,1);
});
test('R5-b201 genuinely narrow track does not invent a blocked duel or physical target',()=>{
 const x=evaluate({now:5,narrowCorridor:true});
 assert.equal(x.state,'FOLLOW');assert.equal(x.scans,1);
});
test('R5-b203 an unattributed unavailable pass holds current physical lane instead of returning into opponent',()=>{
 const x=evaluate({now:5,noSafeCorridor:true,lateralY:-3,laneTarget:2});
 assert.equal(x.state,'EXIT_DUEL');assert.equal(x.lane,-3);assert.equal(x.scans,1);
});

test('R5-b204 a rejected attack corridor blocked by another car keeps the current physical lane',()=>{
 const x=evaluate({now:5,namedBlockedCorridor:true,lateralY:-3,laneTarget:2});
 assert.equal(x.state,'EXIT_DUEL');assert.equal(x.lane,-3);assert.equal(x.scans,1);
});

test('R5-b205 anonymous rejected lane stays in EXIT_DUEL while longitudinal geometry is unchanged',()=>{
 const x=evaluate({exitDuel:true,priorExitGap:8,opponentGap:10,now:1});
 assert.equal(x.state,'EXIT_DUEL');assert.equal(x.scans,0);
});
test('R5-b205 anonymous rejected lane retries after a genuine chassis-length increase in gap',()=>{
 const x=evaluate({exitDuel:true,priorExitGap:8,opponentGap:15,now:1});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);assert.equal(x.lane,-3);
});
test('R5-b205 an identified nearby blocker never gets the anonymous spacing release',()=>{
 const x=evaluate({exitDuel:true,priorExitGap:8,opponentGap:15,now:1,oldBlockerPresent:true});
 assert.equal(x.state,'EXIT_DUEL');assert.equal(x.scans,0);
});

test('R5-b206 real physical side-by-side contact survives pre-attack distance check',()=>{
 const x=evaluate({now:5,opponentGap:7,lateralY:-3,followerSpeed:28.5,opponentSpeed:28});
 assert.equal(x.state,'SIDE_BY_SIDE');assert.equal(x.scans,0);
});
test('R5-b206 physically prepared but unavailable corridor still enters protected EXIT_DUEL',()=>{
 const x=evaluate({now:5,opponentGap:9,lateralY:-3,followerSpeed:28.5,opponentSpeed:28,noSafeCorridor:true});
 assert.equal(x.state,'EXIT_DUEL');assert.equal(x.scans,1);assert.equal(x.lane,-3);
});

test('R5-b207 existing same-opponent physically separated 8m pass retains validated side',()=>{
 const x=evaluate({now:5,opponentGap:8,lateralY:-3,laneTarget:-3,followerSpeed:28.5,opponentSpeed:28});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);assert.equal(x.lane,-3);
});
test('R5-b207 absent previously authored lane does not create short-pass exemption',()=>{
 const x=evaluate({now:5,opponentGap:8,lateralY:-3,laneTarget:null,followerSpeed:28.5,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.scans,0);
});
test('R5-b207 a nearer new opponent does not inherit prior short-pass corridor',()=>{
 const x=evaluate({now:5,nearestChanged:true,newOpponentGap:6,opponentGap:8,lateralY:-3,laneTarget:-3,followerSpeed:28.5,opponentSpeed:28});
 assert.equal(x.target,'new');assert.equal(x.scans,0);
});
test('R5-b208 an actual named blocker stays recorded across rejected hold',()=>{
 const x=evaluate({exitDuel:true,oldBlockerPresent:true,now:1});
 assert.equal(x.state,'EXIT_DUEL');assert.equal(x.scans,0);assert.deepEqual(x.blockedIDs,['obstacle']);
});
test('R5-b208 anonymous rejected hold keeps unnamed blocker state empty while unchanged',()=>{
 const x=evaluate({exitDuel:true,priorExitGap:8,opponentGap:10,now:1});
 assert.equal(x.state,'EXIT_DUEL');assert.deepEqual(x.blockedIDs,[]);
});
test('R5-b209 a just-cleared real side-by-side pass keeps the safe lane for its same opponent',()=>{
 const x=evaluate({sideBySide:true,now:5,opponentGap:8,lateralY:-3,laneTarget:-3,followerSpeed:27.8,opponentSpeed:28});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);assert.equal(x.lane,-3);
});
test('R5-b209 old side-by-side label cannot persist outside the physical crossing extension',()=>{
 const x=evaluate({sideBySide:true,now:5,opponentGap:12,lateralY:-3,laneTarget:-3,followerSpeed:27.8,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.scans,0);
});
test('R5-b209 physically unseparated car cannot inherit short passing intent',()=>{
 const x=evaluate({sideBySide:true,now:5,opponentGap:8,lateralY:-1,laneTarget:-1,followerSpeed:27.8,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.scans,0);
});
test('R5-b210 held lane newly occupied by near rival replans through actual safe-corridor solver',()=>{
 const x=evaluate({now:1,opponentGap:16,lateralY:-3,laneTarget:0,followerSpeed:30,opponentSpeed:28});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,1);assert.equal(x.lane,-3);
});
test('R5-b210 remote legal zero lane remains authored and is not falsely overwritten',()=>{
 const x=evaluate({now:1,opponentGap:42,lateralY:-3,laneTarget:0,followerSpeed:30,opponentSpeed:28});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,0);assert.equal(x.lane,0);
});
test('R5-b210 held side that remains laterally clear is not unnecessarily replanned',()=>{
 const x=evaluate({now:1,opponentGap:16,lateralY:-3,laneTarget:-3,followerSpeed:30,opponentSpeed:28});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.scans,0);assert.equal(x.lane,-3);
});
test('R5-b211 physically separated close FOLLOW holds its actual lane rather than merging onto the opponent',()=>{
 const x=evaluate({now:5,opponentGap:14,lateralY:-3,laneTarget:2,followerSpeed:27,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.lane,-3);assert.equal(x.scans,0);
});
test('R5-b211 a distant slower follower still uses existing ideal-line guidance',()=>{
 const x=evaluate({now:5,opponentGap:42,lateralY:-3,laneTarget:2,followerSpeed:27,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.lane,0);assert.equal(x.scans,0);
});
test('R5-b211 a car without genuine lateral separation is not granted a passing-lane hold',()=>{
 const x=evaluate({now:5,opponentGap:14,lateralY:-1,laneTarget:2,followerSpeed:27,opponentSpeed:28});
 assert.equal(x.state,'FOLLOW');assert.equal(x.lane,0);
});

test('R5-b212 rejected real attack merge remembers its original physically blocked side',()=>{
 const x=evaluate({now:5,blockPlannerTarget:true,lateralY:-2,followerSpeed:30,opponentSpeed:28});
 assert.equal(x.state,'EXIT_DUEL');assert.equal(x.lane,-2);assert.equal(x.rejectedLane,-3);
 assert.deepEqual(x.blockedIDs,['obstacle']);
});
test('R5-b212 no available attack corridor does not invent a rejected lane',()=>{
 const x=evaluate({now:5,noSafeCorridor:true});
 assert.equal(x.state,'EXIT_DUEL');assert.equal(x.rejectedLane,null);
});
test('R5-b212 a fully accepted real attack has no rejected lane marker',()=>{
 const x=evaluate({now:5});
 assert.equal(x.state,'PLAN_ATTACK');assert.equal(x.rejectedLane,null);
});



test('R5-b215 keeps nearby named blocker cooldown without lateral-only release',()=>{
 const x=evaluate({exitDuel:true,now:1,oldBlockerPresent:true,priorRejectedLane:-3,obstacleLateral:3,obstaclePit:'TRACK',obstacleGap:-4});
 assert.equal(x.state,'EXIT_DUEL');assert.equal(x.scans,0);
});
