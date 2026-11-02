// R5-b48 - public release policy for one playable track.
// This reads the shipped engine, style and complete seven-track catalog,
// and does not change simulated physics, saved historical QA or track data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const engine=fs.readFileSync('assets/f1-racing-v1.js','utf8');
const styles=fs.readFileSync('assets/f1-racing-v1.css','utf8');
const catalogSource=fs.readFileSync('assets/f1-track-v1.js','utf8');
const context={};context.window=context;
vm.runInNewContext(catalogSource,context);
const tracks=Object.values(context.MWS_F1_TRACKS_V182||{});
assert.equal(tracks.length,7,'Seven original circuit assets must remain intact');
const beginning=engine.indexOf('const TRACK_CARD_CHARACTER_V266=');
const ending=engine.indexOf('function qaTrackCardsV266(',beginning);
assert(beginning>=0&&ending>beginning,'Track-card source not isolated');
const markupSource=engine.slice(beginning,ending);
const escaped=value=>String(value??'').replaceAll('&','&amp;')
 .replaceAll('<','&lt;').replaceAll('>','&gt;')
 .replaceAll('"','&quot;').replaceAll("'",'&#39;');
const tests=new Function('escapeHtml',markupSource+
 'return {isF1PublicTrackV348,trackCardHtmlV266};')(escaped);
const live=tracks.filter(t=>tests.isF1PublicTrackV348(t.id));
const wip=tracks.filter(t=>!tests.isF1PublicTrackV348(t.id));
assert.deepEqual(live.map(t=>t.id),['majoku-ring-v1']);
assert.equal(wip.length,6);
for(const track of tracks){
 const html=tests.trackCardHtmlV266({...track,profile:{
  maxStraightKph:325,overtakeZones:2}},true);
 const isLive=tests.isF1PublicTrackV348(track.id);
 assert(html.includes('data-f1-track-id="'+track.id+'"'));
 assert(html.includes('f1-racing-track-card-silhouette-v266'));
 assert(html.includes('LENGTH')&&html.includes('OVERTAKE'));
 if(isLive){
  assert(html.includes('data-f1-access-v348="available"'));
  assert(html.includes('aria-pressed="true"'));
  assert(html.includes('aria-disabled="false"'));
  assert(!html.includes(' disabled>')&&!html.includes('WORK IN PROGRESS'));
 }else{
  assert(html.includes('data-f1-access-v348="wip"'));
  assert(html.includes(' disabled>'),'Locked track is still operable');
  assert(html.includes('aria-disabled="true"')&&html.includes('aria-pressed="false"'));
  assert(html.includes('WORK IN PROGRESS')&&html.includes('제작 중'));
 }
}
const choose=engine.slice(engine.indexOf('function selectTrackV186('),
 engine.indexOf('function renderTrackChoicesV186('));
const restore=engine.slice(engine.indexOf('function restoreF1SettingsRecoveryD('),
 engine.indexOf('function persistF1SettingsRecoveryD('));
const start=engine.slice(engine.indexOf('function startRaceFromSetupV187('),
 engine.indexOf('function confirmRaceStartRecoveryM('));
const setup=engine.slice(engine.indexOf('function syncSetupActionV187('),
 engine.indexOf('function populateTransitionV187('));
const render=engine.slice(engine.indexOf('function renderTrackChoicesV186('),
 engine.indexOf('function showImmersiveNoticeV261('));
assert(choose.includes('if(!isF1PublicTrackV348(id)'), 'Selection API bypasses WIP lock');
assert(restore.includes('isF1PublicTrackV348(restoredTrack)'), 'Persisted WIP track not sanitized');
assert(start.includes('!isF1PublicTrackV348(activeTrackId)'), 'Manual race start bypasses WIP lock');
assert(setup.includes('isF1PublicTrackV348(activeTrackId)'), 'Race buttons remain available on WIP');
assert(render.includes("1 / ")&&render.includes(":not([disabled])"), 'UI must show one open track and avoid attaching locked clicks');
assert(styles.includes('.f1-racing-track-card-v266.is-wip-v348')&&
 styles.includes('.f1-racing-track-wip-v348'), 'WIP card appearance not included');
assert(engine.includes("if(unifiedSweptWorldV11(a,ca,b,cb))"),
 'Swept-world collision safety must be retained');
assert(engine.includes("if(!unifiedReservationThreatV12(a,b,ca,cb))continue;"),
 'R5-b39 collision reservation guard must remain');
console.log(JSON.stringify({phase:'R5-b48',status:'PASS',tracks:tracks.length,
 available:live.map(t=>t.id),locked:wip.map(t=>t.id),
 checks:['real track catalog kept intact','one real selectable card',
  'six disabled WIP cards','saved-selection fallback',
  'normal and fast start guard','R5-b39 collision safety intact'],
 limitation:'Pure source-and-markup contract; integrated Chromium is separate'}));
