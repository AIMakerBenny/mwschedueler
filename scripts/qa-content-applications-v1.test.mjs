import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parsePostUrl,parsePostMetadata,normalizeCampaigns,rankEntries,countdown,fromKstInput,toKstInput} from '../assets/content-applications-model-v1.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const url=(id,no)=>`https://www.sooplive.com/station/${id}/post/${no}`;
const e=(id,no,likes)=>({...parsePostUrl(url(id,no)),userId:id,nickname:id,likes,checkedAt:'2026-11-22T00:00:00.000Z'});
test('SOOP links canonicalize and cannot be cross-origin or duplicate',()=>{
 assert.equal(parsePostUrl(url('MaWang0216','123')+'?share=1#test').url,url('mawang0216','123'));
 assert.equal(parsePostUrl('https://bj.afreecatv.com/abc/post/123').url,url('abc','123'));
 for(const raw of ['javascript:alert(1)','https://www.sooplive.com.evil.test/station/a/post/1','https://evil.test/?q='+url('abc','1'),'https://www.sooplive.com/station/abc/board/1','https://user@www.sooplive.com/station/a/post/1'])assert.equal(parsePostUrl(raw),null,raw);
 const input={id:'c',title:'테스트',deadline:'2026-11-23T00:00:00Z',entries:[e('mawang0216','1',10),e('mawang0216','1',20),{url:'https://evil.test'}]};
 const normalized=normalizeCampaigns([input,input]);assert.equal(normalized.length,1);assert.equal(normalized[0].entries.length,1);assert.equal(normalized[0].entries[0].likes,10);
});
test('verified SOOP title endpoint maps nested count; station owner is not the author',()=>{
 const entry=parsePostUrl(url('host','123'));const j={data:{title_no:123,user_id:'mawang0216',user_nick:'마왕0216',title_name:'신청합니다',profile_image:'//profile.img.sooplive.co.kr/LOGO/ma/mawang0216/mawang0216.jpg',count:{like_cnt:118,read_cnt:1239,comment_cnt:20}}};
 const actual=parsePostMetadata(j,entry,'2026-11-22T00:00:00Z');assert.equal(actual.userId,'mawang0216');assert.equal(actual.station,'host');assert.equal(actual.likes,118);assert.equal(actual.views,1239);assert.equal(actual.comments,20);assert.match(actual.avatar,/^https:/);
 const unknown=parsePostMetadata({...j,data:{...j.data,count:{like_cnt:0}}},entry);assert.equal(unknown.likes,0);assert.equal(unknown.views,null);assert.equal(unknown.comments,null);
 assert.throws(()=>parsePostMetadata({...j,data:{...j.data,title_no:456}},entry));assert.throws(()=>parsePostMetadata({code:515},entry));
});
test('ranks tie, missing counts never become zero, mawang always has actual comparative rank',()=>{
 const rows=[e('other','1',50),e('mawang0216','2',40),e('tie','3',50),e('unknown','4',null),e('zero','5',0)];const r=rankEntries(rows);assert.equal(r.ownRank,3);assert.equal(r.leader.likes,50);assert.equal(r.ahead.likes-40+1,11);assert.equal(r.ranks.get(rows[0].id),1);assert.equal(r.ranks.get(rows[2].id),1);assert.equal(r.ranks.get(rows[4].id),4);assert.equal(r.ranks.has(rows[3].id),false);assert.equal(r.known,4);assert.equal(r.allKnown,false);
 assert.equal(rankEntries(rows,new Set([rows[1].id])).ownRank,null);assert.equal(rankEntries([rows[0]]).mawang,null);
});
test('time limit is Korea time, expiry boundary is exact, and invalid dates fail',()=>{
 const ts=fromKstInput('2026-11-23T23:59');assert.equal(ts,'2026-11-23T14:59:00.000Z');assert.equal(toKstInput(ts),'2026-11-23T23:59');assert.equal(fromKstInput('2026-02-30T01:00'),'');const end=Date.parse(ts);assert.equal(countdown(ts,end-1001).label,'00:00:02');assert.equal(countdown(ts,end-1).expired,false);assert.equal(countdown(ts,end).expired,true);assert.equal(countdown(ts,end-86401000).label,'1일 00:00:01');
});
test('production entry and cloud contract share the campaign core key without changing other fields',()=>{
 const html=read('index.html');assert(html.indexOf('data-tab="contentApplications"')<html.indexOf('data-tab="posts"'));assert(html.includes('id="contentApplications"'));assert(html.includes('content-applications-v1.js?v=1'));
 for(const p of ['assets/cloud-v1.1.js','assets/cloud-runtime-v130.js','src/cf-v111-auth.js']){const keys=read(p).match(/const CORE_KEYS\s*=\s*(\[[^\]\n]+\])/)[1];assert(keys.includes("'contentApplications'"));assert(keys.includes("'achievementCards'"));assert(keys.includes("'contentGroups'"))}
 const server=read('src/cf-v111-auth.js');assert(server.includes('source.contentApplications=previousCore.contentApplications'));assert(server.includes("key==='contentApplications'?normalizeCampaigns(src[key]):src[key]"));
 const ui=read('assets/content-applications-v1.js');assert(ui.includes('data.contentApplications=normalizeCampaigns(rows)'));assert(ui.includes('window.mwsV55SaveNow()'));assert(ui.includes('document.body.dataset.mwsMode===\'admin\''));assert(!ui.includes('method:\'POST\''));
});
