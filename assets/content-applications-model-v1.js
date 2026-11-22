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
