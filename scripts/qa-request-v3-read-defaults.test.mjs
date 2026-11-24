import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/app-core.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function mwsNormalizeToolsWorkspaceV3'),source.indexOf('function normalizeMiniGameData'));
let serial=0;
const {mwsNormalizeLoadedReadDefaultsV3:normalize,mwsNormalizeActivityWorkspaceV3:activity,mwsNormalizeToolsWorkspaceV3:tools}=new Function('crypto','window',code+'\nreturn window')({randomUUID:()=>String(++serial)},{});
const all=new Set(['core','events','contacts','activity','miniGames']);
const data=()=>({contacts:[{id:'self'},{id:'a'},{id:'b'}],selfContactId:'self',events:[{id:'e',title:'event',date:'2026-11-24',participants:['a','self']}],todayPeopleByDate:{},todayPeopleManualByDate:{'2026-11-24':['b']},miniGames:{multiDraw:{targetCount:8}}});
test('known read defaults stabilize before save baseline, title edits do not change other partitions',()=>{
 const d=data();normalize(d,all);
 assert.equal(d.dashboardNoticeUrl,'');
 assert.deepEqual(d.todayPeopleByDate,{'2026-11-24':['b','a']});
 assert.deepEqual(d.todayPeopleManualByDate,{'2026-11-24':['b']});
 const before=JSON.stringify(d);
 tools(d);activity(d);normalize(d,all);assert.equal(JSON.stringify(d),before);
 d.events[0].title='edited';activity(d);tools(d);
 const expected=JSON.parse(before);expected.events[0].title='edited';
 assert.deepEqual(d,expected);
});
test('existing user settings and manual activity remain intact; participant edits update derived map',()=>{
 const d=data();d.dashboardNoticeUrl='https://example.invalid/notice';normalize(d,all);
 const tool=d.miniGames.toolsV1;tool.tier.title='Custom';tool.tier.tiers[0].contactIds=['b'];
 tool.matrix.positions={a:{x:10,y:20}};tool.savedV108.tier.push({id:'saved',snapshot:{title:'custom'}});
 const before=JSON.stringify(tool);normalize(d,all);assert.equal(JSON.stringify(d.miniGames.toolsV1),before);
 assert.equal(d.dashboardNoticeUrl,'https://example.invalid/notice');
 d.events[0].participants=[];activity(d);
 assert.deepEqual(d.todayPeopleByDate,{'2026-11-24':['b']});
 assert.deepEqual(d.todayPeopleManualByDate,{'2026-11-24':['b']});
});
test('does not initialize unloaded workspace partitions',()=>{
 const d=data();normalize(d,new Set(['events']));
 assert.equal(d.dashboardNoticeUrl,undefined);assert.equal(d.miniGames.toolsV1,undefined);assert.deepEqual(d.todayPeopleByDate,{});
});
