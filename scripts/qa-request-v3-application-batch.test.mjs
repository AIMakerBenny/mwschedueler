import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleApplicationBatch} from '../src/application-snapshot-v1.js';
test('batch shares nine-page budget, retains continuation and skips expired campaigns',async()=>{
 const sqlite=new DatabaseSync(':memory:');
 const statement=(sql,args=[])=>({bind:(...args)=>statement(sql,args),first:async()=>sqlite.prepare(sql).get(...args)||null,all:async()=>({results:sqlite.prepare(sql).all(...args)}),run:async()=>({meta:{changes:sqlite.prepare(sql).run(...args).changes}})});
 const DB={prepare:sql=>statement(sql),batch:async statements=>{sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}};
 sqlite.exec('CREATE TABLE workspace_parts(scope TEXT,part TEXT,data TEXT)');
 const campaigns=Array.from({length:5},(_,i)=>({id:'c'+i,title:'Campaign '+i,deadline:new Date(Date.now()+(i===4?-3600000:3600000)).toISOString(),entries:[{url:'https://www.sooplive.com/station/host'+i+'/post/'+(i+1)}]}));
 sqlite.prepare('INSERT INTO workspace_parts VALUES(?,?,?)').run('public','core',JSON.stringify({contentApplications:campaigns}));
 let pages=0;
 const proxy=async req=>{pages++;const u=new URL(new URL(req.url).searchParams.get('url')),page=Number(u.searchParams.get('page')),post=Number(u.pathname.split('/').at(-2));assert.notEqual(post,5);return Response.json({data:[{title_no:post,user_id:'u'+post+'_'+page,p_comment_no:page,user_nick:'Fixture',like_cnt:page}],meta:{last_page:3,total:3,current_page:page}})};
 const read=async(ids,continuation=false)=>(await handleApplicationBatch(new Request('http://127.0.0.1/api/soop/application-batch',{method:'POST',body:JSON.stringify({ids,continue:continuation})}),{DB},proxy)).json();
 try{
  const first=await read(campaigns.map(c=>c.id));assert.equal(first.pagesUsed,9);assert.equal(pages,9);assert.equal(first.results.filter(r=>r.snapshot?.complete).length,3);
  const rest=first.results.filter(r=>!r.done).map(r=>r.id);assert.deepEqual(rest,['c3','c4']);
  const second=await read(rest,true);assert.equal(second.pagesUsed,3);assert.equal(pages,12);assert.equal(second.results[0].snapshot.applicants.length,3);assert.equal(second.results[1].expired,true);
  const warm=await read(['c0','c1','c2','c3','c4']);assert.equal(warm.pagesUsed,0);assert.equal(pages,12);
  const invalid=await handleApplicationBatch(new Request('http://127.0.0.1/api/soop/application-batch',{method:'POST',body:JSON.stringify({ids:['c0','c0']})}),{DB},proxy);assert.equal(invalid.status,400);
 }finally{sqlite.close()}
});
