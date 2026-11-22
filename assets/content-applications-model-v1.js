// Shared, side-effect-free rules for the SOOP application tracker.
export const MAWANG_ID='mawang0216';
export const MAX_CAMPAIGNS=100;
export const MAX_ENTRIES=50;
const text=(v,max=200)=>String(v??'').trim().slice(0,max);
const iso=v=>{const n=Date.parse(v);return Number.isFinite(n)?new Date(n).toISOString():''};
const count=v=>{if(v===null||v===undefined||v===''||typeof v==='boolean')return null;const n=Number(v);return Number.isSafeInteger(n)&&n>=0?n:null};
export function parsePostUrl(raw){
  try{
    const u=new URL(text(raw,512));
    if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port)return null;
    let m;
    if(['www.sooplive.com','sooplive.com','ch.sooplive.com','station.sooplive.com','www.sooplive.co.kr','sooplive.co.kr'].includes(u.hostname))m=u.pathname.match(/^\/station\/([a-zA-Z0-9_]+)\/post\/(\d+)\/?$/);
    if(!m&&['bj.afreecatv.com','bj.sooplive.co.kr','ch.sooplive.co.kr'].includes(u.hostname))m=u.pathname.match(/^\/([a-zA-Z0-9_]+)\/post\/(\d+)\/?$/);
    if(!m)return null;
    const station=m[1].toLowerCase(),postNo=m[2];
    if(station.length>40||postNo.length>18)return null;
    return {id:station+':'+postNo,station,postNo,url:`https://www.sooplive.com/station/${station}/post/${postNo}`};
  }catch{return null}
}
function imageUrl(v){try{const u=new URL(String(v||'').replace(/^\/\//,'https://'));return u.protocol==='https:'&&['profile.img.sooplive.co.kr','profile.img.afreecatv.com','stimg.sooplive.co.kr','stimg.afreecatv.com'].includes(u.hostname)?u.href:''}catch{return ''}}
export function commentPermalink(entry){
  const source=parsePostUrl(entry?.url);if(!source)return '';
  const no=String(entry?.commentNo??'');
  return /^\d{1,24}$/.test(no)?source.url+'#comment_noti'+no:source.url;
}
export function normalizeEntry(raw){
  const parsed=parsePostUrl(raw?.url);if(!parsed)return null;
  const checkedAt=iso(raw.checkedAt),userId=text(raw.userId,40).toLowerCase();
  return {...parsed,userId:/^[a-z0-9_]+$/.test(userId)?userId:'',nickname:text(raw.nickname,80),title:text(raw.title,200),avatar:imageUrl(raw.avatar),likes:checkedAt?count(raw.likes):null,views:checkedAt?count(raw.views):null,comments:checkedAt?count(raw.comments):null,checkedAt};
}
export function normalizeCampaigns(raw){
  const ids=new Set();return (Array.isArray(raw)?raw:[]).slice(0,MAX_CAMPAIGNS).flatMap(c=>{
    const id=text(c?.id,80),title=text(c?.title,100),deadline=iso(c?.deadline);
    if(!id||!title||!deadline||ids.has(id))return [];
    ids.add(id);const seen=new Set(),entries=(Array.isArray(c.entries)?c.entries:[]).slice(0,MAX_ENTRIES).flatMap(e=>{const n=normalizeEntry(e);if(!n||seen.has(n.id))return [];seen.add(n.id);return [n]});
    return [{id,title,deadline,entries}];
  });
}
export function parsePostMetadata(payload,entry,checkedAt=new Date().toISOString()){
  const record=payload?.data??payload;
  if(!record||Array.isArray(record)||String(record.title_no)!==entry.postNo||!record.user_id)throw Error('게시글 데이터 확인 실패');
  const result=normalizeEntry({...entry,userId:record.user_id,nickname:record.user_nick,title:record.title_name,avatar:record.profile_image,likes:record.count?.like_cnt,views:record.count?.read_cnt,comments:record.count?.comment_cnt,checkedAt});
  if(!result?.userId)throw Error('게시글 작성자 확인 실패');
  return result;
}
// Recruitment posts are sources, not applications. SOOP returns pinned BEST
// comments alongside chronological pages, so deduplicate by comment ID.
export function parseCommentPage(payload,source){
  const rows=payload?.data,meta=payload?.meta;
  if(!Array.isArray(rows)||!meta||!Number.isInteger(Number(meta.last_page))||Number(meta.last_page)<1)throw Error('댓글 페이지 확인 실패');
  const applicants=rows.flatMap(c=>{
    const userId=text(c?.user_id,40).toLowerCase(),commentNo=text(c?.p_comment_no,24);
    if(!/^[a-z0-9_]+$/.test(userId)||!/^\d+$/.test(commentNo)||userId===source.station||userId===source.userId)return [];
    if(c.title_no!=null&&String(c.title_no)!==source.postNo)return [];
    const comment=text(String(c.comment??'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' '),5000);
    return [{id:source.id+':'+commentNo,commentNo,userId,nickname:text(c.user_nick,80)||userId,avatar:imageUrl(c.profile_image),likes:count(c.like_cnt),comment,regDate:text(c.reg_date,50),best:c.is_best_top===true,url:source.url,sourceTitle:source.title||'',sourceId:source.id}];
  });
  return {applicants,pages:Number(meta.last_page),page:Number(meta.current_page),total:count(meta.total)};
}
export function uniqueApplicants(rows){
  const comments=new Map(),people=new Map();
  for(const row of rows)comments.set(row.id,row);
  for(const row of comments.values()){
    const prev=people.get(row.userId);
    if(!prev||(row.likes??-1)>(prev.likes??-1)||((row.likes??-1)===(prev.likes??-1)&&row.id.localeCompare(prev.id)<0))people.set(row.userId,row);
  }
  return [...people.values()];
}
export function countdown(deadline,now=Date.now()){
  const remaining=Math.max(0,Math.ceil((Date.parse(deadline)-now)/1000)||0);
  const days=Math.floor(remaining/86400),hours=Math.floor(remaining/3600)%24,minutes=Math.floor(remaining/60)%60,seconds=remaining%60;
  const hhmmss=[hours,minutes,seconds].map(v=>String(v).padStart(2,'0')).join(':');
  return {expired:remaining===0,remaining,label:remaining?(days?`${days}일 ${hhmmss}`:hhmmss):'만료'};
}
export function fromKstInput(value){
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return '';
  const result=iso(value+':00+09:00');return result&&toKstInput(result)===value?result:'';
}
export function toKstInput(value){const n=Date.parse(value);return Number.isFinite(n)?new Date(n+9*3600000).toISOString().slice(0,16):''}
export function rankEntries(entries,unavailable=new Set()){
  const eligible=entries.filter(e=>e.likes!==null&&!unavailable.has(e.id));
  const ordered=[...eligible].sort((a,b)=>b.likes-a.likes||a.id.localeCompare(b.id));
  const ranks=new Map();let previous=null,rank=0;
  ordered.forEach((e,i)=>{if(e.likes!==previous)rank=i+1;ranks.set(e.id,rank);previous=e.likes});
  const mawang=ordered.find(e=>e.userId===MAWANG_ID)||entries.find(e=>e.userId===MAWANG_ID)||null;
  const leader=ordered[0]||null;
  const ownRank=mawang?ranks.get(mawang.id)??null:null;
  const ahead=ownRank&&ownRank>1?ordered.filter(e=>e.likes>mawang.likes).at(-1):null;
  return {ordered,ranks,mawang,leader,ownRank,ahead,known:eligible.length,total:entries.length,allKnown:eligible.length===entries.length};
}
