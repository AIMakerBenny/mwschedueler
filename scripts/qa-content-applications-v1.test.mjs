import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parsePostUrl,commentPermalink,parsePostMetadata,normalizeCampaigns,parseCommentPage,uniqueApplicants,rankEntries,compareRankSnapshots,countdown,campaignStatus,MAX_AUTHORS,fromKstInput,toKstInput} from '../assets/content-applications-model-v1.js';
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
test('recruitment comments use like_cnt, pinned duplicates and multiple pages never double count',()=>{
 const source={...parsePostUrl(url('host','123')),userId:'host'};
 const comment=(user,id,likes)=>({user_id:user,user_nick:user,p_comment_no:id,title_no:123,like_cnt:likes,comment:'<b>신청</b>&amp; 어필',is_best_top:true});
 const first=parseCommentPage({meta:{last_page:2,current_page:1,total:5},data:[comment('host',1,999),comment('mawang0216',2,40),comment('other',3,50)]},source);
 const second=parseCommentPage({meta:{last_page:2,current_page:2,total:5},data:[comment('mawang0216',2,41),comment('other',4,12),comment('unknown',5,null),comment('zero',6,0)]},source);
 const rows=uniqueApplicants([...first.applicants,...second.applicants]),r=rankEntries(rows);
 assert.equal(first.pages,2);assert.equal(rows.length,4);assert.equal(r.mawang.likes,41);assert.equal(r.ownRank,2);assert.equal(r.leader.likes,50);assert.equal(r.mawang.comment,'신청& 어필');assert.equal(r.mawang.commentNo,'2');assert(!rows.some(e=>e.userId==='host'));assert.equal(r.known,3);assert.equal(r.allKnown,false);
 assert.throws(()=>parseCommentPage({data:[]},source));assert.equal(parseCommentPage({meta:{current_page:1,last_page:1,total:0},data:[]},source).applicants.length,0);
});
test('comment links target the verified SOOP comment ID, with a safe source fallback',()=>{
 const source=url('wjdfogur98','213215761');
 assert.equal(commentPermalink({url:source,commentNo:'125370759'}),source+'#comment_noti125370759');
 assert.equal(commentPermalink({url:source+'#comment_noti1',commentNo:'125370759'}),source+'#comment_noti125370759');
 assert.equal(commentPermalink({url:source,commentNo:'1?bad'}),source);
 assert.equal(commentPermalink({url:source}),source);
 assert.equal(commentPermalink({url:'https://example.com',commentNo:'123'}),'');
});
test('production entry and cloud contract share the campaign core key without changing other fields',()=>{
 const html=read('index.html');assert(html.indexOf('data-tab="contentApplications"')<html.indexOf('data-tab="posts"'));assert(html.includes('id="contentApplications"'));assert(html.includes('content-applications-v2.js?v=7'));
 assert(html.indexOf('id="dashboardApplicationSupport"')>html.indexOf('class="dashboard-kpi-grid-local"'));assert(html.indexOf('id="dashboardApplicationSupport"')<html.indexOf('class="dashboard-view-controls"'));
 for(const p of ['assets/cloud-v1.1.js','assets/cloud-runtime-v130.js','src/cf-v111-auth.js']){const keys=read(p).match(/const CORE_KEYS\s*=\s*(\[[^\]\n]+\])/)[1];assert(keys.includes("'contentApplications'"));assert(keys.includes("'achievementCards'"));assert(keys.includes("'contentGroups'"))}
 const server=read('src/cf-v111-auth.js');assert(server.includes('source.contentApplications=previousCore.contentApplications'));assert(server.includes("key==='contentApplications'?normalizeCampaigns(src[key]):src[key]"));
 const ui=read('assets/content-applications-v2.js');assert(ui.includes('data.contentApplications=normalizeCampaigns(rows)'));assert(ui.includes('window.mwsV55SaveNow()'));assert(ui.includes('document.body.dataset.mwsMode===\'admin\''));assert(!ui.includes('method:\'POST\''));
});

