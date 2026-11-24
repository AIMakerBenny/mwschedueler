import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleApplicationSync,readApplicationSnapshots} from '../src/application-snapshot-v1.js';
function fixture(pages=[3,4]){
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE workspace_parts(scope TEXT,part TEXT,data TEXT)');
 const campaign={id:'qa',title:'QA',deadline:new Date(Date.now()+3600000).toISOString(),entries:pages.map((_,i)=>({url:'https://www.sooplive.com/station/host'+i+'/post/'+(i+1)}))};
 const write=()=>{db.exec('DELETE FROM workspace_parts');db.prepare('INSERT INTO workspace_parts VALUES(?,?,?)').run('public','core',JSON.stringify({contentApplications:[campaign]}))};write();
 function statement(sql,args=[]){return {bind:(...a)=>statement(sql,a),first:async()=>db.prepare(sql).get(...args)||null,all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(db.prepare(sql).run(...args).changes)}})}}
 const env={DB:{prepare:sql=>statement(sql),batch:async list=>{db.exec('BEGIN');try{const out=[];for(const s of list)out.push(await s.run());db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}}};
 let calls=0,fail=false;
 const proxy=async r=>{calls++;const u=new URL(new URL(r.url).searchParams.get('url'));const n=Number(u.pathname.split('/').at(-2)),page=Number(u.searchParams.get('page'));if(fail)return new Response('{}',{status:503});return Response.json({meta:{current_page:page,last_page:pages[n-1],total:pages[n-1]},data:[{title_no:n,user_id:'user'+n+'_'+page,p_comment_no:page,user_nick:'test',like_cnt:page,comment:'hello'}]})};
 const sync=async(force=false)=>{const r=await handleApplicationSync(new Request('https://test/api/soop/application-sync?id=qa'+(force?'&force=1':'')),env,proxy);assert.equal(r.status,200);return r.json()};
 return {db,env,campaign,write,sync,calls:()=>calls,fail:()=>{fail=true}};
}
test('two registered posts seven SOOP pages one Worker invocation, shared archived snapshot',async()=>{
 const x=fixture();try{const result=await x.sync();assert(result.done&&result.snapshot.complete);assert.equal(x.calls(),7);assert.equal(result.snapshot.applicants.length,7);
 const archive=await readApplicationSnapshots(x.env);assert.equal(archive.length,1);assert.deepEqual(archive[0].applicants,result.snapshot.applicants);
 const cached=await x.sync();assert(cached.cached);assert.equal(x.calls(),7);
 await new Promise(r=>setTimeout(r,5));x.campaign.deadline=new Date(Date.now()-1).toISOString();x.write();const ended=await x.sync(true);assert(ended.expired);assert.equal(x.calls(),7);assert.equal(ended.snapshot.applicants.length,7);
 }finally{x.db.close()}
});
test('multiple posts use a single bounded continuation job; every page exactly once',async()=>{
 const x=fixture([10,10]);try{let result,requests=0;do{result=await x.sync();requests++;assert(requests<=4)}while(!result.done);assert.equal(requests,3);assert.equal(x.calls(),20);assert.equal(result.snapshot.applicants.length,20);assert(result.snapshot.complete);
 }finally{x.db.close()}
});
test('expired never-read campaign sends zero upstream requests and creates no synthetic record',async()=>{
 const x=fixture();try{x.campaign.deadline=new Date(Date.now()-1000).toISOString();x.write();const r=await x.sync();assert(r.expired&&r.snapshot===null);assert.equal(x.calls(),0);assert.deepEqual(await readApplicationSnapshots(x.env),[])}finally{x.db.close()}
});
