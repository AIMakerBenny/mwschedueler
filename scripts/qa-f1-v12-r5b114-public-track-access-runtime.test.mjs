// R5-b114: exercise the actual public track selection gate, not stale text.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const ctx={};ctx.window=ctx;
vm.runInNewContext(fs.readFileSync('assets/f1-track-v1.js','utf8'),ctx);
const tracks=Object.keys(ctx.MWS_F1_TRACKS_V182||{});
assert.equal(tracks.length,7);
const publicId='majoku-ring-v1',locked=tracks.filter(id=>id!==publicId);
assert.equal(locked.length,6);
const section=(first,last)=>{
 const a=source.indexOf(first),b=source.indexOf(last,a+first.length);
 assert(a>=0&&b>a,'Missing real application function '+first);
 return source.slice(a,b);
};
const policy=section('const F1_PUBLIC_TRACK_ID_V348=','function trackCardHtmlV266(');
const select=section('function selectTrackV186(','function renderTrackChoicesV186(');
const start=section('function startRaceFromSetupV187(','function confirmRaceStartRecoveryM(');
const restore=section('function restoreF1SettingsRecoveryD(','function persistF1SettingsRecoveryD(');
assert(start.includes('!isF1PublicTrackV348(activeTrackId)&&!isF1InternalQaV348()'));
assert(restore.includes('isF1PublicTrackV348(restoredTrack)'));
const createSelector=new Function('internal','validIds',
 "const window={__MWS_F1_INTERNAL_QA_V348:internal,"+
 "mwsGetF1TrackV182:id=>validIds.has(String(id))?{id}:null};"+
 "let activeTrackId='majoku-ring-v1',lapOverrideActiveV260=true,"+
 "selectedTotalLapsRecoveryD=10;"+
 "const persistF1SettingsRecoveryD=()=>true;"+
 "const renderTrackChoicesV186=()=>true;"+
 "const updateTrackFoundationStatusV182=()=>true;"+
 "const renderTrackMapV183=()=>true;"+
 "const syncLapControlV260=()=>true;"+
 "const syncSetupActionV187=()=>true;"+
 "const recommendedLapsV260=()=>10;"+
 policy+select+
 "return {pick:selectTrackV186,active:()=>activeTrackId};");
test('public selection permits only real Majoku Ring',()=>{
 const api=createSelector(false,new Set(tracks));
 assert.equal(api.pick(publicId),true);
 for(const id of locked){assert.equal(api.pick(id),false,id);assert.equal(api.active(),publicId)}
 assert.equal(api.pick('fake-track'),false);
});
test('internal QA flag allows geometry testing while not unlocking public UI',()=>{
 const qa=createSelector(true,new Set(tracks));
 for(const id of locked){assert.equal(qa.pick(id),true,id);assert.equal(qa.active(),id)}
 assert.equal(qa.pick('fake-track'),false);
});
test('only strict boolean true sets internal QA exemption',()=>{
 const api=createSelector('true',new Set(tracks));
 for(const id of locked)assert.equal(api.pick(id),false);
});
test('real swept collision, reservation and traffic guards retained',()=>{
 for(const term of [
  'if(unifiedSweptWorldV11(a,ca,b,cb))',
  'function unifiedReservationThreatV12(a,b,ca,cb)',
  "cmd.reason='PREDICTED_TRAFFIC'"
 ])assert(source.includes(term),term);
});
console.log(JSON.stringify({phase:'R5-b114',publicCircuit:publicId,wipLocked:6,physicsChanged:false}));
