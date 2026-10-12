/* MWS F1 unified redesign v1.1 — isolated, deterministic physics kernel.
   This file is intentionally NOT wired to LIVE yet: the legacy engine must be
   removed from the active execution path before switching, not stacked on top.
   All world units: m, s, m/s, m/s², W, J. No DOM, timer or random dependency.
*/
(function(root){
'use strict';
const C=Object.freeze({
 dt:.020,mass:800,baseThrust:14,baseBrake:32,lateral:28,traction:18,
 energyCapacityJ:4e6,ersBaseW:80000,ersAttackW:160000,
 specialW:300000,totalExtraW:480000,tyreRemainingPitGuard:.40,
 compounds:Object.freeze({
  SOFT:Object.freeze({grip:1.06,wearPerLap:.110,temperature:95,tau:8}),
  MEDIUM:Object.freeze({grip:1.00,wearPerLap:.085,temperature:100,tau:12}),
  HARD:Object.freeze({grip:.95,wearPerLap:.060,temperature:105,tau:16})
 })
});
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function finite(v,name){if(!Number.isFinite(v))throw Error('F1 unified nonfinite '+name);return v;}
function ratingFactor(r,amplitude){return 1+amplitude*clamp((finite(Number(r??75),'rating')-75)/20,-1,1)}
function tyreGrip(tyre){
 const cfg=C.compounds[tyre.compound];if(!cfg)throw Error('Unknown compound');
 const w=clamp(finite(tyre.wear,'wear'),0,1),d=clamp(finite(tyre.damage??0,'damage'),0,1);
 const diff=Math.abs(finite(tyre.temperature,'temperature')-cfg.temperature);
 const temp=clamp(1-Math.max(0,diff-10)**2*.00025,.88,1);
 const h=clamp((w-.60)/.40,0,1);
 return finite(cfg.grip*temp*(1-.05*w-.22*h*h)*(1-.12*d),'grip');
}
function powerEnvelope(input){
 const v=Math.max(0,finite(input.speed,'speed'));
 const nominal=finite(input.nominalSpeed,'nominalSpeed');
 if(nominal<=0)throw Error('Invalid nominalSpeed');
 const dragReduction=clamp(finite(input.dragReduction??0,'dragReduction'),0,.12);
 const dBase=14/(nominal*nominal);
 const drag=dBase*(1-dragReduction)*v*v;
 const baseThrust=C.baseThrust*ratingFactor(input.paceRating,.025)*clamp(finite(input.form??1,'form'),.994,1.006);
 const requestedERS=clamp(finite(input.ersW??0,'ersW'),0,C.ersAttackW);
 const requestedSkill=clamp(finite(input.skillW??0,'skillW'),0,C.specialW);
 const requested= Math.min(C.totalExtraW,requestedERS+requestedSkill);
 const vLimit=nominal+35/3.6,vSoft=vLimit-15/3.6;
 const limitDrag=dBase*(1-dragReduction)*vLimit*vLimit;
 const limitPower=C.mass*vLimit*Math.max(0,limitDrag-baseThrust);
 const blend=clamp((v-vSoft)/(vLimit-vSoft),0,1);
 const allowed=Math.min(requested,limitPower);
 const extraPower=requested*(1-blend)+allowed*blend;
 const gross=baseThrust+extraPower/C.mass/Math.max(v,20);
 return {drag,baseThrust,extraPower,requestedERS,requestedSkill,gross,vLimit,
         effectiveDragCoefficient:dBase*(1-dragReduction)};
}
function forwardStep(state,command,env,dt=C.dt){
 const step=finite(dt,'dt');if(step<=0||step>.1)throw Error('Invalid dt');
 const g=tyreGrip(state.tyre);
 const ratings=state.ratings||{};
 const utilization=clamp(.94+.025*clamp((Number(ratings.cornering??75)-75)/20,-1,1),.915,.965);
 const aeroShare=clamp(.35*(state.v/env.nominalSpeed)**2,0,.5);
 const lateral=28*g*(1-clamp(env.dirtyStrength??0,0,1)*.06*aeroShare);
 const demand=state.v*state.v*Math.abs(finite(command.curvature??0,'curvature'));
 const executedLat=Math.min(demand,.98*lateral);
 const lateralRatio=executedLat/lateral;
 const friction=Math.sqrt(clamp(1-lateralRatio*lateralRatio,0,1));
 const tractionLimit=18*g*friction;
 const brakingLimit=32*ratingFactor(ratings.braking,.05)*g*friction;
 const envelope=powerEnvelope({
  speed:state.v, nominalSpeed:env.nominalSpeed,
  paceRating:ratings.pace??75, form:state.form??1,
  dragReduction:env.dragReduction??0,ersW:command.ersW??0,skillW:command.skillW??0
 });
 const throttle=clamp(finite(command.throttle??0,'throttle'),0,1);
 const brake=clamp(finite(command.brake??0,'brake'),0,1);
 const traction=brake>0?0:Math.min(throttle*envelope.gross,tractionLimit);
 const appliedBrake=brake*brakingLimit;
 const acceleration=traction-appliedBrake-envelope.drag;
 const nextV=Math.max(0,state.v+acceleration*step);
 const pathScale=finite(command.pathScale??1,'pathScale');
 if(pathScale<=0)throw Error('Invalid pathScale');
 const distance=(state.v+nextV)*.5*step;
 const nextS=state.s+distance/pathScale;
 const consumedExtraThrust=Math.max(0,traction-Math.min(traction,envelope.baseThrust*throttle));
 const actualExtraW=Math.min(envelope.extraPower,consumedExtraThrust*C.mass*Math.max(state.v,20));
 const actualERSW=Math.min(envelope.requestedERS,actualExtraW);
 const harvestedW=appliedBrake>0?Math.min(120000,appliedBrake*C.mass*state.v*.6):0;
 const nextEnergy=clamp(state.energyJ-actualERSW*step+harvestedW*step,0,C.energyCapacityJ);
 const compound=C.compounds[state.tyre.compound];
 const normalizedTravel=distance/Math.max(1,env.trackLength);
 const management=1-.1*clamp((Number(ratings.tyreManagement??75)-75)/20,-1,1);
 const latLoad=clamp(executedLat/Math.max(.01,lateral),0,1);
 const brakeLoad=clamp(appliedBrake/Math.max(.01,brakingLimit),0,1);
 const loadFactor=clamp(.90+.15*latLoad, .90,1.25);
 const wear=clamp(state.tyre.wear+compound.wearPerLap*normalizedTravel*
   clamp(env.trackStress??1,.88,1.24)*management*loadFactor,0,1);
 const heatLoad=clamp(.65*latLoad+.25*brakeLoad-.45,-.7,1.2);
 const thermalTarget=compound.temperature+18*heatLoad;
 const temp=state.tyre.temperature+(thermalTarget-state.tyre.temperature)*
   (1-Math.exp(-step/compound.tau));
 return {state:{...state,s:finite(nextS,'s'),v:finite(nextV,'v'),
    energyJ:finite(nextEnergy,'energyJ'),
    tyre:{...state.tyre,wear:finite(wear,'wear'),temperature:finite(temp,'temperature')}},
   telemetry:{acceleration,drag:envelope.drag,traction,appliedBrake,executedLat,lateral,
    friction,utilization,actualERSW,harvestedW,actualExtraW,grip:g}};
}
// The whole batch receives one immutable previous-step snapshot. The caller is
// responsible for trajectory reservation and swept-footprint arbitration BEFORE
// committing the returned map. Never feed a committed car into another car step.
function proposeBatch(states,commands,environment,dt=C.dt){
 const ids=Object.keys(states).sort();const out={};
 for(const id of ids){
  const car=states[id],command=commands[id];
  if(!car||!command)throw Error('Missing command/state '+id);
  out[id]=forwardStep(car,command,environment,dt);
 }
 return Object.freeze(out);
}
function selfTest(){
 const mk=()=>({s:0,v:200/3.6,energyJ:4000000,form:1,
  ratings:{pace:75,braking:75,cornering:75,tyreManagement:75},
  tyre:{compound:'MEDIUM',wear:0,temperature:100,damage:0}});
 const env={nominalSpeed:335/3.6,trackLength:5280,dragReduction:0};
 const a=forwardStep(mk(),{throttle:1,curvature:0,ersW:80000},env);
 const b=forwardStep(mk(),{brake:1,curvature:0},env);
 const x=proposeBatch({b:mk(),a:mk()},{a:{throttle:1},b:{brake:1}},env);
 const y=proposeBatch({a:mk(),b:mk()},{b:{brake:1},a:{throttle:1}},env);
 const checks={
 finite:[a,b].every(v=>Number.isFinite(v.state.v)&&Number.isFinite(v.state.s)),
 acceleration:a.state.v>200/3.6,
 braking:b.state.v<200/3.6,
 energy:a.state.energyJ<4000000&&a.state.energyJ>=0,
 deterministic:JSON.stringify(x)===JSON.stringify(y),
 softFasterGrip:tyreGrip({...mk().tyre,compound:'SOFT'})>tyreGrip(mk().tyre),
 pitGuard:C.tyreRemainingPitGuard===.4
 };
 return {checks,allPass:Object.values(checks).every(Boolean)};
}
root.MWSF1UnifiedV11=Object.freeze({constants:C,tyreGrip,powerEnvelope,forwardStep,proposeBatch,selfTest});
})(typeof window!=='undefined'?window:globalThis);
