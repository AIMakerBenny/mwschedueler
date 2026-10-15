// Observe the active single engine's committed AI transitions; do not classify
// a disengagement as a proven lost duel without an opponent-target ledger.
// No game physics or balance patching; all observations use committed steps.
import assert from 'node:assert/strict';
import {setup,engine} from './f1-unified-v11-fixture.mjs';

const body=String.raw`
unifiedInitV11();
const previous=new Map(raceMotionV189.vehicles.map(v=>[String(v.id),{state:'CRUISE',target:''}]));
const pairsSeen=new Map(),transitions={},examples=[];
let ticks=0,opened=0,reengagements=0,blocked=0,disengaged=0,sideBySide=0;
for(let step=0;step<6000;step++){
 if(!simulateUnifiedRaceStepV11(20))break;
 ticks++;
 const rows=unifiedSnapshotV11();
 for(const row of rows){
  const id=row.id,state=String(row.ref.unifiedAiStateV11||'CRUISE'),prior=previous.get(id);
  // The opponent is inferred from committed positions, not claimed as a stored AI target.
  const nearest=rows.filter(p=>p.id!==id&&p.pit==='TRACK'&&unifiedGapV11(row,p)>0&&unifiedGapV11(row,p)<145)
    .sort((a,b)=>unifiedGapV11(row,a)-unifiedGapV11(row,b))[0];
  const target=nearest?.id||'';
  if(prior?.state!==state){
   const key=String(prior?.state||'CRUISE')+'>'+state;
   transitions[key]=(transitions[key]||0)+1;
   if(state==='PLAN_ATTACK'){
    opened++;
    if(target){
      const pair=id+'|'+target,previousCount=pairsSeen.get(pair)||0;
      if(previousCount>0)reengagements++;
      pairsSeen.set(pair,previousCount+1);
    }
   }
   if(state==='EXIT_DUEL'&&['PLAN_ATTACK','SIDE_BY_SIDE'].includes(prior?.state))blocked++;
   if(['FOLLOW','CRUISE'].includes(state)&&['PLAN_ATTACK','SIDE_BY_SIDE'].includes(prior?.state))disengaged++;
   if(state==='SIDE_BY_SIDE'&&prior?.state!=='SIDE_BY_SIDE')sideBySide++;
   if(examples.length<20)examples.push({step,id,from:prior?.state||'CRUISE',to:state,inferredTarget:target});
  }
  previous.set(id,{state,target});
 }
}
const confirmed=unifiedStateV11.telemetry.passes.slice(),crossings=unifiedStateV11.telemetry.rawCrossings.slice();
const allGrounded=confirmed.every(pass=>crossings.some(x=>x.front===pass.front&&
 x.pair===[String(pass.front),String(pass.passed)].sort().join('|')&&Math.abs(x.t-pass.t)<=.021));
return {ticks,opened,reengagements,blocked,disengaged,sideBySide,confirmed:confirmed.length,
 rawCrossings:crossings.length,allGrounded,invalid:unifiedStateV11.telemetry.invalid,
 transitions,examples};
`;
const result=new Function(setup+engine+body)();
assert.equal(result.ticks,6000);
assert.deepEqual(result.invalid,[]);
assert(result.opened>0,'No real attack state was observed');
assert(result.blocked>0,'No real blocked-attack transition was observed');
assert(result.disengaged>0,'No real unconfirmed disengagement was observed');
assert(result.reengagements>0,'No same-opponent attack reengagement was observed');
assert(result.sideBySide>0,'No actual side-by-side state was observed');
assert(result.confirmed>0,'No committed confirmed overtakes observed');
assert(result.allGrounded,'Confirmed overtakes differ from committed crossings');
console.log(JSON.stringify({result:'PASS',engine:'unified-v1.1',
 ticks:result.ticks,simulatedSeconds:result.ticks*.02,
 attemptsOpened:result.opened,blockedTransitions:result.blocked,
 nonConfirmedDisengagements:result.disengaged,sameOpponentReengagements:result.reengagements,
 sideBySideEntries:result.sideBySide,confirmedOvertakes:result.confirmed,
 physicalCrossings:result.rawCrossings,transitions:result.transitions,
 examples:result.examples,
 note:'Passive committed-state observations; opponent is inferred from nearest ahead vehicle; disengagement is not automatically an actual duel failure.'},null,2));
