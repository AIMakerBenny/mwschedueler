// R5-b103: mutation tests driven by the pinned actual ten-lap browser races.
// Deliberately synthetic mutations of REAL history; not a new 20ms race run.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {findMajokuPhysicalFieldDifferences as diff} from './lib/f1-r5b95-physical-compare.mjs';
import {normalizeMajokuScreenTransitions as norm} from './lib/f1-r5b102-transitions.mjs';
const dir='artifacts/r5-b49-majoku/';
const fields=['seededIso','setupCreatedAt','finishedRows','finishEvents',
 'pitRequests','pitTransitions','physics','acceptedCompetition','tickCount',
 'simulatedSeconds','screenTransitions'];
function read(seed){return JSON.parse(fs.readFileSync(dir+'seed'+seed+'-normal10.json','utf8'))}
function checked(r){return {...r,screenTransitions:norm(r.screenTransitions)}}
for(const seed of [1,2]){
 test('seed '+seed+' historical physical outcome agrees with itself',()=>{
  const before=read(seed),clone=structuredClone(before);
  assert.deepEqual(diff(checked(before),checked(clone),fields),[]);
 });
 test('seed '+seed+' real callback port 894x versus 899x is diagnostics only',()=>{
  const before=read(seed),clone=structuredClone(before);
  for(const t of clone.screenTransitions){
   t.caller=t.caller.replace(/127\.0\.0\.1:894[01]/g,'127.0.0.1:899'+(seed-1));
  }
  assert.notDeepEqual(before.screenTransitions,clone.screenTransitions);
  assert.deepEqual(diff(checked(before),checked(clone),fields),[]);
 });
 test('seed '+seed+' physical overtake event mutation fails equality',()=>{
  const before=read(seed),clone=structuredClone(before);
  assert(before.physics.passEvents.length>0);
  clone.physics.passEvents[0].t+=.02;
  assert.deepEqual(diff(checked(before),checked(clone),fields).map(x=>x.field),['physics']);
 });
 test('seed '+seed+' pit lifecycle mutation fails equality',()=>{
  const before=read(seed),clone=structuredClone(before);
  assert(before.pitTransitions.length>0);
  clone.pitTransitions[0].to='FAKE_PIT_TELEPORT';
  assert.deepEqual(diff(checked(before),checked(clone),fields).map(x=>x.field),['pitTransitions']);
 });
 test('seed '+seed+' changed finish time fails equality',()=>{
  const before=read(seed),clone=structuredClone(before);
  clone.finishedRows[0].finishMs+=20;
  assert.deepEqual(diff(checked(before),checked(clone),fields).map(x=>x.field),['finishedRows']);
 });
 test('seed '+seed+' screen transition time mismatch fails equality',()=>{
  const before=read(seed),clone=structuredClone(before);
  clone.screenTransitions.at(-1).ms+=20;
  assert.deepEqual(diff(checked(before),checked(clone),fields).map(x=>x.field),['screenTransitions']);
 });
}