test('final six hours is urgent, and expiry never remains urgent',()=>{
 const end=Date.parse('2026-11-25T12:00:00.000Z');
 const deadline=new Date(end).toISOString();
 assert.equal(campaignStatus(deadline,end-6*3600000-1),'open');
 assert.equal(campaignStatus(deadline,end-6*3600000),'urgent');
 assert.equal(campaignStatus(deadline,end-1),'urgent');
 assert.equal(campaignStatus(deadline,end),'expired');
 assert.equal(campaignStatus(deadline,end+1000),'expired');
 assert.equal(campaignStatus('not-a-date',end),'expired');
});
test('application organizer names survive normalization without losing old campaigns',()=>{
 const base={id:'campaign-a',title:'외부 제작 콘텐츠',deadline:'2026-11-25T12:00:00.000Z',entries:[e('host','1',0)]};
 const authors=['신청 글 작성자 A','작성자 B','  작성자 B  ','',...Array.from({length:20},(_,i)=>'작성자 '+i),'<img src=x onerror=alert(1)>'];
 const withAuthors=normalizeCampaigns([{...base,authors}])[0];
 assert.deepEqual(withAuthors.authors.slice(0,2),['신청 글 작성자 A','작성자 B']);
 assert.equal(withAuthors.authors.length,MAX_AUTHORS);
 assert.equal(normalizeCampaigns([base])[0].authors.length,0);
 assert.deepEqual(normalizeCampaigns([withAuthors])[0].authors,withAuthors.authors);
});
test('application UI keeps normal typing caret but hides static-text caret',()=>{
 const css=read('assets/workspace-clean-v1.css');
 const ui=read('assets/content-applications-v2.js');
 assert.match(css,/caret-color:transparent/);
 assert.match(css,/input,textarea,[^\n]*caret-color:auto/);
 assert.match(ui,/data-ca-phase/);
 assert.match(ui,/data-ca-author-remove/);
 assert.match(ui,/data-ca-back/);
});

test('full leaderboard keeps MaWang at its actual rank and compares account-based changes',()=>{
 const before=[e('other','101',70),e('mawang0216','202',40),e('third','303',30),e('unknown','404',null)];
 const after=[e('mawang0216','999',85),e('other','101',70),e('third','303',34),e('unknown','404',null)];
 const r=rankEntries(after);
 assert.equal(r.ordered.length,3);
 assert.equal(r.ordered[0].userId,'mawang0216');
 assert.equal(r.ownRank,1);
 const diff=compareRankSnapshots(before,after);
 assert.equal(diff.changed,true);
 assert.deepEqual(diff.own,{oldRank:2,newRank:1,rankDelta:1,likesDelta:45});
 assert.deepEqual(diff.rows.get('other'),{oldRank:1,newRank:2,rankDelta:-1,likesDelta:0});
 assert.deepEqual(diff.rows.get('unknown'),{oldRank:null,newRank:null,rankDelta:null,likesDelta:null});
 const steady=compareRankSnapshots(after,[...after]);
 assert.equal(steady.changed,false);
 assert.equal(steady.own.rankDelta,0);
 assert.equal(steady.own.likesDelta,0);
 assert.equal(compareRankSnapshots([],after).changed,false,'Initial fetch must not imply an invented change');
});
test('rank movement supports ties, lost counts, decreases and unavailable users',()=>{
 const before=[e('mawang0216','1',60),e('other','2',60),e('third','3',25)];
 const after=[e('mawang0216','1',49),e('other','2',65),e('third','3',25)];
 const changed=compareRankSnapshots(before,after);
 assert.equal(changed.own.rankDelta,-1);
 assert.equal(changed.own.likesDelta,-11);
 assert.equal(changed.rows.get('third').rankDelta,0);
 const lost=compareRankSnapshots(before,[e('mawang0216','1',null),e('other','2',65)]);
 assert.equal(lost.own.rankDelta,null);
 assert.equal(lost.own.likesDelta,null);
});
