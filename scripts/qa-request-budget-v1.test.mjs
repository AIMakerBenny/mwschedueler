import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCommentBatch,handleSoopCommentBatch} from '../src/soop-comment-batch-v1.js';
const source=readFileSync(new URL('../assets/content-applications-v2.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('async function fetchPageGroup'),source.indexOf('async function refresh(c,'));
test('comment batches are bounded and preserve page errors',async()=>{
 assert.deepEqual(parseCommentBatch('host','123','2,3,4'),{station:'host',post:'123',pages:[2,3,4]});
 for(const args of [['a/b','1','1'],['host','1/2','1'],['host','1','1,2,3,4,5,6,7,8,9,10'],['host','1','2,2'],['host','1','101'],['host','1','0']])assert.equal(parseCommentBatch(...args),null);
 let requests=0;
 const res=await handleSoopCommentBatch(new Request('https://fixture.test/api/soop/comment-batch?station=host&post=123&pages=2,3,4'),async request=>{
  requests++;const target=new URL(new URL(request.url).searchParams.get('url'));assert.equal(target.hostname,'chapi.sooplive.co.kr');assert.equal(target.pathname,'/api/host/title/123/comment');
  const page=Number(target.searchParams.get('page'));return new Response(JSON.stringify({page}),{status:page===3?503:200});
 });
 assert.equal(requests,3);assert.deepEqual((await res.json()).results,[{page:2,status:200,data:{page:2}},{page:3,status:503},{page:4,status:200,data:{page:4}}]);
});
test('twenty pages use four Worker calls and preserve all pages',async()=>{
 let calls=0;const fetchPage=async(s,page)=>{calls++;return {page,pages:20,total:20,applicants:[page]}};
 const fetch=async url=>{calls++;const pages=url.split('pages=')[1].split(',').map(Number);return {ok:true,status:200,json:async()=>({results:pages.map(page=>({page,status:200,data:{page,pages:20,total:20,applicants:[page]}}))})}};
 const load=new Function('fetch','fetchPage','parseCommentPage','AbortSignal',code+'\nreturn fetchSource')(fetch,fetchPage,x=>x,{timeout:()=>undefined});
 const result=await load({station:'host',postNo:'123'});assert.equal(result.complete,true);assert.deepEqual(result.rows,Array.from({length:20},(_,i)=>i+1));assert.equal(calls,4);
 let active=0;await assert.rejects(()=>load({station:'host',postNo:'123'},()=>++active<2));assert.equal(calls,5);
});
