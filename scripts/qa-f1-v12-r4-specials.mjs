// R4 sequential non-pausing ultimates and user pause.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {src,setup,engine} from './f1-unified-v11-fixture.mjs';
const css=fs.readFileSync(new URL('../assets/f1-racing-r401.css',import.meta.url),'utf8');
assert(src.includes('function unifiedSpecialPresentationTickV12('));
assert(src.includes('syncUltimateMarbleV12(marker,vehicle)'));
assert(css.includes('f1UltimateFlickerV12'));
assert(css.includes('background:transparent;'));
assert(!src.slice(src.indexOf('function unifiedSpecialTickV11('),
 src.indexOf('function simulateUnifiedRaceStepV11(')).includes('simClockV192.paused=true'));
const adapters=src.slice(src.indexOf('function applySpecialV401(entry){'),
 src.indexOf('function playSpecialV401(token){'));
const customSetup=setup.replace("const specialStateV401={cinematic:false,lastMs:-Infinity},specialStageV401=()=>null,specialPhraseV401=()=>({}),playSpecialV401=()=>{};","const specialStateV401={cinematic:false,lastMs:-Infinity,queue:[],index:0,visualClockV12:0,bannerEntryV12:null,bannerUntilV12:0,events:0,chains:0,boosts:0,history:[]},\n stage={innerHTML:'',dataset:{},remove(){this.removed=true;this.innerHTML='';}},\n specialStageV401=()=>{stage.removed=false;return stage;},specialPhraseV401=()=>({title:'부스터 엔진 가동',line:'최대 출력!'}),\n playSpecialV401=()=>{},initials=x=>String(x).slice(0,1),escapeHtml=x=>String(x);\n document.getElementById=k=>k==='f1RacingRaceTrackPathV188'?path:k==='f1SkillStageV401'&&!stage.removed?stage:null;");
assert.notEqual(customSetup,setup);
const r=new Function(customSetup+engine+adapters+"\nunifiedInitV11();\nconst a=raceMotionV189.vehicles[4],b=raceMotionV189.vehicles[9];\nspecialStateV401.queue=[\n{vehicle:a,rank:5,chain:false,phrase:specialPhraseV401(),visualAtV12:0,unifiedDelayMsV11:0},\n{vehicle:b,rank:10,chain:true,phrase:specialPhraseV401(),visualAtV12:2050,unifiedDelayMsV11:0}\n];\nunifiedSpecialPresentationTickV12(0);\nconst first={paused:simClockV192.paused,uses:a.specialUsesV401,second:b.specialUsesV401||0,\n banner:stage.innerHTML.includes('SPECIAL BOOST'),power:unifiedSkillPowerV11(a,0,'TRACK')};\nsimClockV192.simTimeMs=600;simClockV192.paused=true;unifiedSpecialPresentationTickV12(7000);\nconst held={index:specialStateV401.index,clock:specialStateV401.visualClockV12,\n second:b.specialUsesV401||0,css:stage.dataset.paused};\nsimClockV192.paused=false;unifiedSpecialPresentationTickV12(2100);\nreturn {first,held,second:{uses:b.specialUsesV401,started:b.specialStartsV11,\n chain:stage.innerHTML.includes('CHAIN BOOST'),paused:simClockV192.paused,boosts:specialStateV401.boosts},\n rates:[1,2,4,7,10,12].map(i=>unifiedSpecialRateV11(i,12)),\n history:specialStateV401.history.map(x=>({id:x.id,chain:x.chain}))};\n")();
assert.equal(r.first.paused,false);
assert.equal(r.first.uses,1);assert.equal(r.first.second,0);
assert(r.first.banner);assert.equal(r.first.power,300000);
assert.equal(r.held.second,0);assert.equal(r.held.index,1);
assert.equal(r.held.clock,0);assert.equal(r.held.css,'1');
assert.equal(r.second.uses,1);assert.equal(r.second.started,600);
assert.equal(r.second.boosts,2);assert(r.second.chain);assert.equal(r.second.paused,false);
assert(r.rates.every((rate,i)=>i===0||rate>r.rates[i-1]));
assert(r.rates.at(-1)>r.rates[0]*15);
assert.deepEqual(r.history,[{id:'4',chain:false},{id:'9',chain:true}]);
console.log(JSON.stringify({result:'PASS',phase:'v1.2-R4',nonPausing:true,
 chainDelayMs:2050,userPauseFreezesChain:true,rearRateRatio:r.rates.at(-1)/r.rates[0],
 flameCss:true,originalPowerW:r.first.power},null,2));
