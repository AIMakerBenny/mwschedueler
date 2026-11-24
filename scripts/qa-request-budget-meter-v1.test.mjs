import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../assets/request-budget-meter-v1.js',import.meta.url),'utf8');
const code=src.slice(src.indexOf('function createMeter'),src.indexOf('const meter=createMeter'));
const create=new Function(code+'\nreturn createMeter')();
test('local timing observations classify Worker routes and distinguish network, cache and unknown',()=>{
 const origin='https://fixture.test',m=create(origin),add=(path,transferSize,decodedBodySize=0)=>m.observe({name:origin+path,transferSize,decodedBodySize});
 add('/api/soop/comment-batch?secret=never-export',100);add('/api/soop/proxy?url='+encodeURIComponent('https://chapi.sooplive.co.kr/api/a/title/1/comment?page=1'),200);
 add('/media/contact/a?v=1',0,200);add('/api/save',0);add('/assets/local.js',100);add('/api/calendar-startup',300);add('/api/parts-batch?parts=core',400);
 m.observe({name:'https://outside.test/api/save',transferSize:200});
 const r=m.report();assert.equal(r.network,4);assert.equal(r.cache,1);assert.equal(r.unknown,1);assert.equal(r.groups.find(g=>g.name==='신청 콘텐츠 댓글').network,2);assert(!JSON.stringify(r).includes('secret'));assert(!JSON.stringify(r).includes('outside'));
});
