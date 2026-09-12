/* CF MWS V 1.0.12 - primary system timezone: Asia/Seoul */
(()=>{
  if(window.__mwsKstCoreV112)return;window.__mwsKstCoreV112=1;
  const TZ='Asia/Seoul';
  const rawString=Date.prototype.toLocaleString,rawDate=Date.prototype.toLocaleDateString,rawTime=Date.prototype.toLocaleTimeString;
  const opts=o=>o&&Object.prototype.hasOwnProperty.call(o,'timeZone')?o:{...(o||{}),timeZone:TZ};
  Date.prototype.toLocaleString=function(locales,options){return rawString.call(this,locales,opts(options))};
  Date.prototype.toLocaleDateString=function(locales,options){return rawDate.call(this,locales,opts(options))};
  Date.prototype.toLocaleTimeString=function(locales,options){return rawTime.call(this,locales,opts(options))};
  window.MWS_PRIMARY_TIME_ZONE=TZ;
  window.mwsKstDateTime=value=>{const d=value instanceof Date?value:new Date(value);return Number.isNaN(d.getTime())?String(value??''):rawString.call(d,'ko-KR',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})};
})();


const DEFAULT_CATEGORIES=[
{id:crypto.randomUUID(),name:'개인',color:'#6b7280'},{id:crypto.randomUUID(),name:'합방',color:'#8b5cf6'},
{id:crypto.randomUUID(),name:'게임',color:'#3b82f6'},{id:crypto.randomUUID(),name:'광고',color:'#f59e0b'},
{id:crypto.randomUUID(),name:'소통',color:'#10b981'},{id:crypto.randomUUID(),name:'방셀',color:'#ec4899'},
{id:crypto.randomUUID(),name:'브산동',color:'#06b6d4'}];
const TIMEZONE_OPTIONS=[
{id:'Asia/Seoul',name:'서울'},{id:'Asia/Tokyo',name:'도쿄'},{id:'America/Los_Angeles',name:'로스앤젤레스'},
{id:'America/New_York',name:'뉴욕'},{id:'Europe/London',name:'런던'},{id:'Europe/Paris',name:'파리'},
{id:'Australia/Sydney',name:'시드니'},{id:'Asia/Singapore',name:'싱가포르'}];
const DEFAULT_TZS=['Asia/Seoul','Asia/Tokyo','America/Los_Angeles','America/New_York','Europe/London'];

const WORLD_SOURCE_ZONES=[
  {id:'Asia/Seoul',name:'한국 · 서울'},{id:'Asia/Tokyo',name:'일본 · 도쿄'},
  {id:'Asia/Shanghai',name:'중국 · 베이징/상하이'},{id:'Asia/Hong_Kong',name:'홍콩'},
  {id:'Asia/Taipei',name:'대만 · 타이베이'},{id:'Asia/Singapore',name:'싱가포르'},
  {id:'Asia/Bangkok',name:'태국 · 방콕'},{id:'Asia/Kolkata',name:'인도 · 뉴델리'},
  {id:'Asia/Dubai',name:'UAE · 두바이'},{id:'Europe/London',name:'영국 · 런던'},
  {id:'Europe/Paris',name:'프랑스 · 파리'},{id:'Europe/Berlin',name:'독일 · 베를린'},
  {id:'Europe/Moscow',name:'러시아 · 모스크바'},{id:'America/New_York',name:'미국 · 뉴욕 (ET)'},
  {id:'America/Chicago',name:'미국 · 시카고 (CT)'},{id:'America/Denver',name:'미국 · 덴버 (MT)'},
  {id:'America/Los_Angeles',name:'미국 · 로스앤젤레스 (PT)'},{id:'America/Vancouver',name:'캐나다 · 밴쿠버'},
  {id:'America/Sao_Paulo',name:'브라질 · 상파울루'},{id:'Pacific/Honolulu',name:'미국 · 하와이'},
  {id:'Australia/Perth',name:'호주 · 퍼스'},{id:'Australia/Sydney',name:'호주 · 시드니'},
  {id:'Pacific/Auckland',name:'뉴질랜드 · 오클랜드'},{id:'UTC',name:'UTC'}
];



function defaultMiniGames(){
  return {
    ladder:{players:[],prizes:[]},
    rps:{players:[]},
    pachinko:{players:[]},
    multiDraw:{players:[],targetCount:8}
  };
}
function normalizeMiniGameData(){
  const d=defaultMiniGames();
  if(!data.miniGames||typeof data.miniGames!=='object')data.miniGames={};
  for(const key of Object.keys(d)){
    if(!data.miniGames[key]||typeof data.miniGames[key]!=='object')data.miniGames[key]=structuredClone(d[key]);
  }
  ['ladder','rps','pachinko','multiDraw'].forEach(k=>{
    if(!Array.isArray(data.miniGames[k].players))data.miniGames[k].players=[];
    data.miniGames[k].players=data.miniGames[k].players.filter(Boolean).map(x=>({
      id:x.id||crypto.randomUUID(),contactId:String(x.contactId||''),name:String(x.name||'참가자'),image:String(x.image||''),description:String(x.description||''),sourcePostId:String(x.sourcePostId||''),sourceCommentId:String(x.sourceCommentId||''),sourceUserId:String(x.sourceUserId||'')
    }));
  });
  if(!Array.isArray(data.miniGames.ladder.prizes))data.miniGames.ladder.prizes=[];
  data.miniGames.ladder.prizes=data.miniGames.ladder.prizes.filter(Boolean).map(x=>({id:x.id||crypto.randomUUID(),label:String(x.label??'')}));
  while(data.miniGames.ladder.prizes.length<data.miniGames.ladder.players.length){
    const n=data.miniGames.ladder.prizes.length+1;
    data.miniGames.ladder.prizes.push({id:crypto.randomUUID(),label:`결과 ${n}`});
  }
  if(data.miniGames.ladder.prizes.length>data.miniGames.ladder.players.length)data.miniGames.ladder.prizes.splice(data.miniGames.ladder.players.length);
  data.miniGames.multiDraw.targetCount=Math.max(1,Math.min(150,Number(data.miniGames.multiDraw.targetCount)||8));

  delete data.miniGames.roulette;
  delete data.miniGames.capsule;
  delete data.miniGames.coin;
  delete data.miniGames.boxes;
  delete data.miniGames.lots;
}

const THEME_META=[{"id": "midnight", "name": "미드나잇", "bg": "#0f1115", "panel": "#171a21", "accent": "#8b5cf6"}, {"id": "neon", "name": "네온 퍼플", "bg": "#090b14", "panel": "#11172a", "accent": "#8b5cf6"}, {"id": "rose", "name": "로즈", "bg": "#160d14", "panel": "#24151f", "accent": "#e65b9c"}, {"id": "ocean", "name": "오션", "bg": "#071519", "panel": "#0e252c", "accent": "#22b8cf"}, {"id": "sunset", "name": "선셋", "bg": "#17100a", "panel": "#281a0f", "accent": "#f59f45"}, {"id": "emerald", "name": "에메랄드", "bg": "#07130e", "panel": "#10231a", "accent": "#22c55e"}, {"id": "ruby", "name": "루비", "bg": "#17090d", "panel": "#281118", "accent": "#ef4444"}, {"id": "sapphire", "name": "사파이어", "bg": "#08101d", "panel": "#101d35", "accent": "#3b82f6"}, {"id": "amethyst", "name": "애머시스트", "bg": "#120b1a", "panel": "#211330", "accent": "#a855f7"}, {"id": "lavender", "name": "라벤더", "bg": "#15131c", "panel": "#24212e", "accent": "#a78bfa"}, {"id": "sakura", "name": "사쿠라", "bg": "#1b1115", "panel": "#2d1b22", "accent": "#fb7185"}, {"id": "peach", "name": "피치", "bg": "#1b120d", "panel": "#2d1e16", "accent": "#fb923c"}, {"id": "coral", "name": "코랄", "bg": "#1b100f", "panel": "#2c1b19", "accent": "#f97366"}, {"id": "amber", "name": "앰버", "bg": "#171308", "panel": "#28200e", "accent": "#fbbf24"}, {"id": "lime", "name": "라임", "bg": "#101505", "panel": "#1b260b", "accent": "#84cc16"}, {"id": "mint", "name": "민트", "bg": "#081612", "panel": "#102821", "accent": "#34d399"}, {"id": "aqua", "name": "아쿠아", "bg": "#061518", "panel": "#0d282d", "accent": "#06b6d4"}, {"id": "cobalt", "name": "코발트", "bg": "#090e1c", "panel": "#121b38", "accent": "#4f6df5"}, {"id": "navy", "name": "네이비", "bg": "#08101a", "panel": "#101d2c", "accent": "#4678a9"}, {"id": "graphite", "name": "그래파이트", "bg": "#101214", "panel": "#1a1e22", "accent": "#7c8794"}, {"id": "silver", "name": "실버", "bg": "#17191d", "panel": "#24282e", "accent": "#aeb8c6"}, {"id": "coffee", "name": "커피", "bg": "#17110e", "panel": "#281d18", "accent": "#b77945"}, {"id": "forest", "name": "포레스트", "bg": "#09130b", "panel": "#132318", "accent": "#4d9a62"}, {"id": "cyber", "name": "사이버펑크", "bg": "#080812", "panel": "#141326", "accent": "#f0e130"}, {"id": "aurora", "name": "오로라", "bg": "#0a1016", "panel": "#111f29", "accent": "#33d6a6"}, {"id": "candy", "name": "캔디", "bg": "#17101c", "panel": "#281a31", "accent": "#e879f9"}, {"id": "wine", "name": "와인", "bg": "#160a10", "panel": "#28121c", "accent": "#c2416c"}, {"id": "teal", "name": "틸", "bg": "#071515", "panel": "#102827", "accent": "#2dd4bf"}, {"id": "sky", "name": "스카이", "bg": "#0a1219", "panel": "#122534", "accent": "#38bdf8"}, {"id": "plum", "name": "플럼", "bg": "#160f18", "panel": "#291a2d", "accent": "#d946ef"}, {"id": "cherry", "name": "체리", "bg": "#190b10", "panel": "#2b121b", "accent": "#f43f5e"}, {"id": "orange", "name": "오렌지", "bg": "#181007", "panel": "#2a1c0c", "accent": "#f97316"}];


/* v5.2 - Device-local presentation preferences. These never belong to shared cloud data. */
const MWS_DEVICE_PREFS_KEY='mws_device_preferences_v1';
const MWS_DEVICE_PREF_KEYS=['theme','backgroundImage','backgroundDim','textScale','resolutionMode','sidebarPinned','postViewMode','postCardColumns','dashboardUpcomingHidden'];
function mwsExtractDevicePrefs(src=data){
  const x=src&&typeof src==='object'?src:{};
  return {
    theme:String(x.theme||'neon'),
    backgroundImage:typeof x.backgroundImage==='string'?x.backgroundImage:'',
    backgroundDim:Math.max(0,Math.min(85,Number(x.backgroundDim??45))),
    textScale:Math.max(85,Math.min(130,Number(x.textScale)||100)),
    resolutionMode:['fhd','2k','4k','wide','mobile'].includes(String(x.resolutionMode||''))?String(x.resolutionMode):'fhd',
    sidebarPinned:x.sidebarPinned!==false,
    postViewMode:x.postViewMode==='list'?'list':'card',
    postCardColumns:Math.max(2,Math.min(5,Number(x.postCardColumns)||4)),
    dashboardUpcomingHidden:Boolean(x.dashboardUpcomingHidden)
  };
}
function mwsLoadDevicePrefs(){
  try{const raw=localStorage.getItem(MWS_DEVICE_PREFS_KEY);if(raw){const v=JSON.parse(raw);if(v&&typeof v==='object')return mwsExtractDevicePrefs(v)}}catch(_){}
  return null;
}
function mwsApplyDevicePrefs(target,prefs=mwsLoadDevicePrefs()){
  if(!target||typeof target!=='object'||!prefs)return target;
  Object.assign(target,mwsExtractDevicePrefs(prefs));
  return target;
}
function mwsSaveDevicePrefs(src=data){
  try{localStorage.setItem(MWS_DEVICE_PREFS_KEY,JSON.stringify(mwsExtractDevicePrefs(src)));return true}catch(e){console.error('개인 설정 저장 실패',e);return false}
}
function mwsStripDevicePrefs(src){
  const out=src&&typeof src==='object'?(typeof structuredClone==='function'?structuredClone(src):JSON.parse(JSON.stringify(src))):{};
  for(const key of MWS_DEVICE_PREF_KEYS)delete out[key];
  return out;
}

let data=loadData();
const loadedDataVersion=Number(data?.version||0);
if(!data.categories)data.categories=DEFAULT_CATEGORIES;
if(!data.contacts)data.contacts=[];
if(!Array.isArray(data.posts))data.posts=[];
if(!data.events)data.events=[];
if(!data.collaborations)data.collaborations=[];
if(!data.timezones)data.timezones=DEFAULT_TZS;
if(!data.memos)data.memos=[];
if(!data.targetList)data.targetList=[];
if(!data.contactTags)data.contactTags=[];
if(!data.contactTagBanners||typeof data.contactTagBanners!=='object'||Array.isArray(data.contactTagBanners))data.contactTagBanners={};
if(!Array.isArray(data.scheduleClipboard))data.scheduleClipboard=[];
if(data.sidebarPinned===undefined)data.sidebarPinned=true;
if(data.dashboardUpcomingHidden===undefined)data.dashboardUpcomingHidden=false;
normalizeMiniGameData();
if(loadedDataVersion<28)data.sidebarPinned=true;
if(!data.theme)data.theme='neon';
if(data.backgroundImage===undefined)data.backgroundImage='';
if(data.backgroundDim===undefined)data.backgroundDim=45;
const mwsStoredDevicePrefs=mwsLoadDevicePrefs();
if(mwsStoredDevicePrefs)mwsApplyDevicePrefs(data,mwsStoredDevicePrefs);
else mwsSaveDevicePrefs(data);
data.version=52;
data.contacts.forEach(c=>{if(c.pendingSetup===undefined)c.pendingSetup=false});
document.body.dataset.theme=data.theme;
document.body.classList.toggle('sidebar-pinned',Boolean(data.sidebarPinned));

let editingEventId=null,editingContactId=null,calDate=new Date(),contactView='cards';
let selectedParticipantIds=[];
let selectedParticipantStatuses={};
let datePickerMonth=new Date();
let datePickerTarget='evDate';
let timePickerState={target:'',ampm:'오후',hour:8,minute:0};
let wheelScrollTimers={};

function loadData(){
  const raw=localStorage.getItem('mawangSchedulerBeta');
  if(raw){try{return JSON.parse(raw)}catch(e){}}
  return {version:52,categories:DEFAULT_CATEGORIES,contacts:[],posts:[],events:[],collaborations:[],memos:[],targetList:[],contactTags:[],contactTagBanners:{},scheduleClipboard:[],favoriteFolders:[],postViewMode:'card',postCardColumns:4,textScale:100,resolutionMode:'fhd',selfContactId:'',sidebarPinned:true,dashboardUpcomingHidden:false,timezones:DEFAULT_TZS,theme:'neon',backgroundImage:'',backgroundDim:45,miniGames:defaultMiniGames()};
}
const AUTOSAVE_KEY='mawangSchedulerAutoBackups';

/* v4.20
   자동 백업 스냅샷 기능은 제거되었습니다.
   이전 버전에서 남아 있던 스냅샷도 즉시 삭제해 브라우저 저장공간을 회수합니다.
   아래 함수들은 구버전 호출과의 호환성을 위한 no-op 입니다.
*/
try{localStorage.removeItem(AUTOSAVE_KEY)}catch(_){}
function compactExistingAutosaves(){
  try{localStorage.removeItem(AUTOSAVE_KEY)}catch(_){}
}
function getAutoSnapshots(){return []}
function saveAutoSnapshots(){return false}
function snapshotPayload(){return null}
function snapshotSignature(){return ''}
function addAutoSnapshot(){return false}
function mergeSnapshotImages(snapshotData){
  return snapshotData&&typeof snapshotData==='object'
    ? JSON.parse(JSON.stringify(snapshotData))
    : snapshotData;
}

function isQuotaError(err){
  return err && (err.name==='QuotaExceededError' || err.name==='NS_ERROR_DOM_QUOTA_REACHED' || err.code===22 || err.code===1014);
}
function persist(){
  const raw=JSON.stringify(mwsStripDevicePrefs(data));
  try{
    localStorage.setItem('mawangSchedulerBeta',raw);
    return true;
  }catch(err){
    if(isQuotaError(err)){
      // Old automatic snapshot storage may still exist from an older file/version.
      try{localStorage.removeItem(AUTOSAVE_KEY)}catch(_){}
      try{
        localStorage.setItem('mawangSchedulerBeta',raw);
        return true;
      }catch(err2){
        console.error('저장 공간 부족',err2);
        return false;
      }
    }
    console.error('저장 실패',err);
    return false;
  }
}

function normalizeDataShape(){
  if(!data||typeof data!=='object')data={};
  if(!Array.isArray(data.categories))data.categories=[];
  if(!Array.isArray(data.contacts))data.contacts=[];
  if(!Array.isArray(data.posts))data.posts=[];
  if(!Array.isArray(data.events))data.events=[];
  if(!Array.isArray(data.collaborations))data.collaborations=[];
  if(!Array.isArray(data.timezones))data.timezones=[];
  if(!Array.isArray(data.memos))data.memos=[];
  if(!Array.isArray(data.targetList))data.targetList=[];
  if(!Array.isArray(data.contactTags))data.contactTags=[];
  if(!data.contactTagBanners||typeof data.contactTagBanners!=='object'||Array.isArray(data.contactTagBanners))data.contactTagBanners={};
  if(!Array.isArray(data.scheduleClipboard))data.scheduleClipboard=[];
  if(!Array.isArray(data.favoriteFolders))data.favoriteFolders=[];
  data.favoriteFolders=data.favoriteFolders.filter(Boolean).map(f=>({id:String(f.id||crypto.randomUUID()),name:String(f.name||'새 폴더').trim()||'새 폴더'}));
  data.postViewMode=data.postViewMode==='list'?'list':'card';
  data.postCardColumns=Math.max(2,Math.min(5,Number(data.postCardColumns)||4));
  data.textScale=Math.max(80,Math.min(200,Number(data.textScale)||100));
  data.resolutionMode=['fhd','2k','4k','wide','mobile'].includes(String(data.resolutionMode||''))?String(data.resolutionMode):'fhd';
  data.selfContactId=String(data.selfContactId||'');
  if(data.sidebarPinned===undefined)data.sidebarPinned=true;

if(data.dashboardUpcomingHidden===undefined)data.dashboardUpcomingHidden=false;
if(!Array.isArray(data.posts))data.posts=[];
data.posts=data.posts.filter(Boolean).map(p=>({
  id:p.id||crypto.randomUUID(),
  url:String(p.url||''),
  bjId:String(p.bjId||''),
  postNo:String(p.postNo||''),
  name:String(p.name||(`게시글 ${p.postNo||''}`)).trim()||'게시글',
  sourceTitle:String(p.sourceTitle||''),
  nameManual:p.nameManual===true || (p.nameManual===undefined && String(p.name||'').trim() && String(p.name||'').trim()!==`게시글 ${p.postNo||''}`),
  createdAt:p.createdAt||new Date().toISOString(),
  lastSyncAt:p.lastSyncAt||'',
  lastError:String(p.lastError||''),
  ignoredCommentKeys:Array.isArray(p.ignoredCommentKeys)?[...new Set(p.ignoredCommentKeys.filter(Boolean).map(String))]:[],
  comments:Array.isArray(p.comments)?p.comments.filter(Boolean).map(c=>({
    id:c.id||crypto.randomUUID(),commentNo:String(c.commentNo||c.p_comment_no||''),userId:String(c.userId||c.user_id||''),name:String(c.name||c.user_nick||'신청자'),profileImage:String(c.profileImage||c.profile_image||''),stationUrl:String(c.stationUrl||''),comment:String(c.comment||''),regDate:String(c.regDate||c.reg_date||''),photoUrl:String(c.photoUrl||''),upCount:Math.max(0,Number(c.upCount??c.up_count??c.up_cnt??c.like_count??c.like_cnt)||0),status:c.status==='excluded'?'nextchance':(['pending','selected','nextchance','gacha'].includes(c.status)?c.status:'pending')
  })):[]
}));
normalizeMiniGameData();

  // v1.6 legacy migration.
  // IMPORTANT: this must only run for genuinely old data.
  // Running it on every save makes user-created categories disappear
  // and makes deleted default categories come back.
  const sourceDataVersion=Number(data.version||0);
  const removedCategoryIds=new Set();
  if(sourceDataVersion>0 && sourceDataVersion<16){
    data.categories
      .filter(c=>['촬영','서버'].includes(String(c?.name||'').trim()))
      .forEach(c=>removedCategoryIds.add(c.id));
    data.categories=data.categories.filter(c=>!['촬영','서버'].includes(String(c?.name||'').trim()));
    if(!data.categories.some(c=>String(c?.name||'').trim()==='브산동')){
      data.categories.push({id:crypto.randomUUID(),name:'브산동',color:'#06b6d4'});
    }
  }

  data.memos=data.memos.filter(Boolean).map(m=>({
    ...m,
    id:m.id||crypto.randomUUID(),
    title:String(m.title||'제목 없는 메모'),
    content:String(m.content||''),
    createdAt:m.createdAt||new Date().toISOString(),
    updatedAt:m.updatedAt||m.createdAt||new Date().toISOString()
  }));

    data.contacts=data.contacts.filter(Boolean).map(c=>({
    ...c,
    id:c.id||crypto.randomUUID(),
    name:String(c.name||'이름 없음'),
    image:typeof c.image==='string'?c.image:'',
    labels:Array.isArray(c.labels)?[...new Set(c.labels.filter(Boolean).map(String))]:[],
    stationUrl:typeof c.stationUrl==='string'?c.stationUrl:'',
    notes:typeof c.notes==='string'?c.notes:'',
    applicationHistory:Array.isArray(c.applicationHistory)?c.applicationHistory.filter(Boolean).map(a=>({
      id:a.id||crypto.randomUUID(),postId:String(a.postId||''),postNo:String(a.postNo||''),postTitle:String(a.postTitle||'게시글'),postUrl:String(a.postUrl||''),soopUserId:String(a.soopUserId||''),firstAppliedAt:String(a.firstAppliedAt||''),lastAppliedAt:String(a.lastAppliedAt||''),commentCount:Math.max(1,Number(a.commentCount)||1),latestComment:String(a.latestComment||''),status:a.status==='excluded'?'nextchance':(['pending','selected','nextchance','gacha'].includes(a.status)?a.status:'pending'),lastSyncedAt:String(a.lastSyncedAt||'')
    })):[],
    pendingSetup:Boolean(c.pendingSetup)
  }));
  {
    const ordered=[];const seen=new Set();
    [...(data.contactTags||[]),...data.contacts.flatMap(c=>c.labels||[])].forEach(raw=>{
      const tag=String(raw||'').trim();
      if(tag&&!seen.has(tag)){seen.add(tag);ordered.push(tag)}
    });
    data.contactTags=ordered;
  }
  const validContactIds=new Set(data.contacts.map(c=>c.id));
  if(data.selfContactId&&!validContactIds.has(data.selfContactId))data.selfContactId='';
  data.targetList=[...new Set(data.targetList.filter(id=>validContactIds.has(id)))];
  try{syncAllPostContactApplicationHistories()}catch(_){}

  data.events=data.events.filter(Boolean).map(e=>{
    const participants=Array.isArray(e.participants)?[...new Set(e.participants.filter(Boolean))]:[];
    const rawStatuses=e.participantStatuses&&typeof e.participantStatuses==='object'?e.participantStatuses:{};
    const participantStatuses={};
    participants.forEach(id=>{
      // Legacy schedules did not have status. Existing selections are treated as confirmed.
      participantStatuses[id]=rawStatuses[id]==='planned'?'planned':'confirmed';
    });
    return {
      ...e,
      id:e.id||crypto.randomUUID(),
      title:String(e.title||'제목 없음'),
      date:String(e.date||todayKST()),
      start:e.start||'TBD',
      end:e.end||'TBD',
      participants,
      participantStatuses,
      autoSelfParticipantId:String(e.autoSelfParticipantId||''),
      checklist:Array.isArray(e.checklist)?e.checklist:[],
      memoTitle:String(e.memoTitle||''),
      memoContent:String(e.memoContent||''),
      favorite:Boolean(e.favorite),
      favoriteFolderId:String(e.favoriteFolderId||''),
      completed:false,
      restDay:Boolean(e.restDay),
      seriesId:typeof e.seriesId==='string'?e.seriesId:'',
      seriesIndex:e.seriesIndex===null||e.seriesIndex===undefined?null:Number(e.seriesIndex),
      repeatConfig:e.repeatConfig&&typeof e.repeatConfig==='object'?e.repeatConfig:null
    };
  });
  // v4.8: the selected user is automatically present in every non-rest content.
  // Only participants inserted by this system are marked in autoSelfParticipantId,
  // so manually-added people are never removed when the selected user changes.
  {
    const currentSelfId=data.selfContactId&&validContactIds.has(data.selfContactId)?data.selfContactId:'';
    data.events.forEach(e=>{
      if(e.restDay)return;
      const managed=String(e.autoSelfParticipantId||'');
      if(managed&&managed!==currentSelfId){
        e.participants=(e.participants||[]).filter(id=>id!==managed);
        if(e.participantStatuses)delete e.participantStatuses[managed];
        e.autoSelfParticipantId='';
      }
      if(currentSelfId&&!(e.participants||[]).includes(currentSelfId)){
        e.participants.push(currentSelfId);
        e.participantStatuses[currentSelfId]='confirmed';
        e.autoSelfParticipantId=currentSelfId;
      }
    });
  }

  {
    const validFavoriteFolderIds=new Set(data.favoriteFolders.map(f=>f.id));
    data.events.forEach(e=>{if(e.favoriteFolderId&&!validFavoriteFolderIds.has(e.favoriteFolderId))e.favoriteFolderId=''});
  }
  if(removedCategoryIds.size){
    data.events.forEach(e=>{
      if(removedCategoryIds.has(e.categoryId))e.categoryId='';
    });
  }

  data.collaborations=data.collaborations.filter(Boolean).map(c=>({
    ...c,
    id:c.id||crypto.randomUUID(),
    title:String(c.title||'컨텐츠'),
    date:String(c.date||''),
    participants:Array.isArray(c.participants)?[...new Set(c.participants.filter(Boolean))]:[]
  })).filter(c=>c.date && !c.restDay && String(c.title||'').trim()!=='휴방');

  if(!data.theme)data.theme='neon';
  if(data.backgroundImage===undefined)data.backgroundImage='';
  if(data.backgroundDim===undefined)data.backgroundDim=45;
  data.version=52;
}

function saveData(reason='데이터 저장'){
  normalizeDataShape();
  lastSyncReason=reason;
  const saved=persist();
  renderAll(reason);
  updateStorageStatus(saved);
  try{
    window.dispatchEvent(new CustomEvent('mawang:datachange',{detail:{reason}}));
  }catch(e){}
  return saved;
}
window.addEventListener('mawang:datachange',e=>{
  const status=document.getElementById('syncStatusText');
  if(status)status.textContent='전체 화면 동기화';
});
function updateStorageStatus(saved=true){
  const el=document.getElementById('storageStatus');
  if(!el)return;
  if(document.body.dataset.mwsMode==='public'){el.textContent='세션 전용 · 자동 저장 안 함';el.style.borderColor='var(--accent)';return}
  try{
    const main=(localStorage.getItem('mawangSchedulerBeta')||'').length;
    const mb=(main/1024/1024).toFixed(2);
    el.textContent=saved?`정상 · 약 ${mb} MB`:`저장 공간 부족`;
    el.style.borderColor=saved?'var(--border)':'var(--danger)';
  }catch(e){el.textContent=saved?'정상':'저장 오류'}
}
function toast(title,msg=null){
  const t=document.getElementById('toast');
  const actualTitle=msg===null?'알림':title;
  const actualMsg=msg===null?title:msg;
  t.innerHTML=`<div class="toast-title">${esc(actualTitle)}</div><div class="toast-message">${esc(actualMsg)}</div>`;
  t.style.display='block';
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.style.display='none',2700);
}
function dt(ev){
  const time=ev.restDay?'23:59':(!ev.start||ev.start==='TBD'?'23:58':ev.start);
  return new Date(ev.date+'T'+time+':00');
}
function ymd(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function todayKST(){
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function formatDate(s){return new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric'}).format(new Date(s+'T12:00:00'))}
function weekdayName(s){return new Intl.DateTimeFormat('ko-KR',{weekday:'short'}).format(new Date(s+'T12:00:00'))}
function formatDateWeekday(s){return `${formatDate(s)} (${weekdayName(s)})`}
function shortDateWeekday(s){
  const d=new Date(s+'T12:00:00');
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${weekdayName(s)})`;
}
function daysUntil(dateStr){
  const a=new Date(todayKST()+'T12:00:00'),b=new Date(dateStr+'T12:00:00');
  return Math.round((b-a)/86400000);
}

function formatTimeKorean(v){
  if(v==='TBD')return '미확정';
  if(!v)return '시간 선택';
  const [h,m]=v.split(':').map(Number);
  if(Number.isNaN(h)||Number.isNaN(m))return '미확정';
  const ap=h<12?'오전':'오후',hh=h%12||12;
  return `${ap} ${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function category(id){return data.categories.find(c=>c.id===id)}
function contact(id){return data.contacts.find(c=>c.id===id)}
function activeEvents(){return data.events}
function upcomingEvents(){
  const today=todayKST();
  return activeEvents()
    .filter(e=>!e.restDay && e.date>=today)
    .sort((a,b)=>dt(a)-dt(b));
}
function checklistProgress(ev){const a=ev.checklist||[];if(!a.length)return[0,0,0];const done=a.filter(x=>x.done).length;return[done,a.length,Math.round(done/a.length*100)]}
function getLastCollab(contactId){
  if(typeof normalizedCollaborationHistory==='function'){
    return normalizedCollaborationHistory().find(c=>(c.participants||[]).includes(contactId))||null;
  }
  const today=todayKST();
  const arr=(data.collaborations||[]).filter(c=>c.date<today&&!c.restDay&&String(c.title||'').trim()!=='휴방'&&c.participants?.includes(contactId)).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return arr[0]||null;
}
function daysSince(dateStr){
  const today=new Date(todayKST()+'T12:00:00');
  const target=new Date(dateStr+'T12:00:00');
  return Math.max(0,Math.floor((today-target)/86400000));
}
function initials(name){return(name||'?').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function rgba(hex,a=.16){const h=(hex||'#64748b').replace('#','');if(h.length!==6)return `rgba(100,116,139,${a})`;const n=parseInt(h,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`}
function deviceChip(e){return e.device?`<span class="chip device-chip">${esc(e.device)}</span>`:''}

function setTab(tab){
  if(tab==='reminders'){tab='dashboard';dashboardMode='reminders'}
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===tab));
  const names={dashboard:'대시보드',calendar:'캘린더',contacts:'연락처',posts:'게시글',sniper:'최근 합방 인원',targets:'저격 리스트',memos:'메모',worldtime:'세계 시간',gameLadder:'사다리타기',gameRps:'가위바위보',gamePachinko:'경마',gameMultiDraw:'Gacha 뽑기',export:'가져오기 / 내보내기',settings:'설정'};
  document.getElementById('pageTitle').textContent=names[tab]||tab;
  // 탭 이동 시에도 같은 중앙 데이터에서 최신 상태를 다시 계산
  if(tab==='calendar')safeRenderView('캘린더',renderCalendar);
  if(tab==='worldtime')safeRenderView('세계 시간',renderWorldTime);
  if(tab==='sniper')safeRenderView('최근 합방 인원',()=>{sniperViewMode==='ranking'?renderCollabRanking():renderSniperList()});
  if(tab==='targets')safeRenderView('저격 리스트',renderTargetList);
  if(tab==='memos')safeRenderView('메모',()=>{memoViewMode==='favorites'?renderFavoriteSchedules():renderMemoLibrary()});
  if(tab==='dashboard')safeRenderView('대시보드',renderDashboard);
  if(tab==='contacts')safeRenderView('연락처',renderContacts);
  if(tab==='posts')safeRenderView('게시글',renderPosts);
  if(tab==='gameLadder')safeRenderView('사다리타기',renderLadder);
  if(tab==='gameRps')safeRenderView('가위바위보',renderRps);
  if(tab==='gamePachinko')safeRenderView('경마',renderPachinko);
  if(tab==='gameMultiDraw')safeRenderView('Gacha 뽑기',renderMultiDraw);
}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
function syncSidebarPinUI(){
  document.body.classList.toggle('sidebar-pinned',Boolean(data.sidebarPinned));
  const btn=document.getElementById('sidebarPinBtn');
  const label=btn?.querySelector('.sidebar-pin-label');
  if(btn)btn.classList.toggle('active',Boolean(data.sidebarPinned));
  if(label)label.textContent=data.sidebarPinned?'고정 해제':'고정';
  if(btn)btn.title=data.sidebarPinned?'메뉴 고정 해제':'메뉴 고정';
}
document.getElementById('sidebarPinBtn').onclick=()=>{
  data.sidebarPinned=!data.sidebarPinned;
  mwsSaveDevicePrefs(data);
  syncSidebarPinUI();
};
syncSidebarPinUI();

function tickClock(){
  const now=new Date();
  document.getElementById('clockText').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now);
  document.getElementById('todayText').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(now);
}
setInterval(tickClock,1000);

let dashboardPinnedEventId=null;
let dashboardHoverEventId=null;

function dashboardUpcomingCardHTML(e){
  const cat=category(e.categoryId),[d,t]=checklistProgress(e),color=e.restDay?'#e85d75':(cat?.color||'#64748b');
  const pinClass=dashboardPinnedEventId===e.id?'pinned':'';
  if(e.restDay){
    return `<div class="event-card rest-event dashboard-upcoming-card ${pinClass}"
      data-event-id="${e.id}"
      onmouseenter="dashboardHoverEvent('${e.id}')"
      onmouseleave="dashboardLeaveEvent('${e.id}')"
      onclick="event.stopPropagation();dashboardPinEvent('${e.id}')"
      style="border-left:4px solid ${color};background:${rgba(color,.10)}">
      <div class="space"><div class="event-title">휴방</div><span class="chip" style="border-color:${color}">휴방</span></div>
      <div class="event-meta"><span>${formatDateWeekday(e.date)}</span><span>하루 종일</span></div>
    </div>`;
  }
  return `<div class="event-card dashboard-upcoming-card ${pinClass}"
    data-event-id="${e.id}"
    onmouseenter="dashboardHoverEvent('${e.id}')"
    onmouseleave="dashboardLeaveEvent('${e.id}')"
    onclick="event.stopPropagation();dashboardPinEvent('${e.id}')"
    style="border-left:4px solid ${color};background:${rgba(color,.08)}">
    <div class="space">
      <div class="event-title">${esc(e.title)}</div>
      <div class="row">${deviceChip(e)}${cat?`<span class="chip" style="border-color:${color}">${esc(cat.name)}</span>`:''}</div>
    </div>
    <div class="event-meta"><span>${formatDateWeekday(e.date)}</span><span>${formatTimeKorean(e.start)}</span><span>Memo ${d}/${t}</span></div>
  </div>`;
}
function dashboardDefaultEvent(){
  return upcomingEvents()[0]||null;
}
function dashboardSelectedEvent(){
  const up=upcomingEvents();
  if(dashboardPinnedEventId){
    const pinned=up.find(e=>e.id===dashboardPinnedEventId);
    if(pinned)return pinned;
    dashboardPinnedEventId=null;
  }
  if(dashboardHoverEventId){
    const hovered=up.find(e=>e.id===dashboardHoverEventId);
    if(hovered)return hovered;
    dashboardHoverEventId=null;
  }
  return up[0]||null;
}
function dashboardDetailHTML(e){
  if(!e)return '<div class="empty">예정된 컨텐츠가 없습니다</div>';
  if(e.restDay){
    const color='#e85d75';
    return `<div class="space">
      <div class="dashboard-detail-title">휴방</div>
      <span class="chip" style="border-color:${color}">휴방</span>
    </div>
    <div class="event-meta"><span>${formatDateWeekday(e.date)}</span><span>하루 종일</span></div>
    <div class="muted small" style="margin-top:14px">해당 날짜는 휴방으로 등록되어 있습니다.</div>
    <div class="row" style="margin-top:15px"><button class="secondary" onclick="event.stopPropagation();openEvent('${e.id}')">수정</button></div>`;
  }

  const cat=category(e.categoryId),[done,total,pct]=checklistProgress(e),people=eventParticipantRows(e),color=cat?.color||'#64748b';
  const memos=e.checklist||[];
  const description=(e.description||'').trim();
  return `<div class="space" style="align-items:flex-start">
    <div>
      <div class="dashboard-detail-title">${esc(e.title)}</div>
      <div class="event-meta">
        <span>${formatDateWeekday(e.date)}</span>
        <span>${formatTimeKorean(e.start)}${e.end?` - ${formatTimeKorean(e.end)}`:''}</span>
      </div>
    </div>
    <div class="row">${deviceChip(e)}${cat?`<span class="chip" style="border-color:${color}">${esc(cat.name)}</span>`:''}</div>
  </div>

  <div class="dashboard-participant-list">
    ${people.length?people.map(({person,status})=>`<div class="dashboard-person">
      ${person.image?`<img class="dashboard-person-avatar" loading="lazy" src="${person.image}">`:`<span class="dashboard-person-avatar avatar" style="display:grid;place-items:center">${esc(initials(person.name))}</span>`}
      <span class="dashboard-person-name">${esc(person.name)}</span>
      <span class="status-badge ${participantStatusClass(status)}">${participantStatusLabel(status)}</span>
    </div>`).join(''):'<span class="muted small">참여자 없음</span>'}
  </div>

  <div class="small muted" style="margin-bottom:6px">Memo ${done} / ${total}</div>
  <div class="progress"><div style="width:${pct}%"></div></div>
  ${memos.length?`<div class="dashboard-memo-list">${memos.slice(0,4).map(x=>`<div class="dashboard-memo-item ${x.done?'done':''}"><span>${x.done?'✓':'○'}</span><span>${esc(x.text)}</span></div>`).join('')}${memos.length>4?`<div class="muted small">외 ${memos.length-4}개 Memo</div>`:''}</div>`:''}
  ${description?`<div class="dashboard-detail-description">${esc(description)}</div>`:''}

  <div class="row" style="margin-top:14px">
    ${e.url?`<button class="secondary" onclick="event.stopPropagation();openEventUrl('${e.id}')">공지 열기</button>`:''}
    <button class="secondary" onclick="event.stopPropagation();openEvent('${e.id}')">수정</button>
  </div>`;
}
function renderDashboardDetail(eventId=null){
  const e=eventId?data.events.find(x=>x.id===eventId):dashboardSelectedEvent();
  const box=document.getElementById('nextStreamCard');
  if(box)box.innerHTML=dashboardDetailHTML(e);
  const edit=document.getElementById('editNextBtn');
  if(edit){
    edit.style.display=e?'':'none';
    edit.onclick=e?()=>openEvent(e.id):null;
  }
}
function updateDashboardPinnedStyles(){
  document.querySelectorAll('#upcomingDashboard .dashboard-upcoming-card').forEach(el=>{
    el.classList.toggle('pinned',el.dataset.eventId===dashboardPinnedEventId);
  });
}
window.dashboardHoverEvent=id=>{
  if(dashboardPinnedEventId)return;
  dashboardHoverEventId=id;
  renderDashboardDetail(id);
}
window.dashboardLeaveEvent=id=>{
  if(dashboardPinnedEventId)return;
  if(dashboardHoverEventId===id)dashboardHoverEventId=null;
  renderDashboardDetail();
}
window.dashboardPinEvent=id=>{
  dashboardPinnedEventId=id;
  dashboardHoverEventId=null;
  renderDashboardDetail(id);
  updateDashboardPinnedStyles();
}
window.dashboardResetPreview=()=>{
  dashboardPinnedEventId=null;
  dashboardHoverEventId=null;
  renderDashboardDetail();
  updateDashboardPinnedStyles();
}
function renderDashboard(){
  const up=upcomingEvents(),next=up[0];
  document.getElementById('contactCountKpi').textContent=data.contacts.length;
  document.getElementById('weekCountKpi').textContent=up.filter(e=>dt(e)<=new Date(Date.now()+7*86400000)).length;
  document.getElementById('nextStreamKpi').textContent=next?(next.restDay?`${shortDateWeekday(next.date)} 휴방`:`${shortDateWeekday(next.date)} ${formatTimeKorean(next.start)}`):'없음';

  if(dashboardPinnedEventId&&!up.some(e=>e.id===dashboardPinnedEventId))dashboardPinnedEventId=null;
  if(dashboardHoverEventId&&!up.some(e=>e.id===dashboardHoverEventId))dashboardHoverEventId=null;

  const visibleCount=Math.min(up.length,15);
  document.getElementById('upcomingDashboard').innerHTML=up.slice(0,15).map(dashboardUpcomingCardHTML).join('')||'<div class="empty">예정된 컨텐츠가 없습니다</div>';

  const dashboard=document.getElementById('dashboard');
  const hidden=Boolean(data.dashboardUpcomingHidden);
  dashboard?.classList.toggle('dashboard-upcoming-hidden',hidden);

  const toggle=document.getElementById('toggleUpcomingDashboardBtn');
  if(toggle){
    toggle.textContent=hidden?'예정 컨텐츠 보이기':'예정 컨텐츠 숨기기';
    toggle.setAttribute('aria-pressed',String(hidden));
  }
  const summary=document.getElementById('upcomingDashboardSummary');
  if(summary)summary.textContent=hidden?`예정 컨텐츠 ${up.length}개 · 숨김`:`예정 컨텐츠 ${up.length}개`;
  const count=document.getElementById('upcomingDashboardCount');
  if(count)count.textContent=up.length>15?`전체 ${up.length}개 중 15개 표시`:`${visibleCount}개 표시`;

  renderDashboardDetail();
  updateDashboardPinnedStyles();
}
document.getElementById('dashboard').addEventListener('click',e=>{
  if(e.target.closest('button,a,input,select,textarea,.dashboard-upcoming-card,#nextStreamCard'))return;
  dashboardResetPreview();
});

document.getElementById('toggleUpcomingDashboardBtn').onclick=()=>{
  data.dashboardUpcomingHidden=!Boolean(data.dashboardUpcomingHidden);
  if(data.dashboardUpcomingHidden)dashboardResetPreview();
  mwsSaveDevicePrefs(data);
  renderDashboard();
  toast('대시보드',data.dashboardUpcomingHidden?'예정 컨텐츠 목록을 숨겼습니다':'예정 컨텐츠 목록을 다시 표시합니다');
};
/* v3.1 - pinned dashboard preview resets from any non-card click */
document.addEventListener('pointerdown',e=>{
  const dashboard=document.getElementById('dashboard');
  if(!dashboard?.classList.contains('active'))return;
  if(!dashboardPinnedEventId)return;

  /* Another upcoming card is allowed to become the new pinned card. */
  if(e.target.closest?.('.dashboard-upcoming-card'))return;

  dashboardResetPreview();
},{capture:true});

window.openEventUrl=id=>{const e=data.events.find(x=>x.id===id);if(e?.url)window.open(e.url,'_blank','noopener')}

function reminderCardHTML(e){
  const cat=category(e.categoryId),color=e.restDay?'#e85d75':(cat?.color||'#64748b');
  const people=eventParticipantRows(e);
  const checks=e.checklist||[];
  const [done,total,pct]=checklistProgress(e);
  const d=daysUntil(e.date);
  const dLabel=d===0?'D-DAY':d===1?'D-1':d>1?`D-${d}`:d<0?`D+${Math.abs(d)}`:'';
  const dateObj=new Date(e.date+'T12:00:00');
  if(e.restDay){
    return `<div class="reminder-card" style="border-left:4px solid ${color}">
      <div class="reminder-main">
        <div class="reminder-datebox">
          <div class="reminder-weekday">${weekdayName(e.date)}</div>
          <div class="reminder-date">${dateObj.getMonth()+1}월 ${dateObj.getDate()}일<br>${dateObj.getFullYear()}</div>
        </div>
        <div><div class="reminder-title">휴방</div><div class="event-meta"><span>하루 종일</span></div></div>
        <div class="dday">${dLabel}</div>
      </div>
    </div>`;
  }
  return `<div class="reminder-card" style="border-left:4px solid ${color}">
    <div class="reminder-main">
      <div class="reminder-datebox">
        <div class="reminder-weekday">${weekdayName(e.date)}</div>
        <div class="reminder-date">${dateObj.getMonth()+1}월 ${dateObj.getDate()}일<br>${dateObj.getFullYear()}</div>
      </div>
      <div>
        <div class="space" style="align-items:flex-start">
          <div class="reminder-title">${esc(e.title)}</div>
          <div class="row">${deviceChip(e)}${cat?`<span class="chip" style="border-color:${color}">${esc(cat.name)}</span>`:''}</div>
        </div>
        <div class="event-meta">
          <span>${formatTimeKorean(e.start)}${e.end?` - ${formatTimeKorean(e.end)}`:''}</span>
          <span class="weekday-inline">${weekdayName(e.date)}</span>
          <span>Memo ${done}/${total}</span>
        </div>
        <div class="progress" style="margin-top:9px"><div style="width:${pct}%"></div></div>
      </div>
      <div class="dday">${dLabel}</div>
    </div>

    <div class="reminder-section">
      <div class="reminder-label">참가자 ${people.length?`· ${people.length}명`:''}</div>
      <div class="reminder-people">
        ${people.length?people.map(({person,status})=>`<span class="reminder-person">${person.image?`<img class="avatar sm" loading="lazy" src="${person.image}">`:''}<span>${esc(person.name)}</span><span class="status-badge ${participantStatusClass(status)}">${participantStatusLabel(status)}</span></span>`).join(''):'<span class="muted small">등록된 참가자가 없습니다</span>'}
      </div>
    </div>

    <div class="reminder-section">
      <div class="reminder-label">Memo</div>
      <div class="reminder-checks">
        ${checks.length?checks.slice(0,8).map(x=>`<div class="reminder-check ${x.done?'done':''}"><span>${x.done?'✓':'○'}</span><span>${esc(x.text)}</span></div>`).join(''):'<span class="muted small">등록된 Memo가 없습니다</span>'}
      </div>
      ${checks.length>8?`<div class="muted small" style="margin-top:7px">외 ${checks.length-8}개 항목</div>`:''}
    </div>

    <div class="row" style="margin-top:12px">
      ${e.url?`<button class="secondary small" onclick="openEventUrl('${e.id}')">공지 열기</button>`:''}
      <button class="secondary small" onclick="openEvent('${e.id}')">스케줄 수정</button>
    </div>
  </div>`;
}
let reminderFilter='all';
function startOfWeekSunday(d){
  const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-x.getDay());return x;
}
function endOfWeekSaturday(d){
  const x=startOfWeekSunday(d);x.setDate(x.getDate()+6);return x;
}
function reminderFilterRange(mode){
  const now=new Date();now.setHours(12,0,0,0);
  if(mode==='thisWeek')return [startOfWeekSunday(now),endOfWeekSaturday(now),'이번 주'];
  if(mode==='nextWeek'){
    const s=startOfWeekSunday(now);s.setDate(s.getDate()+7);
    const e=new Date(s);e.setDate(e.getDate()+6);
    return [s,e,'다음 주'];
  }
  if(mode==='thisMonth'){
    return [new Date(now.getFullYear(),now.getMonth(),1,12),new Date(now.getFullYear(),now.getMonth()+1,0,12),'이번 달'];
  }
  if(mode==='nextMonth'){
    return [new Date(now.getFullYear(),now.getMonth()+1,1,12),new Date(now.getFullYear(),now.getMonth()+2,0,12),'다음 달'];
  }
  return [null,null,'전체'];
}
function renderReminders(){
  let up=upcomingEvents();
  const [rangeStart,rangeEnd,label]=reminderFilterRange(reminderFilter);
  if(rangeStart&&rangeEnd){
    up=up.filter(e=>{
      const d=new Date(e.date+'T12:00:00');
      return d>=rangeStart&&d<=rangeEnd;
    });
  }
  document.querySelectorAll('.reminder-filter').forEach(b=>b.classList.toggle('active',b.dataset.reminderFilter===reminderFilter));
  const note=document.getElementById('reminderRangeNote');
  if(note){
    note.textContent=rangeStart?`${label} · ${shortDateWeekday(ymd(rangeStart))} - ${shortDateWeekday(ymd(rangeEnd))}`:`전체 예정 컨텐츠`;
  }

  if(reminderFilter!=='all'){
    document.getElementById('reminderTimeline').innerHTML=up.length
      ? `<div class="timeline-group"><div class="list">${up.map(reminderCardHTML).join('')}</div></div>`
      : `<div class="empty">${label}에 예정된 컨텐츠가 없습니다</div>`;
    return;
  }

  const today=ymd(new Date());
  const tomorrow=ymd(new Date(Date.now()+86400000));
  const seven=ymd(new Date(Date.now()+7*86400000));
  const groups=[
    ['오늘',e=>e.date===today],
    ['내일',e=>e.date===tomorrow],
    ['7일 이내',e=>e.date>tomorrow&&e.date<=seven],
    ['이후',e=>e.date>seven]
  ];
  document.getElementById('reminderTimeline').innerHTML=groups.map(([name,fn])=>{
    const arr=up.filter(fn);
    return arr.length?`<div class="timeline-group"><h3>${name}</h3><div class="list">${arr.map(reminderCardHTML).join('')}</div></div>`:'';
  }).join('')||'<div class="empty">예정된 컨텐츠가 없습니다</div>';
}
document.querySelectorAll('.reminder-filter').forEach(b=>b.onclick=()=>{reminderFilter=b.dataset.reminderFilter;renderReminders()});

function sundayIndex(jsDay){return jsDay}
function calendarParticipantSummary(e){
  const names=eventParticipantRows(e).map(x=>x.person.name).filter(Boolean);
  if(!names.length)return '';
  const shown=names.slice(0,4).map(esc);
  const extra=names.length-4;
  return `${shown.join(' · ')}${extra>0?` +${extra}명`:''}`;
}
function calendarPreviewHTML(e){
  const cat=category(e.categoryId),color=e.restDay?'#e85d75':(cat?.color||'#64748b');
  if(e.restDay){
    return `<div class="space">
      <div class="calendar-preview-title">휴방</div>
      <span class="chip" style="border-color:${color}">휴방</span>
    </div>
    <div class="event-meta"><span>${formatDateWeekday(e.date)}</span><span>하루 종일</span></div>`;
  }
  const people=eventParticipantRows(e);
  return `<div class="space" style="align-items:flex-start">
    <div class="calendar-preview-title">${esc(e.title)}</div>
    <div class="row">${deviceChip(e)}${cat?`<span class="chip" style="border-color:${color}">${esc(cat.name)}</span>`:''}</div>
  </div>
  <div class="event-meta">
    <span>${formatDateWeekday(e.date)}</span>
    ${e.start==='TBD'?'':`<span>${formatTimeKorean(e.start)}${e.end&&e.end!=='TBD'?` - ${formatTimeKorean(e.end)}`:''}</span>`}
  </div>
  <div class="reminder-section" style="margin-top:10px;padding-top:9px">
    <div class="reminder-label">참가자 ${people.length?`· ${people.length}명`:''}</div>
    <div class="calendar-preview-people">
      ${people.length?people.map(({person,status})=>`<div class="calendar-preview-person">
        ${person.image?`<img class="avatar" loading="lazy" src="${person.image}">`:`<span class="avatar" style="display:grid;place-items:center">${esc(initials(person.name))}</span>`}
        <span style="min-width:0">
          <span class="calendar-preview-person-name">${esc(person.name)}</span>
          <span class="status-badge ${participantStatusClass(status)}" style="margin-top:3px">${participantStatusLabel(status)}</span>
        </span>
      </div>`).join(''):'<span class="muted small">등록된 참가자가 없습니다</span>'}
    </div>
  </div>`;
}
function positionCalendarEventPreview(clientX,clientY){
  const preview=document.getElementById('calendarEventPreview');
  if(!preview||!preview.classList.contains('open'))return;
  const gap=14;
  let left=clientX+gap,top=clientY+gap;
  const rect=preview.getBoundingClientRect();
  if(left+rect.width>window.innerWidth-10)left=clientX-rect.width-gap;
  if(top+rect.height>window.innerHeight-10)top=clientY-rect.height-gap;
  preview.style.left=Math.max(10,left)+'px';
  preview.style.top=Math.max(10,top)+'px';
}
function showCalendarEventPreview(id,clientX,clientY){
  const e=data.events.find(x=>x.id===id),preview=document.getElementById('calendarEventPreview');
  if(!e||!preview)return;
  preview.innerHTML=calendarPreviewHTML(e);
  preview.classList.add('open');
  preview.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>positionCalendarEventPreview(clientX,clientY));
}
function hideCalendarEventPreview(){
  const preview=document.getElementById('calendarEventPreview');
  if(!preview)return;
  preview.classList.remove('open');
  preview.setAttribute('aria-hidden','true');
}
window.hideCalendarEventPreview=hideCalendarEventPreview;


function ensureCalendarYearOptions(){
  const select=document.getElementById('calendarYearSelect');
  if(!select)return;
  const selectedYear=calDate.getFullYear();
  const years=[...select.options].map(o=>Number(o.value)).filter(Number.isFinite);
  if(!years.length||!years.includes(selectedYear)){
    let out='';
    for(let y=selectedYear-12;y<=selectedYear+12;y++)out+=`<option value="${y}">${y}년</option>`;
    select.innerHTML=out;
  }
  select.value=String(selectedYear);
  const monthSelect=document.getElementById('calendarMonthSelect');
  if(monthSelect)monthSelect.value=String(calDate.getMonth());
}



let calendarDragPayload=null;

function cloneEventAsTemplate(e){
  const copy=JSON.parse(JSON.stringify(e));
  delete copy.id;
  copy.completed=false;
  copy.seriesId='';copy.seriesIndex=null;copy.repeat='';copy.repeatConfig=null;
  return copy;
}
function addEventToCalendarClipboard(eventId){
  document.body.classList.remove('calendar-copy-source-dragging');
  const event=data.events.find(e=>e.id===eventId);
  if(!event)return null;
  const item={
    id:crypto.randomUUID(),
    createdAt:new Date().toISOString(),
    event:cloneEventAsTemplate(event)
  };
  data.scheduleClipboard.push(item);
  saveData('캘린더 복사 보관함 추가');
  toast(event.restDay?'휴방':event.title,'복사 보관함에 저장했습니다. 원본 일정은 그대로 유지됩니다.');
  return item;
}
window.addEventToCalendarClipboard=addEventToCalendarClipboard;

function removeCalendarClipboardItem(id){
  const item=data.scheduleClipboard.find(x=>x.id===id);
  data.scheduleClipboard=data.scheduleClipboard.filter(x=>x.id!==id);
  saveData('캘린더 복사 보관함 삭제');
  toast(item?.event?.title||'복사 보관함','저장된 복사본을 삭제했습니다');
}
window.removeCalendarClipboardItem=removeCalendarClipboardItem;

function createEventFromClipboardItem(templateId,date){
  document.body.classList.remove('calendar-template-dragging');
  const item=data.scheduleClipboard.find(x=>x.id===templateId);
  if(!item?.event)return null;
  const event=JSON.parse(JSON.stringify(item.event));
  event.id=crypto.randomUUID();
  event.date=date;
  event.completed=false;
  data.events.push(event);
  saveData('복사 보관함에서 일정 추가');
  toast(event.restDay?'휴방':event.title,`${formatDate(date)}에 새 컨텐츠로 복사했습니다`);
  return event;
}
window.createEventFromClipboardItem=createEventFromClipboardItem;

function clipboardChipColor(event){
  return event.restDay?'#e85d75':(category(event.categoryId)?.color||'#64748b');
}
function renderCalendarClipboard(){
  const items=Array.isArray(data.scheduleClipboard)?data.scheduleClipboard:[];
  const count=document.getElementById('calendarCopyTrayCount');
  const empty=document.getElementById('calendarCopyTrayEmpty');
  const box=document.getElementById('calendarCopyTrayItems');
  if(count)count.textContent=`${items.length}개`;
  if(empty)empty.style.display=items.length?'none':'flex';
  if(!box)return;

  box.innerHTML=items.map(item=>{
    const e=item.event||{};
    const color=clipboardChipColor(e);
    const time=e.start==='TBD'?'':(e.start||'');
    return `<div class="calendar-copy-chip"
      draggable="false"
      data-clip-id="${item.id}"
      style="--clip-color:${color}"
      title="달력 날짜로 끌어 놓아 복사">
      <span class="calendar-copy-chip-main">${esc(e.title||'제목 없음')}</span>
      ${(e.device||time)?`<span class="calendar-copy-chip-meta">${e.device?`[${esc(e.device)}]`:''}${e.device&&time?' ':''}${esc(time)}</span>`:''}
      <button type="button" class="calendar-copy-delete" title="삭제" onclick="event.stopPropagation();removeCalendarClipboardItem('${item.id}')">×</button>
    </div>`;
  }).join('');

  box.querySelectorAll('.calendar-copy-chip').forEach(chip=>{
    chip.onpointerdown=e=>beginCalendarPointerTemplateDrag(e,chip);

    // native DnD fallback
    chip.ondragstart=e=>{
      calendarDragPayload={type:'template',id:chip.dataset.clipId};
      document.body.classList.add('calendar-template-dragging');
      e.dataTransfer.effectAllowed='copy';
      e.dataTransfer.setData('application/x-mawang-template',chip.dataset.clipId);
      e.dataTransfer.setData('text/plain',`template:${chip.dataset.clipId}`);
      chip.classList.add('dragging');
    };
    chip.ondragend=()=>{
      document.body.classList.remove('calendar-template-dragging');
      chip.classList.remove('dragging');
      calendarDragPayload=null;
      document.querySelectorAll('.day.template-drag-over').forEach(x=>x.classList.remove('template-drag-over'));
    };
  });
}
window.renderCalendarClipboard=renderCalendarClipboard;

let calendarPointerTemplateDrag=null;

function clearCalendarPointerTemplateDrag(){
  const s=calendarPointerTemplateDrag;
  if(!s)return;
  try{if(s.source?.hasPointerCapture?.(s.pointerId))s.source.releasePointerCapture(s.pointerId)}catch(_){}
  s.ghost?.remove();
  s.targetDay?.classList.remove('template-drag-over');
  s.source?.classList.remove('dragging');
  document.body.classList.remove('calendar-pointer-template-dragging');
  calendarPointerTemplateDrag=null;
}

function updateCalendarPointerTemplateTarget(x,y){
  const s=calendarPointerTemplateDrag;
  if(!s)return;
  s.ghost.style.left=x+'px';s.ghost.style.top=y+'px';
  s.ghost.style.display='none';
  const hit=document.elementFromPoint(x,y);
  s.ghost.style.display='flex';
  const day=hit?.closest?.('.day[data-date]')||null;
  if(day!==s.targetDay){
    s.targetDay?.classList.remove('template-drag-over');
    s.targetDay=day;
    day?.classList.add('template-drag-over');
  }
}

function beginCalendarPointerTemplateDrag(e,chip){
  if(e.button!==0||e.target.closest('.calendar-copy-delete'))return;
  const id=chip.dataset.clipId;
  const item=data.scheduleClipboard.find(x=>x.id===id);
  if(!item)return;
  e.preventDefault();e.stopPropagation();

  const ghost=document.createElement('div');
  ghost.className='calendar-template-ghost';
  ghost.style.setProperty('--ghost-color',clipboardChipColor(item.event||{}));
  ghost.textContent=item.event?.title||'복사 컨텐츠';
  document.body.appendChild(ghost);

  calendarPointerTemplateDrag={pointerId:e.pointerId,id,source:chip,ghost,targetDay:null};
  chip.classList.add('dragging');
  document.body.classList.add('calendar-pointer-template-dragging');
  try{chip.setPointerCapture(e.pointerId)}catch(_){}
  updateCalendarPointerTemplateTarget(e.clientX,e.clientY);

  requestAnimationFrame(()=>{
    const section=document.getElementById('calendar');
    if(section){
      const top=section.getBoundingClientRect().top+window.scrollY;
      window.scrollTo({top:Math.max(0,top-8),behavior:'auto'});
    }
  });
}
function moveCalendarPointerTemplateDrag(e){
  if(!calendarPointerTemplateDrag||calendarPointerTemplateDrag.pointerId!==e.pointerId)return;
  e.preventDefault();updateCalendarPointerTemplateTarget(e.clientX,e.clientY);
}
function endCalendarPointerTemplateDrag(e){
  const s=calendarPointerTemplateDrag;
  if(!s||s.pointerId!==e.pointerId)return;
  e.preventDefault();
  const id=s.id,date=s.targetDay?.dataset?.date||'';
  clearCalendarPointerTemplateDrag();
  if(id&&date)createEventFromClipboardItem(id,date);
}
document.addEventListener('pointermove',moveCalendarPointerTemplateDrag,{passive:false});
document.addEventListener('pointerup',endCalendarPointerTemplateDrag,{passive:false});
document.addEventListener('pointercancel',clearCalendarPointerTemplateDrag);


function initCalendarCopyTrayDnD(){
  const tray=document.getElementById('calendarCopyTrayDropzone');
  if(!tray||tray.dataset.dndReady)return;
  tray.dataset.dndReady='1';

  tray.addEventListener('dragenter',e=>{
    e.preventDefault();
    tray.classList.add('drag-over');
  });
  tray.addEventListener('dragover',e=>{
    e.preventDefault();
    e.dataTransfer.dropEffect='copy';
    tray.classList.add('drag-over');
  });
  tray.addEventListener('dragleave',e=>{
    if(e.relatedTarget&&tray.contains(e.relatedTarget))return;
    tray.classList.remove('drag-over');
  });
  tray.addEventListener('drop',e=>{
    e.preventDefault();
    tray.classList.remove('drag-over');
    const raw=String(e.dataTransfer.getData('text/plain')||'');
    const eventId=e.dataTransfer.getData('application/x-mawang-calendar-event')
      ||(calendarDragPayload?.type==='event'?calendarDragPayload.id:'')
      ||raw.replace(/^event:/,'');
    if(eventId)addEventToCalendarClipboard(eventId);
  });
}

let calendarCtrlCopyMode=false;
function isCalendarTabActive(){
  return document.getElementById('calendar')?.classList.contains('active');
}
function setCalendarCtrlCopyMode(active){
  calendarCtrlCopyMode=Boolean(active);
  const hint=document.getElementById('calendarCtrlHint');
  if(hint){
    hint.classList.toggle('show',calendarCtrlCopyMode);
    hint.setAttribute('aria-hidden',calendarCtrlCopyMode?'false':'true');
  }
}
function handleCalendarMiniEventClick(ev,id){
  ev.stopPropagation();
  hideCalendarEventPreview();
  if((ev.ctrlKey||calendarCtrlCopyMode)&&isCalendarTabActive()){
    ev.preventDefault();
    duplicateEventById(id,{closeModal:false,source:'ctrl'});
    return;
  }
  openEvent(id);
}
window.handleCalendarMiniEventClick=handleCalendarMiniEventClick;

document.addEventListener('keydown',e=>{
  if(e.key==='Control'&&!e.repeat&&isCalendarTabActive()&&!document.querySelector('.modal.open')){
    setCalendarCtrlCopyMode(true);
  }
});
document.addEventListener('keyup',e=>{
  if(e.key==='Control')setCalendarCtrlCopyMode(false);
});
window.addEventListener('blur',()=>setCalendarCtrlCopyMode(false));

function renderCalendar(){
  hideCalendarEventPreview();
  ensureCalendarYearOptions();
  const y=calDate.getFullYear(),m=calDate.getMonth();
  document.getElementById('monthLabel').textContent=new Intl.DateTimeFormat('ko-KR',{month:'long',year:'numeric'}).format(calDate);
  const first=new Date(y,m,1),offset=sundayIndex(first.getDay()),start=new Date(y,m,1-offset);let out='';
  const eventsByDate=new Map();
  for(const event of activeEvents()){
    const key=event?.date;
    if(!eventsByDate.has(key))eventsByDate.set(key,[]);
    eventsByDate.get(key).push(event);
  }
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);
    const ds=ymd(d),inMonth=d.getMonth()===m,today=ds===todayKST(),dow=d.getDay();
    const evs=(eventsByDate.get(ds)||[]).sort((a,b)=>{
      if(a.restDay&&!b.restDay)return-1;if(!a.restDay&&b.restDay)return 1;
      const at=a.start==='TBD'?'99:99':(a.start||'99:99'),bt=b.start==='TBD'?'99:99':(b.start||'99:99');
      return at.localeCompare(bt)
    });
    out+=`<div class="day ${inMonth?'':'out'} ${today?'today':''} ${dow===0?'sun':''} ${dow===6?'sat':''}" data-date="${ds}">
      <div class="daynum">${d.getDate()}</div>
      ${evs.map(e=>{
        const color=e.restDay?'#e85d75':(category(e.categoryId)?.color||'#64748b');
        const timePrefix=e.start==='TBD'?'':`${esc(e.start||'')} `;
        const label=e.restDay?'휴방':`${e.device?`[${e.device}] `:''}${timePrefix}${esc(e.title)}`;
        const participantSummary=e.restDay?'':calendarParticipantSummary(e);
        return `<div class="mini-event ${e.restDay?'rest-event':''}"
          draggable="true"
          data-evid="${e.id}"
          style="border-left:4px solid ${color};background:${rgba(color,.18)}"
          onclick="handleCalendarMiniEventClick(event,'${e.id}')">
          <span class="mini-event-main">${label}</span>
          ${participantSummary?`<span class="mini-event-people">${participantSummary}</span>`:''}
        </div>`
      }).join('')}
    </div>`;
  }
  const grid=document.getElementById('calendarGrid');grid.innerHTML=out;
  grid.querySelectorAll('.day').forEach(day=>{
    day.onclick=()=>openEvent(null,day.dataset.date);
    day.ondragenter=e=>{
      e.preventDefault();
      if(calendarDragPayload?.type==='template')day.classList.add('template-drag-over');
      else day.classList.add('drag-over');
    };
    day.ondragover=e=>{
      e.preventDefault();
      e.dataTransfer.dropEffect=calendarDragPayload?.type==='template'?'copy':'move';
      if(calendarDragPayload?.type==='template')day.classList.add('template-drag-over');
      else day.classList.add('drag-over');
    };
    day.ondragleave=e=>{
      if(!day.contains(e.relatedTarget)){
        day.classList.remove('drag-over','template-drag-over');
      }
    };
    day.ondrop=e=>{
      e.preventDefault();
      day.classList.remove('drag-over','template-drag-over');
      hideCalendarEventPreview();

      const templateId=e.dataTransfer.getData('application/x-mawang-template')
        ||(calendarDragPayload?.type==='template'?calendarDragPayload.id:'');
      if(templateId){
        createEventFromClipboardItem(templateId,day.dataset.date);
        calendarDragPayload=null;
        return;
      }

      const eventId=e.dataTransfer.getData('application/x-mawang-calendar-event')
        ||(calendarDragPayload?.type==='event'?calendarDragPayload.id:'')
        ||String(e.dataTransfer.getData('text/plain')||'').replace(/^event:/,'');
      const ev=data.events.find(x=>x.id===eventId);
      if(ev){
        ev.date=day.dataset.date;
        calendarDragPayload=null;
        saveData('일정 이동');
        toast(ev.restDay?'휴방':ev.title,'선택한 날짜로 이동되었습니다');
      }
    };
  });
  grid.querySelectorAll('.mini-event').forEach(el=>{
    el.ondragstart=e=>{
      hideCalendarEventPreview();
      calendarDragPayload={type:'event',id:el.dataset.evid};
      document.body.classList.add('calendar-copy-source-dragging');
      e.dataTransfer.effectAllowed='copyMove';
      e.dataTransfer.setData('application/x-mawang-calendar-event',el.dataset.evid);
      e.dataTransfer.setData('text/plain',`event:${el.dataset.evid}`);
    };
    el.ondragend=()=>{
      document.body.classList.remove('calendar-copy-source-dragging');
      calendarDragPayload=null;
      document.querySelectorAll('.day.drag-over,.day.template-drag-over').forEach(x=>x.classList.remove('drag-over','template-drag-over'));
      document.getElementById('calendarCopyTrayDropzone')?.classList.remove('drag-over');
    };
    el.onmouseenter=e=>showCalendarEventPreview(el.dataset.evid,e.clientX,e.clientY);
    el.onmousemove=e=>positionCalendarEventPreview(e.clientX,e.clientY);
    el.onmouseleave=hideCalendarEventPreview;
  });
  renderCalendarClipboard();
  initCalendarCopyTrayDnD();
}
document.getElementById('prevMonth').onclick=()=>{calDate=new Date(calDate.getFullYear(),calDate.getMonth()-1,1);renderCalendar()}
document.getElementById('nextMonth').onclick=()=>{calDate=new Date(calDate.getFullYear(),calDate.getMonth()+1,1);renderCalendar()}
document.getElementById('todayMonth').onclick=()=>{calDate=new Date();renderCalendar()}
document.getElementById('calendarYearSelect').onchange=e=>{
  const y=Number(e.target.value);
  if(!Number.isFinite(y))return;
  calDate=new Date(y,calDate.getMonth(),1);
  renderCalendar();
}
document.getElementById('calendarMonthSelect').onchange=e=>{
  const m=Number(e.target.value);
  if(!Number.isFinite(m))return;
  calDate=new Date(calDate.getFullYear(),m,1);
  renderCalendar();
}


const CATEGORY_COLOR_PALETTE=[
  '#ef4444','#f43f5e','#ec4899','#d946ef','#a855f7','#8b5cf6','#6366f1','#4f46e5',
  '#3b82f6','#0ea5e9','#06b6d4','#14b8a6','#10b981','#22c55e','#84cc16','#a3e635',
  '#eab308','#facc15','#f59e0b','#fb923c','#f97316','#ea580c','#b45309','#92400e',
  '#64748b','#475569','#6b7280','#78716c','#a8a29e','#94a3b8','#cbd5e1','#f8fafc'
];
let categoryPaletteTarget={mode:'event',categoryId:''};

function positionCategoryColorPalette(trigger){
  const pop=document.getElementById('categoryColorPalette');
  const r=trigger.getBoundingClientRect();
  const width=318;
  pop.style.display='block';
  const height=pop.offsetHeight||250;
  let left=Math.min(r.left,window.innerWidth-width-12);
  let top=r.bottom+7;
  if(top+height>window.innerHeight-12)top=Math.max(12,r.top-height-7);
  pop.style.left=Math.max(12,left)+'px';
  pop.style.top=Math.max(12,top)+'px';
}
function closeCategoryColorPalette(){
  const pop=document.getElementById('categoryColorPalette');
  pop.classList.remove('open');
  pop.setAttribute('aria-hidden','true');
  pop.style.display='none';
}
function openCategoryColorPalette(trigger,mode='event',categoryId=''){
  categoryPaletteTarget={mode,categoryId};
  const current=mode==='event'
    ? (document.getElementById('evCategoryColor').value||'#64748b')
    : (category(categoryId)?.color||'#64748b');
  const pop=document.getElementById('categoryColorPalette');
  pop.innerHTML=`<div class="category-color-palette-title">
    <span>색상 선택</span><span class="muted small">${CATEGORY_COLOR_PALETTE.length}색</span>
  </div>
  <div class="category-color-grid">
    ${CATEGORY_COLOR_PALETTE.map(color=>`<button type="button"
      class="category-color-choice ${color.toLowerCase()===String(current).toLowerCase()?'active':''}"
      style="background:${color};color:${color}"
      title="${color}"
      onclick="selectCategoryPaletteColor('${color}')"></button>`).join('')}
  </div>`;
  pop.classList.add('open');
  pop.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>positionCategoryColorPalette(trigger));
}
window.openCategoryColorPalette=openCategoryColorPalette;

function toggleSettingsCategoryPalette(trigger,categoryId){
  const pop=document.getElementById('categoryColorPalette');
  if(pop.classList.contains('open')&&categoryPaletteTarget.mode==='settings'&&categoryPaletteTarget.categoryId===categoryId){
    closeCategoryColorPalette();
    return;
  }
  openCategoryColorPalette(trigger,'settings',categoryId);
}
window.toggleSettingsCategoryPalette=toggleSettingsCategoryPalette;


function selectCategoryPaletteColor(color){
  if(categoryPaletteTarget.mode==='event'){
    document.getElementById('evCategoryColor').value=color;
    const swatch=document.getElementById('evCategoryColorSwatch');
    if(swatch)swatch.style.background=color;
  }else if(categoryPaletteTarget.mode==='settings'&&categoryPaletteTarget.categoryId){
    const c=category(categoryPaletteTarget.categoryId);
    if(c){
      c.color=color;
      closeCategoryColorPalette();
      saveData('카테고리 색상 수정');
      return;
    }
  }
  closeCategoryColorPalette();
}
window.selectCategoryPaletteColor=selectCategoryPaletteColor;

document.getElementById('evCategoryColorButton').onclick=e=>{
  e.preventDefault();
  e.stopPropagation();
  const pop=document.getElementById('categoryColorPalette');
  if(pop.classList.contains('open')&&categoryPaletteTarget.mode==='event'){
    closeCategoryColorPalette();
    return;
  }
  openCategoryColorPalette(e.currentTarget,'event',document.getElementById('evCategory').value);
};

function populateEventSelectors(){
  document.getElementById('evCategory').innerHTML='<option value="">미분류</option>'+data.categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
}
function syncCategoryColor(){
  const id=document.getElementById('evCategory').value,c=category(id);
  const color=c?.color||'#64748b';
  document.getElementById('evCategoryColor').value=color;
  const swatch=document.getElementById('evCategoryColorSwatch');
  if(swatch)swatch.style.background=color;
}
document.getElementById('evCategory').onchange=syncCategoryColor;

function renderChecklistEditor(list){
  document.getElementById('checklistEditor').innerHTML=(list||[]).map((x,i)=>`<div class="checkrow"><input type="checkbox" class="ckdone" ${x.done?'checked':''}><input type="text" class="cktext" value="${esc(x.text)}"><button class="danger small" type="button" onclick="removeChecklist(${i})">삭제</button></div>`).join('');
}
window.removeChecklist=i=>{const list=getChecklistFromEditor();list.splice(i,1);renderChecklistEditor(list)}
function getChecklistFromEditor(){return[...document.querySelectorAll('#checklistEditor .checkrow')].map(r=>({done:r.querySelector('.ckdone').checked,text:r.querySelector('.cktext').value.trim()})).filter(x=>x.text)}
document.getElementById('addChecklistBtn').onclick=()=>{const list=getChecklistFromEditor();list.push({text:'',done:false});renderChecklistEditor(list);setTimeout(()=>{const a=document.querySelectorAll('.cktext');a[a.length-1]?.focus()},0)}

/* 미니 달력 */
function positionPopover(trigger,pop){
  const r=trigger.getBoundingClientRect(),w=pop.offsetWidth||330,h=pop.offsetHeight||300;
  let left=Math.min(r.left,window.innerWidth-w-12),top=r.bottom+6;
  if(top+h>window.innerHeight-12)top=Math.max(12,r.top-h-6);
  pop.style.left=Math.max(12,left)+'px';pop.style.top=top+'px';
}
function openDatePicker(target='evDate'){
  datePickerTarget=target;
  const input=document.getElementById(target);
  if(!input)return;
  const current=input.value||ymd(new Date()),d=new Date(current+'T12:00:00');
  datePickerMonth=new Date(d.getFullYear(),d.getMonth(),1);
  renderDatePicker();
  const pop=document.getElementById('datePickerPopover');
  pop.classList.add('open');
  const trigger=document.getElementById(target+'Display')||input;
  requestAnimationFrame(()=>positionPopover(trigger,pop));
}
window.openDatePicker=openDatePicker;
function renderDatePicker(){
  const pop=document.getElementById('datePickerPopover'),y=datePickerMonth.getFullYear(),m=datePickerMonth.getMonth(),selected=document.getElementById(datePickerTarget)?.value||'',today=ymd(new Date());
  const first=new Date(y,m,1),offset=sundayIndex(first.getDay()),start=new Date(y,m,1-offset);let days='';
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);const ds=ymd(d),dow=d.getDay();
    days+=`<button type="button" class="mini-day ${d.getMonth()===m?'':'out'} ${ds===selected?'selected':''} ${ds===today?'today':''}" style="${dow===0?'color:#ef8b9c;':dow===6?'color:#7da8f7;':''}" onclick="selectMiniDate('${ds}')">${d.getDate()}</button>`
  }
  pop.innerHTML=`<div class="picker-head"><button class="ghost small" type="button" onclick="moveDatePicker(-1)">이전</button><strong>${y}년 ${m+1}월</strong><button class="ghost small" type="button" onclick="moveDatePicker(1)">다음</button></div>
    <div class="mini-week"><div style="color:#ef8b9c">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div style="color:#7da8f7">토</div></div><div class="mini-calendar">${days}</div>`;
}
window.moveDatePicker=n=>{datePickerMonth=new Date(datePickerMonth.getFullYear(),datePickerMonth.getMonth()+n,1);renderDatePicker()}
window.selectMiniDate=ds=>{
  const target=datePickerTarget||'evDate';
  const input=document.getElementById(target);
  if(input)input.value=ds;
  if(target==='worldBaseDate'){
    const text=document.getElementById('worldBaseDateText');
    if(text)text.textContent=formatDateWeekday(ds);
    renderWorldTime();
  }else{
    const text=document.querySelector('#'+target+'Display span');
    if(text)text.textContent=formatDate(ds);
    if(target==='evDate'&&typeof updateRepeatEditorUI==='function')updateRepeatEditorUI();
    if(target==='repeatEndDate'&&typeof updateRepeatEditorUI==='function'){
      eventRepeatDraft.endDate=ds;
      updateRepeatEditorUI();
    }
  }
  document.getElementById('datePickerPopover').classList.remove('open');
}
document.getElementById('evDateDisplay').onclick=()=>openDatePicker('evDate');

/* 모바일식 시간 휠 */
function openTimePicker(target){
  const current=document.getElementById(target).value;
  const raw=(!current||current==='TBD')?(target==='evEnd'?'22:00':'20:00'):current;
  const [h,m]=raw.split(':').map(Number);
  timePickerState={target,ampm:h<12?'오전':'오후',hour:h%12||12,minute:Math.round(m/5)*5%60};
  renderTimePicker();const pop=document.getElementById('timePickerPopover');pop.classList.add('open');
  requestAnimationFrame(()=>{positionPopover(document.getElementById(target+'Display'),pop);centerSelectedWheels()});
}
function renderWheel(kind,values,formatter=x=>x){
  const selected=timePickerState[kind];
  return `<div class="wheel-column" data-kind="${kind}">${values.map(v=>`<div class="wheel-item ${v===selected?'selected':''}" data-value="${v}" onclick="pickWheel('${kind}','${v}')">${formatter(v)}</div>`).join('')}</div>`;
}
function renderTimePicker(){
  const pop=document.getElementById('timePickerPopover'),mins=Array.from({length:12},(_,i)=>i*5);
  const worldMode=timePickerState.target==='worldBaseTime';
  pop.innerHTML=`<div class="picker-head">
      <strong>${worldMode?'한국 기준 시간':'시간 선택'}</strong>
      <span class="time-picker-scroll-note">휠 한 번에 한 칸</span>
    </div>
    <div class="wheel-wrap"><div class="wheel-guide"></div>
      ${renderWheel('ampm',['오전','오후'])}
      ${renderWheel('hour',Array.from({length:12},(_,i)=>i+1),v=>String(v).padStart(2,'0'))}
      ${renderWheel('minute',mins,v=>String(v).padStart(2,'0'))}
    </div>
    <div class="space" style="margin-top:10px">
      ${worldMode?'<span></span>':'<button class="secondary" type="button" onclick="setTimeTBD()">미확정</button>'}
      <div class="row"><span class="muted small" id="timePreview"></span><button class="primary" type="button" onclick="confirmWheelTime()">확인</button></div>
    </div>`;
  updateTimePreview();attachWheelScroll();
}
function centerSelectedWheels(){
  document.querySelectorAll('#timePickerPopover .wheel-column').forEach(col=>{const sel=col.querySelector('.selected');if(sel)col.scrollTop=sel.offsetTop-(col.clientHeight-sel.offsetHeight)/2});
}
function setWheelSelection(kind,value,scroll=true){
  if(kind==='hour'||kind==='minute')value=Number(value);timePickerState[kind]=value;
  const col=document.querySelector(`#timePickerPopover .wheel-column[data-kind="${kind}"]`);
  if(col){col.querySelectorAll('.wheel-item').forEach(x=>x.classList.toggle('selected',String(x.dataset.value)===String(value)));const sel=col.querySelector('.selected');if(scroll&&sel)col.scrollTo({top:sel.offsetTop-(col.clientHeight-sel.offsetHeight)/2,behavior:'auto'})}
  updateTimePreview();
}
window.pickWheel=(kind,value)=>setWheelSelection(kind,value,true)
function attachWheelScroll(){
  document.querySelectorAll('#timePickerPopover .wheel-column').forEach(col=>{
    let wheelLocked=false;

    col.addEventListener('wheel',e=>{
      e.preventDefault();
      e.stopPropagation();
      if(wheelLocked)return;
      wheelLocked=true;

      const items=[...col.querySelectorAll('.wheel-item')];
      let index=items.findIndex(it=>it.classList.contains('selected'));
      if(index<0)index=0;
      const direction=e.deltaY>0?1:-1;
      const next=Math.max(0,Math.min(items.length-1,index+direction));
      if(next!==index)setWheelSelection(col.dataset.kind,items[next].dataset.value,true);

      setTimeout(()=>{wheelLocked=false},72);
    },{passive:false});

    col.onscroll=()=>{
      clearTimeout(wheelScrollTimers[col.dataset.kind]);
      wheelScrollTimers[col.dataset.kind]=setTimeout(()=>{
        const center=col.scrollTop+col.clientHeight/2,items=[...col.querySelectorAll('.wheel-item')];
        let best=null,bestD=Infinity;
        items.forEach(it=>{
          const c=it.offsetTop+it.offsetHeight/2,d=Math.abs(c-center);
          if(d<bestD){bestD=d;best=it}
        });
        if(best)setWheelSelection(col.dataset.kind,best.dataset.value,false);
      },110);
    };
  });
}
function updateTimePreview(){
  const el=document.getElementById('timePreview');if(el)el.textContent=`${timePickerState.ampm} ${String(timePickerState.hour).padStart(2,'0')}:${String(timePickerState.minute).padStart(2,'0')}`;
}
window.confirmWheelTime=()=>{
  let h=timePickerState.hour%12;
  if(timePickerState.ampm==='오후')h+=12;
  const raw=`${String(h).padStart(2,'0')}:${String(timePickerState.minute).padStart(2,'0')}`;
  const target=timePickerState.target;
  document.getElementById(target).value=raw;
  const display=document.getElementById(target+'Display');
  const span=display?.querySelector('span');
  if(span)span.textContent=formatTimeKorean(raw);
  if(target==='worldBaseTime')renderWorldTime();
  document.getElementById('timePickerPopover').classList.remove('open');
}
window.setTimeTBD=()=>{
  const target=timePickerState.target;
  if(!target)return;
  document.getElementById(target).value='TBD';
  document.querySelector('#'+target+'Display span').textContent='미확정';
  document.getElementById('timePickerPopover').classList.remove('open');
}
document.querySelectorAll('.time-trigger').forEach(b=>b.onclick=()=>openTimePicker(b.dataset.timeTarget));


function normalizeParticipantStatus(value){
  return value==='planned'?'planned':'confirmed';
}
function participantStatusLabel(value){
  return normalizeParticipantStatus(value)==='planned'?'예정':'확정';
}
function participantStatusClass(value){
  return normalizeParticipantStatus(value)==='planned'?'planned':'confirmed';
}
function eventParticipantStatus(e,id){
  return normalizeParticipantStatus(e?.participantStatuses?.[id]||'confirmed');
}
function eventParticipantRows(e){
  return (e?.participants||[]).map(id=>{
    const person=contact(id);
    return person?{person,status:eventParticipantStatus(e,id)}:null;
  }).filter(Boolean);
}
function selectedParticipantStatusPayload(){
  const result={};
  selectedParticipantIds.forEach(id=>result[id]=normalizeParticipantStatus(selectedParticipantStatuses[id]||'confirmed'));
  return result;
}
window.setParticipantStatus=(id,status)=>{
  if(!selectedParticipantIds.includes(id))return;
  selectedParticipantStatuses[id]=normalizeParticipantStatus(status);
  renderParticipantPicker();
};

/* 참여자 검색, 다중 선택, 버블 표시, 빠른 추가 */
function renderParticipantPicker(){
  const selectedBox=document.getElementById('selectedParticipants');
  const searchEl=document.getElementById('participantSearch');
  const q=(searchEl.value||'').trim().toLowerCase();
  const selectedContacts=selectedParticipantIds.map(id=>contact(id)).filter(Boolean);

  document.getElementById('participantCount').textContent=`${selectedContacts.length}명 선택`;
  document.getElementById('clearParticipantsBtn').disabled=selectedContacts.length===0;

  selectedBox.innerHTML=selectedContacts.length
    ? selectedContacts.map(c=>{
        const status=normalizeParticipantStatus(selectedParticipantStatuses[c.id]||'confirmed');
        return `<span class="person-chip">
          ${c.image?`<img class="avatar sm" loading="lazy" src="${c.image}">`:''}
          <span>${esc(c.name)}</span>
          ${c.pendingSetup?'<span class="muted">신규</span>':''}
          <select class="participant-status-select" onclick="event.stopPropagation()" onchange="setParticipantStatus('${c.id}',this.value)">
            <option value="confirmed" ${status==='confirmed'?'selected':''}>확정</option>
            <option value="planned" ${status==='planned'?'selected':''}>예정</option>
          </select>
          <button type="button" title="선택 해제" onclick="removeParticipant('${c.id}')">×</button>
        </span>`;
      }).join('')
    : '<span class="muted small">아직 선택된 참여자가 없습니다</span>';

  let arr=data.contacts
    .filter(c=>!q||(c.name+' '+(c.labels||[]).join(' ')).toLowerCase().includes(q))
    .sort((a,b)=>a.name.localeCompare(b.name,'ko'))
    .slice(0,40);

  const result=arr.map(c=>{
    const selected=selectedParticipantIds.includes(c.id);
    const status=normalizeParticipantStatus(selectedParticipantStatuses[c.id]||'confirmed');
    return `<div class="person-result ${selected?'selected':''}"
      role="button"
      tabindex="0"
      aria-pressed="${selected?'true':'false'}"
      onclick="toggleParticipant('${c.id}')"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleParticipant('${c.id}')}">
      <span class="row">
        ${c.image?`<img class="avatar sm" loading="lazy" src="${c.image}">`:`<span class="avatar sm" style="display:grid;place-items:center">${esc(initials(c.name))}</span>`}
        <span>
          <span style="display:block;font-weight:700">${esc(c.name)}</span>
          <span class="muted small">${(c.labels||[]).slice(0,3).map(esc).join(' · ')}${c.pendingSetup?`${(c.labels||[]).length?' · ':''}신규 추가`:''}</span>
        </span>
      </span>
      <span class="row" onclick="event.stopPropagation()">
        ${selected?`<select class="participant-status-select"
          onclick="event.stopPropagation()"
          onchange="event.stopPropagation();setParticipantStatus('${c.id}',this.value)">
          <option value="confirmed" ${status==='confirmed'?'selected':''}>확정</option>
          <option value="planned" ${status==='planned'?'selected':''}>예정</option>
        </select>`:''}
        <input type="checkbox"
          ${selected?'checked':''}
          onclick="event.stopPropagation()"
          onchange="event.stopPropagation();toggleParticipant('${c.id}')">
      </span>
    </div>`;
  }).join('');

  const typed=searchEl.value.trim();
  const exact=typed&&data.contacts.some(c=>c.name.toLowerCase()===typed.toLowerCase());
  const quick=typed&&!exact
    ? `<button type="button" class="person-result quick-add" onclick="quickAddParticipantFromSearch()"><span>＋ "${esc(typed)}"을 신규 연락처로 추가</span><span>추가</span></button>`
    : '';

  document.getElementById('participantResults').innerHTML=(result+quick)||'<div class="empty">검색 결과가 없습니다</div>';
}
window.toggleParticipant=id=>{
  if(selectedParticipantIds.includes(id)){
    selectedParticipantIds=selectedParticipantIds.filter(x=>x!==id);
    delete selectedParticipantStatuses[id];
  }else{
    selectedParticipantIds=[...selectedParticipantIds,id];
    selectedParticipantStatuses[id]='confirmed';
  }
  renderParticipantPicker();
}
window.removeParticipant=id=>{
  selectedParticipantIds=selectedParticipantIds.filter(x=>x!==id);
  delete selectedParticipantStatuses[id];
  renderParticipantPicker();
}
window.clearParticipants=()=>{
  selectedParticipantIds=[];
  selectedParticipantStatuses={};
  renderParticipantPicker();
}
document.getElementById('clearParticipantsBtn').onclick=clearParticipants;

window.quickAddParticipantFromSearch=()=>{
  const searchEl=document.getElementById('participantSearch');
  const name=(searchEl.value||'').trim();if(!name)return;
  let c=data.contacts.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(!c){
    c={id:crypto.randomUUID(),name,image:'',labels:[],notes:'',pendingSetup:true};
    data.contacts.push(c);
    persist();
  }
  if(!selectedParticipantIds.includes(c.id)){selectedParticipantIds.push(c.id);selectedParticipantStatuses[c.id]='confirmed';}
  searchEl.value='';
  renderParticipantPicker();
  renderAll('신규 참여자 추가');
  toast(c.name,'신규 연락처에 추가되었습니다. 연락처의 신규 추가 탭에서 사진과 라벨을 입력할 수 있습니다');
}
document.getElementById('participantSearch').oninput=renderParticipantPicker;


function loadSelectedLibraryMemoToEvent(){
  const id=document.getElementById('eventMemoLibrarySelect').value;
  const memo=memoById(id);
  if(!memo)return toast('메모 불러오기','불러올 메모를 선택해 주세요');
  const hasText=document.getElementById('evMemoTitle').value.trim()||document.getElementById('evMemoContent').value.trim();
  if(hasText&&!confirm('현재 컨텐츠 메모를 선택한 메모 내용으로 바꾸시겠습니까?'))return;
  document.getElementById('evMemoTitle').value=memo.title;
  document.getElementById('evMemoContent').value=memo.content;
  toast(memo.title,'컨텐츠 메모장으로 불러왔습니다');
}
function saveEventMemoToLibrary(){
  const title=document.getElementById('evMemoTitle').value.trim() || document.getElementById('evTitle').value.trim();
  const content=document.getElementById('evMemoContent').value;
  if(!title)return toast('메모장 저장','메모 제목이나 컨텐츠 제목을 입력해 주세요');
  const now=new Date().toISOString();
  const memo={id:crypto.randomUUID(),title,content,createdAt:now,updatedAt:now};
  data.memos.push(memo);
  saveData('컨텐츠 메모를 메모장에 저장');
  refreshEventMemoLibrarySelect(memo.id);
  toast(title,'독립 메모장에 새 메모로 저장했습니다');
}
document.getElementById('loadMemoToEventBtn').onclick=loadSelectedLibraryMemoToEvent;
document.getElementById('saveEventMemoToLibraryBtn').onclick=saveEventMemoToLibrary;
document.getElementById('clearEventMemoBtn').onclick=()=>{
  const hasText=document.getElementById('evMemoTitle').value.trim()||document.getElementById('evMemoContent').value.trim();
  if(hasText&&!confirm('현재 컨텐츠 메모를 비우시겠습니까?'))return;
  document.getElementById('evMemoTitle').value='';
  document.getElementById('evMemoContent').value='';
};



let eventRepeatDraft={enabled:false,unit:'week',interval:1,endMode:'weeks',durationWeeks:4,count:4,endDate:''};
let eventRepeatOriginalSeriesId='';

function clampRepeatNumber(value,min,max,fallback){
  const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n))):fallback;
}
function repeatLegacyValue(cfg){
  if(!cfg?.enabled)return '';
  if(cfg.unit==='month')return 'monthly';
  if(cfg.interval===1)return 'weekly';
  if(cfg.interval===2)return 'biweekly';
  return `every-${cfg.interval}-weeks`;
}
function normalizeRepeatConfigFromEvent(e){
  const raw=e?.repeatConfig;
  if(raw&&typeof raw==='object'&&raw.enabled!==false){
    return {
      enabled:true,
      unit:raw.unit==='month'?'month':'week',
      interval:clampRepeatNumber(raw.interval,1,12,1),
      endMode:['weeks','count','date'].includes(raw.endMode)?raw.endMode:'weeks',
      durationWeeks:clampRepeatNumber(raw.durationWeeks,1,104,4),
      count:clampRepeatNumber(raw.count,1,104,4),
      endDate:String(raw.endDate||'')
    };
  }
  const legacy=String(e?.repeat||'');
  if(!legacy)return {enabled:false,unit:'week',interval:1,endMode:'weeks',durationWeeks:4,count:4,endDate:''};
  if(legacy==='monthly')return {enabled:true,unit:'month',interval:1,endMode:'count',durationWeeks:16,count:4,endDate:''};
  if(legacy==='biweekly')return {enabled:true,unit:'week',interval:2,endMode:'weeks',durationWeeks:8,count:4,endDate:''};
  const match=legacy.match(/^every-(\d+)-weeks$/);
  if(match)return {enabled:true,unit:'week',interval:clampRepeatNumber(match[1],1,12,1),endMode:'weeks',durationWeeks:12,count:4,endDate:''};
  return {enabled:true,unit:'week',interval:1,endMode:'weeks',durationWeeks:4,count:4,endDate:''};
}
function repeatPatternKey(cfg=eventRepeatDraft){
  if(!cfg?.enabled)return 'none';
  return `${cfg.unit}:${cfg.interval}`;
}
function addWeeksToDate(dateStr,weeks){
  const d=new Date(dateStr+'T12:00:00');d.setDate(d.getDate()+Number(weeks||0)*7);return ymd(d);
}
function addMonthsToDate(dateStr,months){
  const d=new Date(dateStr+'T12:00:00');
  const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+Number(months||0));
  const max=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,max));return ymd(d);
}
function repeatCandidateDate(baseDate,cfg,index){
  return cfg.unit==='month'
    ? addMonthsToDate(baseDate,cfg.interval*index)
    : addWeeksToDate(baseDate,cfg.interval*index);
}
function generateRepeatDates(baseDate,cfg){
  if(!baseDate||!cfg?.enabled)return [baseDate].filter(Boolean);
  const out=[baseDate];
  const maxItems=104;
  if(cfg.endMode==='count'){
    const total=clampRepeatNumber(cfg.count,1,maxItems,4);
    for(let i=1;i<total;i++)out.push(repeatCandidateDate(baseDate,cfg,i));
    return [...new Set(out)];
  }
  if(cfg.endMode==='date'){
    const end=cfg.endDate||baseDate;
    for(let i=1;i<maxItems;i++){
      const cand=repeatCandidateDate(baseDate,cfg,i);
      if(cand>end)break;
      out.push(cand);
    }
    return [...new Set(out)];
  }
  const weeks=clampRepeatNumber(cfg.durationWeeks,1,104,4);
  const limitDate=addWeeksToDate(baseDate,weeks);
  for(let i=1;i<maxItems;i++){
    const cand=repeatCandidateDate(baseDate,cfg,i);
    /* duration N weeks means [start, start + N weeks), so weekly+4 = 4 dates */
    if(cand>=limitDate)break;
    out.push(cand);
  }
  return [...new Set(out)];
}
window.generateRepeatDates=generateRepeatDates;

function repeatPatternLabel(cfg=eventRepeatDraft){
  if(!cfg?.enabled)return '반복 없음';
  if(cfg.unit==='month')return cfg.interval===1?'매월':`${cfg.interval}개월마다`;
  return cfg.interval===1?'매주':`${cfg.interval}주마다`;
}
function repeatEndLabel(cfg=eventRepeatDraft){
  if(!cfg?.enabled)return '';
  if(cfg.endMode==='count')return `총 ${cfg.count}회`;
  if(cfg.endMode==='date')return cfg.endDate?`${formatDate(cfg.endDate)}까지`:'종료일 미지정';
  return `${cfg.durationWeeks}주간`;
}
function syncRepeatEndDateDisplay(){
  const btn=document.querySelector('#repeatEndDateDisplay span');
  if(btn)btn.textContent=eventRepeatDraft.endDate?formatDate(eventRepeatDraft.endDate):'종료 날짜 선택';
}
function updateRepeatEditorUI(){
  const cfg=eventRepeatDraft;
  const baseDate=document.getElementById('evDate')?.value||todayKST();
  document.querySelectorAll('#repeatPatternGrid [data-repeat-pattern]').forEach(btn=>btn.classList.toggle('active',btn.dataset.repeatPattern===repeatPatternKey(cfg)));
  document.querySelectorAll('#repeatEndModeGrid [data-repeat-endmode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.repeatEndmode===cfg.endMode));
  document.getElementById('repeatAdvancedOptions').style.opacity=cfg.enabled?'1':'.45';
  document.getElementById('repeatAdvancedOptions').style.pointerEvents=cfg.enabled?'auto':'none';
  ['weeks','count','date'].forEach(mode=>document.getElementById(`repeat${mode[0].toUpperCase()+mode.slice(1)}Control`)?.classList.toggle('active',cfg.endMode===mode));
  document.getElementById('repeatDurationWeeks').value=cfg.durationWeeks;
  document.getElementById('repeatTotalCount').value=cfg.count;
  document.getElementById('repeatEndDate').value=cfg.endDate||'';
  syncRepeatEndDateDisplay();

  const dates=generateRepeatDates(baseDate,cfg);
  const summary=cfg.enabled?`${repeatPatternLabel(cfg)} · ${repeatEndLabel(cfg)} · ${dates.length}개`:'반복 없음';
  document.getElementById('evRepeatSummary').textContent=summary;
  document.getElementById('evRepeat').value=repeatLegacyValue(cfg);
  document.getElementById('evRepeatButton').classList.toggle('active',cfg.enabled);
  document.getElementById('repeatPreviewCount').textContent=cfg.enabled?`${dates.length}개 일정 생성`:'반복을 사용하지 않습니다';
  document.getElementById('repeatSeriesBadge').textContent=cfg.enabled?'반복 시리즈':'단일 일정';
  const preview=document.getElementById('repeatPreviewDates');
  preview.innerHTML=cfg.enabled
    ? dates.slice(0,10).map((d,i)=>`<span class="repeat-preview-date">${i+1}. ${shortDateWeekday(d)}</span>`).join('')+(dates.length>10?`<span class="repeat-preview-more">+ ${dates.length-10}개 더</span>`:'')
    : '<span class="muted small">반복 방식을 선택하면 생성될 날짜를 미리 볼 수 있습니다.</span>';
}
function setRepeatPattern(key){
  if(key==='none'){
    eventRepeatDraft.enabled=false;
  }else{
    const [unit,rawInterval]=key.split(':');
    eventRepeatDraft.enabled=true;
    eventRepeatDraft.unit=unit==='month'?'month':'week';
    eventRepeatDraft.interval=clampRepeatNumber(rawInterval,1,12,1);
    if(eventRepeatDraft.unit==='month'&&eventRepeatDraft.endMode==='weeks'){
      eventRepeatDraft.endMode='count';eventRepeatDraft.count=Math.max(2,eventRepeatDraft.count||4);
    }
  }
  updateRepeatEditorUI();
}
function setRepeatEndMode(mode){
  if(!['weeks','count','date'].includes(mode))return;
  eventRepeatDraft.endMode=mode;
  if(mode==='date'&&!eventRepeatDraft.endDate){
    const base=document.getElementById('evDate')?.value||todayKST();
    eventRepeatDraft.endDate=addWeeksToDate(base,4);
  }
  updateRepeatEditorUI();
}
window.setRepeatPattern=setRepeatPattern;
window.setRepeatEndMode=setRepeatEndMode;

function openEventRepeatPanel(){
  const box=document.querySelector('#eventModal .event-modalbox');
  const panel=document.getElementById('eventRepeatPanel');
  box?.classList.add('repeat-panel-open');panel?.classList.add('open');panel?.setAttribute('aria-hidden','false');
  document.getElementById('evRepeatButton')?.setAttribute('aria-expanded','true');
  updateRepeatEditorUI();
}
function closeEventRepeatPanel(){
  const box=document.querySelector('#eventModal .event-modalbox');
  const panel=document.getElementById('eventRepeatPanel');
  box?.classList.remove('repeat-panel-open');panel?.classList.remove('open');panel?.setAttribute('aria-hidden','true');
  document.getElementById('evRepeatButton')?.setAttribute('aria-expanded','false');
}
window.openEventRepeatPanel=openEventRepeatPanel;window.closeEventRepeatPanel=closeEventRepeatPanel;

function loadEventRepeatEditor(e){
  eventRepeatDraft=normalizeRepeatConfigFromEvent(e);
  eventRepeatOriginalSeriesId=String(e?.seriesId||'');
  const note=document.getElementById('repeatSeriesEditNote');
  if(note)note.style.display=e?.seriesId?'block':'none';
  closeEventRepeatPanel();updateRepeatEditorUI();
}
function currentRepeatConfig(){
  const cfg={...eventRepeatDraft};
  cfg.durationWeeks=clampRepeatNumber(document.getElementById('repeatDurationWeeks')?.value,1,104,cfg.durationWeeks||4);
  cfg.count=clampRepeatNumber(document.getElementById('repeatTotalCount')?.value,1,104,cfg.count||4);
  cfg.endDate=document.getElementById('repeatEndDate')?.value||cfg.endDate||'';
  return cfg;
}
function createSeriesEventPayload(payload,date,seriesId,seriesIndex){
  return {id:crypto.randomUUID(),completed:false,...JSON.parse(JSON.stringify(payload)),date,seriesId,seriesIndex};
}
function applyEventPayloadWithRepeat(payload,editingId=null){
  const cfg=currentRepeatConfig();
  payload.repeat=repeatLegacyValue(cfg);
  payload.repeatConfig=cfg.enabled?JSON.parse(JSON.stringify(cfg)):null;
  const dates=generateRepeatDates(payload.date,cfg);

  if(editingId){
    const target=data.events.find(x=>x.id===editingId);
    if(!target)return {created:0,series:false};
    const previousSeriesId=String(target.seriesId||'');
    const previousIndex=Number.isFinite(Number(target.seriesIndex))?Number(target.seriesIndex):0;

    if(previousSeriesId){
      data.events=data.events.filter(ev=>ev.id===editingId || ev.seriesId!==previousSeriesId || Number(ev.seriesIndex)<=previousIndex);
    }

    if(cfg.enabled){
      const seriesId=previousSeriesId||crypto.randomUUID();
      Object.assign(target,payload,{seriesId,seriesIndex:previousIndex});
      dates.slice(1).forEach((date,i)=>data.events.push(createSeriesEventPayload(payload,date,seriesId,previousIndex+i+1)));
      return {created:dates.length-1,series:true,total:dates.length};
    }

    Object.assign(target,payload,{seriesId:'',seriesIndex:null,repeat:'',repeatConfig:null});
    return {created:0,series:false,total:1};
  }

  if(cfg.enabled){
    const seriesId=crypto.randomUUID();
    dates.forEach((date,i)=>data.events.push(createSeriesEventPayload(payload,date,seriesId,i)));
    return {created:dates.length,series:true,total:dates.length};
  }
  data.events.push({id:crypto.randomUUID(),completed:false,...payload,seriesId:'',seriesIndex:null,repeat:'',repeatConfig:null});
  return {created:1,series:false,total:1};
}
window.applyEventPayloadWithRepeat=applyEventPayloadWithRepeat;


let eventFavoriteState=false;
function setEventFavoriteState(value){
  eventFavoriteState=Boolean(value);
  const btn=document.getElementById('evFavoriteBtn');
  if(!btn)return;
  btn.classList.toggle('active',eventFavoriteState);
  btn.setAttribute('aria-pressed',eventFavoriteState?'true':'false');
  btn.title=eventFavoriteState?'즐겨찾기에서 제거':'즐겨찾기에 추가';
}
document.getElementById('evFavoriteBtn').onclick=()=>{
  setEventFavoriteState(!eventFavoriteState);
};
document.getElementById('evRepeatButton').onclick=()=>{
  const panel=document.getElementById('eventRepeatPanel');
  panel?.classList.contains('open')?closeEventRepeatPanel():openEventRepeatPanel();
};
document.getElementById('closeRepeatPanelBtn').onclick=closeEventRepeatPanel;
document.getElementById('applyRepeatPanelBtn').onclick=()=>{updateRepeatEditorUI();closeEventRepeatPanel()};
document.getElementById('disableRepeatBtn').onclick=()=>{eventRepeatDraft.enabled=false;updateRepeatEditorUI()};
document.querySelectorAll('#repeatPatternGrid [data-repeat-pattern]').forEach(btn=>btn.onclick=()=>setRepeatPattern(btn.dataset.repeatPattern));
document.querySelectorAll('#repeatEndModeGrid [data-repeat-endmode]').forEach(btn=>btn.onclick=()=>setRepeatEndMode(btn.dataset.repeatEndmode));
document.getElementById('repeatDurationWeeks').oninput=e=>{eventRepeatDraft.durationWeeks=clampRepeatNumber(e.target.value,1,104,4);updateRepeatEditorUI()};
document.getElementById('repeatTotalCount').oninput=e=>{eventRepeatDraft.count=clampRepeatNumber(e.target.value,1,104,4);updateRepeatEditorUI()};
document.getElementById('repeatEndDate').onchange=e=>{eventRepeatDraft.endDate=e.target.value;updateRepeatEditorUI()};


function openEvent(id=null,date=null){
  closeMainModals();
  editingEventId=id;populateEventSelectors();const e=id?data.events.find(x=>x.id===id):null;
  document.getElementById('eventModalTitle').textContent=e?(e.restDay?'휴방 수정':'컨텐츠 스케줄 수정'):'스케줄 추가';
  document.getElementById('evTitle').value=e?.title||'';
  document.getElementById('evTitle').disabled=Boolean(e?.restDay);
  document.getElementById('evDevice').value=e ? (e.device||'') : 'PC';
  document.getElementById('evDevice').disabled=Boolean(e?.restDay);
  setEventFavoriteState(Boolean(e?.favorite));
  const evDate=e?.date||date||ymd(new Date());document.getElementById('evDate').value=evDate;document.querySelector('#evDateDisplay span').textContent=formatDate(evDate);
  document.getElementById('evCategory').value=e?.categoryId||'';syncCategoryColor();
  const start=e?.start||'20:00',end=e?.end||'22:00';document.getElementById('evStart').value=start;document.querySelector('#evStartDisplay span').textContent=formatTimeKorean(start);
  document.getElementById('evEnd').value=end;document.querySelector('#evEndDisplay span').textContent=formatTimeKorean(end);
  selectedParticipantIds=[...(e?.participants||[])];
  if(!e&&data.selfContactId&&contact(data.selfContactId)&&!selectedParticipantIds.includes(data.selfContactId))selectedParticipantIds.push(data.selfContactId);
  selectedParticipantStatuses={};
  selectedParticipantIds.forEach(id=>{
    selectedParticipantStatuses[id]=e?.participantStatuses?.[id]
      ? normalizeParticipantStatus(e.participantStatuses[id])
      : 'confirmed';
  });
  document.getElementById('participantSearch').value='';
  document.getElementById('evMemoTitle').value=e?.memoTitle||'';
  document.getElementById('evMemoContent').value=e?.memoContent||'';
  refreshEventMemoLibrarySelect();
  document.getElementById('evUrl').value=e?.url||'';document.getElementById('evDescription').value=e?.description||'';document.getElementById('evReminder').value=e?.reminder||'';
  loadEventRepeatEditor(e);
  renderChecklistEditor(e?.checklist||[]);
  document.getElementById('deleteEventBtn').style.display=e?'':'none';document.getElementById('duplicateEventBtn').style.display=e?'':'none';
  document.getElementById('restDayBtn').style.display=e?'none':'';document.getElementById('saveEventBtn').style.display=e?.restDay?'none':'';
  document.getElementById('eventModal').classList.add('open');
  // 먼저 창을 보여준 뒤 무거운 연락처 목록을 다음 프레임에 렌더링
  requestAnimationFrame(()=>renderParticipantPicker());
}
window.openEvent=openEvent;document.getElementById('newEventBtn').onclick=()=>openEvent();

document.getElementById('saveEventBtn').onclick=()=>{
  const title=document.getElementById('evTitle').value.trim();
  if(!title)return toast('스케줄 저장','제목을 입력해 주세요');
  const date=document.getElementById('evDate').value;
  if(!date)return toast('스케줄 저장','날짜를 선택해 주세요');

  const categoryId=document.getElementById('evCategory').value,c=category(categoryId);
  if(c)c.color=document.getElementById('evCategoryColor').value;

  const selfId=String(data.selfContactId||'');
  const payloadParticipants=[...selectedParticipantIds];
  const payloadStatuses=selectedParticipantStatusPayload();
  let autoSelfParticipantId=editingEventId?String(data.events.find(x=>x.id===editingEventId)?.autoSelfParticipantId||''):(selfId?selfId:'');
  if(selfId&&!payloadParticipants.includes(selfId)){
    payloadParticipants.push(selfId);payloadStatuses[selfId]='confirmed';autoSelfParticipantId=selfId;
  }
  const payload={
    title,restDay:false,device:document.getElementById('evDevice').value,
    favorite:eventFavoriteState,
    date,start:document.getElementById('evStart').value||'TBD',
    end:document.getElementById('evEnd').value||'TBD',
    categoryId,participants:payloadParticipants,participantStatuses:payloadStatuses,autoSelfParticipantId,
    url:document.getElementById('evUrl').value.trim(),
    description:document.getElementById('evDescription').value.trim(),
    memoTitle:document.getElementById('evMemoTitle').value.trim(),
    memoContent:document.getElementById('evMemoContent').value,
    checklist:getChecklistFromEditor(),
    reminder:document.getElementById('evReminder').value
  };

  const isEdit=Boolean(editingEventId);
  const repeatResult=applyEventPayloadWithRepeat(payload,editingEventId);

  // 화면부터 즉시 닫아서 저장 작업 때문에 창이 남아 보이지 않도록 처리
  closeAllPickers();
  document.getElementById('eventModal').classList.remove('open');

  const saved=saveData(isEdit?'컨텐츠 스케줄 수정':'스케줄 추가');
  // 연락처의 UPCOMING 상태는 컨텐츠의 참여자/날짜 수정 직후 다시 계산
  refreshContactViews();
  const repeatMsg=repeatResult?.series?` · 반복 일정 ${repeatResult.total}개 구성`:'';
  toast(title,saved?(isEdit?`스케줄이 수정되었습니다${repeatMsg} · 연락처 Upcoming도 갱신되었습니다`:`스케줄에 추가되었습니다${repeatMsg} · 연락처 Upcoming도 갱신되었습니다`):'화면에는 추가되었지만 브라우저 저장 공간이 부족합니다. 백업 후 연락처 이미지를 정리해 주세요.');
}
let restConfirmStage=1;
function openRestConfirm(){
  const date=document.getElementById('evDate').value;
  if(!date)return toast('휴방','날짜를 먼저 선택해 주세요');
  restConfirmStage=1;
  renderRestConfirm();
  document.getElementById('restConfirmModal').classList.add('open');
}
function closeRestConfirm(){document.getElementById('restConfirmModal').classList.remove('open')}
function renderRestConfirm(){
  const step=document.getElementById('restConfirmStep'),q=document.getElementById('restConfirmQuestion'),actions=document.getElementById('restConfirmActions');
  step.textContent=`휴방 확인 ${restConfirmStage} / 3`;
  if(restConfirmStage===1){
    q.textContent='휴방을 추가하시겠습니까?';
    actions.innerHTML=`<button class="secondary" type="button" onclick="advanceRestConfirm()">예</button><button class="no-emphasis" type="button" onclick="closeRestConfirm()">아니요</button>`;
  }else if(restConfirmStage===2){
    q.textContent='정말 휴방 하시겠습니까?';
    actions.innerHTML=`<button class="secondary" type="button" onclick="advanceRestConfirm()">예</button><button class="no-emphasis" type="button" onclick="closeRestConfirm()">아니요</button>`;
  }else{
    q.textContent='스케줄을 확인하셨습니까?';
    actions.innerHTML=`<button class="no-emphasis" type="button" onclick="closeRestConfirm()">아니요</button><button class="secondary" type="button" onclick="confirmRestDay()">예</button>`;
  }
}
window.advanceRestConfirm=()=>{restConfirmStage++;renderRestConfirm()}
window.closeRestConfirm=closeRestConfirm;
window.confirmRestDay=()=>{
  const date=document.getElementById('evDate').value;
  data.events.push({
    id:crypto.randomUUID(),title:'휴방',restDay:true,completed:false,date,
    start:'',end:'',categoryId:'',participants:[],participantStatuses:{},url:'',description:'',memoTitle:'',memoContent:'',
    checklist:[],reminder:'',repeat:'',device:'',favorite:false,autoSelfParticipantId:''
  });
  closeRestConfirm();closeAllPickers();document.getElementById('eventModal').classList.remove('open');
  saveData('휴방 추가');
  toast('휴방','휴방을 추가하셨습니다.');
}
document.getElementById('restDayBtn').onclick=openRestConfirm;

document.getElementById('deleteEventBtn').onclick=()=>{if(!editingEventId)return;data.events=data.events.filter(x=>x.id!==editingEventId);document.getElementById('eventModal').classList.remove('open');saveData('일정 삭제');toast('스케줄','삭제되었습니다')}
function duplicateEventById(id,{closeModal=false,source='button'}={}){
  const original=data.events.find(x=>x.id===id);
  if(!original)return null;
  const copy=JSON.parse(JSON.stringify(original));
  copy.id=crypto.randomUUID();
  copy.title=original.title;
  copy.completed=false;
  copy.seriesId='';copy.seriesIndex=null;copy.repeat='';copy.repeatConfig=null;

  const index=data.events.findIndex(x=>x.id===id);
  if(index>=0)data.events.splice(index+1,0,copy);
  else data.events.push(copy);

  if(closeModal){
    closeAllPickers();
    document.getElementById('eventModal').classList.remove('open');
  }

  saveData(source==='ctrl'?'Ctrl 클릭 일정 복제':'일정 복제');
  toast(copy.title,source==='ctrl'
    ? '동일한 컨텐츠가 바로 아래에 복사되었습니다'
    : '동일한 이름과 정보로 복제되었습니다');
  return copy;
}
window.duplicateEventById=duplicateEventById;

document.getElementById('duplicateEventBtn').onclick=()=>{
  if(!editingEventId)return;
  duplicateEventById(editingEventId,{closeModal:true,source:'button'});
};



/* =========================================================
   v2.7 - 메모 / 즐겨찾기
   ========================================================= */
let memoViewMode='library';

function setMemoView(mode){
  memoViewMode=mode==='favorites'?'favorites':'library';
  document.querySelectorAll('.memo-section-tab').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.memoView===memoViewMode);
  });
  document.getElementById('memoLibraryView')?.classList.toggle('active',memoViewMode==='library');
  document.getElementById('memoFavoritesView')?.classList.toggle('active',memoViewMode==='favorites');
  if(memoViewMode==='favorites')renderFavoriteSchedules();
  else renderMemoLibrary();
}
window.setMemoView=setMemoView;

function favoriteEvents(){
  return (data.events||[]).filter(e=>Boolean(e.favorite)&&!e.restDay);
}
function favoriteEventSearchText(e){
  const participantNames=(e.participants||[])
    .map(id=>contact(id)?.name||'')
    .filter(Boolean);
  return [e.title,...participantNames].join(' ').toLowerCase();
}
function favoriteEventTimestamp(e){
  const time=e.start&&e.start!=='TBD'?e.start:'23:59';
  const t=new Date(`${e.date||todayKST()}T${time}:00`).getTime();
  return Number.isFinite(t)?t:0;
}
function favoriteStatus(e){
  if((e.date||'')>=todayKST())return {key:'upcoming',label:'예정'};
  return {key:'past',label:'지난 일정'};
}
function favoriteParticipantHTML(id){
  const c=contact(id);
  if(!c)return '';
  return `<span class="favorite-person">
    ${c.image
      ? `<img loading="lazy" src="${c.image}">`
      : `<span class="favorite-person-avatar" style="display:grid;place-items:center">${esc(initials(c.name))}</span>`}
    <span class="favorite-person-name">${esc(c.name)}</span>
  </span>`;
}
function filteredFavoriteEvents(){
  const q=(document.getElementById('favoriteScheduleSearch')?.value||'').trim().toLowerCase();
  const sort=document.getElementById('favoriteScheduleSort')?.value||'upcoming';
  let arr=favoriteEvents().filter(e=>!q||favoriteEventSearchText(e).includes(q));
  const today=todayKST();
  if(sort==='dateAsc'){
    arr.sort((a,b)=>favoriteEventTimestamp(a)-favoriteEventTimestamp(b));
  }else if(sort==='dateDesc'){
    arr.sort((a,b)=>favoriteEventTimestamp(b)-favoriteEventTimestamp(a));
  }else if(sort==='titleAsc'){
    arr.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'ko'));
  }else{
    arr.sort((a,b)=>{
      const aUpcoming=(a.date||'')>=today;
      const bUpcoming=(b.date||'')>=today;
      if(aUpcoming!==bUpcoming)return aUpcoming?-1:1;
      if(aUpcoming)return favoriteEventTimestamp(a)-favoriteEventTimestamp(b);
      return favoriteEventTimestamp(b)-favoriteEventTimestamp(a);
    });
  }
  return arr;
}
function renderFavoriteSchedules(){
  const all=favoriteEvents();
  const arr=filteredFavoriteEvents();
  const list=document.getElementById('favoriteScheduleList');
  const countTab=document.getElementById('favoriteScheduleCountChip');
  const total=document.getElementById('favoriteTotalChip');
  const upcoming=document.getElementById('favoriteUpcomingChip');
  const completed=document.getElementById('favoriteCompletedChip');
  const today=todayKST();

  if(countTab)countTab.textContent=String(all.length);
  if(total)total.textContent=`북마크 ${all.length}개`;
  if(upcoming)upcoming.textContent=`예정 ${all.filter(e=>(e.date||'')>=today).length}개`;
  if(completed)completed.textContent=`지난 일정 ${all.filter(e=>(e.date||'')<today).length}개`;
  if(!list)return;

  list.innerHTML=arr.length?arr.map(e=>{
    const cat=category(e.categoryId);
    const status=favoriteStatus(e);
    const participantNames=(e.participants||[]).map(id=>contact(id)?.name).filter(Boolean);
    const time=e.start==='TBD'?'미확정':formatTimeKorean(e.start);
    const end=e.end==='TBD'?'미확정':formatTimeKorean(e.end);
    return `<article class="favorite-schedule-card"
      data-event-id="${e.id}"
      style="border-left-color:${cat?.color||'var(--accent)'}"
      onclick="openEvent('${e.id}')">
      <span class="favorite-schedule-star" title="북마크">★</span>
      <div class="favorite-schedule-title">${esc(e.title)}</div>
      <div class="favorite-schedule-meta">
        <span>${formatDateWeekday(e.date)}</span>
        <span>${time}${e.end?` - ${end}`:''}</span>
        ${e.device?`<span class="chip device-chip">${esc(e.device)}</span>`:''}
        ${cat?`<span class="chip" style="border-color:${cat.color}">${esc(cat.name)}</span>`:''}
        <span class="favorite-status ${status.key}">${status.label}</span>
      </div>
      <div class="favorite-participants">
        ${(e.participants||[]).length
          ? (e.participants||[]).map(favoriteParticipantHTML).join('')
          : '<span class="muted small">참가자 없음</span>'}
      </div>
      <div class="muted small" style="margin-top:11px">
        ${participantNames.length?`참가자 ${participantNames.map(esc).join(', ')}`:'참가자 없음'}
      </div>
    </article>`;
  }).join(''):`<div class="favorite-empty">
    ${all.length
      ? '검색 조건에 맞는 북마크 컨텐츠가 없습니다.'
      : '아직 북마크한 컨텐츠가 없습니다. 스케줄 수정창의 별을 눌러 추가해 보세요.'}
  </div>`;
}
window.renderFavoriteSchedules=renderFavoriteSchedules;

document.getElementById('memoLibraryTab').onclick=()=>setMemoView('library');
document.getElementById('memoFavoritesTab').onclick=()=>setMemoView('favorites');
document.getElementById('favoriteScheduleSearch').oninput=renderFavoriteSchedules;
document.getElementById('favoriteScheduleSort').onchange=renderFavoriteSchedules;


/* 메모 */
let editingMemoId=null;

function memoDateText(value){
  if(!value)return '';
  try{
    return new Intl.DateTimeFormat('ko-KR',{
      timeZone:'Asia/Seoul',
      year:'numeric',month:'long',day:'numeric',
      hour:'2-digit',minute:'2-digit'
    }).format(new Date(value));
  }catch(e){return ''}
}
function memoById(id){return (data.memos||[]).find(m=>m.id===id)||null}
function memoLibraryOptions(selected=''){
  return '<option value="">메모 선택</option>'+(data.memos||[])
    .slice()
    .sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt))
    .map(m=>`<option value="${m.id}" ${m.id===selected?'selected':''}>${esc(m.title)}</option>`)
    .join('');
}
function refreshEventMemoLibrarySelect(selected=''){
  const el=document.getElementById('eventMemoLibrarySelect');
  if(el)el.innerHTML=memoLibraryOptions(selected);
}
function filteredMemos(){
  const q=(document.getElementById('memoSearch')?.value||'').trim().toLowerCase();
  let arr=[...(data.memos||[])];
  if(q)arr=arr.filter(m=>
    String(m.title||'').toLowerCase().includes(q) ||
    String(m.content||'').toLowerCase().includes(q)
  );
  return arr.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
}
function renderMemoEditor(){
  const memo=editingMemoId?memoById(editingMemoId):null;
  const editor=document.getElementById('memoEditor');
  const empty=document.getElementById('memoEmptyState');
  if(!editor||!empty)return;

  if(!memo){
    editor.style.display='none';
    empty.style.display='';
    return;
  }
  empty.style.display='none';
  editor.style.display='flex';
  document.getElementById('memoTitleInput').value=memo.title||'';
  document.getElementById('memoContentInput').value=memo.content||'';
  document.getElementById('memoUpdatedText').textContent=memo.updatedAt?`최근 저장 ${memoDateText(memo.updatedAt)}`:'';
}
function renderMemoLibrary(){
  const arr=filteredMemos();
  const list=document.getElementById('memoList');
  const count=document.getElementById('memoCount');
  if(count)count.textContent=`${arr.length}개`;
  if(list){
    list.innerHTML=arr.length?arr.map(m=>`
      <button type="button" class="memo-list-item ${m.id===editingMemoId?'active':''}" onclick="selectMemo('${m.id}')">
        <div class="memo-list-title">${esc(m.title)}</div>
        <div class="memo-list-preview">${esc((m.content||'').trim()||'내용 없음')}</div>
        <div class="memo-list-date">${memoDateText(m.updatedAt)}</div>
      </button>`).join(''):'<div class="empty">저장된 메모가 없습니다</div>';
  }
  if(editingMemoId&&!memoById(editingMemoId))editingMemoId=null;
  renderMemoEditor();
  refreshEventMemoLibrarySelect();
}
window.selectMemo=id=>{
  editingMemoId=id;
  renderMemoLibrary();
}
function createMemo(){
  const now=new Date().toISOString();
  const memo={id:crypto.randomUUID(),title:'새 메모',content:'',createdAt:now,updatedAt:now};
  data.memos.push(memo);
  editingMemoId=memo.id;
  saveData('메모 추가');
  setTab('memos');
  requestAnimationFrame(()=>{
    document.getElementById('memoTitleInput')?.focus();
    document.getElementById('memoTitleInput')?.select();
  });
}
function saveCurrentMemo(){
  const memo=memoById(editingMemoId);
  if(!memo)return;
  const title=document.getElementById('memoTitleInput').value.trim();
  if(!title)return toast('메모 저장','메모 제목을 입력해 주세요');
  memo.title=title;
  memo.content=document.getElementById('memoContentInput').value;
  memo.updatedAt=new Date().toISOString();
  saveData('메모 저장');
  toast(memo.title,'메모가 저장되었습니다');
}
function deleteCurrentMemo(){
  const memo=memoById(editingMemoId);
  if(!memo)return;
  if(!confirm(`"${memo.title}" 메모를 삭제하시겠습니까?`))return;
  data.memos=data.memos.filter(m=>m.id!==editingMemoId);
  editingMemoId=null;
  saveData('메모 삭제');
  toast('메모','삭제되었습니다');
}
document.getElementById('newMemoBtn').onclick=createMemo;
document.getElementById('saveMemoBtn').onclick=saveCurrentMemo;
document.getElementById('deleteMemoBtn').onclick=deleteCurrentMemo;
document.getElementById('memoSearch').oninput=renderMemoLibrary;
document.getElementById('exportMemosBtn').onclick=()=>downloadJSON({version:37,memos:data.memos},'mawang-memos.json');
document.getElementById('importMemosInput').onchange=async e=>{
  const input=e.target,file=input.files[0];
  if(!file)return;
  try{
    const obj=JSON.parse(await file.text());
    const incoming=Array.isArray(obj)?obj:(Array.isArray(obj.memos)?obj.memos:[]);
    if(!incoming.length)throw new Error('메모 데이터가 없습니다');
    let added=0,updated=0;
    incoming.forEach(raw=>{
      if(!raw)return;
      const title=String(raw.title||'제목 없는 메모').trim()||'제목 없는 메모';
      const content=String(raw.content||'');
      const existing=(data.memos||[]).find(m=>m.id&&raw.id&&m.id===raw.id);
      if(existing){
        existing.title=title;
        existing.content=content;
        existing.updatedAt=raw.updatedAt||new Date().toISOString();
        updated++;
      }else{
        data.memos.push({
          id:raw.id&&!memoById(raw.id)?raw.id:crypto.randomUUID(),
          title,content,
          createdAt:raw.createdAt||new Date().toISOString(),
          updatedAt:raw.updatedAt||new Date().toISOString()
        });
        added++;
      }
    });
    saveData('메모 불러오기');
    toast('메모 불러오기',`추가 ${added}개 · 업데이트 ${updated}개`);
  }catch(err){
    toast('메모 불러오기','메모 JSON을 읽을 수 없습니다');
  }finally{
    input.value='';
  }
};

/* 연락처 */
function contactMatches(c,q){
  const text=(String(c.name||'')+' '+(c.labels||[]).join(' ')+' '+String(c.notes||'')).toLowerCase();
  return !q || text.includes(q.toLowerCase());
}
function allContactLabels(){
  const out=[];const seen=new Set();
  [...(data.contactTags||[]),...data.contacts.flatMap(c=>Array.isArray(c.labels)?c.labels:[])].forEach(raw=>{
    const tag=String(raw||'').trim();if(tag&&!seen.has(tag)){seen.add(tag);out.push(tag)}
  });
  return out;
}
let activeContactTag='';
function ensureContactTag(tag){
  const value=String(tag||'').trim();
  if(!value)return;
  if(!data.contactTags.includes(value))data.contactTags.push(value);
}
function syncContactTagsFromContacts(){
  data.contacts.flatMap(c=>c.labels||[]).forEach(ensureContactTag);
}
function setActiveContactTag(tag=''){
  activeContactTag=tag;
  const hidden=document.getElementById('contactLabelFilter');
  if(hidden)hidden.value=tag;
  if(contactView!=='cards'){
    contactView='cards';
    document.querySelectorAll('.contact-view').forEach(b=>b.classList.toggle('active',b.dataset.contactView==='cards'));
    document.getElementById('contactGrid').style.display='grid';
    document.getElementById('pendingContacts').style.display='none';
    const tagPanel=document.querySelector('.contact-tag-panel');
    if(tagPanel)tagPanel.style.display='block';
  }
  renderContacts();
}
window.setActiveContactTag=setActiveContactTag;
function renderContactTagSidebar(){
  const box=document.getElementById('contactTagList');
  if(!box)return;
  syncContactTagsFromContacts();
  const tags=[...(data.contactTags||[])];
  const allCount=data.contacts.filter(c=>!c.pendingSetup).length;
  const allItem=`<div class="contact-tag-item">
    <button type="button" class="contact-tag-button ${activeContactTag===''?'active':''}" onclick="setActiveContactTag('')">
      <span class="contact-tag-name">전체</span><span class="contact-tag-count">${allCount}</span>
    </button>
  </div>`;
  box.innerHTML=allItem+tags.map(tag=>{
    const count=data.contacts.filter(c=>(c.labels||[]).includes(tag)&&!c.pendingSetup).length;
    const encoded=encodeURIComponent(tag);
    return `<div class="contact-tag-item reorder-row" data-contact-tag="${encoded}"
      ondragover="contactTagReorderOver(decodeURIComponent('${encoded}'),event)"
      ondragleave="contactTagReorderLeave(event)"
      ondrop="contactTagReorderDrop(decodeURIComponent('${encoded}'),event)">
      <button type="button" class="reorder-handle tag-reorder-handle" draggable="true" title="드래그해서 태그 순서 변경"
        onclick="event.stopPropagation()"
        ondragstart="contactTagReorderStart(decodeURIComponent('${encoded}'),event)"
        ondragend="contactTagReorderEnd(event)">⋮⋮</button>
      <button type="button" class="contact-tag-button ${activeContactTag===tag?'active':''}"
        onclick="setActiveContactTag(decodeURIComponent('${encoded}'))"
        ondragover="contactTagDragOver(event)"
        ondragleave="contactTagDragLeave(event)"
        ondrop="dropContactOnTag(decodeURIComponent('${encoded}'),event)">
        <span class="contact-tag-name">${esc(tag)}</span><span class="contact-tag-count">${count}</span>
      </button>
      <button type="button" class="contact-tag-action" title="태그 이름 변경" onclick="event.stopPropagation();renameContactTag(decodeURIComponent('${encoded}'))">수정</button>
      <button type="button" class="contact-tag-action" title="태그 삭제" onclick="event.stopPropagation();deleteContactTag(decodeURIComponent('${encoded}'))">삭제</button>
    </div>`;
  }).join('');
}

let contactTagReorderSource='';
function isTagOrderDrag(e){return Array.from(e.dataTransfer?.types||[]).includes('application/x-mawang-tag-order')||Boolean(contactTagReorderSource)}
function clearContactTagReorderMarks(){document.querySelectorAll('#contactTagList .reorder-row').forEach(r=>r.classList.remove('drop-before','drop-after','reorder-dragging'))}
window.contactTagReorderStart=(tag,e)=>{
  contactTagReorderSource=tag;e.stopPropagation();e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('application/x-mawang-tag-order',tag);e.dataTransfer.setData('text/plain',tag);
  e.currentTarget.closest('.reorder-row')?.classList.add('reorder-dragging');
};
window.contactTagReorderOver=(targetTag,e)=>{
  if(!isTagOrderDrag(e))return;
  const source=e.dataTransfer.getData('application/x-mawang-tag-order')||contactTagReorderSource;
  if(!source||source===targetTag)return;e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='move';
  const row=e.currentTarget;const rect=row.getBoundingClientRect();const after=e.clientY>rect.top+rect.height/2;
  row.classList.toggle('drop-before',!after);row.classList.toggle('drop-after',after);
};
window.contactTagReorderLeave=e=>{if(isTagOrderDrag(e))e.currentTarget.classList.remove('drop-before','drop-after')};
window.contactTagReorderDrop=(targetTag,e)=>{
  if(!isTagOrderDrag(e))return;
  const source=e.dataTransfer.getData('application/x-mawang-tag-order')||contactTagReorderSource;
  if(!source||source===targetTag)return clearContactTagReorderMarks();
  e.preventDefault();e.stopPropagation();const row=e.currentTarget,rect=row.getBoundingClientRect(),after=e.clientY>rect.top+rect.height/2;
  const arr=(data.contactTags||[]).filter(t=>t!==source);let idx=arr.indexOf(targetTag);if(idx<0)idx=arr.length;if(after)idx++;
  arr.splice(idx,0,source);data.contactTags=arr;contactTagReorderSource='';clearContactTagReorderMarks();saveData('연락처 태그 순서 변경');
};
window.contactTagReorderEnd=()=>{contactTagReorderSource='';clearContactTagReorderMarks()};

window.contactTagDragOver=e=>{e.preventDefault();e.currentTarget.classList.add('drag-over')};
window.contactTagDragLeave=e=>e.currentTarget.classList.remove('drag-over');
window.dropContactOnTag=(tag,e)=>{
  const types=Array.from(e.dataTransfer?.types||[]);
  if(types.includes('application/x-mawang-tag-order'))return;
  e.preventDefault();e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');
  const id=e.dataTransfer.getData('text/contact-id')||e.dataTransfer.getData('text/plain');
  const c=contact(id);
  if(!c)return;
  ensureContactTag(tag);
  if(!(c.labels||[]).includes(tag))c.labels=[...(c.labels||[]),tag];
  saveData('연락처 태그 지정');
  toast(c.name,`${tag} 태그에 추가했습니다`);
};
window.renameContactTag=oldTag=>{
  const next=prompt('새 태그 이름을 입력해 주세요',oldTag);
  if(next===null)return;
  const value=next.trim();
  if(!value||value===oldTag)return;
  if(data.contactTags.includes(value))return toast('태그','이미 같은 이름의 태그가 있습니다');
  data.contactTags=data.contactTags.map(x=>x===oldTag?value:x);
  if(data.contactTagBanners?.[oldTag]){
    data.contactTagBanners[value]=data.contactTagBanners[oldTag];
    delete data.contactTagBanners[oldTag];
  }
  data.contacts.forEach(c=>c.labels=[...new Set((c.labels||[]).map(x=>x===oldTag?value:x))]);
  if(activeContactTag===oldTag)activeContactTag=value;
  saveData('연락처 태그 이름 변경');
};
window.deleteContactTag=tag=>{
  if(!confirm(`"${tag}" 태그를 삭제하시겠습니까?\n연락처 자체는 삭제되지 않습니다.`))return;
  data.contactTags=data.contactTags.filter(x=>x!==tag);
  if(data.contactTagBanners)delete data.contactTagBanners[tag];
  data.contacts.forEach(c=>c.labels=(c.labels||[]).filter(x=>x!==tag));
  if(activeContactTag===tag)activeContactTag='';
  saveData('연락처 태그 삭제');
};
document.getElementById('addContactTagBtn').onclick=()=>{
  const value=(prompt('추가할 태그 이름을 입력해 주세요')||'').trim();
  if(!value)return;
  if(data.contactTags.includes(value))return setActiveContactTag(value);
  ensureContactTag(value);
  saveData('연락처 태그 추가');
  setActiveContactTag(value);
};
function sortContacts(arr,mode){
  const list=[...arr];
  const lastDate=c=>getLastCollab(c.id)?.date||'';
  if(mode==='nameDesc')return list.sort((a,b)=>b.name.localeCompare(a.name,'ko'));
  if(mode==='oldestFirst')return list.sort((a,b)=>{
    const ad=lastDate(a),bd=lastDate(b);
    if(!ad&&!bd)return a.name.localeCompare(b.name,'ko');
    if(!ad)return-1;if(!bd)return 1;
    return new Date(ad)-new Date(bd);
  });
  if(mode==='recentFirst')return list.sort((a,b)=>{
    const ad=lastDate(a),bd=lastDate(b);
    if(!ad&&!bd)return a.name.localeCompare(b.name,'ko');
    if(!ad)return 1;if(!bd)return-1;
    return new Date(bd)-new Date(ad);
  });
  if(mode==='noRecordFirst')return list.sort((a,b)=>{
    const aa=lastDate(a)?1:0,bb=lastDate(b)?1:0;
    return aa-bb || a.name.localeCompare(b.name,'ko');
  });
  return list.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
}
function filteredContacts({pendingOnly=false}={}){
  const q=(document.getElementById('contactSearch')?.value||'').trim().toLowerCase();
  const label=activeContactTag || document.getElementById('contactLabelFilter')?.value||'';
  const sort=document.getElementById('contactSort')?.value||'nameAsc';
  let arr=data.contacts.filter(c=>c.id!==data.selfContactId&&contactMatches(c,q));
  if(label)arr=arr.filter(c=>(c.labels||[]).includes(label));
  if(pendingOnly)arr=arr.filter(c=>c.pendingSetup);
  return sortContacts(arr,sort);
}
function renderContactFilters(){
  const select=document.getElementById('contactLabelFilter');
  if(!select)return;
  const current=select.value;
  select.innerHTML='<option value="">전체 태그</option>'+allContactLabels().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  if([...select.options].some(o=>o.value===current))select.value=current;
  renderContactTagSidebar();
}
function upcomingEventsForContact(contactId){
  return upcomingEvents()
    .filter(e=>!e.restDay&&(e.participants||[]).includes(contactId))
    .sort((a,b)=>dt(a)-dt(b))
    .slice(0,8);
}

/*
  v1.0:
  Older beta versions may have a completed event but no collaboration record,
  or a collaboration record plus the same completed event.
  Build one normalized history and de-duplicate it every time contact state is rendered.
*/
function normalizedCollaborationHistory(){
  const rows=[];
  const today=todayKST();

  // Explicit collaboration records from older/current versions
  (data.collaborations||[]).forEach(c=>{
    if(!c||!c.date||c.date>=today||c.restDay||String(c.title||'').trim()==='휴방')return;
    rows.push({
      title:String(c.title||'컨텐츠'),
      date:c.date,
      participants:[...new Set(c.participants||[])],
      source:'record'
    });
  });

  /*
    Calendar is the source of truth:
    if a content date is already before today, it is considered to have happened
    even if the user did not manually press "Complete".
    Future/today events never count toward historical sniper effects.
  */
  (data.events||[])
    .filter(e=>!e.restDay && e.date && e.date<today && (e.participants||[]).length)
    .forEach(e=>{
      const confirmedParticipants=(e.participants||[]).filter(id=>eventParticipantStatus(e,id)==='confirmed');
      if(!confirmedParticipants.length)return;
      rows.push({
        title:String(e.title||'컨텐츠'),
        date:e.date,
        participants:[...new Set(confirmedParticipants)],
        source:e.completed?'completed-event':'past-calendar-event'
      });
    });

  // De-duplicate an explicit record and its matching calendar event
  const unique=new Map();
  rows.forEach(r=>{
    const people=[...r.participants].sort().join(',');
    const key=`${r.date}|${r.title.trim().toLocaleLowerCase('ko-KR')}|${people}`;
    if(!unique.has(key))unique.set(key,r);
  });
  return [...unique.values()].sort((a,b)=>new Date(b.date)-new Date(a.date));
}
function contactCollaborationsLast30Days(contactId){
  const today=todayKST();
  return normalizedCollaborationHistory().filter(c=>{
    if(!(c.participants||[]).includes(contactId))return false;
    // 저격 효과는 Upcoming/오늘/미래가 아니라 오늘보다 이전에 완료된 컨텐츠만 계산
    if(c.date>=today)return false;
    const days=daysSince(c.date);
    return days>=1&&days<=30;
  });
}
function contactCollabCount30(contactId){
  return contactCollaborationsLast30Days(contactId).length;
}
function collabFrequencyTier(contactId){
  return Math.min(5,contactCollabCount30(contactId));
}
function collabFrequencyLabel(contactId){
  const n=contactCollabCount30(contactId);
  return n>=5?'30일 · 5회+':`30일 · ${n}회`;
}
function latestNormalizedCollab(contactId){
  return normalizedCollaborationHistory().find(c=>(c.participants||[]).includes(contactId))||null;
}
function contentDdayLabel(dateStr){
  const d=daysUntil(dateStr);
  if(d===0)return 'D-DAY';
  if(d>0)return `D-${d}`;
  return `D+${Math.abs(d)}`;
}
function contactUpcomingItemsHTML(c){
  const upcoming=upcomingEventsForContact(c.id);
  if(!upcoming.length)return '';
  return upcoming.map(e=>`
    <button type="button" class="upcoming-link" onclick="event.stopPropagation();openEventFromLinkedItem('${e.id}')">
      <span style="min-width:0">
        <span class="upcoming-link-title">${esc(e.title)}</span>
        <span class="upcoming-link-meta">${shortDateWeekday(e.date)} · ${formatTimeKorean(e.start)}</span>
      </span>
      <span class="upcoming-dday">${contentDdayLabel(e.date)}</span>
    </button>
  `).join('');
}
function contactUpcomingPopover(c){
  const items=contactUpcomingItemsHTML(c);
  if(!items)return '';
  return `<div class="contact-upcoming-popover" onclick="event.stopPropagation()">
    <div class="upcoming-title">UPCOMING</div>
    ${items}
  </div>`;
}
function contactUpcomingStatic(c){
  const items=contactUpcomingItemsHTML(c);
  if(!items)return '';
  return `<div class="sniper-upcoming-static" onclick="event.stopPropagation()">
    <div class="upcoming-title">UPCOMING</div>
    ${items}
  </div>`;
}
window.contactCardDragStart=(id,e)=>{
  e.stopPropagation();
  e.dataTransfer.effectAllowed='copy';
  e.dataTransfer.setData('text/contact-id',id);
  e.dataTransfer.setData('text/plain',id);
  e.currentTarget.classList.add('dragging');
};
window.contactCardDragEnd=e=>e.currentTarget.classList.remove('dragging');
function normalizeExternalUrl(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  if(/^https?:\/\//i.test(raw))return raw;
  return 'https://'+raw;
}
window.openContactStation=id=>{
  const c=contact(id);
  const url=normalizeExternalUrl(c?.stationUrl);
  if(url)window.open(url,'_blank','noopener');
};


function renderContactTagBanner(){
  const area=document.getElementById('contactTagBannerArea');
  if(!area)return;
  if(contactView!=='cards'||!activeContactTag){
    area.style.display='none';
    area.innerHTML='';
    return;
  }

  const banner=data.contactTagBanners?.[activeContactTag]||'';
  area.style.display='block';
  const encoded=encodeURIComponent(activeContactTag);

  if(!banner){
    area.innerHTML=`<div class="contact-tag-banner-placeholder">
      <div>
        <div class="contact-tag-banner-placeholder-title">${esc(activeContactTag)}</div>
        <div class="contact-tag-banner-placeholder-help">이 태그 그룹 전용 배너 이미지를 추가할 수 있습니다.</div>
      </div>
      <button type="button" class="secondary" onclick="chooseContactTagBanner(decodeURIComponent('${encoded}'))">배너 추가</button>
    </div>`;
    return;
  }

  area.innerHTML=`<div class="contact-tag-banner">
    <img src="${banner}" alt="${esc(activeContactTag)} 배너">
    <div class="contact-tag-banner-info">
      <div class="contact-tag-banner-kicker">CONTACT GROUP</div>
      <div class="contact-tag-banner-name">${esc(activeContactTag)}</div>
    </div>
    <div class="contact-tag-banner-actions">
      <button type="button" class="secondary small" onclick="chooseContactTagBanner(decodeURIComponent('${encoded}'))">배너 교체</button>
      <button type="button" class="danger small" onclick="removeContactTagBanner(decodeURIComponent('${encoded}'))">배너 제거</button>
    </div>
  </div>`;
}
window.renderContactTagBanner=renderContactTagBanner;

let contactTagBannerTarget='';
window.chooseContactTagBanner=tag=>{
  if(!tag)return;
  contactTagBannerTarget=tag;
  const input=document.getElementById('contactTagBannerInput');
  input.value='';
  input.click();
};
window.removeContactTagBanner=tag=>{
  if(!tag||!data.contactTagBanners?.[tag])return;
  if(!confirm(`"${tag}" 그룹 배너를 제거하시겠습니까?`))return;
  delete data.contactTagBanners[tag];
  saveData('연락처 태그 배너 제거');
  renderContactTagBanner();
};

async function compressTagBannerImage(dataUrl,maxWidth=1800,quality=.86){
  if(!dataUrl||!dataUrl.startsWith('data:image/'))return dataUrl||'';
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const scale=Math.min(1,maxWidth/(img.naturalWidth||1));
        const w=Math.max(1,Math.round(img.naturalWidth*scale));
        const h=Math.max(1,Math.round(img.naturalHeight*scale));
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,w,h);
        let result;
        try{result=canvas.toDataURL('image/webp',quality)}catch(e){result=dataUrl}
        resolve(result&&result.length<dataUrl.length?result:dataUrl);
      }catch(e){resolve(dataUrl)}
    };
    img.onerror=()=>resolve(dataUrl);
    img.src=dataUrl;
  });
}

document.getElementById('contactTagBannerInput').onchange=async e=>{
  const file=e.target.files?.[0];
  const tag=contactTagBannerTarget;
  if(!file||!tag)return;
  if(!(file.type||'').startsWith('image/')){
    toast('태그 배너','이미지 파일만 사용할 수 있습니다');
    return;
  }
  try{
    const raw=await new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=()=>resolve(r.result);
      r.onerror=reject;
      r.readAsDataURL(file);
    });
    const compressed=await compressTagBannerImage(raw);
    data.contactTagBanners[tag]=compressed;
    saveData('연락처 태그 배너 변경');
    renderContactTagBanner();
    toast(tag,'그룹 배너를 적용했습니다');
  }catch(err){
    toast('태그 배너','이미지를 불러오지 못했습니다');
  }finally{
    e.target.value='';
  }
};

function renderContacts(){
  renderContactTagSidebar();
  renderContactTagBanner();
  const arr=filteredContacts();
  document.getElementById('contactGrid').innerHTML=arr.map(c=>{
    const last=getLastCollab(c.id);
    const upcoming=upcomingEventsForContact(c.id);

    return `<div class="contact-card ${c.pendingSetup?'pending-card':''} ${upcoming.length?'has-upcoming':''}"
      draggable="true" data-contact-id="${c.id}"
      ondragstart="contactCardDragStart('${c.id}',event)"
      ondragend="contactCardDragEnd(event)"
      onclick="openContact('${c.id}')">
      <div class="space" style="align-items:flex-start">
        <div class="row">
          ${c.image?`<img class="avatar" loading="lazy" src="${c.image}">`:`<div class="avatar" style="display:grid;place-items:center;font-weight:800">${esc(initials(c.name))}</div>`}
          <div>
            <div class="event-title">${esc(c.name)}</div>
            ${c.pendingSetup?'<span class="chip" style="margin-top:5px">신규 추가</span>':''}
          </div>
        </div>
        <div class="contact-statuses">
          ${upcoming.length?`<span class="upcoming-count-badge">UPCOMING ${upcoming.length}</span>`:''}
        </div>
      </div>
      <div class="row" style="margin-top:10px">${(c.labels||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div>
      <div class="small" style="margin-top:12px">
        ${last?`최근 컨텐츠: ${esc(last.title)}<br><span class="muted">${formatDateWeekday(last.date)} · ${daysSince(last.date)}일 전</span>`:'<span class="muted">합방 기록 없음</span>'}
      </div>
      ${c.stationUrl?`<button type="button" class="station-link" onclick="event.stopPropagation();openContactStation('${c.id}')">방송국 열기</button>`:''}
      ${contactUpcomingPopover(c)}
    </div>`;
  }).join('')||'<div class="empty">연락처가 없습니다</div>';
}
function renderSniperFilters(){
  const select=document.getElementById('sniperLabelFilter');
  if(!select)return;
  const current=select.value;
  select.innerHTML='<option value="">전체 라벨</option>'+allContactLabels().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  if([...select.options].some(o=>o.value===current))select.value=current;
}

/* =========================================================
   전용 저격 리스트
   ========================================================= */
let targetShootingMode=false;
let targetClearingIds=new Set();
let targetPickerTag='';

function targetContacts(){
  return (data.targetList||[]).map(contact).filter(Boolean);
}
function targetGapInfo(contactId){
  const last=getLastCollab(contactId);
  if(!last)return {last:null,days:null,label:'아직 같이 논 기록 없음',className:'very-long'};
  const days=daysSince(last.date);
  if(days>=60)return {last,days,label:`${days}일째 안 놀아줌`,className:'very-long'};
  if(days>=30)return {last,days,label:`${days}일째 안 놀아줌`,className:'long'};
  if(days>=14)return {last,days,label:`${days}일 전 마지막 합방`,className:''};
  return {last,days,label:`${days}일 전 같이 놀았음`,className:'recent'};
}
function targetUpcoming(contactId){
  return upcomingEventsForContact(contactId);
}
function targetNearestUpcoming(contactId){
  return targetUpcoming(contactId)[0]||null;
}
function targetFilteredContacts(){
  const q=(document.getElementById('targetSearch')?.value||'').trim().toLowerCase();
  let arr=targetContacts();
  if(q)arr=arr.filter(c=>contactMatches(c,q));
  return arr.sort((a,b)=>{
    const ag=targetGapInfo(a.id),bg=targetGapInfo(b.id);
    if(ag.days===null&&bg.days!==null)return -1;
    if(ag.days!==null&&bg.days===null)return 1;
    if(ag.days!==bg.days)return (bg.days||0)-(ag.days||0);
    return a.name.localeCompare(b.name,'ko');
  });
}
function targetClearFxHTML(){
  const feathers='<span class="target-feather"></span>'.repeat(5);
  return `<div class="target-clear-fx" aria-hidden="true">
    <div class="target-clear-flash"></div>
    <div class="target-wings">
      <div class="target-wing left">${feathers}</div>
      <div class="target-wing right">${feathers}</div>
    </div>
    <div class="target-clear-word">CLEAR</div>
  </div>`;
}
function targetCardHTML(c){
  const gap=targetGapInfo(c.id);
  const last=gap.last;
  const upcoming=targetUpcoming(c.id);
  const nearest=upcoming[0]||null;
  const count30=contactCollabCount30(c.id);
  const labels=(c.labels||[]).slice(0,4);
  return `<article class="target-person-card ${targetClearingIds.has(c.id)?'clearing':''}" data-target-id="${c.id}"
      onclick="handleTargetCardClick('${c.id}',event)">
    ${targetClearFxHTML()}
    <div class="target-person-header">
      ${c.image
        ? `<img class="target-person-avatar" loading="lazy" src="${c.image}">`
        : `<div class="target-person-avatar placeholder">${esc(initials(c.name))}</div>`}
      <div style="min-width:0;flex:1">
        <div class="target-person-name">${esc(c.name)}</div>
        <div class="target-person-labels">
          ${labels.length?labels.map(x=>`<span class="target-label-pill">${esc(x)}</span>`).join(''):'<span class="target-label-pill">라벨 없음</span>'}
        </div>
      </div>
      ${nearest?`<span class="target-dday">${contentDdayLabel(nearest.date)}</span>`:''}
    </div>

    <div class="target-gap-box">
      <div class="target-gap-label">안 놀아준 기간</div>
      <div class="target-gap-value ${gap.className}">${esc(gap.label)}</div>
    </div>

    <div class="target-info-grid">
      <div class="target-info-cell">
        <div class="target-info-label">마지막 합방</div>
        <div class="target-info-main">${last?esc(last.title):'기록 없음'}</div>
        <div class="target-info-sub">${last?shortDateWeekday(last.date):'아직 함께한 과거 컨텐츠가 없습니다'}</div>
      </div>
      <div class="target-info-cell">
        <div class="target-info-label">최근 30일</div>
        <div class="target-info-main">${count30}회 같이 놀았음</div>
        <div class="target-info-sub">${upcoming.length?`앞으로 ${upcoming.length}개 예정`:'현재 예정된 합방 없음'}</div>
      </div>
    </div>

    <div class="target-upcoming-block">
      <div class="target-upcoming-title">
        <span>앞으로 합방 예정</span>
        <span>${upcoming.length}개</span>
      </div>
      ${upcoming.length
        ? upcoming.slice(0,3).map(e=>`<button type="button" class="target-upcoming-item"
            onclick="event.stopPropagation();openEventFromLinkedItem('${e.id}')">
            <span style="min-width:0">
              <span class="target-upcoming-name">${esc(e.title)}</span>
              <span class="target-upcoming-meta">${shortDateWeekday(e.date)} · ${formatTimeKorean(e.start)}</span>
            </span>
            <span class="target-dday">${contentDdayLabel(e.date)}</span>
          </button>`).join('') +
          (upcoming.length>3?`<div class="muted small" style="margin-top:6px">외 ${upcoming.length-3}개 예정</div>`:'')
        : '<div class="target-no-upcoming">현재 잡혀 있는 합방이 없습니다. 저격 요청이 필요해 보입니다.</div>'}
    </div>
  </article>`;
}
function renderTargetList(){
  const grid=document.getElementById('targetGrid');
  if(!grid)return;

  const all=targetContacts();
  const arr=targetFilteredContacts();
  const noUpcoming=all.filter(c=>targetUpcoming(c.id).length===0).length;
  const longGap=all.filter(c=>{
    const g=targetGapInfo(c.id);
    return g.days===null||g.days>=30;
  }).length;

  document.getElementById('targetCountChip').textContent=`등록 ${all.length}명`;
  document.getElementById('targetNoUpcomingChip').textContent=`예정 없음 ${noUpcoming}명`;
  document.getElementById('targetLongGapChip').textContent=`30일 이상 ${longGap}명`;

  const addCard=`<button type="button" class="target-add-card" onclick="openTargetPicker()">
    <div class="target-add-symbol">
      <span class="target-silhouette" aria-hidden="true"></span>
      <span class="target-add-plus">+</span>
    </div>
    <div class="target-add-label">인원 추가</div>
    <div class="target-add-help">연락처에서 저격 대상을 선택합니다</div>
  </button>`;

  grid.innerHTML=addCard + arr.map(targetCardHTML).join('');
  updateTargetShootUI();
}
function renderTargetPicker(){
  const list=document.getElementById('targetPickerList');
  const tagBox=document.getElementById('targetPickerTags');
  if(!list)return;
  const q=(document.getElementById('targetPickerSearch')?.value||'').trim().toLowerCase();
  const registered=new Set(data.targetList||[]);
  syncContactTagsFromContacts();
  const tags=[...(data.contactTags||[])];
  if(tagBox){
    tagBox.innerHTML=`<button type="button" class="target-picker-tag ${targetPickerTag===''?'active':''}" onclick="setTargetPickerTag('')">전체</button>`+
      tags.map(tag=>{
        const encoded=encodeURIComponent(tag);
        return `<button type="button" class="target-picker-tag ${targetPickerTag===tag?'active':''}" onclick="setTargetPickerTag(decodeURIComponent('${encoded}'))">${esc(tag)}</button>`;
      }).join('');
  }
  let arr=[...(data.contacts||[])].filter(c=>contactMatches(c,q));
  if(targetPickerTag)arr=arr.filter(c=>(c.labels||[]).includes(targetPickerTag));
  arr.sort((a,b)=>a.name.localeCompare(b.name,'ko'));

  list.innerHTML=arr.length?arr.map(c=>{
    const isRegistered=registered.has(c.id);
    const last=getLastCollab(c.id);
    return `<button type="button" class="target-picker-person ${isRegistered?'target-picker-registered':''}"
      ${isRegistered?'disabled':''}
      onclick="addTargetContact('${c.id}')">
      <span class="row" style="min-width:0">
        ${c.image?`<img class="avatar" loading="lazy" src="${c.image}">`:`<span class="avatar" style="display:grid;place-items:center">${esc(initials(c.name))}</span>`}
        <span style="min-width:0">
          <span class="target-picker-name">${esc(c.name)}</span>
          <span class="target-picker-meta">${(c.labels||[]).slice(0,3).map(esc).join(' · ')||'라벨 없음'}${last?` · 마지막 합방 ${daysSince(last.date)}일 전`:' · 합방 기록 없음'}</span>
        </span>
      </span>
      <span class="target-picker-add">${isRegistered?'등록됨':'+ 추가'}</span>
    </button>`;
  }).join(''):'<div class="empty">검색 결과가 없습니다</div>';
}
window.setTargetPickerTag=tag=>{targetPickerTag=tag;renderTargetPicker()};
window.openTargetPicker=()=>{
  if(targetShootingMode)return toast('저격 모드','저격 모드를 종료한 뒤 인원을 추가해 주세요');
  closeMainModals();
  document.getElementById('targetPickerSearch').value='';
  targetPickerTag='';
  renderTargetPicker();
  document.getElementById('targetPickerModal').classList.add('open');
  requestAnimationFrame(()=>document.getElementById('targetPickerSearch')?.focus());
};
window.addTargetContact=id=>{
  if(!contact(id))return;
  if(!(data.targetList||[]).includes(id)){
    data.targetList.push(id);
    saveData('저격 리스트 인원 추가');
  }
  document.getElementById('targetPickerModal').classList.remove('open');
  const c=contact(id);
  toast(c?.name||'저격 리스트','저격 리스트에 등록했습니다');
  setTab('targets');
};
window.removeTargetContact=id=>{
  data.targetList=(data.targetList||[]).filter(x=>x!==id);
  saveData('저격 리스트 인원 제거');
};
function updateTargetShootUI(){
  const btn=document.getElementById('targetShootBtn');
  const text=document.getElementById('targetShootBtnText');
  if(!btn||!text)return;
  btn.classList.toggle('active',targetShootingMode);
  text.textContent=targetShootingMode?'저격 종료':'저격';
  document.body.classList.toggle('target-shooting',targetShootingMode);
  btn.setAttribute('aria-pressed',targetShootingMode?'true':'false');
}
function toggleTargetShooting(){
  if(!(data.targetList||[]).length){
    targetShootingMode=false;
    updateTargetShootUI();
    return toast('저격 리스트','먼저 저격할 인원을 추가해 주세요');
  }
  targetShootingMode=!targetShootingMode;
  updateTargetShootUI();
  toast('저격 모드',targetShootingMode?'조준 모드를 시작했습니다. 카드를 클릭해 CLEAR 하세요.':'저격 모드를 종료했습니다.');
}

function stopTargetShooting(reason='manual'){
  if(!targetShootingMode)return;
  targetShootingMode=false;
  updateTargetShootUI();
  if(reason==='blank')toast('저격 모드','허공을 클릭하여 저격 모드를 종료했습니다.');
}
document.addEventListener('click',e=>{
  if(!targetShootingMode)return;
  const section=document.getElementById('targets');
  if(!section?.classList.contains('active'))return;
  const target=e.target;
  if(!(target instanceof Element))return;

  // Cards and actual controls are not "empty space".
  if(target.closest('.target-person-card,#targetShootBtn,.target-add-card,button,input,select,textarea,label,.modal'))return;

  // The target tab is active, so any remaining background click counts as an empty shot.
  // This also covers the large blank main/background area below or beside the cards.
  stopTargetShooting('blank');
});

function playTargetShotSound(){
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
    const ctx=new Ctx();
    const duration=.23;
    const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate);
    const channel=buffer.getChannelData(0);
    for(let i=0;i<channel.length;i++){
      const t=i/channel.length;
      const env=Math.pow(1-t,4.2);
      channel[i]=(Math.random()*2-1)*env;
    }
    const noise=ctx.createBufferSource();
    noise.buffer=buffer;
    const filter=ctx.createBiquadFilter();
    filter.type='lowpass';filter.frequency.setValueAtTime(1650,ctx.currentTime);
    const gain=ctx.createGain();
    gain.gain.setValueAtTime(.34,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);
    noise.connect(filter).connect(gain).connect(ctx.destination);

    const osc=ctx.createOscillator();
    const og=ctx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(115,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(48,ctx.currentTime+.13);
    og.gain.setValueAtTime(.22,ctx.currentTime);
    og.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.17);
    osc.connect(og).connect(ctx.destination);

    noise.start();osc.start();
    noise.stop(ctx.currentTime+duration);osc.stop(ctx.currentTime+.18);
    setTimeout(()=>{try{ctx.close()}catch(e){}},450);
  }catch(e){
    console.warn('저격 효과음 재생 실패',e);
  }
}
window.handleTargetCardClick=(id,event)=>{
  if(event?.target?.closest('button'))return;
  if(targetShootingMode){
    clearTargetWithEffect(id);
  }else{
    openContact(id);
  }
};
function clearTargetWithEffect(id){
  if(targetClearingIds.has(id))return;
  const c=contact(id);
  const card=document.querySelector(`.target-person-card[data-target-id="${id}"]`);
  if(!c||!card)return;

  targetClearingIds.add(id);
  card.classList.add('clearing');
  playTargetShotSound();

  setTimeout(()=>{
    data.targetList=(data.targetList||[]).filter(x=>x!==id);
    targetClearingIds.delete(id);
    saveData('저격 CLEAR');
    toast(c.name,'CLEAR · 저격 리스트에서 제거했습니다');
    if(!(data.targetList||[]).length){
      targetShootingMode=false;
      updateTargetShootUI();
    }
  },1450);
}
document.getElementById('targetShootBtn').onclick=toggleTargetShooting;
document.getElementById('targetSearch').oninput=renderTargetList;
document.getElementById('targetPickerSearch').oninput=renderTargetPicker;



/* =========================================================
   v2.5 - 최근 합방 / 랭킹 서브탭
   ========================================================= */
let sniperViewMode='recent';
let rankingRangeMode='all';
let rankingCustomStart='';
let rankingCustomEnd='';

function setSniperView(mode){
  sniperViewMode=mode==='ranking'?'ranking':'recent';
  document.querySelectorAll('.sniper-view-tab').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.sniperView===sniperViewMode);
  });
  document.getElementById('sniperRecentView').classList.toggle('active',sniperViewMode==='recent');
  document.getElementById('sniperRankingView').classList.toggle('active',sniperViewMode==='ranking');
  if(sniperViewMode==='ranking')renderCollabRanking();
  else renderSniperList();
}
window.setSniperView=setSniperView;

function dateShiftMonths(dateStr,months){
  const d=new Date(dateStr+'T12:00:00');
  const originalDay=d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth()+months);
  const lastDay=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  d.setDate(Math.min(originalDay,lastDay));
  return ymd(d);
}
function rankingBounds(){
  const today=todayKST();
  if(rankingRangeMode==='1m')return {start:dateShiftMonths(today,-1),end:today};
  if(rankingRangeMode==='2m')return {start:dateShiftMonths(today,-2),end:today};
  if(rankingRangeMode==='3m')return {start:dateShiftMonths(today,-3),end:today};
  if(rankingRangeMode==='custom'){
    return {start:rankingCustomStart||'',end:rankingCustomEnd||today};
  }
  return {start:'',end:today};
}
function rankingRangeCaption(){
  const {start,end}=rankingBounds();
  if(rankingRangeMode==='all')return '전체 기간';
  if(rankingRangeMode==='1m')return `최근 1개월 · ${formatDate(start)} ~ ${formatDate(end)}`;
  if(rankingRangeMode==='2m')return `최근 2개월 · ${formatDate(start)} ~ ${formatDate(end)}`;
  if(rankingRangeMode==='3m')return `최근 3개월 · ${formatDate(start)} ~ ${formatDate(end)}`;
  return start?`사용자 지정 · ${formatDate(start)} ~ ${formatDate(end)}`:`사용자 지정 · 시작일을 선택해 주세요`;
}
function rankingHistory(){
  const {start,end}=rankingBounds();
  return normalizedCollaborationHistory().filter(r=>{
    if(!r?.date)return false;
    if(end&&r.date>end)return false;
    if(start&&r.date<start)return false;
    return true;
  });
}
function rankingRows(){
  /*
    중요: 순위는 전체 기간 랭킹을 가져와 잘라 쓰지 않습니다.
    현재 선택된 rankingHistory()만 집계하고 정렬한 뒤 1부터 rank를 새로 부여합니다.
  */
  const history=rankingHistory();
  const counts=new Map();
  const latest=new Map();
  history.forEach(record=>{
    (record.participants||[]).forEach(id=>{
      if(!contact(id))return;
      counts.set(id,(counts.get(id)||0)+1);
      if(!latest.has(id)||record.date>latest.get(id))latest.set(id,record.date);
    });
  });
  const sorted=data.contacts
    .filter(c=>c.id!==data.selfContactId)
    .map(c=>({contact:c,count:counts.get(c.id)||0,latest:latest.get(c.id)||''}))
    .filter(x=>x.count>0)
    .sort((a,b)=>b.count-a.count || (b.latest||'').localeCompare(a.latest||'') || a.contact.name.localeCompare(b.contact.name,'ko'));
  return sorted.map((entry,index)=>({...entry,rank:index+1}));
}
function rankingCrownSVG(){
  return `<svg viewBox="0 0 64 48" aria-hidden="true">
    <path d="M7 36 4 11l15 11L32 5l13 17 15-11-3 25H7Zm3 5h44v4H10z"/>
  </svg>`;
}
function rankingAvatarHTML(c,cls='ranking-podium-avatar'){
  return c.image
    ? `<img class="${cls}" loading="lazy" src="${c.image}">`
    : `<div class="${cls}" style="display:grid;place-items:center;font-size:22px;font-weight:950">${esc(initials(c.name))}</div>`;
}
function podiumSlotHTML(entry,place){
  const names={1:'1ST',2:'2ND',3:'3RD'};
  const klass=place===1?'first':place===2?'second':'third';
  if(!entry){
    return `<div class="ranking-podium-slot ${klass}">
      <div class="ranking-podium-card ranking-empty-podium">
        ${place===1?`<div class="ranking-crown">${rankingCrownSVG()}</div>`:''}
        <div class="ranking-medal">${names[place]}</div>
        <div class="ranking-podium-name">기록 없음</div>
        <div class="ranking-podium-count">0회</div>
        <span class="ranking-podium-number">${place}</span>
      </div>
      <div class="ranking-step">${place}</div>
    </div>`;
  }
  const c=entry.contact;
  return `<div class="ranking-podium-slot ${klass}">
    <button type="button" class="ranking-podium-card" onclick="openContact('${c.id}')">
      ${place===1?`<div class="ranking-crown">${rankingCrownSVG()}</div>`:''}
      <div class="ranking-medal">${names[place]}</div>
      ${rankingAvatarHTML(c)}
      <div class="ranking-podium-name">${esc(c.name)}</div>
      <div class="ranking-podium-count">합방 ${entry.count}회</div>
      <div class="ranking-period-rank">선택 기간 ${entry.rank}위</div>
      <span class="ranking-podium-number">${entry.rank}</span>
    </button>
    <div class="ranking-step">${entry.rank}</div>
  </div>`;
}
function syncRankingRangeUI(){
  document.querySelectorAll('.ranking-range-btn').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.rankingRange===rankingRangeMode);
  });
  const panel=document.getElementById('rankingCustomPanel');
  if(panel)panel.classList.toggle('open',rankingRangeMode==='custom');
}
function renderCollabRanking(){
  if(!document.getElementById('rankingPodium'))return;
  syncRankingRangeUI();
  const today=todayKST();
  const startInput=document.getElementById('rankingStartDate');
  const endInput=document.getElementById('rankingEndDate');
  if(startInput){
    startInput.max=today;
    startInput.value=rankingCustomStart;
  }
  if(endInput){
    endInput.max=today;
    endInput.value=rankingCustomEnd||today;
  }

  const rows=rankingRows();
  const history=rankingHistory();
  const caption=document.getElementById('rankingPeriodCaption');
  const totalCaption=document.getElementById('rankingTotalCaption');
  if(caption)caption.textContent=rankingRangeCaption();
  if(totalCaption)totalCaption.textContent=`선택 기간 재계산 · 집계 컨텐츠 ${history.length}개 · 랭킹 인원 ${rows.length}명`;

  const first=rows[0]||null,second=rows[1]||null,third=rows[2]||null;
  document.getElementById('rankingPodium').innerHTML=
    podiumSlotHTML(second,2)+podiumSlotHTML(first,1)+podiumSlotHTML(third,3);

  const rest=rows.slice(3);
  document.getElementById('rankingList').innerHTML=rest.length
    ? rest.map(entry=>`<button type="button" class="ranking-list-row" onclick="openContact('${entry.contact.id}')">
        <span class="ranking-list-rank"><span class="ranking-rank-pill">${entry.rank}위</span></span>
        <span class="ranking-list-name">${esc(entry.contact.name)}</span>
        <span class="ranking-list-count">${entry.count}회</span>
      </button>`).join('')
    : `<div class="ranking-no-data">${rows.length
        ? '4위 이하의 추가 인원이 없습니다.'
        : '선택한 기간에 집계할 합방 기록이 없습니다.'}</div>`;
}
window.renderCollabRanking=renderCollabRanking;

document.getElementById('sniperRecentTab').onclick=()=>setSniperView('recent');
document.getElementById('sniperRankingTab').onclick=()=>setSniperView('ranking');
document.querySelectorAll('.ranking-range-btn').forEach(btn=>{
  btn.onclick=()=>{
    const mode=btn.dataset.rankingRange;
    if(mode==='custom'){
      rankingRangeMode='custom';
      if(!rankingCustomEnd)rankingCustomEnd=todayKST();
      if(!rankingCustomStart)rankingCustomStart=dateShiftMonths(todayKST(),-1);
      renderCollabRanking();
      requestAnimationFrame(()=>{
        const start=document.getElementById('rankingStartDate');
        if(start&&typeof start.showPicker==='function'){
          try{start.showPicker()}catch(e){}
        }
      });
      return;
    }
    rankingRangeMode=mode;
    document.getElementById('rankingCustomPanel')?.classList.remove('open');
    renderCollabRanking();
  };
});
document.getElementById('rankingApplyCustom').onclick=()=>{
  const start=document.getElementById('rankingStartDate').value;
  if(!start)return toast('랭킹 기간','시작일을 선택해 주세요');
  updateRankingFromCustomInputs();
};
function updateRankingFromCustomInputs({silent=false}={}){
  const start=document.getElementById('rankingStartDate')?.value||'';
  const end=document.getElementById('rankingEndDate')?.value||todayKST();
  if(!start)return false;
  if(start>end){
    if(!silent)toast('랭킹 기간','시작일은 종료일보다 늦을 수 없습니다');
    return false;
  }
  rankingCustomStart=start;
  rankingCustomEnd=end;
  rankingRangeMode='custom';
  renderCollabRanking();
  return true;
}
['rankingStartDate','rankingEndDate'].forEach(id=>{
  const input=document.getElementById(id);
  if(!input)return;
  input.onclick=()=>{
    if(typeof input.showPicker==='function'){
      try{input.showPicker()}catch(e){}
    }
  };
  input.onchange=()=>updateRankingFromCustomInputs({silent:true});
});



let sniperTierFilter='all';
function sniperFilteredContacts(){
  const q=(document.getElementById('sniperSearch')?.value||'').trim().toLowerCase();
  const label=document.getElementById('sniperLabelFilter')?.value||'';
  const mode=document.getElementById('sniperSort')?.value||'recentFirst';

  let arr=data.contacts.filter(c=>contactMatches(c,q));
  if(label)arr=arr.filter(c=>(c.labels||[]).includes(label));

  if(sniperTierFilter!=='all'){
    const wanted=Number(sniperTierFilter);
    arr=arr.filter(c=>{
      const count=contactCollabCount30(c.id);
      const tier=Math.min(10,count);
      return wanted===0?count===0:tier===wanted;
    });
  }

  const lastDate=c=>getLastCollab(c.id)?.date||'';
  if(mode==='nameAsc'){
    arr.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  }else if(mode==='recentFirst'){
    arr.sort((a,b)=>{
      const ad=lastDate(a),bd=lastDate(b);
      if(!ad&&!bd)return a.name.localeCompare(b.name,'ko');
      if(!ad)return 1;if(!bd)return -1;
      return new Date(bd)-new Date(ad);
    });
  }else if(mode==='collabCountDesc'){
    arr.sort((a,b)=>contactCollabCount30(b.id)-contactCollabCount30(a.id)||a.name.localeCompare(b.name,'ko'));
  }else if(mode==='collabCountAsc'){
    arr.sort((a,b)=>contactCollabCount30(a.id)-contactCollabCount30(b.id)||a.name.localeCompare(b.name,'ko'));
  }else{
    arr.sort((a,b)=>{
      const ad=lastDate(a),bd=lastDate(b);
      if(!ad&&!bd)return a.name.localeCompare(b.name,'ko');
      if(!ad)return -1;if(!bd)return 1;
      return new Date(ad)-new Date(bd);
    });
  }
  return arr;
}
function renderSniperList(){
  renderSniperFilters();
  const arr=sniperFilteredContacts();
  const active30=arr.filter(c=>contactCollabCount30(c.id)>0).length;
  const upcomingCount=arr.filter(c=>upcomingEventsForContact(c.id).length>0).length;
  const summary=document.getElementById('sniperSummary');
  if(summary){
    summary.innerHTML=`
      <span class="chip">현재 표시 ${arr.length}명</span>
      <span class="chip">이전 30일 합방 ${active30}명</span>
      <span class="chip">Upcoming ${upcomingCount}명</span>`;
  }

  const allContacts=data.contacts.filter(c=>{
    if(c.id===data.selfContactId)return false;
    const q=(document.getElementById('sniperSearch')?.value||'').trim().toLowerCase();
    const label=document.getElementById('sniperLabelFilter')?.value||'';
    return contactMatches(c,q)&&(!label||(c.labels||[]).includes(label));
  });
  const tierCounts={0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0};
  allContacts.forEach(c=>{
    const n=contactCollabCount30(c.id);
    tierCounts[Math.min(10,n)]++;
  });
  const filterBox=document.getElementById('sniperTierFilters');
  if(filterBox){
    const defs=[
      ['all','전체',allContacts.length],
      ['0','기록 없음',tierCounts[0]],
      ['1','1회',tierCounts[1]],
      ['2','2회',tierCounts[2]],
      ['3','3회',tierCounts[3]],
      ['4','4회',tierCounts[4]],
      ['5','5회',tierCounts[5]],
      ['6','6회',tierCounts[6]],
      ['7','7회',tierCounts[7]],
      ['8','8회',tierCounts[8]],
      ['9','9회',tierCounts[9]],
      ['10','10회+',tierCounts[10]]
    ];
    filterBox.innerHTML=defs.map(([id,label,count])=>`
      <button type="button" class="sniper-tier-filter ${String(sniperTierFilter)===String(id)?'active':''}" data-tier="${id}">
        ${label}<span class="filter-count">${count}</span>
      </button>`).join('');
    filterBox.querySelectorAll('.sniper-tier-filter').forEach(btn=>{
      btn.onclick=()=>{
        sniperTierFilter=btn.dataset.tier;
        renderSniperList();
      };
    });
  }

  document.getElementById('sniperList').innerHTML=arr.map((c,i)=>{
    const last=getLastCollab(c.id);
    const upcoming=upcomingEventsForContact(c.id);
    const count30=contactCollabCount30(c.id);
    const tier=Math.min(10,count30);
    const tierText=count30
      ? `오늘 제외 이전 30일 · ${count30}회`
      : '오늘 제외 이전 30일 · 기록 없음';

    return `<div class="event-card contact-card ${tier?`collab-${tier}`:''}">
      <div class="sniper-row">
        <div class="sniper-rank">${i+1}</div>
        <div class="sniper-main" onclick="openContact('${c.id}')">
          ${c.image?`<img class="avatar sm" loading="lazy" src="${c.image}">`:`<div class="avatar sm" style="display:grid;place-items:center;font-weight:800">${esc(initials(c.name))}</div>`}
          <div style="min-width:0">
            <div class="sniper-name">${esc(c.name)}</div>
            <div class="sniper-meta">${(c.labels||[]).slice(0,4).map(esc).join(' · ')||'라벨 없음'}</div>
            <div class="sniper-activity-note">${tierText}</div>
          </div>
        </div>
        ${tier?`<div class="sniper-fx-stage fx-tier-${tier}" data-count="${count30>=10?'10+':count30}" aria-label="최근 30일 ${count30}회 효과">
          <span class="fx-core"></span>
          <span class="fx-particles"></span>
          <span class="fx-overlay"></span>
        </div>`:`<div class="sniper-fx-stage" data-count="0"></div>`}
        <div class="sniper-side">
          <div class="sniper-badges">
            ${upcoming.length?`<span class="upcoming-count-badge">UPCOMING ${upcoming.length}</span>`:''}
            ${count30?`<span class="collab-count-badge">이전30일 · ${count30}회</span>`:''}
          </div>
          <div class="sniper-last-days">${last?daysSince(last.date)+'일':'기록 없음'}</div>
          <div class="muted small">${last?`최근: ${esc(last.title)} · ${shortDateWeekday(last.date)}`:'아직 합방 기록이 없습니다'}</div>
        </div>
      </div>
      ${contactUpcomingStatic(c)}
    </div>`;
  }).join('')||'<div class="empty">검색 조건에 맞는 연락처가 없습니다</div>';
}
function renderPendingContacts(){
  const arr=filteredContacts({pendingOnly:true});
  const allCount=data.contacts.filter(c=>c.pendingSetup).length;document.getElementById('pendingTabBtn').textContent=`신규 추가${allCount?` ${allCount}`:''}`;
  document.getElementById('pendingContacts').innerHTML=`<div class="space" style="margin-bottom:12px"><div><h3 style="margin:0">신규 추가 연락처</h3><div class="muted small" style="margin-top:4px">일정 등록 중 빠르게 추가한 연락처입니다. 사진, 라벨, 메모를 입력하면 일반 연락처로 이동합니다.</div></div><span class="chip">${arr.length}명</span></div>
    <div class="contact-grid">${arr.map(c=>`<div class="contact-card pending-card" onclick="openContact('${c.id}')"><div class="row"><div class="avatar" style="display:grid;place-items:center;font-weight:800">${esc(initials(c.name))}</div><div><div class="event-title">${esc(c.name)}</div><span class="chip" style="margin-top:5px">정보 입력 필요</span></div></div><div class="muted small" style="margin-top:12px">클릭해서 프로필 이미지와 라벨을 등록해 주세요.</div></div>`).join('')||'<div class="empty">새로 정리할 연락처가 없습니다</div>'}</div>`;
}
function setContactView(view){
  contactView=view;document.querySelectorAll('.contact-view').forEach(b=>b.classList.toggle('active',b.dataset.contactView===view));
  document.getElementById('contactGrid').style.display=view==='cards'?'grid':'none';
  document.getElementById('pendingContacts').style.display=view==='pending'?'block':'none';
  const tagPanel=document.querySelector('.contact-tag-panel');
  if(tagPanel)tagPanel.style.display=view==='cards'?'block':'none';
  if(view==='pending')renderPendingContacts();else renderContacts();
}
document.querySelectorAll('.contact-view').forEach(b=>b.onclick=()=>setContactView(b.dataset.contactView));
function refreshContactViews(){renderContacts();renderSniperList();renderTargetList();renderPendingContacts();renderContactTagSidebar()}
function mwsRenderActiveContactView(){
  if(contactView==='pending')renderPendingContacts();
  else if(contactView==='incomplete'&&typeof renderIncompleteContacts==='function')renderIncompleteContacts();
  else if(contactView==='favorite'&&typeof renderFavoriteContactsV574==='function')renderFavoriteContactsV574();
  else renderContacts();
}
let mwsContactSearchTimer=0;
const mwsContactSearchInput=document.getElementById('contactSearch');
if(mwsContactSearchInput){
  mwsContactSearchInput.oninput=(ev)=>{
    if(ev?.isComposing)return;
    clearTimeout(mwsContactSearchTimer);
    mwsContactSearchTimer=setTimeout(()=>{
      window.__mwsContactSearchRender=true;
      try{mwsRenderActiveContactView()}finally{window.__mwsContactSearchRender=false}
    },100);
  };
  mwsContactSearchInput.oncompositionend=()=>{
    clearTimeout(mwsContactSearchTimer);
    mwsContactSearchTimer=setTimeout(()=>{
      window.__mwsContactSearchRender=true;
      try{mwsRenderActiveContactView()}finally{window.__mwsContactSearchRender=false}
    },0);
  };
}
document.getElementById('contactSort').onchange=mwsRenderActiveContactView;
document.getElementById('contactLabelFilter').onchange=()=>{mwsRenderActiveContactView();renderContactTagSidebar()};
document.getElementById('sniperSearch').oninput=renderSniperList;
document.getElementById('sniperSort').onchange=renderSniperList;
document.getElementById('sniperLabelFilter').onchange=renderSniperList;


function contactPastContentRows(contactId){
  const today=todayKST();
  const rows=[];
  const seen=new Set();

  // Prefer real schedule rows because they can be opened directly.
  (data.events||[])
    .filter(e=>!e.restDay&&e.date<today&&(e.participants||[]).includes(contactId))
    .forEach(e=>{
      const key=`${e.date}|${String(e.title||'').trim().toLocaleLowerCase('ko-KR')}`;
      seen.add(key);
      rows.push({
        date:e.date,
        title:e.title||'컨텐츠',
        eventId:e.id,
        device:e.device||'',
        categoryId:e.categoryId||'',
        source:'schedule'
      });
    });

  // Include old collaboration-only records if no matching schedule remains.
  (data.collaborations||[])
    .filter(c=>!c.restDay && String(c.title||'').trim()!=='휴방' && c.date<today&&(c.participants||[]).includes(contactId))
    .forEach(c=>{
      const key=`${c.date}|${String(c.title||'').trim().toLocaleLowerCase('ko-KR')}`;
      if(seen.has(key))return;
      seen.add(key);
      rows.push({
        date:c.date,
        title:c.title||'컨텐츠',
        eventId:'',
        device:'',
        categoryId:'',
        source:'record'
      });
    });

  return rows.sort((a,b)=>new Date(b.date)-new Date(a.date));
}
function renderContactHistory(contactId){
  const list=document.getElementById('contactHistoryList');
  const count=document.getElementById('contactHistoryCount');
  if(!list||!count)return;

  if(!contactId){
    count.textContent='0개';
    list.innerHTML='<div class="empty">새 연락처에는 아직 함께한 컨텐츠 기록이 없습니다</div>';
    return;
  }

  const rows=contactPastContentRows(contactId);
  count.textContent=`${rows.length}개`;
  list.innerHTML=rows.length?rows.map(r=>{
    const cat=category(r.categoryId);
    const inner=`
      <div class="space" style="align-items:flex-start">
        <div class="contact-history-title">${esc(r.title)}</div>
        ${cat?`<span class="chip" style="border-color:${cat.color||'#888'}">${esc(cat.name)}</span>`:''}
      </div>
      <div class="contact-history-meta">${formatDateWeekday(r.date)}${r.device?` · ${esc(r.device)}`:''}</div>
      ${r.source==='record'?'<div class="contact-history-source">구버전 합방 기록</div>':''}`;
    return r.eventId
      ? `<button type="button" class="contact-history-item" onclick="openEventFromLinkedItem('${r.eventId}')">${inner}</button>`
      : `<div class="contact-history-item">${inner}</div>`;
  }).join(''):'<div class="empty">함께한 과거 컨텐츠 기록이 없습니다</div>';
}


let contactDetailTab='content';
window.setContactDetailTab=tab=>{
  contactDetailTab=tab==='applications'?'applications':'content';
  document.getElementById('contactContentTab')?.classList.toggle('active',contactDetailTab==='content');
  document.getElementById('contactApplicationTab')?.classList.toggle('active',contactDetailTab==='applications');
  document.getElementById('contactContentHistoryPanel')?.classList.toggle('active',contactDetailTab==='content');
  document.getElementById('contactApplicationHistoryPanel')?.classList.toggle('active',contactDetailTab==='applications');
};
function applicationStatusText(s){return s==='selected'?'확정':s==='excluded'?'제외':'대기'}
function renderContactApplicationHistory(contactId){
  const list=document.getElementById('contactApplicationList'),count=document.getElementById('contactApplicationCount');if(!list||!count)return;
  const c=contactId?contact(contactId):null,rows=[...(c?.applicationHistory||[])].sort((a,b)=>String(b.lastAppliedAt||b.firstAppliedAt||'').localeCompare(String(a.lastAppliedAt||a.firstAppliedAt||'')));
  count.textContent=`${rows.length}개`;
  list.innerHTML=rows.length?rows.map(a=>`<div class="contact-application-item"><div class="space" style="align-items:flex-start"><div class="contact-application-title">${esc(a.postTitle||`게시글 ${a.postNo||''}`)}</div><span class="contact-application-status ${a.status}">${applicationStatusText(a.status)}</span></div><div class="contact-application-meta">${esc(a.lastAppliedAt||a.firstAppliedAt||'신청 시간 없음')} · 댓글 ${a.commentCount||1}개${a.soopUserId?` · ${esc(a.soopUserId)}`:''}</div>${a.latestComment?`<div class="contact-application-comment">${esc(a.latestComment)}</div>`:''}<div class="row" style="margin-top:9px">${a.postId&&postById(a.postId)?`<button class="secondary small" onclick="openApplicationPost('${a.postId}')">게시글 관리 열기</button>`:''}${a.postUrl?`<button class="ghost small" onclick="window.open('${esc(a.postUrl)}','_blank','noopener')">SOOP 원문</button>`:''}</div></div>`).join(''):'<div class="empty">SOOP 게시글 참가 신청 기록이 없습니다</div>';
}
window.openApplicationPost=id=>{document.getElementById('contactModal')?.classList.remove('open');activePostId=id;setTab('posts');renderPosts()};


function contactImageStem(filename){
  return String(filename||'')
    .replace(/^.*[\\/]/,'')
    .replace(/\.[^.]+$/,'')
    .trim();
}
function setContactImagePreview(src='',filename=''){
  const img=document.getElementById('ctImagePreview');
  const placeholder=document.getElementById('ctImagePreviewPlaceholder');
  const fileName=document.getElementById('ctImageFileName');
  const headerImg=document.getElementById('ctHeaderAvatarImage');
  const headerFallback=document.getElementById('ctHeaderAvatarFallback');
  const name=String(document.getElementById('ctName')?.value||'').trim();
  if(img){
    if(src){img.src=src;img.classList.add('visible');placeholder?.classList.add('hidden')}
    else{img.removeAttribute('src');img.classList.remove('visible');placeholder?.classList.remove('hidden')}
  }
  if(headerImg&&headerFallback){
    if(src){headerImg.src=src;headerImg.style.display='block';headerFallback.style.display='none'}
    else{headerImg.removeAttribute('src');headerImg.style.display='none';headerFallback.style.display='grid';headerFallback.textContent=(name||'?').slice(0,1)}
  }
  if(fileName)fileName.textContent=filename||'선택된 파일 없음';
}
function autofillContactNameFromImageFile(file){
  if(!file)return;
  const nameInput=document.getElementById('ctName');
  if(!nameInput)return;
  // 새 연락처에서만 자동 이름 입력. 기존 연락처 사진 교체 시 이름은 보존.
  if(editingContactId)return;
  const stem=contactImageStem(file.name);
  if(stem)nameInput.value=stem;
}
function handleContactImageFile(file){
  if(!file)return false;
  if(!(file.type||'').startsWith('image/')){
    toast('프로필 이미지','이미지 파일만 사용할 수 있습니다');
    return false;
  }
  const input=document.getElementById('ctImage');
  try{
    const dt=new DataTransfer();
    dt.items.add(file);
    input.files=dt.files;
  }catch(e){
    console.warn('드롭 파일을 file input에 연결하지 못했습니다',e);
  }
  autofillContactNameFromImageFile(file);
  const reader=new FileReader();
  reader.onload=()=>setContactImagePreview(reader.result,file.name);
  reader.readAsDataURL(file);
  return true;
}
window.handleContactImageFile=handleContactImageFile;

const contactImageDropzone=document.getElementById('contactImageDropzone');
const contactImageInput=document.getElementById('ctImage');
const contactImageBrowseBtn=document.getElementById('ctImageBrowseBtn');

contactImageBrowseBtn.onclick=e=>{
  e.preventDefault();
  contactImageInput.click();
};
contactImageDropzone.onclick=e=>{
  if(e.target.closest('button'))return;
  contactImageInput.click();
};
contactImageDropzone.onkeydown=e=>{
  if(e.key==='Enter'||e.key===' '){
    e.preventDefault();
    contactImageInput.click();
  }
};
['dragenter','dragover'].forEach(type=>{
  contactImageDropzone.addEventListener(type,e=>{
    e.preventDefault();
    e.stopPropagation();
    contactImageDropzone.classList.add('drag-over');
    if(e.dataTransfer)e.dataTransfer.dropEffect='copy';
  });
});
['dragleave','dragend'].forEach(type=>{
  contactImageDropzone.addEventListener(type,e=>{
    e.preventDefault();
    e.stopPropagation();
    if(type==='dragleave'&&e.relatedTarget&&contactImageDropzone.contains(e.relatedTarget))return;
    contactImageDropzone.classList.remove('drag-over');
  });
});
contactImageDropzone.addEventListener('drop',e=>{
  e.preventDefault();
  e.stopPropagation();
  contactImageDropzone.classList.remove('drag-over');
  const file=[...(e.dataTransfer?.files||[])].find(f=>(f.type||'').startsWith('image/'));
  if(!file)return toast('프로필 이미지','드롭한 항목에서 이미지 파일을 찾지 못했습니다');
  handleContactImageFile(file);
});
contactImageInput.onchange=()=>{
  const file=contactImageInput.files?.[0];
  if(file)handleContactImageFile(file);
};

function openContact(id=null){
  closeMainModals();
  editingContactId=id;
  const c=id?contact(id):null;
  document.getElementById('contactModalTitle').textContent=c?(c.pendingSetup?'신규 연락처 정보 입력':'연락처 상세'):'연락처 추가';
  document.getElementById('contactModalSubtitle').textContent=c?`${c.name} · 함께한 과거 컨텐츠와 연락처 정보를 한 화면에서 확인합니다`:'새 연락처를 등록합니다';
  const favoriteBtnV574=document.getElementById('contactFavoriteBtnV574');
  if(favoriteBtnV574){
    favoriteBtnV574.hidden=!c;
    favoriteBtnV574.classList.toggle('active',Boolean(c?.favorite));
    favoriteBtnV574.setAttribute('aria-pressed',c?.favorite?'true':'false');
    favoriteBtnV574.textContent=c?.favorite?'★':'☆';
    favoriteBtnV574.title=c?.favorite?'즐겨찾기에서 제거':'즐겨찾기에 추가';
  }
  document.getElementById('ctName').value=c?.name||'';
  document.getElementById('ctLabels').value=(c?.labels||[]).join(', ');
  document.getElementById('ctStationUrl').value=c?.stationUrl||'';
  document.getElementById('ctNotes').value=c?.notes||'';
  document.getElementById('ctImage').value='';
  setContactImagePreview(c?.image||'',c?.image?'현재 저장된 프로필 이미지':'선택된 파일 없음');
  document.getElementById('deleteContactBtn').style.display=c?'':'none';
  contactDetailTab='content';
  setContactDetailTab('content');
  renderContactHistory(id);
  renderContactApplicationHistory(id);
  document.getElementById('contactModal').classList.add('open');
}
window.openContact=openContact;document.getElementById('newContactBtn').onclick=()=>openContact();
document.getElementById('contactFavoriteBtnV574').onclick=()=>{
  const c=editingContactId?contact(editingContactId):null;if(!c)return;
  c.favorite=!Boolean(c.favorite);
  const btn=document.getElementById('contactFavoriteBtnV574');
  if(btn){btn.classList.toggle('active',c.favorite);btn.setAttribute('aria-pressed',c.favorite?'true':'false');btn.textContent=c.favorite?'★':'☆';btn.title=c.favorite?'즐겨찾기에서 제거':'즐겨찾기에 추가'}
  saveData(c.favorite?'연락처 즐겨찾기 추가':'연락처 즐겨찾기 해제');
  try{renderFavoriteContactsV574()}catch(_){}
  try{renderContacts()}catch(_){}
  toast(c.name,c.favorite?'즐겨찾기에 추가했습니다':'즐겨찾기에서 제거했습니다');
};
document.getElementById('saveContactBtn').onclick=async()=>{
  const name=document.getElementById('ctName').value.trim();
  if(!name)return toast('연락처 저장','이름을 입력해 주세요');

  const original=editingContactId?contact(editingContactId):null;
  const candidate={
    id:original?.id||crypto.randomUUID(),
    image:original?.image||'',
    pendingSetup:false,
    favorite:Boolean(original?.favorite),
    name,
    labels:[...new Set(document.getElementById('ctLabels').value.split(',').map(x=>x.trim()).filter(Boolean))],
    stationUrl:normalizeExternalUrl(document.getElementById('ctStationUrl').value),
    notes:document.getElementById('ctNotes').value.trim(),
    applicationHistory:Array.isArray(original?.applicationHistory)?original.applicationHistory:[]
  };
  candidate.labels.forEach(ensureContactTag);

  const file=document.getElementById('ctImage').files[0];
  if(file){
    const raw=await new Promise((resolve,reject)=>{
      const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);
    });
    candidate.image=await compressContactImage(raw);
  }

  const sameName=data.contacts.find(c=>c.id!==candidate.id&&normalizeContactName(c.name)===normalizeContactName(candidate.name));
  if(sameName){
    conflictApplyAllChoice=null;
    const choice=await resolveDuplicateContact(sameName,candidate,'새로 입력한 연락처');
    if(choice==='existing'){
      document.getElementById('contactModal').classList.remove('open');
      toast(candidate.name,'같은 이름이 있어 기존 연락처를 유지했습니다');
      return;
    }
    Object.assign(sameName,candidate,{id:sameName.id,pendingSetup:false});
    if(original && original.id!==sameName.id){
      replaceContactReferences(original.id,sameName.id);
      data.contacts=data.contacts.filter(c=>c.id!==original.id);
    }
    document.getElementById('contactModal').classList.remove('open');
    syncAllPostContactApplicationHistories();
    const saved=saveData('연락처 중복 교체');
    toast(candidate.name,saved?'기존 중복 연락처를 선택한 정보로 교체했습니다':'연락처는 변경되었지만 저장 공간이 부족합니다');
    return;
  }

  if(original){
    Object.assign(original,candidate,{id:original.id});
  }else{
    data.contacts.push(candidate);
  }
  document.getElementById('contactModal').classList.remove('open');
  syncAllPostContactApplicationHistories();
  const saved=saveData('연락처 저장');
  renderContactFilters();
  toast(candidate.name,saved?'연락처에 저장되었습니다':'연락처는 추가되었지만 브라우저 저장 공간이 부족합니다');
}
document.getElementById('deleteContactBtn').onclick=()=>{if(!editingContactId)return;data.contacts=data.contacts.filter(x=>x.id!==editingContactId);data.events.forEach(e=>e.participants=(e.participants||[]).filter(x=>x!==editingContactId));data.targetList=(data.targetList||[]).filter(x=>x!==editingContactId);document.getElementById('contactModal').classList.remove('open');saveData('연락처 삭제');toast('연락처','삭제되었습니다')}


/* 세계 시간 */
let selectedWorldZone='America/New_York';
let selectedWorldName='뉴욕';
let worldSourceZone='Asia/Seoul';

function worldParts(date,zone){
  const parts=new Intl.DateTimeFormat('ko-KR',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',weekday:'long',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const get=t=>parts.find(p=>p.type===t)?.value||'';
  return {year:get('year'),month:get('month'),day:get('day'),weekday:get('weekday'),hour:get('hour'),minute:get('minute')};
}
function zoneOffsetMinutes(date,zone){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const get=t=>Number(parts.find(p=>p.type===t)?.value||0);
  const asUTC=Date.UTC(get('year'),get('month')-1,get('day'),get('hour'),get('minute'),get('second'));
  return Math.round((asUTC-date.getTime())/60000);
}
function zonedWallTimeToUTC(dateStr,timeStr,zone){
  if(!dateStr||!timeStr)return new Date();
  const [y,m,d]=dateStr.split('-').map(Number),[hh,mm]=String(timeStr).split(':').map(Number);
  const desired=Date.UTC(y,m-1,d,hh,mm,0);
  let guess=desired;
  for(let i=0;i<5;i++){
    const next=desired-zoneOffsetMinutes(new Date(guess),zone)*60000;
    if(Math.abs(next-guess)<1000){guess=next;break}
    guess=next;
  }
  return new Date(guess);
}
function dateKeyFromParts(p){return `${p.year}-${p.month}-${p.day}`}
function zoneDisplayName(zone){return WORLD_SOURCE_ZONES.find(x=>x.id===zone)?.name||TIMEZONE_OPTIONS.find(x=>x.id===zone)?.name||zone}
function formatZoneOffset(date,zone){
  const mins=zoneOffsetMinutes(date,zone);
  if(mins===0)return 'UTC±0';
  const sign=mins>=0?'+':'-',abs=Math.abs(mins),h=Math.floor(abs/60),m=abs%60;
  return `UTC${sign}${h}${m?':'+String(m).padStart(2,'0'):''}`;
}
function populateWorldSourceZones(){
  const select=document.getElementById('worldSourceZone');if(!select)return;
  select.innerHTML=WORLD_SOURCE_ZONES.map(z=>`<option value="${z.id}">${esc(z.name)} · ${z.id}</option>`).join('');
  select.value=worldSourceZone;
}
function renderWorldTime(){
  const dateEl=document.getElementById('worldBaseDate'),timeEl=document.getElementById('worldBaseTime'),sourceEl=document.getElementById('worldSourceZone');
  if(!dateEl||!timeEl)return;
  if(sourceEl?.value)worldSourceZone=sourceEl.value;
  if(!dateEl.value)dateEl.value=ymd(new Date());
  if(!timeEl.value){
    const now=new Date(),mins=Math.floor(now.getMinutes()/5)*5;
    timeEl.value=`${String(now.getHours()).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;
  }
  document.getElementById('worldBaseDateText').textContent=formatDateWeekday(dateEl.value);
  document.getElementById('worldBaseTimeText').textContent=formatTimeKorean(timeEl.value);

  const utc=zonedWallTimeToUTC(dateEl.value,timeEl.value,worldSourceZone);
  const source=worldParts(utc,worldSourceZone),target=worldParts(utc,selectedWorldZone),korea=worldParts(utc,'Asia/Seoul');
  const diff=(new Date(dateKeyFromParts(target)+'T12:00:00')-new Date(dateKeyFromParts(source)+'T12:00:00'))/86400000;

  document.getElementById('worldKoreaResultTime').textContent=`${korea.hour}:${korea.minute}`;
  document.getElementById('worldKoreaResultDate').textContent=`${korea.year}년 ${Number(korea.month)}월 ${Number(korea.day)}일 ${korea.weekday}`;
  document.getElementById('worldSourceSummary').textContent=`입력: ${zoneDisplayName(worldSourceZone)} · ${source.year}년 ${Number(source.month)}월 ${Number(source.day)}일 ${source.weekday} ${source.hour}:${source.minute} · ${formatZoneOffset(utc,worldSourceZone)}`;

  document.getElementById('worldZoneName').textContent=selectedWorldName;
  document.getElementById('worldResultTime').textContent=`${target.hour}:${target.minute}`;
  document.getElementById('worldResultDate').textContent=`${target.year}년 ${Number(target.month)}월 ${Number(target.day)}일 ${target.weekday}`;
  document.getElementById('worldBaseSummary').textContent=`${zoneDisplayName(worldSourceZone)} · ${source.year}년 ${Number(source.month)}월 ${Number(source.day)}일 ${source.weekday} ${source.hour}:${source.minute} · ${formatZoneOffset(utc,worldSourceZone)}`;
  document.getElementById('worldDateDiff').textContent=diff===0?'입력 지역과 같은 날짜':diff<0?'입력 지역보다 전날':'입력 지역보다 다음 날';
  document.querySelectorAll('.world-marker').forEach(x=>x.classList.toggle('active',x.dataset.zone===selectedWorldZone));
}
window.selectWorldZone=(zone,name)=>{selectedWorldZone=zone;selectedWorldName=name;renderWorldTime()};
window.useSelectedWorldAsSource=()=>{
  worldSourceZone=selectedWorldZone;
  const select=document.getElementById('worldSourceZone');
  if(select){
    if(![...select.options].some(o=>o.value===worldSourceZone)){
      const o=document.createElement('option');o.value=worldSourceZone;o.textContent=`${selectedWorldName} · ${worldSourceZone}`;select.appendChild(o);
    }
    select.value=worldSourceZone;
  }
  renderWorldTime();toast('세계 시간',`${selectedWorldName}을 입력 Timezone으로 설정했습니다`);
};
populateWorldSourceZones();
document.getElementById('worldSourceZone').onchange=e=>{worldSourceZone=e.target.value;renderWorldTime()};
document.getElementById('useSelectedWorldAsSourceBtn').onclick=useSelectedWorldAsSource;
document.getElementById('worldBaseDate').onchange=renderWorldTime;
document.getElementById('worldBaseTime').onchange=renderWorldTime;



/* 데이터 초기화 */
function resetContentAndContactData(){
  const first=confirm('컨텐츠, 연락처, 연락처 태그, 메모, 저격 리스트, 합방 기록을 모두 초기화하시겠습니까?\n\n테마, 카테고리 색상, 배경 이미지는 유지됩니다.');
  if(!first)return;
  const second=confirm('이 작업은 되돌릴 수 없습니다. 정말 초기화하시겠습니까?');
  if(!second)return;

  data.events=[];
  data.contacts=[];
  data.memos=[];
  data.targetList=[];
  data.contactTags=[];
  data.scheduleClipboard=[];
  activeContactTag='';
  data.collaborations=[];
  try{localStorage.removeItem(AUTOSAVE_KEY)}catch(e){}
  persist();
  renderAll('데이터 초기화');
  setTab('settings');
  toast('데이터 초기화','컨텐츠, 연락처, 메모, 저격 리스트, 합방 기록을 모두 비웠습니다');
}
document.getElementById('resetDataBtn').onclick=resetContentAndContactData;


/* v2.3 - Created by Majoku easter egg */
let mascotRainActive=false;
function clearMascotRain(){
  mascotRainActive=false;
  document.body.classList.remove('mascot-rain-active');
  const layer=document.getElementById('mascotRainLayer');
  if(layer){
    layer.classList.remove('active');
    layer.setAttribute('aria-hidden','true');
    layer.innerHTML='';
  }
}
function startMascotRain(){
  mascotRainActive=true;
  document.body.classList.add('mascot-rain-active');
  const layer=document.getElementById('mascotRainLayer');
  if(!layer)return;
  layer.innerHTML='';
  const count=58;
  for(let i=0;i<count;i++){
    const el=document.createElement('img');
    el.src=document.querySelector('#creatorEasterEggBtn img')?.src||'';
    el.alt='';
    el.className='mascot-rain-item';
    const size=54+Math.random()*105;
    const startX=Math.random()*100;
    const drift=(Math.random()-.5)*150;
    const rotation=(Math.random()-.5)*470;
    const startRot=(Math.random()-.5)*55;
    const duration=3.5+Math.random()*4.2;
    const delay=-(Math.random()*duration);
    el.style.width=size+'px';
    el.style.setProperty('--start-x',startX+'vw');
    el.style.setProperty('--fall-x',drift+'px');
    el.style.setProperty('--fall-rotate',rotation+'deg');
    el.style.setProperty('--start-rotate',startRot+'deg');
    el.style.setProperty('--fall-duration',duration+'s');
    el.style.setProperty('--fall-delay',delay+'s');
    layer.appendChild(el);
  }
  layer.classList.add('active');
  layer.setAttribute('aria-hidden','false');
}
function toggleMascotRain(){
  mascotRainActive?clearMascotRain():startMascotRain();
}
window.toggleMascotRain=toggleMascotRain;


function hexToRgbParts(hex){
  const h=String(hex||'').replace('#','');
  if(!/^[0-9a-fA-F]{6}$/.test(h))return [139,92,246];
  const n=parseInt(h,16);
  return [(n>>16)&255,(n>>8)&255,n&255];
}
function rgbToHslParts(r,g,b){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){
    const d=max-min;
    s=l>.5?d/(2-max-min):d/(max+min);
    if(max===r)h=(g-b)/d+(g<b?6:0);
    else if(max===g)h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h*=60;
  }
  return [h,s*100,l*100];
}
function updateUpcomingAccent(){
  const theme=THEME_META.find(t=>t.id===data.theme)||THEME_META[0];
  const [r,g,b]=hexToRgbParts(theme?.accent||'#8b5cf6');
  const [h]=rgbToHslParts(r,g,b);
  const opposite=(h+165)%360;
  const color=`hsl(${Math.round(opposite)} 92% 63%)`;
  document.body.style.setProperty('--upcoming-accent',color);
  return color;
}
window.updateUpcomingAccent=updateUpcomingAccent;

/* 설정 */
function applyTheme(id,notify=true){data.theme=id;document.body.dataset.theme=id;updateUpcomingAccent();mwsSaveDevicePrefs(data);renderThemeGrid();document.getElementById('themeSelect').value=id;if(notify)toast('테마를 변경했습니다')}
function renderThemeGrid(){
  const box=document.getElementById('themeGrid');box.innerHTML=THEME_META.map(t=>`<button type="button" class="theme-card ${t.id===data.theme?'active':''}" onclick="applyTheme('${t.id}')"><div class="theme-swatches"><span class="theme-swatch" style="background:${t.bg}"></span><span class="theme-swatch" style="background:${t.panel}"></span><span class="theme-swatch" style="background:${t.accent}"></span></div><div>${esc(t.name)}</div></button>`).join('');
}
window.applyTheme=applyTheme;
const BUILTIN_DEFAULT_BACKGROUND='assets/default-background.png';
function applyBackground(){
  const img=data.backgroundImage||BUILTIN_DEFAULT_BACKGROUND;
  const dim=Math.max(0,Math.min(85,Number(data.backgroundDim??45)));
  document.body.style.setProperty('--custom-bg-image',img?`url("${img}")`:'none');
  document.body.style.setProperty('--custom-bg-dim',String(dim/100));
  const preview=document.getElementById('backgroundPreview');
  if(preview){
    preview.style.backgroundImage=img?`linear-gradient(rgba(0,0,0,.18),rgba(0,0,0,.18)),url("${img}")`:'none';
    preview.textContent='';
  }
  const slider=document.getElementById('backgroundDim');
  const value=document.getElementById('backgroundDimValue');
  if(slider)slider.value=dim;
  if(value)value.textContent=dim+'%';
}
async function compressBackgroundImage(dataUrl,maxWidth=1920,quality=.82){
  if(!dataUrl||!dataUrl.startsWith('data:image/'))return dataUrl||'';
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const scale=Math.min(1,maxWidth/(img.naturalWidth||1));
        const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
        const result=canvas.toDataURL('image/jpeg',quality);
        resolve(result.length<dataUrl.length?result:dataUrl);
      }catch(e){resolve(dataUrl)}
    };
    img.onerror=()=>resolve(dataUrl);
    img.src=dataUrl;
  });
}
function renderSettings(){
  document.getElementById('themeSelect').value=data.theme;renderThemeGrid();
  applyTextScale(data.textScale??100,false);
  document.getElementById('categoryList').innerHTML=data.categories.map(c=>`<div class="catrow reorder-row" data-category-id="${c.id}"
    ondragover="categoryReorderOver('${c.id}',event)" ondragleave="categoryReorderLeave(event)" ondrop="categoryReorderDrop('${c.id}',event)">
    <button type="button" class="reorder-handle" draggable="true" title="드래그해서 순서 변경"
      ondragstart="categoryReorderStart('${c.id}',event)" ondragend="categoryReorderEnd(event)">⋮⋮</button>
    <input value="${esc(c.name)}"
      data-category-name-id="${c.id}"
      oninput="updateCategoryDraft('${c.id}',this.value)"
      onchange="commitCategoryName('${c.id}',this.value)"
      onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}">
    <button type="button" class="settings-color-button" title="색상 선택" onclick="event.stopPropagation();toggleSettingsCategoryPalette(this,'${c.id}')">
      <span class="category-color-swatch" style="display:block;background:${c.color||'#888888'}"></span>
    </button>
    <button class="danger" onclick="deleteCategory('${c.id}')">삭제</button>
  </div>`).join('');
  applyBackground();
}
document.getElementById('creatorEasterEggBtn').onclick=toggleMascotRain;
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&mascotRainActive)clearMascotRain();
});
document.getElementById('themeSelect').onchange=e=>applyTheme(e.target.value);
document.getElementById('backgroundImageInput').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const raw=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
    data.backgroundImage=await compressBackgroundImage(raw);
    mwsSaveDevicePrefs(data);
    applyBackground();
    toast('배경 이미지','새 배경을 적용했습니다');
  }catch(err){toast('배경 이미지','이미지를 불러오지 못했습니다')}
  e.target.value='';
};
document.getElementById('removeBackgroundBtn').onclick=()=>{
  data.backgroundImage='';mwsSaveDevicePrefs(data);applyBackground();toast('배경 이미지','기본 MAWANG 배경으로 돌아왔습니다');
};
document.getElementById('backgroundDim').oninput=e=>{
  data.backgroundDim=Number(e.target.value);
  applyBackground();
  mwsSaveDevicePrefs(data);
};
document.getElementById('backgroundDim').onchange=()=>mwsSaveDevicePrefs(data);

let categoryReorderSourceId='';
function clearCategoryReorderMarks(){document.querySelectorAll('#categoryList .reorder-row').forEach(r=>r.classList.remove('drop-before','drop-after','reorder-dragging'))}
window.categoryReorderStart=(id,e)=>{
  categoryReorderSourceId=id;e.stopPropagation();e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('application/x-mawang-category-order',id);e.dataTransfer.setData('text/plain',id);
  e.currentTarget.closest('.reorder-row')?.classList.add('reorder-dragging');
};
window.categoryReorderOver=(targetId,e)=>{
  const source=e.dataTransfer.getData('application/x-mawang-category-order')||categoryReorderSourceId;
  if(!source||source===targetId)return;e.preventDefault();e.dataTransfer.dropEffect='move';
  const row=e.currentTarget;const rect=row.getBoundingClientRect();const after=e.clientY>rect.top+rect.height/2;
  row.classList.toggle('drop-before',!after);row.classList.toggle('drop-after',after);
};
window.categoryReorderLeave=e=>e.currentTarget.classList.remove('drop-before','drop-after');
window.categoryReorderDrop=(targetId,e)=>{
  const sourceId=e.dataTransfer.getData('application/x-mawang-category-order')||categoryReorderSourceId;
  if(!sourceId||sourceId===targetId)return clearCategoryReorderMarks();
  e.preventDefault();const targetRow=e.currentTarget,rect=targetRow.getBoundingClientRect(),after=e.clientY>rect.top+rect.height/2;
  const source=data.categories.find(c=>c.id===sourceId);if(!source)return clearCategoryReorderMarks();
  const arr=data.categories.filter(c=>c.id!==sourceId);let idx=arr.findIndex(c=>c.id===targetId);if(idx<0)idx=arr.length;
  if(after)idx++;arr.splice(idx,0,source);data.categories=arr;categoryReorderSourceId='';clearCategoryReorderMarks();saveData('카테고리 순서 변경');
};
window.categoryReorderEnd=()=>{categoryReorderSourceId='';clearCategoryReorderMarks()};

window.updateCategoryDraft=(id,val)=>{
  const c=category(id);
  if(!c)return;
  // Keep what the user is currently typing in memory immediately.
  // Do not call renderAll here because that would replace the input during Korean IME composition.
  c.name=String(val);
  persist();
};

window.commitCategoryName=(id,val)=>{
  const c=category(id);
  if(!c)return;
  const clean=String(val||'').trim();
  c.name=clean||'새 카테고리';
  saveData('카테고리 이름 수정');
  toast('카테고리',`"${c.name}" 카테고리를 저장했습니다`);
};

window.updateCategory=(id,key,val)=>{
  const c=category(id);
  if(!c)return;
  c[key]=val;
  saveData('카테고리 수정');
};

window.deleteCategory=id=>{
  const c=category(id);
  if(!c)return;
  data.categories=data.categories.filter(x=>x.id!==id);
  data.events.forEach(e=>{if(e.categoryId===id)e.categoryId=''});
  saveData('카테고리 삭제');
  toast('카테고리',`"${c.name}" 카테고리를 삭제했습니다`);
};

function nextNewCategoryName(){
  const used=new Set((data.categories||[]).map(c=>String(c.name||'').trim()));
  if(!used.has('새 카테고리'))return '새 카테고리';
  let n=2;
  while(used.has(`새 카테고리 ${n}`))n++;
  return `새 카테고리 ${n}`;
}

document.getElementById('addCategoryBtn').onclick=()=>{
  const id=crypto.randomUUID();
  const name=nextNewCategoryName();
  data.categories.push({id,name,color:'#64748b'});
  saveData('카테고리 추가');
  toast('카테고리',`"${name}" 카테고리를 추가했습니다`);

  // After renderAll recreates the settings list, focus the newly created row.
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      const input=document.querySelector(`[data-category-name-id="${id}"]`);
      if(input){
        input.focus();
        input.select();
        input.scrollIntoView({block:'nearest',behavior:'smooth'});
      }
    });
  });
};


function renderAutoSaveHistory(){/* v4.20: 자동 백업 기능 제거 */}


async function compressContactImage(dataUrl,maxSize=320,quality=.78){
  if(!dataUrl || typeof dataUrl!=='string' || !dataUrl.startsWith('data:image/'))return dataUrl||'';
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const scale=Math.min(1,maxSize/Math.max(img.naturalWidth||1,img.naturalHeight||1));
        if(scale>=1 && dataUrl.length<60000)return resolve(dataUrl);
        const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d',{alpha:false});ctx.drawImage(img,0,0,w,h);
        const compressed=canvas.toDataURL('image/jpeg',quality);
        resolve(compressed.length<dataUrl.length?compressed:dataUrl);
      }catch(e){resolve(dataUrl)}
    };
    img.onerror=()=>resolve(dataUrl);
    img.src=dataUrl;
  });
}
function extractContactsFromImport(obj){
  if(Array.isArray(obj))return obj;
  if(obj && Array.isArray(obj.contacts))return obj.contacts;
  if(obj && obj.data && Array.isArray(obj.data.contacts))return obj.data.contacts;
  throw new Error('연락처 배열을 찾을 수 없습니다');
}
function normalizeImportedContact(src){
  if(!src || typeof src!=='object')return null;
  const name=String(src.name||src.displayName||'').trim();
  if(!name)return null;
  return {
    id:String(src.id||crypto.randomUUID()),
    image:typeof src.image==='string'?src.image:'',
    name,
    labels:Array.isArray(src.labels)?src.labels.map(x=>String(x).trim()).filter(Boolean):[],
    stationUrl:typeof src.stationUrl==='string'?normalizeExternalUrl(src.stationUrl):'',
    notes:typeof src.notes==='string'?src.notes:'',
    pendingSetup:Boolean(src.pendingSetup),
    favorite:Boolean(src.favorite)
  };
}
function normalizeContactName(name){
  return String(name||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('ko-KR');
}
let conflictResolver=null;
let conflictApplyAllChoice=null;
function contactConflictCard(c,label){
  return `<div class="conflict-card">
    <h4>${label}</h4>
    <div class="row">
      ${c.image?`<img class="conflict-avatar" src="${c.image}">`:`<div class="conflict-avatar" style="display:grid;place-items:center;font-weight:850">${esc(initials(c.name))}</div>`}
      <div><div class="event-title">${esc(c.name)}</div><div class="muted small" style="margin-top:5px">${(c.labels||[]).map(esc).join(' · ')||'라벨 없음'}</div></div>
    </div>
    <div class="conflict-note" style="margin-top:9px">${esc(c.notes||'메모 없음')}</div>
  </div>`;
}
function resolveDuplicateContact(existing,incoming,incomingLabel='불러온 파일의 연락처'){
  if(conflictApplyAllChoice)return Promise.resolve(conflictApplyAllChoice);
  return new Promise(resolve=>{
    conflictResolver=choice=>{
      if(document.getElementById('applyConflictChoiceAll').checked)conflictApplyAllChoice=choice;
      document.getElementById('contactConflictModal').classList.remove('open');
      conflictResolver=null;
      resolve(choice);
    };
    document.getElementById('applyConflictChoiceAll').checked=false;
    document.getElementById('contactConflictBody').innerHTML=`
      <div class="contact-conflict-grid">
        ${contactConflictCard(existing,'현재 저장된 연락처')}
        ${contactConflictCard(incoming,incomingLabel)}
      </div>
      <div class="contact-conflict-grid">
        <button class="primary conflict-choice" onclick="chooseContactConflict('existing')">현재 연락처 유지</button>
        <button class="secondary conflict-choice" onclick="chooseContactConflict('incoming')">불러온 연락처 사용</button>
      </div>
      <div class="conflict-note">불러온 연락처를 선택해도 기존 스케줄과 합방 기록 연결이 끊기지 않도록 현재 연락처의 내부 ID는 유지합니다.</div>`;
    document.getElementById('contactConflictModal').classList.add('open');
  });
}

window.chooseContactConflict=choice=>{if(conflictResolver)conflictResolver(choice)}
function replaceContactReferences(oldId,newId){
  data.events.forEach(e=>{
    e.participants=[...new Set((e.participants||[]).map(id=>id===oldId?newId:id))];
  });
  data.collaborations.forEach(c=>{
    c.participants=[...new Set((c.participants||[]).map(id=>id===oldId?newId:id))];
  });
  data.targetList=[...new Set((data.targetList||[]).map(id=>id===oldId?newId:id))];
}
function duplicateContactGroups(){
  const groups=new Map();
  data.contacts.forEach(c=>{
    const key=normalizeContactName(c.name);
    if(!key)return;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(c);
  });
  return [...groups.values()].filter(g=>g.length>1);
}
async function cleanupExistingDuplicates(){
  const groups=duplicateContactGroups();
  if(!groups.length){
    toast('중복 연락처','같은 이름의 중복 연락처가 없습니다');
    return;
  }
  conflictApplyAllChoice=null;
  let removed=0,replaced=0;
  for(const group of groups){
    let keeper=group[0];
    for(let i=1;i<group.length;i++){
      const duplicate=group[i];
      if(!data.contacts.some(c=>c.id===duplicate.id))continue;
      const choice=await resolveDuplicateContact(keeper,duplicate,'중복 저장된 연락처');
      if(choice==='incoming'){
        const keeperId=keeper.id,duplicateId=duplicate.id;
        Object.assign(keeper,duplicate,{id:keeperId,pendingSetup:false});
        replaceContactReferences(duplicateId,keeperId);
        data.contacts=data.contacts.filter(c=>c.id!==duplicateId);
        replaced++;removed++;
      }else{
        replaceContactReferences(duplicate.id,keeper.id);
        data.contacts=data.contacts.filter(c=>c.id!==duplicate.id);
        removed++;
      }
    }
  }
  saveData('중복 연락처 정리');
  toast('중복 연락처',`${removed}개의 중복 항목을 정리했습니다${replaced?` · ${replaced}개는 선택한 정보로 교체`:''}`);
}
document.getElementById('cleanupDuplicatesBtn').onclick=cleanupExistingDuplicates;

async function importContactsObject(obj){
  const incomingRaw=extractContactsFromImport(obj);
  if(obj&&Array.isArray(obj.contactTags))obj.contactTags.forEach(ensureContactTag);
  if(obj&&obj.contactTagBanners&&typeof obj.contactTagBanners==='object'){
    for(const [tag,banner] of Object.entries(obj.contactTagBanners)){
      const cleanTag=String(tag||'').trim();
      if(!cleanTag||typeof banner!=='string'||!banner.startsWith('data:image/'))continue;
      ensureContactTag(cleanTag);
      if(!data.contactTagBanners[cleanTag])data.contactTagBanners[cleanTag]=await compressTagBannerImage(banner);
    }
  }
  conflictApplyAllChoice=null;

  let added=0,replaced=0,kept=0,invalid=0,duplicates=0;

  for(const src of incomingRaw){
    const incoming=normalizeImportedContact(src);
    if(!incoming){invalid++;continue}
    incoming.pendingSetup=false;
    incoming.labels.forEach(ensureContactTag);
    if(incoming.image)incoming.image=await compressContactImage(incoming.image);

    const key=normalizeContactName(incoming.name);
    const existing=data.contacts.find(c=>normalizeContactName(c.name)===key);

    if(existing){
      duplicates++;
      const choice=await resolveDuplicateContact(existing,incoming);
      if(choice==='incoming'){
        const keepId=existing.id;
        Object.assign(existing,incoming,{id:keepId,pendingSetup:false});
        replaced++;
      }else{
        kept++;
      }
    }else{
      if(!incoming.id || data.contacts.some(c=>c.id===incoming.id))incoming.id=crypto.randomUUID();
      data.contacts.push(incoming);
      added++;
    }
  }

  const saved=saveData('연락처 가져오기');
  renderContactFilters();
  refreshContactViews();
  return {added,replaced,kept,invalid,duplicates,saved};
}
window.importContactsObject=importContactsObject;

/* 가져오기 / 내보내기 */
function downloadJSON(obj,name){
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function buildFullBackupObject(){
  normalizeDataShape();
  const payload=mwsStripDevicePrefs(data);
  const contactImages={};
  (payload.contacts||[]).forEach(c=>{
    if(typeof c.image==='string'&&c.image.startsWith('data:image/'))contactImages[c.id]=c.image;
  });
  return {
    format:'MAWANG_CONTENT_SCHEDULER_FULL_BACKUP',
    version:37,
    exportedAt:new Date().toISOString(),
    meta:{
      contacts:(payload.contacts||[]).length,
      contactImages:Object.keys(contactImages).length,
      events:(payload.events||[]).length,
      memos:(payload.memos||[]).length
    },
    data:payload,
    assets:{
      contactImages,
      contactTagBanners:payload.contactTagBanners&&typeof payload.contactTagBanners==='object'
        ? JSON.parse(JSON.stringify(payload.contactTagBanners)):{}
    }
  };
}
window.buildFullBackupObject=buildFullBackupObject;

function restoreFullBackupAssets(backup){
  const payload=backup?.data&&typeof backup.data==='object'
    ? JSON.parse(JSON.stringify(backup.data))
    : JSON.parse(JSON.stringify(backup||{}));
  const assets=backup?.assets&&typeof backup.assets==='object'?backup.assets:{};
  const imageMap=assets.contactImages&&typeof assets.contactImages==='object'?assets.contactImages:{};

  if(Array.isArray(payload.contacts)){
    payload.contacts=payload.contacts.map(c=>{
      const backupImage=imageMap[c.id];
      return {...c,image:
        (typeof c.image==='string'&&c.image.startsWith('data:image/'))?c.image:
        (typeof backupImage==='string'&&backupImage.startsWith('data:image/'))?backupImage:''
      };
    });
  }
  if(assets.contactTagBanners&&typeof assets.contactTagBanners==='object'){
    payload.contactTagBanners={...assets.contactTagBanners,...(payload.contactTagBanners||{})};
  }
  return payload;
}
window.restoreFullBackupAssets=restoreFullBackupAssets;

function updateFullBackupAssetStatus(){
  const el=document.getElementById('fullBackupAssetStatus');
  if(!el)return;
  const contacts=(data.contacts||[]).length;
  const images=(data.contacts||[]).filter(c=>typeof c.image==='string'&&c.image.startsWith('data:image/')).length;
  el.textContent=`연락처 ${contacts}명 · 백업에 포함될 프로필 이미지 ${images}개`;
  el.classList.toggle('ok',images>0);
}
window.updateFullBackupAssetStatus=updateFullBackupAssetStatus;

document.getElementById('exportAllBtn').onclick=()=>{
  const backup=buildFullBackupObject();
  downloadJSON(backup,'mawang-scheduler-backup.json');
  toast('전체 백업',`프로필 이미지 ${backup.meta.contactImages}개를 포함해 저장했습니다`);
};
document.getElementById('exportContactsBtn').onclick=()=>downloadJSON({
  version:37,contacts:data.contacts,contactTags:data.contactTags,contactTagBanners:data.contactTagBanners
},'mawang-contacts.json');

document.getElementById('importAllInput').onchange=e=>importFile(e.target.files[0],obj=>{
  const currentDevicePrefs=mwsExtractDevicePrefs(data);
  const payload=restoreFullBackupAssets(obj);
  if(!payload.events||!payload.contacts)throw new Error('유효하지 않은 백업 파일입니다');

  data=payload;
  mwsApplyDevicePrefs(data,currentDevicePrefs);
  if(!data.theme)data.theme='neon';
  if(data.backgroundImage===undefined)data.backgroundImage='';
  if(data.backgroundDim===undefined)data.backgroundDim=45;
  if(!data.categories)data.categories=DEFAULT_CATEGORIES;
  if(!data.collaborations)data.collaborations=[];
  if(!data.memos)data.memos=[];
  if(!data.targetList)data.targetList=[];
  if(!data.contactTags)data.contactTags=[];
  if(!data.contactTagBanners||typeof data.contactTagBanners!=='object')data.contactTagBanners={};
  if(!Array.isArray(data.scheduleClipboard))data.scheduleClipboard=[];
  if(data.sidebarPinned===undefined)data.sidebarPinned=true;
  if(!data.timezones)data.timezones=DEFAULT_TZS;
  data.version=52;
  document.body.dataset.theme=data.theme;

  const imageCount=(data.contacts||[]).filter(c=>typeof c.image==='string'&&c.image.startsWith('data:image/')).length;
  const saved=saveData('전체 백업 가져오기');
  updateFullBackupAssetStatus();
  toast('전체 백업',saved
    ? `백업을 불러왔습니다 · 프로필 이미지 ${imageCount}개 복원`
    : '백업은 화면에 불러왔지만 브라우저 저장 공간이 부족합니다');
});
document.getElementById('importContactsInput').onchange=async e=>{
  const input=e.target,file=input.files[0];
  if(!file)return;
  const label=input.closest('label');
  if(label)label.classList.add('importing');
  toast('연락처 가져오기','구버전 형식을 확인하고 프로필 이미지를 최적화하는 중입니다');
  try{
    const text=await file.text();
    const obj=JSON.parse(text);
    const result=await importContactsObject(obj);
    toast('연락처 가져오기',result.saved?`신규 ${result.added}개 · 교체 ${result.replaced}개 · 기존 유지 ${result.kept}개${result.invalid?` · 제외 ${result.invalid}개`:''}`:`연락처 처리는 완료했지만 브라우저 저장 공간이 부족합니다.`);
  }catch(err){
    console.error(err);
    toast('연락처 가져오기 실패',err?.message||'JSON 파일을 읽을 수 없습니다');
  }finally{
    if(label)label.classList.remove('importing');
    input.value='';
  }
};
function importFile(file,cb){if(!file)return;const r=new FileReader();r.onload=()=>{try{cb(JSON.parse(r.result))}catch(err){toast(err.message)}};r.readAsText(file)}


function closeMainModals(){
  if(typeof closeEventRepeatPanel==='function')closeEventRepeatPanel();
  if(typeof hideCalendarEventPreview==='function')hideCalendarEventPreview();
  ['eventModal','contactModal','targetPickerModal','contactConflictModal','restConfirmModal'].forEach(id=>{
    document.getElementById(id)?.classList.remove('open');
  });
  closeAllPickers();
}

window.closeMainModals=closeMainModals;

/* v2.0 - modal layer/background interaction state */
function syncModalInteractionState(){
  const hasOpen=[...document.querySelectorAll('.modal')].some(m=>m.classList.contains('open'));
  document.body.classList.toggle('modal-active',hasOpen);
  if(hasOpen&&typeof hideCalendarEventPreview==='function')hideCalendarEventPreview();
}
const modalLayerObserver=new MutationObserver(syncModalInteractionState);
document.querySelectorAll('.modal').forEach(m=>{
  modalLayerObserver.observe(m,{attributes:true,attributeFilter:['class']});
});
syncModalInteractionState();

function closeModalFromBackdrop(modal){
  if(!modal?.classList.contains('open'))return;
  if(modal.id==='contactConflictModal'&&typeof conflictResolver==='function'&&conflictResolver){
    conflictResolver('existing');return;
  }
  if(modal.id==='restConfirmModal'&&typeof closeRestConfirm==='function'){
    closeRestConfirm();return;
  }
  if(modal.id==='eventModal'&&typeof closeEventRepeatPanel==='function')closeEventRepeatPanel();
  modal.classList.remove('open');
  closeAllPickers();
}
window.closeModalFromBackdrop=closeModalFromBackdrop;
document.querySelectorAll('.modal').forEach(modal=>{
  modal.addEventListener('pointerdown',e=>{
    if(e.target!==modal)return;
    e.preventDefault();
    closeModalFromBackdrop(modal);
  });
});



function openEventFromLinkedItem(id){
  closeMainModals();
  requestAnimationFrame(()=>openEvent(id));
}
window.openEventFromLinkedItem=openEventFromLinkedItem;

function closeAllPickers(){document.getElementById('datePickerPopover').classList.remove('open');document.getElementById('timePickerPopover').classList.remove('open');if(typeof closeCategoryColorPalette==='function')closeCategoryColorPalette()}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{if(b.dataset.close==='eventModal'&&typeof closeEventRepeatPanel==='function')closeEventRepeatPanel();closeAllPickers();document.getElementById(b.dataset.close).classList.remove('open')});

document.addEventListener('pointerdown',e=>{
  const palette=document.getElementById('categoryColorPalette');
  if(!palette?.classList.contains('open'))return;
  if(palette.contains(e.target))return;
  if(e.target.closest?.('.category-color-button,.settings-color-button'))return;
  closeCategoryColorPalette();
},{capture:true});

document.addEventListener('mousedown',e=>{
  const palette=document.getElementById('categoryColorPalette');
  if(palette?.classList.contains('open')&&!palette.contains(e.target)&&!e.target.closest('.category-color-button,.settings-color-button'))closeCategoryColorPalette();
  const dp=document.getElementById('datePickerPopover'),tp=document.getElementById('timePickerPopover');
  if(dp.classList.contains('open')&&!dp.contains(e.target)&&!document.getElementById('evDateDisplay')?.contains(e.target)&&!document.getElementById('worldBaseDateDisplay')?.contains(e.target)&&!document.getElementById('repeatEndDateDisplay')?.contains(e.target))dp.classList.remove('open');
  if(tp.classList.contains('open')&&!tp.contains(e.target)&&!e.target.closest('.time-trigger'))tp.classList.remove('open');
});
window.addEventListener('resize',closeAllPickers);

function closeTopPopupWithEscape(){
  setCalendarCtrlCopyMode(false);

  const palette=document.getElementById('categoryColorPalette');
  if(palette?.classList.contains('open')){
    closeCategoryColorPalette();
    return true;
  }

  const dp=document.getElementById('datePickerPopover');
  const tp=document.getElementById('timePickerPopover');
  if(dp?.classList.contains('open')||tp?.classList.contains('open')){
    closeAllPickers();
    return true;
  }

  if(typeof hideCalendarEventPreview==='function')hideCalendarEventPreview();

  const rest=document.getElementById('restConfirmModal');
  if(rest?.classList.contains('open')){
    if(typeof closeRestConfirm==='function')closeRestConfirm();
    else rest.classList.remove('open');
    return true;
  }

  const conflict=document.getElementById('contactConflictModal');
  if(conflict?.classList.contains('open')){
    if(typeof conflictResolver==='function'&&conflictResolver)conflictResolver('existing');
    else conflict.classList.remove('open');
    return true;
  }

  const ids=['targetPickerModal','contactModal','eventModal'];
  for(const id of ids){
    const modal=document.getElementById(id);
    if(modal?.classList.contains('open')){
      modal.classList.remove('open');
      closeAllPickers();
      return true;
    }
  }

  if(typeof targetShootingMode!=='undefined'&&targetShootingMode){
    if(typeof stopTargetShooting==='function')stopTargetShooting('manual');
    return true;
  }

  if(typeof mascotRainActive!=='undefined'&&mascotRainActive){
    clearMascotRain();
    return true;
  }
  return false;
}
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(closeTopPopupWithEscape()){
    e.preventDefault();
    e.stopPropagation();
  }
});



let lastSyncReason='초기화';
function safeRenderView(name,fn){
  try{
    fn();
    return true;
  }catch(err){
    console.error(`[${name}] 화면 갱신 오류`,err);
    return false;
  }
}

/* =========================================================
   MINI GAMES v3.8
   ========================================================= */
const miniGameRuntime={
  ladder:{rungs:[],generated:false,animating:false,activePlayer:-1},
  rps:{round:0,activeIds:[],moves:{},rolling:false,history:[],winnerId:'',rosterKey:''},
  pachinko:{running:false,racers:[],winnerId:'',turn:0,placements:[],rosterKey:'',timer:null}
};
const MINI_COLORS=['#8b5cf6','#2dd4bf','#f59e0b','#ec4899','#3b82f6','#ef4444','#22c55e','#f97316','#06b6d4','#eab308','#d946ef','#14b8a6'];

/* CSPRNG utilities. Bounded integers use rejection sampling, so every integer
   in the requested range receives exactly the same number of uint32 states. */
function cryptoUint32(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]}
function randomIntUnbiased(max){
  max=Math.floor(Number(max));
  if(!Number.isFinite(max)||max<=0)throw new Error('randomIntUnbiased max must be > 0');
  const range=0x100000000,limit=range-(range%max);let x;
  do{x=cryptoUint32()}while(x>=limit);
  return x%max;
}
function randomBit(){return randomIntUnbiased(2)}
function randomFloat53(){
  const a=cryptoUint32()>>>5,b=cryptoUint32()>>>6;
  return (a*67108864+b)/9007199254740992;
}
function secureRandom(){return randomFloat53()}
function cryptoShuffleInPlace(arr){for(let i=arr.length-1;i>0;i--){const j=randomIntUnbiased(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function weightedRandomIndex(entries,getWeight=x=>x.weight){
  const weights=entries.map(x=>Math.max(0,Number(getWeight(x))||0)),total=weights.reduce((a,b)=>a+b,0);
  if(!(total>0))return randomIntUnbiased(entries.length);
  const target=randomFloat53()*total;let sum=0;
  for(let i=0;i<weights.length;i++){sum+=weights[i];if(target<sum)return i}
  return entries.length-1;
}
window.__miniRandomTest={randomIntUnbiased,randomBit,randomFloat53,weightedRandomIndex};

function miniPersist(){normalizeMiniGameData();data.version=52;persist()}
function miniGameArray(game){
  if(game==='ladder')return data.miniGames.ladder.players;
  if(game==='rps')return data.miniGames.rps.players;
  if(game==='pachinko')return data.miniGames.pachinko.players;
  return [];
}
function miniContactEntry(contactId){const c=contact(contactId);if(!c)return null;return{id:crypto.randomUUID(),contactId:c.id,name:c.name,image:c.image||'',weight:1}}
function miniEntryAvatar(x){return x.image?`<img class="mini-entry-avatar" src="${x.image}">`:`<div class="mini-entry-avatar">${esc(initials(x.name))}</div>`}
function miniUniqueContact(game,contactId){return !miniGameArray(game).some(x=>x.contactId&&x.contactId===contactId)}
function resetGameRuntimeOnRosterChange(game){
  if(game==='ladder'){miniGameRuntime.ladder.generated=false;miniGameRuntime.ladder.rungs=[];miniGameRuntime.ladder.activePlayer=-1}
  if(game==='rps')resetRpsTournamentState(false);
  if(game==='pachinko')resetPachinkoState(false);
}
window.miniContactDragStart=(id,e)=>{e.stopPropagation();e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('text/contact-id',id);e.dataTransfer.setData('text/plain',id);e.currentTarget.classList.add('dragging')};
window.miniContactDragEnd=e=>e.currentTarget.classList.remove('dragging');
window.miniDropOver=e=>{e.preventDefault();e.currentTarget.classList.add('drag-over')};
window.miniDropLeave=e=>e.currentTarget.classList.remove('drag-over');
window.miniDropContact=(game,e)=>{e.preventDefault();e.currentTarget.classList.remove('drag-over');const id=e.dataTransfer.getData('text/contact-id')||e.dataTransfer.getData('text/plain');miniAddContact(game,id)};
window.miniAddContact=(game,contactId)=>{
  if(!['ladder','rps','pachinko'].includes(game))return;
  const c=contact(contactId);if(!c)return;
  if(game==='pachinko'&&miniGameArray(game).length>=10)return toast('경마','가독성과 한 화면 표시를 위해 최대 10명까지 지원합니다');
  if(!miniUniqueContact(game,contactId)){toast('미니게임',`${c.name}은(는) 이미 추가되어 있습니다`);return}
  miniGameArray(game).push(miniContactEntry(contactId));resetGameRuntimeOnRosterChange(game);miniPersist();renderMiniGame(game);
};
window.miniManualAdd=(game,inputId)=>{
  if(!['ladder','rps'].includes(game))return;
  const input=document.getElementById(inputId),name=String(input?.value||'').trim();if(!name)return;
  miniGameArray(game).push({id:crypto.randomUUID(),contactId:'',name,image:'',weight:1});if(input)input.value='';resetGameRuntimeOnRosterChange(game);miniPersist();renderMiniGame(game)
};
window.miniRemoveEntry=(game,id)=>{const arr=miniGameArray(game),i=arr.findIndex(x=>x.id===id);if(i>=0)arr.splice(i,1);resetGameRuntimeOnRosterChange(game);miniPersist();renderMiniGame(game)};
window.clearMiniEntries=game=>{if(!confirm('이 게임의 현재 항목을 모두 비우시겠습니까?'))return;miniGameArray(game).splice(0);resetGameRuntimeOnRosterChange(game);miniPersist();renderMiniGame(game)};
window.miniRenameEntry=(game,id,value)=>{const x=miniGameArray(game).find(x=>x.id===id);if(!x)return;x.name=String(value||'').trim()||'항목';miniPersist();if(game==='roulette')drawRoulette();if(game==='ladder'){renderLadderPlayerButtons();drawLadder()}if(game==='rps')renderRps();if(game==='pachinko')renderPachinko()};
window.miniSetWeight=(id,value)=>{const x=data.miniGames.roulette.entries.find(x=>x.id===id);if(!x)return;x.weight=Math.max(.01,Number(value)||1);miniPersist();renderRouletteEntryList();drawRoulette()};
function renderMiniContactPalette(game,q=''){
  const box=document.getElementById(`${game}ContactPalette`);if(!box)return;
  const query=String(q||'').trim().toLowerCase();
  const arr=(data.contacts||[]).filter(c=>!c.pendingSetup&&(!query||(c.name+' '+(c.labels||[]).join(' ')).toLowerCase().includes(query)));
  const counter=document.getElementById(`${game}ContactCount`);if(counter)counter.textContent=`${arr.length}명`;
  box.innerHTML=arr.map(c=>`<div class="mini-contact-item" draggable="true" ondragstart="miniContactDragStart('${c.id}',event)" ondragend="miniContactDragEnd(event)" title="게임 영역으로 끌어 놓으세요">
    ${c.image?`<img src="${c.image}">`:`<div class="mini-contact-avatar">${esc(initials(c.name))}</div>`}
    <div style="min-width:0"><div class="mini-contact-name">${esc(c.name)}</div><div class="mini-contact-tags">${esc((c.labels||[]).join(' · ')||'라벨 없음')}</div></div>
    <button class="ghost mini-contact-add" onclick="event.stopPropagation();miniAddContact('${game}','${c.id}')">+</button>
  </div>`).join('')||'<div class="empty small">검색 결과가 없습니다</div>';
}
function renderMiniGame(game){({ladder:renderLadder,rps:renderRps,pachinko:renderPachinko}[game]||(()=>{}))()}
function renderAllMiniGames(){renderLadder();renderRps();renderPachinko()}

/* celebration */
function showMiniGameCelebration(kicker,text,image=''){
  const layer=document.getElementById('miniGameCelebration');if(!layer)return;
  document.getElementById('celebrationKicker').textContent=kicker||'WINNER';
  document.getElementById('celebrationText').textContent=text||'당첨';
  const av=document.getElementById('celebrationAvatar');av.classList.toggle('show',Boolean(image));av.style.backgroundImage=image?`url("${image}")`:'';
  const conf=document.getElementById('celebrationConfetti');conf.innerHTML='';
  for(let i=0;i<64;i++){const p=document.createElement('i');p.className='confetti-piece';p.style.left=(randomFloat53()*100)+'%';p.style.background=MINI_COLORS[i%MINI_COLORS.length];p.style.setProperty('--dur',(1.9+randomFloat53()*2.1)+'s');p.style.setProperty('--rot',(randomFloat53()*360)+'deg');p.style.setProperty('--drift',((randomFloat53()-.5)*360)+'px');p.style.animationDelay=(randomFloat53()*.35)+'s';conf.appendChild(p)}
  layer.classList.add('open');layer.setAttribute('aria-hidden','false');
  clearTimeout(layer._closeTimer);layer._closeTimer=setTimeout(closeMiniGameCelebration,4500)
}
window.closeMiniGameCelebration=()=>{const l=document.getElementById('miniGameCelebration');if(l){l.classList.remove('open');l.setAttribute('aria-hidden','true')}};

/* Roulette */
function rouletteTotal(){return data.miniGames.roulette.entries.reduce((s,x)=>s+Math.max(.01,Number(x.weight)||1),0)}
function renderRouletteEntryList(){
  const box=document.getElementById('rouletteEntryList');if(!box)return;const arr=data.miniGames.roulette.entries,total=rouletteTotal();
  box.innerHTML=arr.map(x=>{const pct=total?Math.max(.01,Number(x.weight)||1)/total*100:0;return `<div class="mini-entry-row weighted">${miniEntryAvatar(x)}<input type="text" value="${esc(x.name)}" onchange="miniRenameEntry('roulette','${x.id}',this.value)"><input type="number" min="0.01" step="0.1" value="${Number(x.weight)||1}" title="가중치" onchange="miniSetWeight('${x.id}',this.value)"><div class="mini-entry-meta">${pct.toFixed(1)}%</div><button class="ghost mini-delete" onclick="miniRemoveEntry('roulette','${x.id}')">×</button></div>`}).join('')||'<div class="empty small">참가자를 추가해 주세요</div>';
  const s=document.getElementById('rouletteProbabilitySummary');if(s)s.innerHTML=arr.length?`총 가중치 <strong>${total.toFixed(2)}</strong> · 53비트 CSPRNG 독립 추첨 · 각 확률은 가중치 ÷ 총 가중치입니다.`:'연락처 또는 수동 이름을 추가하면 확률이 표시됩니다.';
}
function drawRoulette(rotation=miniGameRuntime.roulette.rotation){
  const canvas=document.getElementById('rouletteCanvas');if(!canvas)return;const ctx=canvas.getContext('2d'),arr=data.miniGames.roulette.entries,w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,r=Math.min(w,h)/2-25;ctx.clearRect(0,0,w,h);
  if(!arr.length){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle='#171d2a';ctx.fill();ctx.strokeStyle='#364159';ctx.lineWidth=8;ctx.stroke();ctx.fillStyle='#8e9bb8';ctx.font='700 28px sans-serif';ctx.textAlign='center';ctx.fillText('참가자를 추가해 주세요',cx,cy);return}
  const total=rouletteTotal();let acc=0;const base=-Math.PI/2+rotation;
  arr.forEach((x,i)=>{const span=Math.PI*2*(Math.max(.01,Number(x.weight)||1)/total),a0=base+acc,a1=a0+span;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a0,a1);ctx.closePath();ctx.fillStyle=MINI_COLORS[i%MINI_COLORS.length];ctx.fill();ctx.strokeStyle='rgba(255,255,255,.42)';ctx.lineWidth=3;ctx.stroke();const mid=a0+span/2;ctx.save();ctx.translate(cx+Math.cos(mid)*r*.66,cy+Math.sin(mid)*r*.66);ctx.rotate(mid+Math.PI/2);ctx.fillStyle='#fff';ctx.font=`900 ${Math.max(13,Math.min(23,150/Math.max(1,arr.length)*2))}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,.65)';ctx.shadowBlur=4;ctx.fillText(x.name.length>9?x.name.slice(0,8)+'…':x.name,0,0);ctx.restore();acc+=span});
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=9;ctx.stroke();
}
function renderRoulette(){renderMiniContactPalette('roulette');renderRouletteEntryList();requestAnimationFrame(()=>drawRoulette());const btn=document.getElementById('rouletteSpinBtn');if(btn)btn.disabled=data.miniGames.roulette.entries.length<2||miniGameRuntime.roulette.spinning}
window.spinRoulette=()=>{
  const arr=data.miniGames.roulette.entries;if(arr.length<2||miniGameRuntime.roulette.spinning)return toast('룰렛','참가자를 2명 이상 추가해 주세요');
  const index=weightedRandomIndex(arr,x=>Math.max(.01,Number(x.weight)||1)),total=rouletteTotal();
  let before=0;for(let i=0;i<index;i++)before+=Math.PI*2*(Math.max(.01,Number(arr[i].weight)||1)/total);const span=Math.PI*2*(Math.max(.01,Number(arr[index].weight)||1)/total);const center=-Math.PI/2+before+span/2;
  const start=miniGameRuntime.roulette.rotation,desired=-Math.PI/2-center;let delta=((desired-start)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);delta+=Math.PI*2*(7+randomIntUnbiased(3));const target=start+delta,duration=4100+randomIntUnbiased(500),t0=performance.now();miniGameRuntime.roulette.spinning=true;document.querySelector('.roulette-stage-card')?.classList.add('spinning');renderRoulette();
  const step=now=>{const t=Math.min(1,(now-t0)/duration),ease=1-Math.pow(1-t,4);miniGameRuntime.roulette.rotation=start+(target-start)*ease;drawRoulette();if(t<1)return requestAnimationFrame(step);miniGameRuntime.roulette.rotation=((target%(Math.PI*2))+Math.PI*2)%(Math.PI*2);miniGameRuntime.roulette.spinning=false;document.querySelector('.roulette-stage-card')?.classList.remove('spinning');const winner=arr[index];data.miniGames.roulette.lastWinnerId=winner.id;miniPersist();document.getElementById('rouletteWinner').textContent=`당첨 · ${winner.name}`;renderRoulette();showMiniGameCelebration('ROULETTE WINNER',winner.name,winner.image)};requestAnimationFrame(step)
};

/* Ladder */
function ensureLadderPrizeCount(){
  const players=data.miniGames.ladder.players,prizes=data.miniGames.ladder.prizes;
  while(prizes.length<players.length)prizes.push({id:crypto.randomUUID(),label:`결과 ${prizes.length+1}`});
  if(prizes.length>players.length)prizes.splice(players.length);
}
function renderLadder(){
  ensureLadderPrizeCount();renderMiniContactPalette('ladder');const players=data.miniGames.ladder.players,prizes=data.miniGames.ladder.prizes;
  const pc=document.getElementById('ladderPlayerCountChip');if(pc)pc.textContent=`${players.length}명`;const rc=document.getElementById('ladderPrizeCountChip');if(rc)rc.textContent=`${prizes.length}개`;
  const pbox=document.getElementById('ladderPlayerList');if(pbox)pbox.innerHTML=players.map(x=>`<div class="mini-entry-row">${miniEntryAvatar(x)}<input type="text" value="${esc(x.name)}" onchange="miniRenameEntry('ladder','${x.id}',this.value)"><button class="ghost mini-delete" onclick="miniRemoveEntry('ladder','${x.id}')">×</button></div>`).join('')||'<div class="empty small">참가자 없음</div>';
  const rbox=document.getElementById('ladderPrizeList');if(rbox)rbox.innerHTML=prizes.map((x,i)=>`<div class="mini-entry-row"><div class="mini-entry-avatar">${i+1}</div><input type="text" value="${esc(x.label)}" oninput="updateLadderPrize('${x.id}',this.value)"></div>`).join('')||'<div class="empty small">참가자를 추가하면 자동 생성됩니다</div>';
  const status=document.getElementById('ladderStatus');if(status&&!miniGameRuntime.ladder.generated)status.textContent=players.length?`참가자 ${players.length}명 · 결과 ${prizes.length}개 자동 준비`:'참가자를 준비해 주세요';
  renderLadderPlayerButtons();requestAnimationFrame(drawLadder)
}
window.updateLadderPrize=(id,v)=>{const x=data.miniGames.ladder.prizes.find(x=>x.id===id);if(x){x.label=String(v??'');persist();requestAnimationFrame(drawLadder)}};
window.shuffleLadderOrders=()=>{
  const players=data.miniGames.ladder.players,prizes=data.miniGames.ladder.prizes;if(players.length<2)return toast('사다리','참가자가 2명 이상 필요합니다');
  cryptoShuffleInPlace(players);cryptoShuffleInPlace(prizes);miniGameRuntime.ladder.generated=false;miniGameRuntime.ladder.rungs=[];miniGameRuntime.ladder.activePlayer=-1;miniPersist();renderLadder();toast('사다리','참가자와 당첨 항목 순서를 각각 섞었습니다');
};
function renderLadderPlayerButtons(){const box=document.getElementById('ladderPlayerButtons');if(!box)return;const arr=data.miniGames.ladder.players;box.innerHTML=arr.map((x,i)=>`<button class="secondary ${miniGameRuntime.ladder.activePlayer===i?'path-active':''}" ${miniGameRuntime.ladder.generated?'':'disabled'} onclick="runLadderPath(${i})" title="${esc(x.name)}의 사다리만 타기">${esc(x.name)}</button>`).join('')}
window.generateLadder=()=>{
  ensureLadderPrizeCount();const n=data.miniGames.ladder.players.length;if(n<2)return toast('사다리','참가자가 2명 이상 필요합니다');if(n>12)return toast('사다리','가독성을 위해 참가자는 최대 12명까지 지원합니다');
  const rows=Math.max(10,n*2),rungs=[];for(let row=0;row<rows;row++){let last=-2;for(let i=0;i<n-1;i++){if(i===last+1)continue;if(randomFloat53()<.38){rungs.push({row,left:i});last=i}}}miniGameRuntime.ladder.rungs=rungs;miniGameRuntime.ladder.generated=true;miniGameRuntime.ladder.activePlayer=-1;document.getElementById('ladderResult').classList.remove('done');document.getElementById('ladderResult').textContent='위 참가자 이름을 누르면 해당 경로만 따라 내려갑니다.';document.getElementById('ladderStatus').textContent=`랜덤 사다리 생성 완료 · ${n}명`;renderLadderPlayerButtons();drawLadder()
};
function ladderGeometry(){const canvas=document.getElementById('ladderCanvas'),n=data.miniGames.ladder.players.length,w=canvas?.width||1180,h=canvas?.height||650,top=75,bottom=h-75,left=65,right=w-65;const xs=Array.from({length:n},(_,i)=>n===1?w/2:left+(right-left)*i/(n-1));const rows=Math.max(10,n*2);return{canvas,n,w,h,top,bottom,xs,rows}}
function drawLadder(highlightPoints=null,progress=1){const g=ladderGeometry();if(!g.canvas)return;const ctx=g.canvas.getContext('2d');ctx.clearRect(0,0,g.w,g.h);ctx.lineCap='round';ctx.strokeStyle='#54617a';ctx.lineWidth=4;g.xs.forEach(x=>{ctx.beginPath();ctx.moveTo(x,g.top);ctx.lineTo(x,g.bottom);ctx.stroke()});miniGameRuntime.ladder.rungs.forEach(r=>{const y=g.top+(g.bottom-g.top)*(r.row+1)/(g.rows+1);ctx.beginPath();ctx.moveTo(g.xs[r.left],y);ctx.lineTo(g.xs[r.left+1],y);ctx.stroke()});ctx.font='800 16px sans-serif';ctx.textAlign='center';ctx.fillStyle='#f5f7ff';data.miniGames.ladder.players.forEach((p,i)=>ctx.fillText(p.name.slice(0,8),g.xs[i],34));ctx.fillStyle='#ffd96a';data.miniGames.ladder.prizes.forEach((p,i)=>ctx.fillText((p.label||`결과 ${i+1}`).slice(0,9),g.xs[i],g.h-27));if(highlightPoints?.length)drawPolylineProgress(ctx,highlightPoints,progress)}
function ladderPath(index){const g=ladderGeometry(),sorted=[...miniGameRuntime.ladder.rungs].sort((a,b)=>a.row-b.row),points=[{x:g.xs[index],y:g.top}],start=index;let cur=index;for(const r of sorted){const y=g.top+(g.bottom-g.top)*(r.row+1)/(g.rows+1);if(r.left===cur){points.push({x:g.xs[cur],y});cur++;points.push({x:g.xs[cur],y})}else if(r.left===cur-1){points.push({x:g.xs[cur],y});cur--;points.push({x:g.xs[cur],y})}}points.push({x:g.xs[cur],y:g.bottom});return{points,resultIndex:cur,start}}
function drawPolylineProgress(ctx,pts,t){const seg=[];let total=0;for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);seg.push(l);total+=l}let remain=total*t;ctx.strokeStyle='#ffe14a';ctx.shadowColor='#ffe14a';ctx.shadowBlur=14;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);let marker=pts[0];for(let i=0;i<seg.length;i++){if(remain>=seg[i]){ctx.lineTo(pts[i+1].x,pts[i+1].y);remain-=seg[i];marker=pts[i+1]}else{const q=seg[i]?remain/seg[i]:0;marker={x:pts[i].x+(pts[i+1].x-pts[i].x)*q,y:pts[i].y+(pts[i+1].y-pts[i].y)*q};ctx.lineTo(marker.x,marker.y);break}}ctx.stroke();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(marker.x,marker.y,9,0,Math.PI*2);ctx.fillStyle='#fff6a1';ctx.fill();ctx.strokeStyle='#5b4600';ctx.lineWidth=2;ctx.stroke()}
window.runLadderPath=index=>{if(!miniGameRuntime.ladder.generated||miniGameRuntime.ladder.animating)return;const player=data.miniGames.ladder.players[index],path=ladderPath(index),prize=data.miniGames.ladder.prizes[path.resultIndex];miniGameRuntime.ladder.animating=true;miniGameRuntime.ladder.activePlayer=index;renderLadderPlayerButtons();const t0=performance.now(),dur=2200;const frame=now=>{const t=Math.min(1,(now-t0)/dur);drawLadder(path.points,1-Math.pow(1-t,2.2));if(t<1)return requestAnimationFrame(frame);miniGameRuntime.ladder.animating=false;const result=document.getElementById('ladderResult');result.classList.add('done');result.innerHTML=`<strong>${esc(player.name)}</strong> → <strong>${esc(prize?.label||`결과 ${path.resultIndex+1}`)}</strong>`};requestAnimationFrame(frame)};

/* Capsule */
function renderCapsule(){renderMiniContactPalette('capsule');const arr=data.miniGames.capsule.entries,box=document.getElementById('capsuleEntryList');if(box)box.innerHTML=arr.map(x=>`<div class="mini-entry-row">${miniEntryAvatar(x)}<input type="text" value="${esc(x.name)}" onchange="miniRenameEntry('capsule','${x.id}',this.value)"><button class="ghost mini-delete" onclick="miniRemoveEntry('capsule','${x.id}')">×</button></div>`).join('')||'<div class="empty small">캡슐이 비어 있습니다</div>';const balls=document.getElementById('capsuleBalls');if(balls)balls.innerHTML=arr.slice(0,22).map((x,i)=>`<div class="capsule-ball" style="background:${MINI_COLORS[i%MINI_COLORS.length]}">${esc(x.name.slice(0,3))}</div>`).join('');const chk=document.getElementById('capsuleRemoveDrawn');if(chk)chk.checked=data.miniGames.capsule.removeDrawn}
window.setMiniRemoveDrawn=(game,v)=>{if(game!=='capsule')return;data.miniGames.capsule.removeDrawn=Boolean(v);miniPersist()};
window.drawCapsule=()=>{const arr=data.miniGames.capsule.entries;if(!arr.length||miniGameRuntime.capsule.drawing)return toast('캡슐','캡슐 풀에 항목을 추가해 주세요');miniGameRuntime.capsule.drawing=true;const machine=document.getElementById('capsuleMachine');machine?.classList.add('drawing');document.getElementById('capsuleSlot').textContent='...';setTimeout(()=>{const idx=randomIntUnbiased(arr.length),picked=arr[idx];machine?.classList.remove('drawing');document.getElementById('capsuleSlot').textContent=picked.name;document.getElementById('capsuleResult').textContent=`OPEN · ${picked.name}`;miniGameRuntime.capsule.result=picked;if(data.miniGames.capsule.removeDrawn){arr.splice(idx,1);miniPersist()}miniGameRuntime.capsule.drawing=false;renderCapsule();showMiniGameCelebration('CAPSULE OPEN',picked.name,picked.image)},1300)};

/* Rock Paper Scissors */
const RPS_MOVES=['바위','가위','보'];
function resetRpsTournamentState(render=true){const arr=data.miniGames.rps.players;miniGameRuntime.rps={round:0,activeIds:arr.map(x=>x.id),moves:{},rolling:false,history:[],winnerId:'',rosterKey:arr.map(x=>x.id).join('|')};if(render)renderRps()}
window.resetRpsTournament=()=>resetRpsTournamentState(true);
function rpsRosterNeedsReset(){return data.miniGames.rps.players.map(x=>x.id).join('|')!==miniGameRuntime.rps.rosterKey}
function renderRps(){
  renderMiniContactPalette('rps');const arr=data.miniGames.rps.players;if(rpsRosterNeedsReset())resetRpsTournamentState(false);if(!miniGameRuntime.rps.activeIds.length&&arr.length)miniGameRuntime.rps.activeIds=arr.map(x=>x.id);
  const list=document.getElementById('rpsEntryList');if(list)list.innerHTML=arr.map(x=>`<div class="mini-entry-row">${miniEntryAvatar(x)}<input type="text" value="${esc(x.name)}" onchange="miniRenameEntry('rps','${x.id}',this.value)"><button class="ghost mini-delete" onclick="miniRemoveEntry('rps','${x.id}')">×</button></div>`).join('')||'<div class="empty small">참가자를 추가해 주세요</div>';
  const active=new Set(miniGameRuntime.rps.activeIds),moves=miniGameRuntime.rps.moves,arena=document.getElementById('rpsArena');if(arena)arena.innerHTML=arr.map(x=>{const alive=active.has(x.id),move=moves[x.id],winner=miniGameRuntime.rps.winnerId===x.id;return `<div class="rps-player ${alive?'survivor':'eliminated'} ${winner?'winner':''} ${miniGameRuntime.rps.rolling&&alive?'rolling':''}">${x.image?`<img class="rps-avatar" src="${x.image}">`:`<div class="rps-avatar">${esc(initials(x.name))}</div>`}<div class="rps-name">${esc(x.name)}</div><div class="rps-gesture">${miniGameRuntime.rps.rolling&&alive?'?':(move||'대기')}</div><div class="rps-state ${alive?'alive':'out'}">${winner?'최종 우승':alive?'생존':'탈락'}</div></div>`}).join('')||'<div class="empty" style="grid-column:1/-1">참가자를 2명 이상 추가해 주세요.</div>';
  const status=document.getElementById('rpsStatus'),btn=document.getElementById('rpsRoundBtn');if(status)status.textContent=miniGameRuntime.rps.winnerId?'토너먼트 종료':`생존 ${active.size}명 · 진행 ${miniGameRuntime.rps.round}라운드`;if(btn){btn.disabled=arr.length<2||miniGameRuntime.rps.rolling||Boolean(miniGameRuntime.rps.winnerId);btn.textContent=miniGameRuntime.rps.round?`${miniGameRuntime.rps.round+1}라운드 시작`:'1라운드 시작'}
  const h=document.getElementById('rpsHistory');if(h)h.innerHTML=miniGameRuntime.rps.history.slice().reverse().map(x=>`<div class="rps-log-line">${esc(x)}</div>`).join('');
}
function rpsLosingMove(unique){const s=new Set(unique);if(s.has('바위')&&s.has('가위'))return'가위';if(s.has('가위')&&s.has('보'))return'보';if(s.has('보')&&s.has('바위'))return'바위';return''}
window.playRpsRound=()=>{
  const arr=data.miniGames.rps.players;if(arr.length<2||miniGameRuntime.rps.rolling||miniGameRuntime.rps.winnerId)return;
  let active=arr.filter(x=>miniGameRuntime.rps.activeIds.includes(x.id));if(active.length<2){resetRpsTournamentState(false);active=arr.slice()}
  miniGameRuntime.rps.round++;miniGameRuntime.rps.rolling=true;miniGameRuntime.rps.moves={};renderRps();
  setTimeout(()=>{
    const moves={};active.forEach(x=>moves[x.id]=RPS_MOVES[randomIntUnbiased(3)]);miniGameRuntime.rps.moves=moves;miniGameRuntime.rps.rolling=false;
    const unique=[...new Set(Object.values(moves))];let message='';
    if(unique.length===1||unique.length===3){message=`${miniGameRuntime.rps.round}R · 무승부 · 전원 생존`;miniGameRuntime.rps.history.push(message);document.getElementById('rpsRoundSummary').textContent='무승부입니다. 다음 라운드를 눌러 다시 진행하세요.';renderRps();return}
    const loser=rpsLosingMove(unique),eliminated=active.filter(x=>moves[x.id]===loser),survivors=active.filter(x=>moves[x.id]!==loser);miniGameRuntime.rps.activeIds=survivors.map(x=>x.id);message=`${miniGameRuntime.rps.round}R · ${loser} 탈락 · ${eliminated.map(x=>x.name).join(', ')}`;miniGameRuntime.rps.history.push(message);document.getElementById('rpsRoundSummary').innerHTML=`<strong>${esc(loser)}</strong>를 낸 ${eliminated.length}명 탈락 · 생존 ${survivors.length}명`;
    if(survivors.length===1){const w=survivors[0];miniGameRuntime.rps.winnerId=w.id;renderRps();setTimeout(()=>showMiniGameCelebration('RPS CHAMPION',w.name,w.image),350)}else renderRps();
  },760)
};

/* Premium Coin */
function renderCoin(){const s=data.miniGames.coin;const f=document.getElementById('coinFrontLabel'),b=document.getElementById('coinBackLabel');if(f&&document.activeElement!==f)f.value=s.frontLabel;if(b&&document.activeElement!==b)b.value=s.backLabel;const ff=document.getElementById('coinFrontFaceLabel'),bf=document.getElementById('coinBackFaceLabel');if(ff)ff.textContent=s.frontLabel;if(bf)bf.textContent=s.backLabel;document.getElementById('coinChooseFront')?.classList.toggle('selected',miniGameRuntime.coin.choice==='front');document.getElementById('coinChooseBack')?.classList.toggle('selected',miniGameRuntime.coin.choice==='back');const txt=document.getElementById('coinChoiceText');if(txt)txt.textContent=miniGameRuntime.coin.choice?`선택: ${miniGameRuntime.coin.choice==='front'?s.frontLabel:s.backLabel}`:'아직 선택하지 않았습니다.'}
window.updateCoinLabel=(side,v)=>{data.miniGames.coin[side==='front'?'frontLabel':'backLabel']=String(v||'').trim()||(side==='front'?'앞면':'뒷면');miniPersist();renderCoin()};
window.chooseCoinSide=side=>{miniGameRuntime.coin.choice=side;renderCoin()};
function coinLandingSparks(){const layer=document.getElementById('coinSparkLayer');if(!layer)return;layer.innerHTML='';for(let i=0;i<18;i++){const s=document.createElement('i');s.className='coin-spark';const a=randomFloat53()*Math.PI*2,r=55+randomFloat53()*95;s.style.setProperty('--dx',`${Math.cos(a)*r}px`);s.style.setProperty('--dy',`${Math.sin(a)*r*.55}px`);layer.appendChild(s)}setTimeout(()=>layer.innerHTML='',900)}
function playCoinClink(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ac=new C(),g=ac.createGain(),o=ac.createOscillator();o.type='triangle';o.frequency.setValueAtTime(1450,ac.currentTime);o.frequency.exponentialRampToValueAtTime(620,ac.currentTime+.08);g.gain.setValueAtTime(.07,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+.13);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.14);setTimeout(()=>ac.close(),250)}catch(_){}}
window.flipCoin=()=>{
  if(miniGameRuntime.coin.flipping)return;const result=randomBit()===0?'front':'back',visual=document.getElementById('coinVisual'),shadow=document.getElementById('coinShadow'),s=data.miniGames.coin;if(!visual)return;miniGameRuntime.coin.flipping=true;const endFace=result==='front'?0:180,fullSpins=8+randomIntUnbiased(4),end=fullSpins*360+endFace,drift=randomIntUnbiased(2)?18:-18;
  document.getElementById('coinResult').textContent='동전이 공중으로 올라갑니다...';visual.getAnimations().forEach(a=>a.cancel());shadow?.getAnimations().forEach(a=>a.cancel());
  const anim=visual.animate([
    {offset:0,transform:`translate3d(0,0,0) rotateX(8deg) rotateY(${miniGameRuntime.coin.restingRotation}deg) scale(1)`},
    {offset:.16,transform:`translate3d(${drift*.35}px,-74px,28px) rotateX(48deg) rotateY(${end*.2}deg) scale(.94)`},
    {offset:.48,transform:`translate3d(${drift}px,-224px,70px) rotateX(118deg) rotateY(${end*.58}deg) scale(1.08)`},
    {offset:.73,transform:`translate3d(${-drift*.4}px,-118px,34px) rotateX(36deg) rotateY(${end*.82}deg) scale(.99)`},
    {offset:.91,transform:`translate3d(0,13px,0) rotateX(-12deg) rotateY(${end+14}deg) scale(1.04)`},
    {offset:1,transform:`translate3d(0,0,0) rotateX(0deg) rotateY(${end}deg) scale(1)`}
  ],{duration:2050,easing:'cubic-bezier(.12,.72,.16,1)',fill:'forwards'});
  shadow?.animate([{transform:'translateX(-50%) scale(1)',opacity:.7},{offset:.48,transform:'translateX(-50%) scale(.32)',opacity:.15},{transform:'translateX(-50%) scale(1.12)',opacity:.78},{transform:'translateX(-50%) scale(1)',opacity:.7}],{duration:2050,easing:'ease-in-out'});
  setTimeout(()=>{coinLandingSparks();playCoinClink()},1840);
  anim.finished.then(()=>{miniGameRuntime.coin.flipping=false;miniGameRuntime.coin.lastResult=result;miniGameRuntime.coin.restingRotation=endFace;anim.cancel();visual.style.transform=`rotateY(${endFace}deg)`;const label=result==='front'?s.frontLabel:s.backLabel,chosen=miniGameRuntime.coin.choice,win=chosen?chosen===result:null;document.getElementById('coinResult').textContent=chosen?`${label} · ${win?'선택 성공':'선택 실패'}`:`결과 · ${label}`;showMiniGameCelebration(win===false?'COIN RESULT':'COIN FLIP',label)}).catch(()=>{miniGameRuntime.coin.flipping=false})
};

/* Pachinko */
function resetPachinkoState(render=true){miniGameRuntime.pachinko.running=false;miniGameRuntime.pachinko.paths=[];miniGameRuntime.pachinko.winnerId='';document.querySelectorAll('#pachinkoBalls .pachinko-ball').forEach(x=>x.getAnimations().forEach(a=>a.cancel()));if(render)renderPachinko()}
window.resetPachinko=()=>resetPachinkoState(true);
function buildPachinkoPegs(){const box=document.getElementById('pachinkoPegs');if(!box)return;let out='';const rows=10;for(let row=0;row<rows;row++){const count=row%2?10:9;for(let col=0;col<count;col++){const x=(col+1)/(count+1)*100+(row%2?0:0),y=16+row*6.55;out+=`<i class="pachinko-peg" style="left:${x}%;top:${y}%"></i>`}}box.innerHTML=out}
function renderPachinko(){
  renderMiniContactPalette('pachinko');buildPachinkoPegs();const arr=data.miniGames.pachinko.players,box=document.getElementById('pachinkoEntryList');if(box)box.innerHTML=arr.map(x=>`<div class="mini-entry-row">${miniEntryAvatar(x)}<input type="text" value="${esc(x.name)}" readonly title="연락처 표시 이름"><button class="ghost mini-delete" onclick="miniRemoveEntry('pachinko','${x.id}')">×</button></div>`).join('')||'<div class="empty small">연락처에서 참가자를 추가해 주세요</div>';
  const balls=document.getElementById('pachinkoBalls');if(balls&&!miniGameRuntime.pachinko.running){balls.innerHTML=arr.map((x,i)=>`<div class="pachinko-ball ${miniGameRuntime.pachinko.winnerId===x.id?'winner':''}" data-id="${x.id}" style="left:${46+(i%5)*2}%;top:${7+(i%3)*1.7}%">${x.image?`<img src="${x.image}">`:`<div style="width:100%;height:100%;display:grid;place-items:center;color:#fff;font-weight:950">${esc(initials(x.name))}</div>`}<span class="pachinko-ball-name">${esc(x.name)}</span></div>`).join('')}
  const st=document.getElementById('pachinkoStatus');if(st)st.textContent=arr.length<2?'참가자를 2명 이상 추가해 주세요.':miniGameRuntime.pachinko.winnerId?`당첨 · ${arr.find(x=>x.id===miniGameRuntime.pachinko.winnerId)?.name||''}`:`참가 ${arr.length}명 · 동일 확률 경로`;const btn=document.getElementById('pachinkoStartBtn');if(btn)btn.disabled=arr.length<2||miniGameRuntime.pachinko.running
}
function pachinkoPathForPlayer(player,order){const rows=10;let pos=0;const points=[{x:50+(order%5-2)*1.5,y:7}];for(let r=0;r<rows;r++){pos+=randomBit()?1:-1;points.push({x:50+pos*3.9+(r%2?1.1:-1.1),y:18+r*6.35})}points.push({x:50+pos*3.9,y:88});return{player,points,centrality:Math.abs(pos),tie:randomFloat53(),pos}}
window.startPachinko=()=>{
  const arr=data.miniGames.pachinko.players;if(arr.length<2)return toast('파칭코','참가자를 2명 이상 추가해 주세요');if(arr.length>18)return toast('파칭코','최대 18명까지 지원합니다');if(miniGameRuntime.pachinko.running)return;
  miniGameRuntime.pachinko.running=true;miniGameRuntime.pachinko.winnerId='';const order=cryptoShuffleInPlace(arr.map((_,i)=>i)),paths=arr.map((p,i)=>pachinkoPathForPlayer(p,order[i]));const ranked=[...paths].sort((a,b)=>a.centrality-b.centrality||a.tie-b.tie);const winner=ranked[0].player;miniGameRuntime.pachinko.paths=paths;
  const balls=document.getElementById('pachinkoBalls');balls.innerHTML=arr.map((x,i)=>`<div class="pachinko-ball" data-id="${x.id}" style="left:50%;top:7%">${x.image?`<img src="${x.image}">`:`<div style="width:100%;height:100%;display:grid;place-items:center;color:#fff;font-weight:950">${esc(initials(x.name))}</div>`}<span class="pachinko-ball-name">${esc(x.name)}</span></div>`).join('');document.getElementById('pachinkoResult').textContent='공이 내려가는 중입니다...';document.getElementById('pachinkoStatus').textContent=`${arr.length}개의 공이 출발했습니다`;
  let maxEnd=0;paths.forEach((path,i)=>{const el=balls.querySelector(`[data-id="${CSS.escape(path.player.id)}"]`);if(!el)return;const delay=i*70,duration=4000+randomIntUnbiased(850);maxEnd=Math.max(maxEnd,delay+duration);const frames=path.points.map((p,j)=>({offset:j/(path.points.length-1),left:`${p.x}%`,top:`${p.y}%`,transform:`translate(-50%,-50%) rotate(${(j%2?1:-1)*(12+j*9)}deg)`}));el.animate(frames,{duration,delay,easing:'cubic-bezier(.22,.54,.34,1)',fill:'forwards'})});
  setTimeout(()=>{miniGameRuntime.pachinko.running=false;miniGameRuntime.pachinko.winnerId=winner.id;const wel=balls.querySelector(`[data-id="${CSS.escape(winner.id)}"]`);wel?.classList.add('winner');document.getElementById('pachinkoResult').textContent=`JACKPOT · ${winner.name}`;document.getElementById('pachinkoStatus').textContent=`중앙에 가장 가까운 공 · ${winner.name}`;const btn=document.getElementById('pachinkoStartBtn');if(btn)btn.disabled=false;showMiniGameCelebration('PACHINKO JACKPOT',winner.name,winner.image)},maxEnd+250)
};

function renderAll(reason=lastSyncReason){
  normalizeDataShape();
  document.body.dataset.theme=data.theme||'neon';
  updateUpcomingAccent();

  const results=[
    safeRenderView('배경',applyBackground),
    safeRenderView('연락처 필터',renderContactFilters),
    safeRenderView('대시보드',renderDashboard),
    safeRenderView('리마인더',renderReminders),
    safeRenderView('연락처',renderContacts),
    safeRenderView('최근 합방 인원',renderSniperList),
    safeRenderView('합방 랭킹',renderCollabRanking),
    safeRenderView('즐겨찾기',renderFavoriteSchedules),
    safeRenderView('백업 이미지 상태',updateFullBackupAssetStatus),
    safeRenderView('저격 리스트',renderTargetList),
    safeRenderView('메모',renderMemoLibrary),
    safeRenderView('신규 연락처',renderPendingContacts),
    safeRenderView('캘린더',renderCalendar),
    safeRenderView('설정',renderSettings),
    safeRenderView('세계 시간',renderWorldTime),
    safeRenderView('미니게임',renderAllMiniGames),
    safeRenderView('저장 상태',()=>updateStorageStatus(true)),
    safeRenderView('시계',tickClock)
  ];

  const status=document.getElementById('syncStatusText');
  if(status){
    const ok=results.filter(Boolean).length;
    status.textContent=ok===results.length?'전체 화면 동기화':`동기화 ${ok}/${results.length}`;
  }
}
compactExistingAutosaves();
normalizeDataShape();
persist();
renderAll('초기 로드');


/* v3.8 overrides - ladder geometry, horse race, custom coin */
function ladderGeometry(){const canvas=document.getElementById('ladderCanvas'),n=data.miniGames.ladder.players.length,w=canvas?.width||1360,h=canvas?.height||720,top=82,bottom=h-82,left=68,right=w-68;const xs=Array.from({length:n},(_,i)=>n===1?w/2:left+(right-left)*i/(n-1));const rows=Math.max(10,n*2);return{canvas,n,w,h,top,bottom,xs,rows}}
function renderLadder(){
  ensureLadderPrizeCount();renderMiniContactPalette('ladder');const players=data.miniGames.ladder.players,prizes=data.miniGames.ladder.prizes;
  const pc=document.getElementById('ladderPlayerCountChip');if(pc)pc.textContent=`${players.length}명`;const rc=document.getElementById('ladderPrizeCountChip');if(rc)rc.textContent=`${prizes.length}개`;
  const pbox=document.getElementById('ladderPlayerList');if(pbox)pbox.innerHTML=players.map(x=>`<div class="mini-entry-row">${miniEntryAvatar(x)}<input type="text" value="${esc(x.name)}" onchange="miniRenameEntry('ladder','${x.id}',this.value)"><button class="ghost mini-delete" onclick="miniRemoveEntry('ladder','${x.id}')">×</button></div>`).join('')||'<div class="empty small">참가자 없음</div>';
  const rbox=document.getElementById('ladderPrizeList');if(rbox)rbox.innerHTML=prizes.map((x,i)=>`<div class="mini-entry-row"><div class="mini-entry-avatar">${i+1}</div><input type="text" value="${esc(x.label)}" oninput="updateLadderPrize('${x.id}',this.value)"></div>`).join('')||'<div class="empty small">참가자를 추가하면 자동 생성됩니다</div>';
  const status=document.getElementById('ladderStatus');if(status&&!miniGameRuntime.ladder.generated)status.textContent=players.length?`참가자 ${players.length}명 · 결과 ${prizes.length}개 자동 준비`:'참가자를 준비해 주세요';
  renderLadderPlayerButtons();requestAnimationFrame(drawLadder)
}

function resetPachinkoState(render=true){
  clearTimeout(miniGameRuntime.pachinko.timer);
  miniGameRuntime.pachinko={running:false,racers:[],winnerId:'',turn:0,placements:[],rosterKey:'',timer:null};
  if(render)renderPachinko();
}
window.resetPachinko=()=>resetPachinkoState(true);
function horseRaceRosterKey(){return (data.miniGames.pachinko.players||[]).map(x=>x.id).join('|')}
function buildHorseRaceRacers(){return (data.miniGames.pachinko.players||[]).map((p,i)=>({id:p.id,contactId:p.contactId||'',name:p.name||'참가자',image:p.image||'',lane:i,progress:0,skip:0,finished:false,finishOrder:0,lastMove:0,lastEvent:'준비',tie:randomFloat53(),passed:{boost22:false,trap44:false,boost66:false,trap81:false}}))}
function ensureHorseRaceRuntime(){const key=horseRaceRosterKey();if(miniGameRuntime.pachinko.running)return;if(miniGameRuntime.pachinko.rosterKey!==key){miniGameRuntime.pachinko.racers=buildHorseRaceRacers();miniGameRuntime.pachinko.placements=[];miniGameRuntime.pachinko.winnerId='';miniGameRuntime.pachinko.turn=0;miniGameRuntime.pachinko.rosterKey=key}}
function horseRacers(){ensureHorseRaceRuntime();return miniGameRuntime.pachinko.racers||[]}
function horseRaceSort(a,b){if(a.finished&&b.finished)return a.finishOrder-b.finishOrder;if(a.finished!==b.finished)return a.finished?-1:1;return b.progress-a.progress||b.lastMove-a.lastMove||a.skip-b.skip||a.tie-b.tie}
function horseRunnerAvatar(x){return x.image?`<img src="${x.image}">`:`<span>${esc(initials(x.name))}</span>`}
function buildHorseRaceStage(){const box=document.getElementById('horseRaceStage');if(!box)return;const arr=horseRacers(),sig=arr.map(x=>x.id).join('|');if(box.dataset.sig===sig)return;box.dataset.sig=sig;box.innerHTML=arr.map((x,i)=>`<div class="horse-lane" data-horse-id="${x.id}"><div class="horse-lane-index">${i+1}</div><div class="horse-track"><div class="horse-track-zone boost z1"><span>BOOST</span></div><div class="horse-track-zone trap z2"><span>TRAP</span></div><div class="horse-track-zone boost z3"><span>BOOST</span></div><div class="horse-track-zone trap z4"><span>TRAP</span></div><div id="horseRunner-${x.id}" class="horse-runner"><div class="horse-avatar">${horseRunnerAvatar(x)}</div><div class="horse-body"><div class="horse-emoji">🐎</div><span class="horse-name">${esc(x.name)}</span></div><div id="horseState-${x.id}" class="horse-runner-state">준비</div></div></div></div>`).join('')||'<div class="empty small">참가자를 2명 이상 준비해 주세요</div>'}
function raceRankChip(r){if(r.finished)return `${r.finishOrder}등`;if(r.skip>0)return `정지 ${r.skip}턴`;return r.lastEvent||'주행 중'}
function updateHorseRaceUI(){
  ensureHorseRaceRuntime();const arr=horseRacers(),status=document.getElementById('pachinkoStatus'),result=document.getElementById('pachinkoResult'),chip=document.getElementById('horseRaceTurnChip'),btn=document.getElementById('pachinkoStartBtn');
  buildHorseRaceStage();
  if(chip)chip.textContent=`${miniGameRuntime.pachinko.turn||0}턴`;
  const list=document.getElementById('pachinkoEntryList');if(list)list.innerHTML=arr.map((x,i)=>`<div class="horse-entry-row">${miniEntryAvatar(x)}<input type="text" value="${esc(x.name)}" readonly title="연락처 표시 이름"><div class="horse-entry-order">${i+1}</div></div>`).join('')||'<div class="empty small">연락처에서 참가자를 추가해 주세요</div>';
  arr.forEach(x=>{const el=document.getElementById(`horseRunner-${x.id}`),st=document.getElementById(`horseState-${x.id}`);if(!el)return;const left=Math.min(92,2+x.progress*.9);el.style.left=`${left}%`;el.classList.toggle('active',miniGameRuntime.pachinko.running&&!x.finished&&x.skip===0);el.classList.toggle('stunned',!x.finished&&x.skip>0);el.classList.toggle('finished',x.finished);if(st)st.textContent=x.finished?`${x.finishOrder}등 도착`:x.skip>0?`장애물 · ${x.skip}턴 대기`:x.lastEvent||'준비'});
  const ranked=[...arr].sort(horseRaceSort),lb=document.getElementById('horseRaceLeaderboard');if(lb)lb.innerHTML=ranked.map((x,i)=>`<div class="horse-rank-row ${i===0?'top1':''}"><div class="horse-rank-num">${i+1}</div><div class="horse-rank-avatar">${horseRunnerAvatar(x)}</div><div style="min-width:0"><div class="horse-rank-name">${esc(x.name)}</div><div class="horse-rank-meta">${x.finished?`결승 통과 · ${x.finishOrder}등 확정`:x.skip>0?`장애물로 잠시 정지`:x.lastEvent||'주행 중'}</div></div><div class="horse-rank-chip">${raceRankChip(x)}</div></div>`).join('')||'<div class="empty small">참가자 없음</div>';
  if(status)status.textContent=!arr.length?'참가자를 추가해 주세요.':arr.length<2?'참가자를 2명 이상 추가해 주세요.':miniGameRuntime.pachinko.running?`실시간 레이스 진행 중 · ${miniGameRuntime.pachinko.placements.length}명 결승 통과`:miniGameRuntime.pachinko.placements.length?`레이스 종료 · ${miniGameRuntime.pachinko.placements.length}명 완주`:`참가 ${arr.length}명 · 레이스 준비 완료`;
  if(result&&!miniGameRuntime.pachinko.running&&!miniGameRuntime.pachinko.placements.length)result.textContent='아직 레이스를 시작하지 않았습니다.';
  if(result&&miniGameRuntime.pachinko.placements.length){const nameMap=Object.fromEntries(arr.map(x=>[x.id,x.name]));const order=miniGameRuntime.pachinko.placements.map((id,idx)=>`${idx+1}등 ${nameMap[id]||''}`).join(' · ');result.textContent=miniGameRuntime.pachinko.running?`중간 순위 · ${order}`:`최종 순위 · ${order}`}
  if(btn){btn.disabled=arr.length<2||miniGameRuntime.pachinko.running;btn.textContent=miniGameRuntime.pachinko.running?'레이스 진행 중':'레이스 시작'}
}
window.shufflePachinkoOrder=()=>{const arr=data.miniGames.pachinko.players;if(arr.length<2)return toast('경마','참가자가 2명 이상 필요합니다');cryptoShuffleInPlace(arr);resetPachinkoState(false);miniPersist();renderPachinko();toast('경마','출발 순서를 섞었습니다')};
function horseCrossZone(r,oldProgress,newProgress,at,type){const key=`${type}${at}`;if(r.passed[key])return newProgress; if(oldProgress<at&&newProgress>=at){r.passed[key]=true;if(type==='boost'){const bonus=1+randomIntUnbiased(3);r.lastEvent=`부스터 +${bonus}`;return newProgress+bonus}else{const stop=1+randomIntUnbiased(2);r.skip=stop;r.lastEvent=`장애물 · ${stop}턴 정지`;return newProgress}}return newProgress}
function horseRaceTick(){
  if(!miniGameRuntime.pachinko.running)return;miniGameRuntime.pachinko.turn=(miniGameRuntime.pachinko.turn||0)+1;const arr=miniGameRuntime.pachinko.racers;
  for(const r of arr){
    if(r.finished)continue;
    if(r.skip>0){r.skip-=1;r.lastMove=0;r.lastEvent=`장애물 회복 중`;continue}
    const old=r.progress;let next=old+randomIntUnbiased(3);r.lastMove=Math.max(0,next-old);r.lastEvent=r.lastMove===0?'잠시 주춤':r.lastMove===1?'안정 전진':'빠른 전진';
    next=horseCrossZone(r,old,next,22,'boost');
    next=horseCrossZone(r,old,next,44,'trap');
    next=horseCrossZone(r,old,next,66,'boost');
    next=horseCrossZone(r,old,next,81,'trap');
    r.lastMove=Math.max(0,next-old);r.progress=Math.min(100,next);
    if(r.progress>=100&&!r.finished){r.finished=true;r.finishOrder=miniGameRuntime.pachinko.placements.length+1;miniGameRuntime.pachinko.placements.push(r.id);if(!miniGameRuntime.pachinko.winnerId)miniGameRuntime.pachinko.winnerId=r.id;r.lastEvent=`${r.finishOrder}등 도착`}
  }
  updateHorseRaceUI();
  if(arr.every(x=>x.finished)){
    miniGameRuntime.pachinko.running=false;clearTimeout(miniGameRuntime.pachinko.timer);miniGameRuntime.pachinko.timer=null;updateHorseRaceUI();const winner=arr.find(x=>x.id===miniGameRuntime.pachinko.winnerId);if(winner)showMiniGameCelebration('RACE WINNER',winner.name,winner.image);return;
  }
  miniGameRuntime.pachinko.timer=setTimeout(horseRaceTick,620);
}
window.startPachinko=()=>{const arr=data.miniGames.pachinko.players;if(arr.length<2)return toast('경마','참가자를 2명 이상 추가해 주세요');if(arr.length>10)return toast('경마','가독성과 한 화면 표시를 위해 최대 10명까지 지원합니다');if(miniGameRuntime.pachinko.running)return;clearTimeout(miniGameRuntime.pachinko.timer);miniGameRuntime.pachinko={running:true,racers:buildHorseRaceRacers(),winnerId:'',turn:0,placements:[],rosterKey:horseRaceRosterKey(),timer:null};buildHorseRaceStage();updateHorseRaceUI();const result=document.getElementById('pachinkoResult');if(result)result.textContent='레이스 시작 · 실시간 등수는 오른쪽 패널에서 확인할 수 있습니다.';miniGameRuntime.pachinko.timer=setTimeout(horseRaceTick,620)};
function renderPachinko(){renderMiniContactPalette('pachinko');updateHorseRaceUI()}



/* v3.9 overrides - fair roulette and faster horse race */
window.spinRoulette=()=>{
  const arr=data.miniGames.roulette.entries;
  if(arr.length<2||miniGameRuntime.roulette.spinning)return toast('룰렛','참가자를 2명 이상 추가해 주세요');
  const weights=arr.map(x=>Math.max(.01,Number(x.weight)||1));
  const total=weights.reduce((a,b)=>a+b,0);
  const sample=randomFloat53()*total;
  let beforeWeight=0,index=0;
  for(let i=0;i<weights.length;i++){
    if(sample<beforeWeight+weights[i]){index=i;break}
    beforeWeight+=weights[i];
  }
  const sliceWeight=weights[index];
  const within=(sample-beforeWeight)/sliceWeight;
  const beforeAngle=Math.PI*2*(beforeWeight/total);
  const sliceAngle=Math.PI*2*(sliceWeight/total);
  const epsilon=Math.min(sliceAngle*.12,0.035);
  const offsetWithin=Math.min(sliceAngle-epsilon,Math.max(epsilon,sliceAngle*within));
  const desired=-(beforeAngle+offsetWithin);
  const start=miniGameRuntime.roulette.rotation;
  let delta=((desired-start)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
  delta+=Math.PI*2*(7+randomIntUnbiased(3));
  const target=start+delta,duration=4200+randomIntUnbiased(450),t0=performance.now();
  miniGameRuntime.roulette.spinning=true;
  document.querySelector('.roulette-stage-card')?.classList.add('spinning');
  renderRoulette();
  const step=now=>{
    const t=Math.min(1,(now-t0)/duration),ease=1-Math.pow(1-t,4);
    miniGameRuntime.roulette.rotation=start+(target-start)*ease;
    drawRoulette();
    if(t<1)return requestAnimationFrame(step);
    miniGameRuntime.roulette.rotation=((target%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
    miniGameRuntime.roulette.spinning=false;
    document.querySelector('.roulette-stage-card')?.classList.remove('spinning');
    const winner=arr[index];
    data.miniGames.roulette.lastWinnerId=winner.id;
    miniPersist();
    document.getElementById('rouletteWinner').textContent=`당첨 · ${winner.name}`;
    renderRoulette();
    showMiniGameCelebration('ROULETTE WINNER',winner.name,winner.image)
  };
  requestAnimationFrame(step)
};

function resetPachinkoState(render=true){
  clearTimeout(miniGameRuntime.pachinko.timer);
  miniGameRuntime.pachinko={running:false,racers:[],winnerId:'',turn:0,placements:[],rosterKey:'',timer:null};
  if(render)renderPachinko();
}
window.resetPachinko=()=>resetPachinkoState(true);
function horseRaceRosterKey(){return (data.miniGames.pachinko.players||[]).map(x=>x.id).join('|')}
function buildHorseRaceRacers(){
  return (data.miniGames.pachinko.players||[]).map((p,i)=>({
    id:p.id,contactId:p.contactId||'',name:p.name||'참가자',image:p.image||'',lane:i,progress:0,finished:false,finishOrder:0,
    lastMove:0,lastEvent:'준비',tie:randomFloat53(),passed:{b18:false,b43:false,b66:false,b82:false}
  }))
}
function ensureHorseRaceRuntime(){const key=horseRaceRosterKey();if(miniGameRuntime.pachinko.running)return;if(miniGameRuntime.pachinko.rosterKey!==key){miniGameRuntime.pachinko.racers=buildHorseRaceRacers();miniGameRuntime.pachinko.placements=[];miniGameRuntime.pachinko.winnerId='';miniGameRuntime.pachinko.turn=0;miniGameRuntime.pachinko.rosterKey=key}}
function horseRacers(){ensureHorseRaceRuntime();return miniGameRuntime.pachinko.racers||[]}
function horseRaceSort(a,b){if(a.finished&&b.finished)return a.finishOrder-b.finishOrder;if(a.finished!==b.finished)return a.finished?-1:1;return b.progress-a.progress||b.lastMove-a.lastMove||a.tie-b.tie}
function horseRunnerAvatar(x){return x.image?`<img src="${x.image}">`:`<span>${esc(initials(x.name))}</span>`}
function buildHorseRaceStage(){
  const box=document.getElementById('horseRaceStage');if(!box)return;const arr=horseRacers(),sig=arr.map(x=>x.id).join('|');if(box.dataset.sig===sig)return;box.dataset.sig=sig;
  box.innerHTML=arr.map((x,i)=>`<div class="horse-lane" data-horse-id="${x.id}"><div class="horse-lane-index">${i+1}</div><div class="horse-track"><div class="horse-track-zone boost z1"><span>BOOST</span></div><div class="horse-track-zone boost z2"><span>BOOST</span></div><div class="horse-track-zone boost z3"><span>BOOST</span></div><div class="horse-track-zone boost z4"><span>BOOST</span></div><div id="horseRunner-${x.id}" class="horse-runner"><div class="horse-avatar">${horseRunnerAvatar(x)}</div><div class="horse-body"><div class="horse-emoji">🐎</div><span class="horse-name">${esc(x.name)}</span></div><div id="horseState-${x.id}" class="horse-runner-state">준비</div></div></div></div>`).join('')||'<div class="empty small">참가자를 2명 이상 준비해 주세요</div>'
}
function raceRankChip(r){return r.finished?`${r.finishOrder}등`:r.lastEvent||'주행 중'}
function updateHorseRaceUI(){
  ensureHorseRaceRuntime();
  const arr=horseRacers(),status=document.getElementById('pachinkoStatus'),result=document.getElementById('pachinkoResult'),chip=document.getElementById('horseRaceTurnChip'),btn=document.getElementById('pachinkoStartBtn');
  buildHorseRaceStage();
  if(chip)chip.textContent=`${miniGameRuntime.pachinko.turn||0}턴`;
  const list=document.getElementById('pachinkoEntryList');
  if(list)list.innerHTML=arr.map((x,i)=>`<div class="horse-entry-row">${miniEntryAvatar(x)}<input type="text" value="${esc(x.name)}" readonly title="연락처 표시 이름"><div class="horse-entry-order">${i+1}</div></div>`).join('')||'<div class="empty small">연락처에서 참가자를 추가해 주세요</div>';
  arr.forEach(x=>{const el=document.getElementById(`horseRunner-${x.id}`),st=document.getElementById(`horseState-${x.id}`);if(!el)return;const left=Math.min(92,2+x.progress*.9);el.style.left=`${left}%`;el.classList.toggle('active',miniGameRuntime.pachinko.running&&!x.finished);el.classList.toggle('finished',x.finished);if(st)st.textContent=x.finished?`${x.finishOrder}등 도착`:x.lastEvent||'준비'});
  const ranked=[...arr].sort(horseRaceSort),lb=document.getElementById('horseRaceLeaderboard');
  if(lb)lb.innerHTML=ranked.map((x,i)=>`<div class="horse-rank-row ${i===0?'top1':''}"><div class="horse-rank-num">${i+1}</div><div class="horse-rank-avatar">${horseRunnerAvatar(x)}</div><div style="min-width:0"><div class="horse-rank-name">${esc(x.name)}</div><div class="horse-rank-meta">${x.finished?`결승 통과 · ${x.finishOrder}등 확정`:x.lastEvent||'주행 중'}</div></div><div class="horse-rank-chip">${raceRankChip(x)}</div></div>`).join('')||'<div class="empty small">참가자 없음</div>';
  if(status)status.textContent=!arr.length?'참가자를 추가해 주세요.':arr.length<2?'참가자를 2명 이상 추가해 주세요.':miniGameRuntime.pachinko.running?`실시간 레이스 진행 중 · ${miniGameRuntime.pachinko.placements.length}명 결승 통과`:miniGameRuntime.pachinko.placements.length?`레이스 종료 · ${miniGameRuntime.pachinko.placements.length}명 완주`:`참가 ${arr.length}명 · 빠른 레이스 준비 완료`;
  if(result&&!miniGameRuntime.pachinko.running&&!miniGameRuntime.pachinko.placements.length)result.textContent='아직 레이스를 시작하지 않았습니다.';
  if(result&&miniGameRuntime.pachinko.placements.length){const nameMap=Object.fromEntries(arr.map(x=>[x.id,x.name]));const order=miniGameRuntime.pachinko.placements.map((id,idx)=>`${idx+1}등 ${nameMap[id]||''}`).join(' · ');result.textContent=miniGameRuntime.pachinko.running?`중간 순위 · ${order}`:`최종 순위 · ${order}`}
  if(btn){btn.disabled=arr.length<2||miniGameRuntime.pachinko.running;btn.textContent=miniGameRuntime.pachinko.running?'레이스 진행 중':'레이스 시작'}
}
window.shufflePachinkoOrder=()=>{const arr=data.miniGames.pachinko.players;if(arr.length<2)return toast('경마','참가자가 2명 이상 필요합니다');cryptoShuffleInPlace(arr);resetPachinkoState(false);miniPersist();renderPachinko();toast('경마','출발 순서를 섞었습니다')};
function horseStepValue(){const r=randomFloat53();return r<0.2?0:r<0.65?1:2}
function horseBoostPass(r,oldP,newP,mark){const key=`b${mark}`;if(r.passed[key])return newP;if(oldP<mark&&newP>=mark){r.passed[key]=true;const bonus=2+randomIntUnbiased(4);r.lastEvent=`부스터 +${bonus}`;return newP+bonus}return newP}
function horseRaceTick(){
  if(!miniGameRuntime.pachinko.running)return;
  miniGameRuntime.pachinko.turn=(miniGameRuntime.pachinko.turn||0)+1;
  const arr=miniGameRuntime.pachinko.racers;
  for(const r of arr){
    if(r.finished)continue;
    const old=r.progress;
    let next=old+horseStepValue();
    r.lastMove=Math.max(0,next-old);
    r.lastEvent=r.lastMove===0?'호흡 조절':r.lastMove===1?'안정 전진':'강한 스퍼트';
    next=horseBoostPass(r,old,next,18);
    next=horseBoostPass(r,old,next,43);
    next=horseBoostPass(r,old,next,66);
    next=horseBoostPass(r,old,next,82);
    if(next>=92&&randomFloat53()<0.34){next+=1;r.lastEvent='마지막 스퍼트'}
    r.lastMove=Math.max(0,next-old);
    r.progress=Math.min(100,next);
    if(r.progress>=100&&!r.finished){r.finished=true;r.finishOrder=miniGameRuntime.pachinko.placements.length+1;miniGameRuntime.pachinko.placements.push(r.id);if(!miniGameRuntime.pachinko.winnerId)miniGameRuntime.pachinko.winnerId=r.id;r.lastEvent=`${r.finishOrder}등 도착`}
  }
  updateHorseRaceUI();
  if(arr.every(x=>x.finished)){
    miniGameRuntime.pachinko.running=false;clearTimeout(miniGameRuntime.pachinko.timer);miniGameRuntime.pachinko.timer=null;updateHorseRaceUI();const winner=arr.find(x=>x.id===miniGameRuntime.pachinko.winnerId);if(winner)showMiniGameCelebration('RACE WINNER',winner.name,winner.image);return;
  }
  miniGameRuntime.pachinko.timer=setTimeout(horseRaceTick,170)
}
window.startPachinko=()=>{const arr=data.miniGames.pachinko.players;if(arr.length<2)return toast('경마','참가자를 2명 이상 추가해 주세요');if(arr.length>10)return toast('경마','가독성과 한 화면 표시를 위해 최대 10명까지 지원합니다');if(miniGameRuntime.pachinko.running)return;clearTimeout(miniGameRuntime.pachinko.timer);miniGameRuntime.pachinko={running:true,racers:buildHorseRaceRacers(),winnerId:'',turn:0,placements:[],rosterKey:horseRaceRosterKey(),timer:null};buildHorseRaceStage();updateHorseRaceUI();const result=document.getElementById('pachinkoResult');if(result)result.textContent='레이스 시작 · 중앙 트랙과 오른쪽 실시간 순위를 확인해 주세요.';miniGameRuntime.pachinko.timer=setTimeout(horseRaceTick,220)};
function renderPachinko(){renderMiniContactPalette('pachinko');updateHorseRaceUI()}



/* =====================================================
   v4.1 dashboard modes
   ===================================================== */
var dashboardMode='overview';
function setDashboardMode(mode){
  dashboardMode=mode==='reminders'?'reminders':'overview';
  document.querySelectorAll('.dashboard-mode-tab').forEach(b=>b.classList.toggle('active',b.dataset.dashboardMode===dashboardMode));
  document.getElementById('dashboardOverviewMode')?.classList.toggle('active',dashboardMode==='overview');
  document.getElementById('dashboardReminderMode')?.classList.toggle('active',dashboardMode==='reminders');
  if(dashboardMode==='reminders')renderReminders();else renderDashboard();
}
document.querySelectorAll('.dashboard-mode-tab').forEach(b=>b.onclick=()=>setDashboardMode(b.dataset.dashboardMode));
const originalSetTabV41=setTab;
setTab=function(tab){
  if(tab==='dashboard'&&tab!==document.querySelector('.nav button.active')?.dataset.tab)dashboardMode='overview';
  originalSetTabV41(tab);
  if(tab==='dashboard'||tab==='reminders')setDashboardMode(tab==='reminders'?'reminders':dashboardMode);
};
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));

/* =====================================================
   v4.1 ladder automatic sequence
   ===================================================== */
miniGameRuntime.ladder.autoRunning=false;
miniGameRuntime.ladder.autoResultNames=[];
function ladderSleep(ms){return new Promise(r=>setTimeout(r,ms))}
function makeRandomLadderRungs(n){
  const rows=Math.max(10,n*2),rungs=[];
  for(let row=0;row<rows;row++){
    let last=-2;
    for(let i=0;i<n-1;i++){
      if(i===last+1)continue;
      if(randomFloat53()<.38){rungs.push({row,left:i});last=i}
    }
  }
  return rungs;
}
function renderLadderOrderVisual(){
  const players=data.miniGames.ladder.players,prizes=data.miniGames.ladder.prizes;
  const pbox=document.getElementById('ladderPlayerList');if(pbox)pbox.innerHTML=players.map(x=>`<div class="mini-entry-row">${miniEntryAvatar(x)}<input type="text" value="${esc(x.name)}" onchange="miniRenameEntry('ladder','${x.id}',this.value)"><button class="ghost mini-delete" onclick="miniRemoveEntry('ladder','${x.id}')">×</button></div>`).join('');
  const rbox=document.getElementById('ladderPrizeList');if(rbox)rbox.innerHTML=prizes.map((x,i)=>`<div class="mini-entry-row"><div class="mini-entry-avatar">${i+1}</div><input type="text" value="${esc(x.label)}" oninput="updateLadderPrize('${x.id}',this.value)"></div>`).join('');
  renderLadderPlayerButtons();drawLadder();renderLadderAutoResultSlots();
}
function renderLadderAutoResultSlots(){
  const box=document.getElementById('ladderAutoResultSlots');if(!box)return;
  const prizes=data.miniGames.ladder.prizes,names=miniGameRuntime.ladder.autoResultNames||[];
  box.style.setProperty('--ladder-cols',Math.max(1,prizes.length));
  box.innerHTML=prizes.map((p,i)=>`<div class="ladder-auto-result-slot ${names[i]?'revealed':''}" data-result-index="${i}"><div class="result-label">${esc(p.label||`결과 ${i+1}`)}</div><div class="result-person">${names[i]?esc(names[i]):' '}</div></div>`).join('');
}
const renderLadderV40=renderLadder;
renderLadder=function(){renderLadderV40();renderLadderAutoResultSlots();const stage=document.querySelector('.ladder-stage-card');stage?.classList.toggle('auto-running',Boolean(miniGameRuntime.ladder.autoRunning));const auto=document.getElementById('ladderAutoStartBtn');if(auto){auto.disabled=Boolean(miniGameRuntime.ladder.autoRunning);auto.textContent=miniGameRuntime.ladder.autoRunning?'자동 진행 중':'자동 시작'}};
const generateLadderV40=generateLadder;
generateLadder=function(){miniGameRuntime.ladder.autoResultNames=[];return generateLadderV40()};
const shuffleLadderOrdersV40=shuffleLadderOrders;
shuffleLadderOrders=function(){miniGameRuntime.ladder.autoResultNames=[];return shuffleLadderOrdersV40()};
async function animateLadderPathAuto(index,duration=650){
  const player=data.miniGames.ladder.players[index],path=ladderPath(index);if(!player)return;
  miniGameRuntime.ladder.activePlayer=index;renderLadderPlayerButtons();
  await new Promise(resolve=>{const t0=performance.now();const frame=now=>{const t=Math.min(1,(now-t0)/duration);drawLadder(path.points,1-Math.pow(1-t,2.1));if(t<1)return requestAnimationFrame(frame);miniGameRuntime.ladder.autoResultNames[path.resultIndex]=player.name;renderLadderAutoResultSlots();resolve()};requestAnimationFrame(frame)});
}
window.autoStartLadder=async()=>{
  const players=data.miniGames.ladder.players,prizes=data.miniGames.ladder.prizes;
  if(players.length<2)return toast('사다리','참가자를 2명 이상 추가해 주세요');
  if(players.length>12)return toast('사다리','가독성을 위해 최대 12명까지 지원합니다');
  if(miniGameRuntime.ladder.autoRunning)return;
  ensureLadderPrizeCount();miniGameRuntime.ladder.autoRunning=true;miniGameRuntime.ladder.autoResultNames=[];miniGameRuntime.ladder.generated=false;miniGameRuntime.ladder.activePlayer=-1;renderLadder();
  const status=document.getElementById('ladderStatus'),result=document.getElementById('ladderResult');result?.classList.remove('done');
  try{
    // 10 visible order shuffles: very fast first, gradually slowing.
    for(let i=0;i<10;i++){
      cryptoShuffleInPlace(players);cryptoShuffleInPlace(prizes);renderLadderOrderVisual();
      if(status)status.textContent=`자동 시작 · 순서 섞기 ${i+1} / 10`;
      await ladderSleep(38+Math.round(Math.pow(i/9,2)*150));
    }
    // 20 ladder regenerations: rapidly flicker then slow down for suspense.
    for(let i=0;i<20;i++){
      miniGameRuntime.ladder.rungs=makeRandomLadderRungs(players.length);miniGameRuntime.ladder.generated=true;drawLadder();
      if(status)status.textContent=`자동 시작 · 사다리 섞기 ${i+1} / 20`;
      await ladderSleep(28+Math.round(Math.pow(i/19,2.35)*235));
    }
    miniGameRuntime.ladder.generated=true;renderLadderPlayerButtons();
    if(status)status.textContent='자동 시작 · 왼쪽부터 결과 확인';
    if(result)result.textContent='왼쪽 참가자부터 차례대로 사다리를 내려갑니다.';
    for(let i=0;i<players.length;i++){
      await animateLadderPathAuto(i,Math.max(430,720-players.length*14));
      await ladderSleep(120);
    }
    miniGameRuntime.ladder.activePlayer=-1;
    if(status)status.textContent=`자동 사다리 완료 · ${players.length}명`;
    if(result){result.classList.add('done');result.textContent='모든 참가자의 결과가 공개되었습니다.'}
  }finally{
    miniGameRuntime.ladder.autoRunning=false;miniPersist();renderLadder();
  }
};

/* =====================================================
   v4.1 SOOP post/comment intake
   ===================================================== */
var activePostId='';

function parseSoopPostUrl(raw){
  let u=String(raw||'').trim();if(!u)return null;try{u=new URL(u).href}catch(_){return null}
  const m=u.match(/sooplive\.com\/station\/([^/?#]+)\/post\/(\d+)/i);if(!m)return null;
  return {bjId:decodeURIComponent(m[1]),postNo:m[2],url:`https://www.sooplive.com/station/${encodeURIComponent(decodeURIComponent(m[1]))}/post/${m[2]}`};
}
function normalizeSoopUrl(v){v=String(v||'');return v.startsWith('//')?'https:'+v:v}
function soopUserStationUrl(userId){const id=String(userId||'').trim();return id?`https://www.sooplive.com/station/${encodeURIComponent(id)}`:''}
function soopStationKey(raw){
  let v=String(raw||'').trim();if(!v)return'';
  if(!/^https?:\/\//i.test(v))v='https://'+v;
  try{
    const u=new URL(v),host=u.hostname.toLowerCase(),parts=u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if(host.endsWith('sooplive.com')){
      if(parts[0]?.toLowerCase()==='station'&&parts[1])return parts[1].toLowerCase();
      if(host.startsWith('play.')&&parts[0])return parts[0].toLowerCase();
    }
    if(host.endsWith('afreecatv.com')){
      if(parts[0]?.toLowerCase()==='station'&&parts[1])return parts[1].toLowerCase();
      if(parts[0])return parts[0].toLowerCase();
    }
  }catch(_){return''}
  return'';
}
function findContactForSoopApplicant(applicant){
  const key=String(applicant?.userId||'').trim().toLowerCase()||soopStationKey(applicant?.stationUrl);if(!key)return null;
  return (data.contacts||[]).find(c=>soopStationKey(c.stationUrl)===key)||null;
}
function soopPhotoUrl(photo){
  if(!photo)return'';
  if(typeof photo==='string')return normalizeSoopUrl(photo);
  if(Array.isArray(photo)){for(const x of photo){const u=soopPhotoUrl(x);if(u)return u}return''}
  if(typeof photo==='object'){
    for(const key of ['url','image','image_url','photo','src','path']){if(photo[key]){const u=soopPhotoUrl(photo[key]);if(u)return u}}
    for(const v of Object.values(photo)){const u=soopPhotoUrl(v);if(u)return u}
  }
  return'';
}
function soopApiUrl(post,page=1){return `https://bjapi.afreecatv.com/api/${encodeURIComponent(post.bjId)}/title/${encodeURIComponent(post.postNo)}/comment?page=${page}`}
function soopBoardApiUrl(post,page=1){return `https://bjapi.afreecatv.com/api/${encodeURIComponent(post.bjId)}/board?page=${page}`}
async function fetchSoopJson(url){
  try{
    const r=await fetch(url,{headers:{accept:'application/json'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json();
  }catch(directErr){
    try{
      const bridge=`http://127.0.0.1:8765/soop?url=${encodeURIComponent(url)}`;
      const r=await fetch(bridge);if(!r.ok)throw new Error(`Bridge HTTP ${r.status}`);return await r.json();
    }catch(bridgeErr){
      const e=new Error('SOOP 요청이 브라우저 보안(CORS) 또는 네트워크에서 차단되었습니다. ZIP의 Start_SOOP_Bridge.bat를 실행한 뒤 다시 동기화해 주세요.');e.direct=directErr;e.bridge=bridgeErr;throw e;
    }
  }
}
function cleanSoopPostTitle(raw){
  let t=String(raw||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  t=t.replace(/^\s*\[?공지\]?\s*/,'').trim();
  t=t.replace(/\s*[|\-]\s*SOOP\s*$/i,'').trim();
  t=t.replace(/\s*[|\-]\s*아프리카TV\s*$/i,'').trim();
  return t;
}
function titleFromSoopJson(root){
  const keys=['post_title','board_title','bbs_title','subject','title_name','title'];
  const seen=new Set();
  function walk(v,depth=0){
    if(depth>5||v===null||v===undefined)return'';
    if(typeof v==='object'){
      if(seen.has(v))return'';seen.add(v);
      if(!Array.isArray(v))for(const k of keys){if(typeof v[k]==='string'){const t=cleanSoopPostTitle(v[k]);if(t&&t.length>1&&!/^SOOP$/i.test(t))return t}}
      if(Array.isArray(v))return''; // 댓글 배열의 내용은 제목 후보로 보지 않음
      for(const [k,x] of Object.entries(v)){if(k==='data'&&Array.isArray(x))continue;const t=walk(x,depth+1);if(t)return t}
    }
    return'';
  }
  return walk(root);
}
function titleFromSoopHtml(html){
  const s=String(html||'');if(!s)return'';
  try{
    const d=new DOMParser().parseFromString(s,'text/html');
    const meta=d.querySelector('meta[property="og:title"],meta[name="twitter:title"]')?.getAttribute('content');
    const mt=cleanSoopPostTitle(meta);if(mt&&mt.length>1)return mt;
    const tt=cleanSoopPostTitle(d.querySelector('title')?.textContent);if(tt&&tt.length>1&&!/^SOOP$/i.test(tt))return tt;
  }catch(_){}
  const patterns=[/"post_title"\s*:\s*"((?:\\.|[^"\\])*)"/i,/"subject"\s*:\s*"((?:\\.|[^"\\])*)"/i,/"title"\s*:\s*"((?:\\.|[^"\\])*)"/i];
  for(const re of patterns){const m=s.match(re);if(!m)continue;try{const t=cleanSoopPostTitle(JSON.parse('"'+m[1].replace(/"/g,'\\"')+'"'));if(t&&t.length>1&&!/^SOOP$/i.test(t))return t}catch(_){}}
  return'';
}
function titleFromBoardResult(root,postNo){
  const target=String(postNo||'');let found='';
  function walk(v,depth=0){
    if(found||depth>5||v===null||v===undefined)return;
    if(Array.isArray(v)){for(const x of v)walk(x,depth+1);return}
    if(typeof v!=='object')return;
    const no=String(v.title_no??v.p_title_no??v.nTitleNo??v.post_no??v.postNo??'');
    if(no===target){found=titleFromSoopJson(v);if(found)return}
    for(const x of Object.values(v))walk(x,depth+1)
  }
  walk(root);return found;
}
async function fetchSoopPostTitle(post,firstJson){
  const fromJson=titleFromSoopJson(firstJson);if(fromJson)return fromJson;
  try{
    const rec=await fetchSoopBoardRecord(post);
    const fromBoard=rec?metaFromSoopRecord(rec).title:'';
    if(fromBoard)return fromBoard;
  }catch(err){console.warn('SOOP 제목 보조 조회 실패',err)}
  return String(post?.sourceTitle||'').trim();
}

function postById(id){return data.posts.find(p=>p.id===id)}
function setPostGlobalStatus(text,state=''){const el=document.getElementById('postSyncGlobalStatus');if(!el)return;el.textContent=text;el.className='posts-status-chip'+(state?' '+state:'')}
function applicantStatusLabel(s){return s==='selected'?'확정':s==='excluded'?'제외':'대기'}
function applicantDuplicates(post){const counts={};for(const c of post.comments||[]){if(c.userId)counts[c.userId]=(counts[c.userId]||0)+1}return counts}
function postApplicantGroupsByUser(post){
  const map=new Map();
  for(const c of post.comments||[]){const key=String(c.userId||'').trim().toLowerCase()||soopStationKey(c.stationUrl);if(!key)continue;if(!map.has(key))map.set(key,[]);map.get(key).push(c)}
  return map;
}
function aggregateApplicantStatus(comments){if(comments.some(c=>c.status==='selected'))return'selected';if(comments.length&&comments.every(c=>c.status==='excluded'))return'excluded';return'pending'}
function syncPostContactApplicationHistories(post){
  if(!post)return 0;const groups=postApplicantGroupsByUser(post);let matched=0;
  for(const c of data.contacts||[]){
    const key=soopStationKey(c.stationUrl);if(!key)continue;const comments=groups.get(key);if(!comments?.length)continue;matched++;
    if(!Array.isArray(c.applicationHistory))c.applicationHistory=[];
    const dates=comments.map(x=>x.regDate).filter(Boolean).sort(),latest=[...comments].sort((a,b)=>String(b.regDate||'').localeCompare(String(a.regDate||'')))[0]||comments[0];
    let rec=c.applicationHistory.find(a=>a.postId===post.id || (a.postNo===post.postNo&&a.postUrl===post.url));
    if(!rec){rec={id:crypto.randomUUID(),postId:post.id,postNo:post.postNo,postTitle:post.name,postUrl:post.url,soopUserId:key,firstAppliedAt:dates[0]||'',lastAppliedAt:dates.at(-1)||'',commentCount:comments.length,latestComment:latest?.comment||'',status:aggregateApplicantStatus(comments),lastSyncedAt:post.lastSyncAt||new Date().toISOString()};c.applicationHistory.push(rec)}
    else Object.assign(rec,{postId:post.id,postNo:post.postNo,postTitle:post.name,postUrl:post.url,soopUserId:key,firstAppliedAt:rec.firstAppliedAt||dates[0]||'',lastAppliedAt:dates.at(-1)||rec.lastAppliedAt||'',commentCount:comments.length,latestComment:latest?.comment||rec.latestComment||'',status:aggregateApplicantStatus(comments),lastSyncedAt:post.lastSyncAt||new Date().toISOString()});
  }
  return matched;
}
function syncAllPostContactApplicationHistories(){let n=0;for(const p of data.posts||[])n+=syncPostContactApplicationHistories(p);return n}
window.__syncPostContactApplicationHistories=syncPostContactApplicationHistories;
async function syncSoopPost(id,{quiet=false}={}){
  const post=postById(id);if(!post)return;
  setPostGlobalStatus('게시글 · 댓글 동기화 중','syncing');post.lastError='';renderPosts();
  try{
    const first=await fetchSoopJson(soopApiUrl(post,1));
    const sourceTitle=await fetchSoopPostTitle(post,first);
    if(sourceTitle){post.sourceTitle=sourceTitle;if(!post.nameManual)post.name=sourceTitle}
    const totalPages=Math.max(1,Math.min(100,Number(first?.meta?.last_page)||1));
    let raw=[...(Array.isArray(first?.data)?first.data:[])];
    for(let page=2;page<=totalPages;page++){
      setPostGlobalStatus(`댓글 동기화 ${page} / ${totalPages}`,'syncing');
      const j=await fetchSoopJson(soopApiUrl(post,page));if(Array.isArray(j?.data))raw.push(...j.data);
    }
    const prev=new Map((post.comments||[]).map(c=>[c.commentNo||`${c.userId}|${c.regDate}`,c]));
    post.comments=raw.map(c=>{
      const key=String(c.p_comment_no||`${c.user_id||''}|${c.reg_date||''}`),old=prev.get(key),userId=String(c.user_id||'');
      return {id:old?.id||crypto.randomUUID(),commentNo:String(c.p_comment_no||''),userId,name:String(c.user_nick||c.user_id||'신청자'),profileImage:normalizeSoopUrl(c.profile_image||''),stationUrl:soopUserStationUrl(userId),comment:String(c.comment||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,''),regDate:String(c.reg_date||''),photoUrl:soopPhotoUrl(c.photo),status:old?.status||'pending'};
    });
    post.lastSyncAt=new Date().toISOString();post.lastError='';syncPostContactApplicationHistories(post);data.version=52;saveData('SOOP 게시글 · 댓글 동기화');setPostGlobalStatus(`${post.comments.length}개 댓글 동기화 완료`,'ok');if(!quiet)toast('게시글',`${post.name} · ${post.comments.length}개의 댓글을 불러왔습니다`);
  }catch(err){post.lastError=String(err?.message||err);saveData('SOOP 댓글 동기화 오류');setPostGlobalStatus('댓글 동기화 실패','error');if(!quiet)toast('게시글',post.lastError)}
  renderPosts();
}
window.selectPost=id=>{activePostId=id;renderPosts()};
window.addSoopPostFromUrl=async()=>{
  const input=document.getElementById('postUrlInput'),parsed=parseSoopPostUrl(input?.value);if(!parsed)return toast('게시글','SOOP 게시글 URL 형식을 확인해 주세요');
  let post=data.posts.find(p=>p.bjId===parsed.bjId&&p.postNo===parsed.postNo);
  if(!post){post={id:crypto.randomUUID(),url:parsed.url,bjId:parsed.bjId,postNo:parsed.postNo,name:`게시글 ${parsed.postNo}`,sourceTitle:'',nameManual:false,createdAt:new Date().toISOString(),lastSyncAt:'',lastError:'',comments:[]};data.posts.unshift(post);saveData('게시글 등록')}
  activePostId=post.id;if(input)input.value='';renderPosts();await syncSoopPost(post.id);
};
window.deletePost=id=>{const p=postById(id);if(!p)return;if(!confirm(`'${p.name}' 게시글과 가져온 신청자 정보를 삭제하시겠습니까?\n연락처의 신청 기록은 과거 기록으로 유지됩니다.`))return;data.posts=data.posts.filter(x=>x.id!==id);if(activePostId===id)activePostId=data.posts[0]?.id||'';saveData('게시글 삭제');renderPosts()};
window.updatePostApplicantStatus=(postId,commentId,status)=>{const p=postById(postId),c=p?.comments.find(x=>x.id===commentId);if(!c)return;c.status=['pending','selected','excluded'].includes(status)?status:'pending';syncPostContactApplicationHistories(p);saveData('게시글 신청자 상태 변경');renderPosts()};
window.openMatchedPostContact=id=>openContact(id);
window.addPostApplicantToContacts=(postId,commentId)=>{
  const p=postById(postId),c=p?.comments.find(x=>x.id===commentId);if(!c)return;const matched=findContactForSoopApplicant(c);if(matched)return openContact(matched.id);
  const sameName=data.contacts.find(x=>normalizeContactName(x.name)===normalizeContactName(c.name));if(sameName&&soopStationKey(sameName.stationUrl)!==String(c.userId||'').toLowerCase())return toast('연락처',`같은 표시 이름 '${c.name}'이 있지만 방송국 주소가 일치하지 않습니다. 연락처에서 먼저 확인해 주세요.`);
  const item={id:crypto.randomUUID(),name:c.name,image:c.profileImage||'',labels:[],stationUrl:c.stationUrl||soopUserStationUrl(c.userId),notes:c.userId?`SOOP ID: ${c.userId}`:'',applicationHistory:[],pendingSetup:false};data.contacts.push(item);syncPostContactApplicationHistories(p);saveData('게시글 신청자를 연락처에 추가');renderContactFilters();renderPosts();toast('연락처',`${c.name}을(를) 연락처에 추가하고 신청 기록을 연결했습니다`)
};
function postApplicantCardHTML(post,c,dups){
  const matched=findContactForSoopApplicant(c),station=c.stationUrl||soopUserStationUrl(c.userId),avatar=c.profileImage?`<img class="post-applicant-avatar" src="${esc(c.profileImage)}" loading="lazy">`:`<div class="post-applicant-avatar">${esc(initials(c.name))}</div>`;
  return `<div class="post-applicant-card ${c.status}" data-comment-id="${c.id}"><div class="post-applicant-top">${station?`<a class="post-applicant-avatar-link" href="${esc(station)}" target="_blank" rel="noopener noreferrer" title="${esc(c.name)} 방송국 열기">${avatar}</a>`:avatar}<div style="min-width:0"><div class="post-applicant-name">${esc(c.name)}${dups[c.userId]>1?' <span class="chip" style="font-size:7px">중복 댓글</span>':''}</div><div class="post-applicant-id">${esc(c.userId||'ID 없음')}</div>${matched?`<div class="post-contact-match">연락처 연결됨 · 신청 기록 자동 저장</div>`:''}</div><select class="post-status-select" onchange="updatePostApplicantStatus('${post.id}','${c.id}',this.value)"><option value="pending" ${c.status==='pending'?'selected':''}>대기</option><option value="selected" ${c.status==='selected'?'selected':''}>확정</option><option value="excluded" ${c.status==='excluded'?'selected':''}>제외</option></select></div><div class="post-applicant-comment">${esc(c.comment||'(내용 없음)')}</div>${c.photoUrl?`<img class="post-applicant-photo" src="${esc(c.photoUrl)}" loading="lazy">`:''}<div class="post-applicant-foot"><div class="post-applicant-date">${esc(c.regDate||'작성 시간 없음')}</div><button class="secondary post-contact-btn" onclick="${matched?`openMatchedPostContact('${matched.id}')`:`addPostApplicantToContacts('${post.id}','${c.id}')`}">${matched?'연락처 보기':'연락처 추가'}</button></div></div>`
}
function uniquePostGameApplicants(post){
  const map=new Map();for(const c of post.comments||[]){if(c.status==='excluded')continue;const key=String(c.userId||'').trim().toLowerCase()||`name:${normalizeContactName(c.name)}`;const prev=map.get(key);if(!prev||String(c.regDate||'')>String(prev.regDate||''))map.set(key,c)}
  return [...map.values()].map(c=>{const matched=findContactForSoopApplicant(c);return{id:crypto.randomUUID(),contactId:matched?.id||'',name:matched?.name||c.name,image:matched?.image||c.profileImage||'',sourceUserId:c.userId||''}})
}
const POST_GAME_DEFS={ladder:{title:'사다리타기',tab:'gameLadder',cap:12,desc:'자동 시작으로 순서와 사다리를 섞은 뒤 왼쪽부터 결과를 확인합니다.'},rps:{title:'가위바위보',tab:'gameRps',cap:150,desc:'많은 신청자를 한 번에 넣고 마지막 한 명이 남을 때까지 라운드를 진행합니다.'},pachinko:{title:'경마',tab:'gamePachinko',cap:10,desc:'실시간 순위가 바뀌는 레이스로 최종 전원 순위를 확인합니다.'},multiDraw:{title:'Gacha 뽑기',tab:'gameMultiDraw',cap:150,desc:'여러 명 중 필요한 인원만 한 명씩 중복 없이 카드 오픈 연출로 선발합니다.'}};
window.openPostGamePicker=()=>{
  const p=postById(activePostId);if(!p)return;const arr=uniquePostGameApplicants(p),modal=document.getElementById('postGamePickerModal');
  document.getElementById('postGamePickerSubtitle').textContent=`${p.name} · 게임 참가 대상 ${arr.length}명 (제외 상태 및 중복 작성자 제외)`;
  const grid=document.getElementById('postGamePickerGrid');if(grid)grid.innerHTML=Object.entries(POST_GAME_DEFS).map(([key,g])=>{const tooMany=arr.length>g.cap,disabled=arr.length<2||tooMany;return `<button class="post-game-card" ${disabled?'disabled':''} onclick="launchPostApplicantsIntoGame('${key}')"><div class="post-game-card-kicker">MINI GAME</div><div class="post-game-card-title">${g.title}</div><div class="post-game-card-desc">${g.desc}</div><div class="post-game-card-cap">${tooMany?`현재 ${arr.length}명 · 최대 ${g.cap}명이라 사용 불가`:`${arr.length}명 준비 · 최대 ${g.cap}명`}</div></button>`}).join('');
  modal?.classList.add('open');
};
window.launchPostApplicantsIntoGame=game=>{
  const p=postById(activePostId),g=POST_GAME_DEFS[game];if(!p||!g)return;const arr=uniquePostGameApplicants(p);if(arr.length<2)return toast('랜덤선별','게임 참가 대상이 2명 이상 필요합니다');if(arr.length>g.cap)return toast(g.title,`현재 ${arr.length}명입니다. 이 게임은 최대 ${g.cap}명까지 지원합니다`);
  const players=arr.map(x=>({id:crypto.randomUUID(),contactId:x.contactId||'',name:x.name,image:x.image||''}));
  if(game==='ladder'){data.miniGames.ladder.players=players;data.miniGames.ladder.prizes=[];ensureLadderPrizeCount();miniGameRuntime.ladder={rungs:[],generated:false,animating:false,activePlayer:-1,autoRunning:false,autoResultNames:[]}}
  if(game==='rps'){data.miniGames.rps.players=players;resetRpsTournamentState(false)}
  if(game==='pachinko'){data.miniGames.pachinko.players=players;resetPachinkoState(false)}
  normalizeMiniGameData();saveData(`게시글 신청자 → ${g.title}`);document.getElementById('postGamePickerModal')?.classList.remove('open');
  const tr=document.getElementById('postGameTransition');document.getElementById('postGameTransitionTitle').textContent=g.title;document.getElementById('postGameTransitionMeta').textContent=`${arr.length}명의 신청자를 참가자로 등록했습니다`;tr?.classList.add('open');tr?.setAttribute('aria-hidden','false');
  setTimeout(()=>{setTab(g.tab);setTimeout(()=>{tr?.classList.remove('open');tr?.setAttribute('aria-hidden','true')},320)},650)
};
function renderPosts(){
  if(!Array.isArray(data.posts))data.posts=[];if(activePostId&&!postById(activePostId))activePostId='';if(!activePostId&&data.posts.length)activePostId=data.posts[0].id;
  const count=document.getElementById('postSavedCount');if(count)count.textContent=`${data.posts.length}개`;
  const list=document.getElementById('postSavedList');if(list)list.innerHTML=data.posts.map(p=>`<div class="post-saved-item ${p.id===activePostId?'active':''}" onclick="selectPost('${p.id}')"><div class="post-saved-title">${esc(p.name)}</div><div class="post-saved-meta"><span>${p.comments?.length||0}개 댓글</span><span>${p.lastSyncAt?new Date(p.lastSyncAt).toLocaleString('ko-KR'):'미동기화'}</span></div></div>`).join('')||'<div class="empty small">등록된 게시글이 없습니다</div>';
  const p=postById(activePostId),empty=document.getElementById('postEmptyState'),detail=document.getElementById('postDetailView');if(empty)empty.style.display=p?'none':'';if(detail)detail.style.display=p?'':'none';if(!p)return;
  const title=document.getElementById('postDisplayName');if(title&&document.activeElement!==title)title.value=p.name;const meta=document.getElementById('postDetailMeta');if(meta)meta.textContent=`${p.bjId} · 글 ${p.postNo} · ${p.lastSyncAt?'마지막 동기화 '+new Date(p.lastSyncAt).toLocaleString('ko-KR'):'아직 동기화하지 않음'}${p.sourceTitle&&p.nameManual?` · SOOP 원문 제목: ${p.sourceTitle}`:''}${p.lastError?' · 최근 오류 있음':''}`;
  const open=document.getElementById('postOpenBtn');if(open)open.onclick=()=>window.open(p.url,'_blank','noopener');const sync=document.getElementById('postSyncBtn');if(sync)sync.onclick=()=>syncSoopPost(p.id);const del=document.getElementById('postDeleteBtn');if(del)del.onclick=()=>deletePost(p.id);const game=document.getElementById('postRandomGameBtn');if(game)game.onclick=openPostGamePicker;
  const q=(document.getElementById('postApplicantSearch')?.value||'').trim().toLowerCase(),sf=document.getElementById('postApplicantStatusFilter')?.value||'';let arr=p.comments||[];if(q)arr=arr.filter(c=>(`${c.name} ${c.userId} ${c.comment}`).toLowerCase().includes(q));if(sf)arr=arr.filter(c=>c.status===sf);const unique=new Set((p.comments||[]).map(c=>c.userId).filter(Boolean));const selected=(p.comments||[]).filter(c=>c.status==='selected').length,excluded=(p.comments||[]).filter(c=>c.status==='excluded').length,matched=uniquePostGameApplicants(p).filter(c=>c.contactId).length;const summary=document.getElementById('postApplicantSummary');if(summary)summary.innerHTML=`<span class="chip">댓글 ${p.comments.length}개</span><span class="chip">고유 작성자 ${unique.size}명</span><span class="chip" style="border-color:#38b77a">확정 ${selected}명</span><span class="chip">제외 ${excluded}명</span><span class="chip" style="border-color:#2ea676">연락처 연결 ${matched}명</span>`;const grid=document.getElementById('postApplicantGrid'),dups=applicantDuplicates(p);if(grid)grid.innerHTML=arr.map(c=>postApplicantCardHTML(p,c,dups)).join('')||'<div class="empty" style="grid-column:1/-1">조건에 맞는 신청자가 없습니다</div>';
}
document.getElementById('postUrlAddBtn')?.addEventListener('click',addSoopPostFromUrl);document.getElementById('postUrlInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addSoopPostFromUrl()}});document.getElementById('postDisplayName')?.addEventListener('change',e=>{const p=postById(activePostId);if(!p)return;p.name=e.target.value.trim()||p.sourceTitle||`게시글 ${p.postNo}`;p.nameManual=true;syncPostContactApplicationHistories(p);saveData('게시글 이름 변경');renderPosts()});document.getElementById('postApplicantSearch')?.addEventListener('input',renderPosts);document.getElementById('postApplicantStatusFilter')?.addEventListener('change',renderPosts);

// v4.1 recent collaboration default sort.
const sniperSortV41=document.getElementById('sniperSort');if(sniperSortV41)sniperSortV41.value='recentFirst';



/* =========================================================
   v4.3 - SOOP source/UP, contact completeness, modal fix
   ========================================================= */
let postDetailMode='applicants';
window.setPostDetailMode=mode=>{
  postDetailMode=mode==='source'?'source':'applicants';
  document.getElementById('postApplicantsTab')?.classList.toggle('active',postDetailMode==='applicants');
  document.getElementById('postSourceTab')?.classList.toggle('active',postDetailMode==='source');
  document.getElementById('postApplicantsPanel')?.classList.toggle('active',postDetailMode==='applicants');
  document.getElementById('postSourcePanel')?.classList.toggle('active',postDetailMode==='source');
  if(postDetailMode==='source'){const p=postById(activePostId);if(p)renderPostSourceContent(p)}
};

function contactNeedsCompletion(c){return !(c?.labels||[]).length || !String(c?.stationUrl||'').trim()}
function renderIncompleteContacts(){
  const q=(document.getElementById('contactSearch')?.value||'').trim().toLowerCase(),sort=document.getElementById('contactSort')?.value||'nameAsc';
  let arr=(data.contacts||[]).filter(c=>contactMatches(c,q)&&contactNeedsCompletion(c));arr=sortContacts(arr,sort);
  const allCount=(data.contacts||[]).filter(contactNeedsCompletion).length,btn=document.getElementById('incompleteTabBtn');if(btn)btn.textContent=`정보 미완성${allCount?` ${allCount}`:''}`;
  const box=document.getElementById('incompleteContacts');if(!box)return;
  box.innerHTML=`<div class="space" style="margin-bottom:12px"><div><h3 style="margin:0">정보 미완성 연락처</h3><div class="muted small" style="margin-top:4px">태그 또는 방송국 URL이 비어 있는 연락처만 표시합니다.</div></div><span class="chip">${arr.length}명</span></div><div class="contact-incomplete-grid">${arr.map(c=>`<div class="contact-incomplete-card" onclick="openContact('${c.id}')"><div class="row">${c.image?`<img class="avatar" src="${c.image}" loading="lazy">`:`<div class="avatar" style="display:grid;place-items:center;font-weight:850">${esc(initials(c.name))}</div>`}<div style="min-width:0"><div class="event-title">${esc(c.name)}</div><div class="muted small">클릭해서 정보를 보완하세요</div></div></div><div class="contact-missing-badges">${!(c.labels||[]).length?'<span class="contact-missing-badge">태그 없음</span>':''}${!String(c.stationUrl||'').trim()?'<span class="contact-missing-badge">URL 없음</span>':''}</div></div>`).join('')||'<div class="empty">태그와 URL이 모두 입력되어 있습니다</div>'}</div>`;
}
function renderFavoriteContactsV574(){
  const q=(document.getElementById('contactSearch')?.value||'').trim().toLowerCase(),sort=document.getElementById('contactSort')?.value||'nameAsc';
  let arr=(data.contacts||[]).filter(c=>Boolean(c.favorite)&&contactMatches(c,q));arr=sortContacts(arr,sort);
  const allCount=(data.contacts||[]).filter(c=>Boolean(c.favorite)).length,btn=document.getElementById('favoriteContactTabBtn');if(btn)btn.textContent=`즐겨찾기${allCount?` ${allCount}`:''}`;
  const box=document.getElementById('favoriteContacts');if(!box)return;
  box.innerHTML=`<div class="space" style="margin-bottom:12px"><div><h3 style="margin:0">즐겨찾기 연락처</h3><div class="muted small" style="margin-top:4px">별표를 켠 연락처를 한곳에서 확인합니다.</div></div><span class="chip">${arr.length}명</span></div><div class="contact-maintenance-grid">${arr.map(c=>{const av=c.image?`<img class="contact-maintenance-avatar" src="${c.image}" loading="lazy">`:`<div class="contact-maintenance-avatar">${esc(initials(c.name))}</div>`;const tags=(c.labels||[]).slice(0,4).map(x=>`<span class="chip">${esc(x)}</span>`).join('');return `<div class="contact-maintenance-card contact-favorite-card-v574" onclick="openContact('${c.id}')">${av}<div style="min-width:0"><div class="contact-maintenance-title">★ ${esc(c.name)}</div><div class="contact-maintenance-desc">${c.stationUrl?esc(c.stationUrl):'방송국 URL 없음'}</div><div class="contact-favorite-tags-v574">${tags}</div></div></div>`}).join('')||'<div class="empty" style="grid-column:1/-1">아직 즐겨찾기한 연락처가 없습니다. 연락처 상세의 별표를 눌러 추가해 보세요.</div>'}</div>`;
}
window.renderFavoriteContactsV574=renderFavoriteContactsV574;
function setContactView(view){
  contactView=['cards','pending','incomplete','favorite'].includes(view)?view:'cards';
  document.querySelectorAll('.contact-view').forEach(b=>b.classList.toggle('active',b.dataset.contactView===contactView));
  const grid=document.getElementById('contactGrid'),pending=document.getElementById('pendingContacts'),incomplete=document.getElementById('incompleteContacts'),favorite=document.getElementById('favoriteContacts');
  if(grid)grid.style.display=contactView==='cards'?'grid':'none';
  if(pending)pending.style.display=contactView==='pending'?'block':'none';
  if(incomplete)incomplete.style.display=contactView==='incomplete'?'block':'none';
  if(favorite)favorite.style.display=contactView==='favorite'?'block':'none';
  const tagPanel=document.querySelector('.contact-tag-panel'),board=document.querySelector('#contacts .contact-board-layout');
  if(tagPanel)tagPanel.style.display=contactView==='cards'?'block':'none';
  board?.classList.toggle('maintenance-mode',contactView!=='cards');
  if(contactView==='pending')renderPendingContacts();else if(contactView==='incomplete')renderIncompleteContacts();else if(contactView==='favorite')renderFavoriteContactsV574();else renderContacts();
}
window.setContactView=setContactView;
function refreshContactViews(){renderContacts();renderSniperList();renderTargetList();renderPendingContacts();renderIncompleteContacts();renderFavoriteContactsV574();renderContactTagSidebar()}

function soopApiUrl(post,page=1){return `https://chapi.sooplive.co.kr/api/${encodeURIComponent(post.bjId)}/title/${encodeURIComponent(post.postNo)}/comment?page=${page}&orderby=reg_date`}
function soopBoardApiUrl(post,page=1){return `https://chapi.sooplive.co.kr/api/${encodeURIComponent(post.bjId)}/board/?per_page=50&start_date=&end_date=&field=title,contents,user_nick,user_id,hashtags&keyword=&type=all&order_by=reg_date&board_number=&page=${page}`}
function boardRecordPostNo(v){return String(v?.title_no??v?.p_title_no??v?.nTitleNo??v?.post_no??v?.postNo??v?.id??'')}
function boardRecordFromResult(root,postNo){const target=String(postNo||'');let found=null;function walk(v,depth=0){if(found||depth>6||v==null)return;if(Array.isArray(v)){for(const x of v)walk(x,depth+1);return}if(typeof v!=='object')return;if(boardRecordPostNo(v)===target){found=v;return}for(const x of Object.values(v))walk(x,depth+1)}walk(root);return found}
function soopPlainText(raw){
  const s=String(raw||'');if(!s)return'';try{const d=new DOMParser().parseFromString(s.replace(/<br\s*\/?\s*>/gi,'\n'),'text/html');return String(d.body?.textContent||'').replace(/\u00a0/g,' ').replace(/\n\s*\n\s*\n+/g,'\n\n').trim()}catch(_){return s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
}
function soopPhotosFromHtml(raw){const s=String(raw||''),out=[];try{const d=new DOMParser().parseFromString(s,'text/html');for(const img of d.querySelectorAll('img[src]')){const u=normalizeSoopUrl(img.getAttribute('src')||'');if(u&&!out.includes(u))out.push(u)}}catch(_){}return out.slice(0,30)}
function metaFromSoopRecord(r){if(!r||typeof r!=='object')return{};const rawContent=r.contents??r.content??r.board_content??r.post_content??r.memo??'';const photos=[];const photoCandidates=[r.photos,r.photo,r.images,r.attachments,r.files];for(const x of photoCandidates){if(Array.isArray(x))for(const z of x){const u=normalizeSoopUrl(typeof z==='string'?z:(z?.url||z?.image_url||z?.file_url||z?.src||''));if(u&&!photos.includes(u))photos.push(u)}}for(const u of soopPhotosFromHtml(rawContent))if(!photos.includes(u))photos.push(u);return{title:cleanSoopPostTitle(r.title_name??r.title??r.subject??r.post_title??''),content:soopPlainText(rawContent),author:String(r.user_nick??r.writer_nick??r.nick??''),authorId:String(r.user_id??r.writer_id??''),regDate:String(r.reg_date??r.write_date??r.created_at??''),viewCount:Math.max(0,Number(r.view_cnt??r.read_cnt??r.hit??r.view_count??0)||0),photos:photos.slice(0,30)}}
async function fetchSoopBoardRecord(post){
  const target=Number(post.postNo)||0;for(let page=1;page<=120;page++){const j=await fetchSoopJson(soopBoardApiUrl(post,page));const rec=boardRecordFromResult(j,post.postNo);if(rec)return rec;const rows=Array.isArray(j?.data)?j.data:[];if(!rows.length)break;const nums=rows.map(boardRecordPostNo).map(Number).filter(Number.isFinite);if(target&&nums.length&&Math.min(...nums)<target)break;const last=Math.max(1,Number(j?.meta?.last_page)||1);if(page>=last)break}return null
}
function metaFromBridgeJson(j){return{title:cleanSoopPostTitle(j?.title),content:String(j?.content||''),author:String(j?.author||''),authorId:String(j?.authorId||''),regDate:String(j?.regDate||''),viewCount:Math.max(0,Number(j?.viewCount)||0),photos:Array.isArray(j?.photos)?j.photos.filter(Boolean).map(String):[]}}
async function fetchSoopPostMetaV43(post,firstJson){
  // Compatibility shim. Source body, author metadata, view count, and images are intentionally not synchronized.
  return {title:await fetchSoopPostTitle(post,firstJson)};
}

function extractSoopUpCount(c){
  const keys=['up_count','up_cnt','comment_up_count','comment_up_cnt','like_count','like_cnt','recommend_count','recommend_cnt','good_count','good_cnt','vote_count','vote_cnt','up','likes','like'];
  for(const k of keys){const v=c?.[k];if(typeof v==='number'&&Number.isFinite(v))return Math.max(0,v);if(typeof v==='string'&&/^\d+$/.test(v.trim()))return Number(v)}
  for(const k of ['reaction','recommend','like_info','up_info']){const v=c?.[k];if(v&&typeof v==='object'){for(const kk of ['count','cnt','total','up_count','like_count']){const n=Number(v[kk]);if(Number.isFinite(n)&&n>=0)return n}}}
  return 0
}
function applicantStatusLabel(s){return s==='selected'?'확정':(s==='nextchance'||s==='excluded')?'다음기회에':'대기'}
function applicationStatusText(s){return applicantStatusLabel(s)}
function aggregateApplicantStatus(comments){if(comments.some(c=>c.status==='selected'))return'selected';if(comments.length&&comments.every(c=>c.status==='nextchance'||c.status==='excluded'))return'nextchance';return'pending'}
window.updatePostApplicantStatus=(postId,commentId,status)=>{const p=postById(postId),c=p?.comments.find(x=>x.id===commentId);if(!c)return;c.status=status==='excluded'?'nextchance':(['pending','selected','nextchance'].includes(status)?status:'pending');syncPostContactApplicationHistories(p);saveData('게시글 신청자 상태 변경');renderPosts()};
window.setPostApplicantDecision=(postId,commentId,status)=>{const p=postById(postId),c=p?.comments.find(x=>x.id===commentId);if(!c)return;const next=(c.status===status)?'pending':status;updatePostApplicantStatus(postId,commentId,next)};

function renderPostSourceContent(p){
  const box=document.getElementById('postSourceContent');if(!box)return;const title=p.sourceTitle||p.name||`게시글 ${p.postNo}`,body=String(p.sourceContent||'').trim(),photos=Array.isArray(p.sourcePhotos)?p.sourcePhotos:[];
  box.innerHTML=`<div class="post-source-title">${esc(title)}</div><div class="post-source-meta">${p.sourceAuthor?`<span>작성자 ${esc(p.sourceAuthor)}</span>`:''}${p.sourceRegDate?`<span>${esc(p.sourceRegDate)}</span>`:''}${p.sourceViewCount?`<span>조회 ${Number(p.sourceViewCount).toLocaleString('ko-KR')}</span>`:''}<span>글 ${esc(p.postNo)}</span></div>${body?`<div class="post-source-body">${esc(body)}</div>`:'<div class="post-source-empty">원문 본문이 없거나 SOOP에서 본문 텍스트를 제공하지 않았습니다. 상단의 원문 열기 버튼은 그대로 사용할 수 있습니다.</div>'}${photos.length?`<div class="post-source-photos">${photos.map(u=>`<img class="post-source-photo" src="${esc(u)}" loading="lazy">`).join('')}</div>`:''}`
}

async function syncSoopPost(id,{quiet=false}={}){
  const post=postById(id);if(!post)return;setPostGlobalStatus('게시글 · 댓글 동기화 중','syncing');post.lastError='';renderPosts();
  try{
    const first=await fetchSoopJson(soopApiUrl(post,1));const meta=await fetchSoopPostMetaV43(post,first);
    if(meta.title){post.sourceTitle=meta.title;const placeholder=/^게시글\s+\d+$/u.test(String(post.name||'').trim());if(!post.nameManual||placeholder){post.name=meta.title;if(placeholder)post.nameManual=false}}if(typeof stripLegacyPostSourceV510==='function')stripLegacyPostSourceV510(post);
    const totalPages=Math.max(1,Math.min(100,Number(first?.meta?.last_page)||1));let raw=[...(Array.isArray(first?.data)?first.data:[])];for(let page=2;page<=totalPages;page++){setPostGlobalStatus(`댓글 동기화 ${page} / ${totalPages}`,'syncing');const j=await fetchSoopJson(soopApiUrl(post,page));if(Array.isArray(j?.data))raw.push(...j.data)}
    const prev=new Map((post.comments||[]).map(c=>[c.commentNo||`${c.userId}|${c.regDate}`,c]));post.comments=raw.map(c=>{const key=String(c.p_comment_no||`${c.user_id||''}|${c.reg_date||''}`),old=prev.get(key),userId=String(c.user_id||'');return{id:old?.id||crypto.randomUUID(),commentNo:String(c.p_comment_no||''),userId,name:String(c.user_nick||c.user_id||'신청자'),profileImage:normalizeSoopUrl(c.profile_image||''),stationUrl:soopUserStationUrl(userId),comment:String(c.comment||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,''),regDate:String(c.reg_date||''),photoUrl:soopPhotoUrl(c.photo),upCount:extractSoopUpCount(c),status:old?.status==='excluded'?'nextchance':(old?.status||'pending')}});
    post.lastSyncAt=new Date().toISOString();post.lastError='';syncPostContactApplicationHistories(post);data.version=52;saveData('SOOP 게시글 · 댓글 동기화');setPostGlobalStatus(`${post.comments.length}개 댓글 동기화 완료`,'ok');if(!quiet)toast('게시글',`${post.name} · ${post.comments.length}개의 댓글을 불러왔습니다`)
  }catch(err){post.lastError=String(err?.message||err);saveData('SOOP 댓글 동기화 오류');setPostGlobalStatus('댓글 동기화 실패','error');if(!quiet)toast('게시글',post.lastError)}renderPosts()
}
window.syncSoopPost=syncSoopPost;

function postApplicantCardHTML(post,c,dups){
  const matched=findContactForSoopApplicant(c),station=c.stationUrl||soopUserStationUrl(c.userId),avatar=c.profileImage?`<img class="post-applicant-avatar" src="${esc(c.profileImage)}" loading="lazy">`:`<div class="post-applicant-avatar">${esc(initials(c.name))}</div>`,st=c.status==='excluded'?'nextchance':(c.status||'pending');
  return `<div class="post-applicant-card ${st} ${matched?'':'new-applicant'}" data-comment-id="${c.id}">${matched?'':'<span class="post-new-badge">신규</span>'}<div class="post-applicant-top">${station?`<a class="post-applicant-avatar-link" href="${esc(station)}" target="_blank" rel="noopener noreferrer" title="${esc(c.name)} 방송국 열기">${avatar}</a>`:avatar}<div style="min-width:0"><div class="post-applicant-name">${esc(c.name)}${dups[c.userId]>1?' <span class="chip" style="font-size:7px">중복 댓글</span>':''}</div><div class="post-applicant-id">${esc(c.userId||'ID 없음')}</div>${matched?'<div class="post-contact-match">연락처 연결됨 · 신청 기록 자동 저장</div>':'<div class="post-applicant-id" style="color:#61baff;margin-top:3px">연락처에서 찾을 수 없음</div>'}</div><div class="post-status-block"><span class="post-status-badge ${st}">${applicantStatusLabel(st)}</span><div class="post-decision-row"><button type="button" class="post-decision-btn selected ${st==='selected'?'active':''}" onclick="setPostApplicantDecision('${post.id}','${c.id}','selected')">확정</button><button type="button" class="post-decision-btn nextchance ${st==='nextchance'?'active':''}" onclick="setPostApplicantDecision('${post.id}','${c.id}','nextchance')">다음기회에</button></div></div></div><div class="post-applicant-comment">${esc(c.comment||'(내용 없음)')}</div>${c.photoUrl?`<img class="post-applicant-photo" src="${esc(c.photoUrl)}" loading="lazy">`:''}<div class="post-applicant-foot"><div class="post-applicant-foot-left"><div class="post-applicant-date">${esc(c.regDate||'작성 시간 없음')}</div><span class="post-up-count">♡ UP ${Math.max(0,Number(c.upCount)||0)}</span></div><button class="secondary post-contact-btn" onclick="${matched?`openMatchedPostContact('${matched.id}')`:`addPostApplicantToContacts('${post.id}','${c.id}')`}">${matched?'연락처 보기':'연락처 추가'}</button></div></div>`
}
function uniquePostGameApplicants(post){const map=new Map();for(const c of post.comments||[]){if(c.status==='nextchance'||c.status==='excluded')continue;const key=String(c.userId||'').trim().toLowerCase()||`name:${normalizeContactName(c.name)}`;const prev=map.get(key);if(!prev||String(c.regDate||'')>String(prev.regDate||''))map.set(key,c)}return[...map.values()].map(c=>{const matched=findContactForSoopApplicant(c);return{id:crypto.randomUUID(),contactId:matched?.id||'',name:matched?.name||c.name,image:matched?.image||c.profileImage||'',sourceUserId:c.userId||''}})}

function renderPosts(){
  if(!Array.isArray(data.posts))data.posts=[];if(activePostId&&!postById(activePostId))activePostId='';if(!activePostId&&data.posts.length)activePostId=data.posts[0].id;
  const count=document.getElementById('postSavedCount');if(count)count.textContent=`${data.posts.length}개`;const list=document.getElementById('postSavedList');if(list)list.innerHTML=data.posts.map(p=>`<div class="post-saved-item ${p.id===activePostId?'active':''}" onclick="selectPost('${p.id}')"><div class="post-saved-title">${esc(p.name)}</div><div class="post-saved-meta"><span>${p.comments?.length||0}개 댓글</span><span>${p.lastSyncAt?new Date(p.lastSyncAt).toLocaleString('ko-KR'):'미동기화'}</span></div></div>`).join('')||'<div class="empty small">등록된 게시글이 없습니다</div>';
  const p=postById(activePostId),empty=document.getElementById('postEmptyState'),detail=document.getElementById('postDetailView');if(empty)empty.style.display=p?'none':'';if(detail)detail.style.display=p?'':'none';if(!p)return;
  const title=document.getElementById('postDisplayName');if(title&&document.activeElement!==title)title.value=p.name;const meta=document.getElementById('postDetailMeta');if(meta)meta.textContent=`${p.bjId} · 글 ${p.postNo} · ${p.lastSyncAt?'마지막 동기화 '+new Date(p.lastSyncAt).toLocaleString('ko-KR'):'아직 동기화하지 않음'}${p.sourceTitle&&p.nameManual?` · SOOP 원문 제목: ${p.sourceTitle}`:''}${p.lastError?' · 최근 오류 있음':''}`;
  const open=document.getElementById('postOpenBtn');if(open)open.onclick=()=>window.open(p.url,'_blank','noopener');const sync=document.getElementById('postSyncBtn');if(sync)sync.onclick=()=>syncSoopPost(p.id);const del=document.getElementById('postDeleteBtn');if(del)del.onclick=()=>deletePost(p.id);const game=document.getElementById('postRandomGameBtn');if(game)game.onclick=openPostGamePicker;
  setPostDetailMode(postDetailMode);renderPostSourceContent(p);
  const q=(document.getElementById('postApplicantSearch')?.value||'').trim().toLowerCase(),sf=document.getElementById('postApplicantStatusFilter')?.value||'',sort=document.getElementById('postApplicantSort')?.value||'recent';let arr=[...(p.comments||[])];if(q)arr=arr.filter(c=>(`${c.name} ${c.userId} ${c.comment}`).toLowerCase().includes(q));if(sf)arr=arr.filter(c=>(c.status==='excluded'?'nextchance':c.status)===sf);
  if(sort==='upDesc')arr.sort((a,b)=>(Number(b.upCount)||0)-(Number(a.upCount)||0)||String(b.regDate||'').localeCompare(String(a.regDate||'')));else if(sort==='upAsc')arr.sort((a,b)=>(Number(a.upCount)||0)-(Number(b.upCount)||0)||String(b.regDate||'').localeCompare(String(a.regDate||'')));else if(sort==='oldest')arr.sort((a,b)=>String(a.regDate||'').localeCompare(String(b.regDate||'')));else if(sort==='name')arr.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ko'));else arr.sort((a,b)=>String(b.regDate||'').localeCompare(String(a.regDate||'')));
  const unique=new Set((p.comments||[]).map(c=>c.userId).filter(Boolean)),selected=(p.comments||[]).filter(c=>c.status==='selected').length,nextchance=(p.comments||[]).filter(c=>c.status==='nextchance'||c.status==='excluded').length,matchedCount=uniquePostGameApplicants(p).filter(c=>c.contactId).length,newCount=(p.comments||[]).filter(c=>!findContactForSoopApplicant(c)).length;const summary=document.getElementById('postApplicantSummary');if(summary)summary.innerHTML=`<span class="chip">댓글 ${p.comments.length}개</span><span class="chip">고유 작성자 ${unique.size}명</span><span class="chip" style="border-color:#38b77a">확정 ${selected}명</span><span class="chip">다음기회에 ${nextchance}명</span><span class="chip" style="border-color:#2ea676">연락처 연결 ${matchedCount}명</span>${newCount?`<span class="chip" style="border-color:#3aa9ff;color:#7ccaff">신규 ${newCount}개 댓글</span>`:''}`;const grid=document.getElementById('postApplicantGrid'),dups=applicantDuplicates(p);if(grid)grid.innerHTML=arr.map(c=>postApplicantCardHTML(p,c,dups)).join('')||'<div class="empty" style="grid-column:1/-1">조건에 맞는 신청자가 없습니다</div>';
}

// Rebind the new sort control after it exists in DOM.
document.getElementById('postApplicantSort')?.addEventListener('change',renderPosts);

// Game picker modal must not remain inside .main because modal-active disables pointer events on .main.
window.openPostGamePicker=()=>{
  const p=postById(activePostId);if(!p)return;const arr=uniquePostGameApplicants(p),modal=document.getElementById('postGamePickerModal');if(modal&&modal.parentElement!==document.body)document.body.appendChild(modal);
  document.getElementById('postGamePickerSubtitle').textContent=`${p.name} · 게임 참가 대상 ${arr.length}명 (다음기회에 상태 및 중복 작성자 제외)`;const grid=document.getElementById('postGamePickerGrid');if(grid)grid.innerHTML=Object.entries(POST_GAME_DEFS).map(([key,g])=>{const tooMany=arr.length>g.cap,disabled=arr.length<2||tooMany;return `<button class="post-game-card" ${disabled?'disabled':''} onclick="launchPostApplicantsIntoGame('${key}')"><div class="post-game-card-kicker">MINI GAME</div><div class="post-game-card-title">${g.title}</div><div class="post-game-card-desc">${g.desc}</div><div class="post-game-card-cap">${tooMany?`현재 ${arr.length}명 · 최대 ${g.cap}명이라 사용 불가`:`${arr.length}명 준비 · 최대 ${g.cap}명`}</div></button>`}).join('');modal?.classList.add('open');syncModalInteractionState()
};
function closePostGamePicker(){const m=document.getElementById('postGamePickerModal');if(m?.classList.contains('open')){m.classList.remove('open');syncModalInteractionState();return true}return false}
window.closePostGamePicker=closePostGamePicker;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('postGamePickerModal')?.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();closePostGamePicker()}},true);

// Keep completeness count current after every global render.
window.addEventListener('mawang:datachange',()=>{try{renderIncompleteContacts()}catch(_){}});



/* =========================================================
   v4.6 - ladder readability, contact detail, resolution presets
   ========================================================= */
let favoriteFolderFilter='all';
let favoriteDraggingEventId='';

function applyTextScale(value,writeData=true){
  const n=Math.max(85,Math.min(130,Number(value)||100));
  if(writeData)data.textScale=n;
  document.body.style.setProperty('--ui-text-scale',String(n/100));
  const slider=document.getElementById('textScaleSlider'),label=document.getElementById('textScaleValue'),sample=document.getElementById('textScalePreview');
  if(slider&&document.activeElement!==slider)slider.value=String(n);
  if(label)label.textContent=`${n}%`;
  if(sample)sample.style.fontSize=`${(16*n/100).toFixed(1)}px`;
}
window.applyTextScale=applyTextScale;
const textScaleSlider=document.getElementById('textScaleSlider');
if(textScaleSlider){
  textScaleSlider.oninput=e=>{applyTextScale(e.target.value,true);mwsSaveDevicePrefs(data)};
  textScaleSlider.onchange=()=>mwsSaveDevicePrefs(data);
}
applyTextScale(data.textScale??100,false);

function applyPostViewPrefs(){
  const mode=data.postViewMode==='list'?'list':'card',cols=Math.max(2,Math.min(5,Number(data.postCardColumns)||4));
  const grid=document.getElementById('postApplicantGrid');
  if(grid){grid.classList.toggle('view-card',mode==='card');grid.classList.toggle('view-list',mode==='list');grid.style.setProperty('--post-card-columns',String(cols));}
  document.getElementById('postCardViewBtn')?.classList.toggle('active',mode==='card');
  document.getElementById('postListViewBtn')?.classList.toggle('active',mode==='list');
  const select=document.getElementById('postCardColumns');if(select)select.value=String(cols);
  document.querySelector('.post-column-control')?.classList.toggle('disabled',mode==='list');
  const hint=document.getElementById('postViewHint');if(hint)hint.textContent=mode==='card'?`카드형 · 한 줄 ${cols}개`:'리스트형 · 가로 상세 보기';
}
window.setPostViewMode=mode=>{data.postViewMode=mode==='list'?'list':'card';mwsSaveDevicePrefs(data);applyPostViewPrefs()};
window.setPostCardColumns=v=>{data.postCardColumns=Math.max(2,Math.min(5,Number(v)||4));mwsSaveDevicePrefs(data);applyPostViewPrefs()};

function favoriteFolderById(id){return (data.favoriteFolders||[]).find(f=>f.id===id)||null}
function favoriteFolderCount(id){return favoriteEvents().filter(e=>(e.favoriteFolderId||'')===id).length}
function setFavoriteFolderFilter(id){favoriteFolderFilter=id||'unfiled';renderFavoriteSchedules()}
window.setFavoriteFolderFilter=setFavoriteFolderFilter;
window.addFavoriteFolder=()=>{
  if(!Array.isArray(data.favoriteFolders))data.favoriteFolders=[];
  let n=1,name='새 폴더';const names=new Set(data.favoriteFolders.map(f=>f.name));while(names.has(name)){n++;name=`새 폴더 ${n}`}
  const folder={id:crypto.randomUUID(),name};data.favoriteFolders.push(folder);favoriteFolderFilter=folder.id;saveData('즐겨찾기 폴더 추가');
  requestAnimationFrame(()=>{const el=document.querySelector(`[data-favorite-folder-id="${CSS.escape(folder.id)}"] .favorite-folder-name-input`);el?.focus();el?.select()})
};
window.renameFavoriteFolderDraft=(id,v)=>{const f=favoriteFolderById(id);if(!f)return;f.name=String(v||'').trim()||'새 폴더';persist()};
window.commitFavoriteFolderName=(id,v)=>{const f=favoriteFolderById(id);if(!f)return;f.name=String(v||'').trim()||'새 폴더';saveData('즐겨찾기 폴더 이름 변경')};
window.deleteFavoriteFolder=id=>{
  const f=favoriteFolderById(id);if(!f)return;if(!confirm(`'${f.name}' 폴더를 삭제하시겠습니까?
폴더 안의 즐겨찾기 컨텐츠는 삭제되지 않고 미분류로 이동합니다.`))return;
  (data.events||[]).forEach(e=>{if(e.favoriteFolderId===id)e.favoriteFolderId=''});data.favoriteFolders=data.favoriteFolders.filter(x=>x.id!==id);if(favoriteFolderFilter===id)favoriteFolderFilter='all';saveData('즐겨찾기 폴더 삭제')
};
window.favoriteDragStart=(eventId,e)=>{favoriteDraggingEventId=eventId;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/favorite-event-id',eventId);e.currentTarget.classList.add('dragging')};
window.favoriteDragEnd=e=>{favoriteDraggingEventId='';e.currentTarget.classList.remove('dragging');document.querySelectorAll('.favorite-folder-tile.drag-over').forEach(x=>x.classList.remove('drag-over'))};
window.favoriteFolderDragOver=e=>{e.preventDefault();e.dataTransfer.dropEffect='move';e.currentTarget.classList.add('drag-over')};
window.favoriteFolderDragLeave=e=>{e.currentTarget.classList.remove('drag-over')};
window.favoriteFolderDrop=(folderId,e)=>{
  e.preventDefault();e.currentTarget.classList.remove('drag-over');const id=e.dataTransfer.getData('text/favorite-event-id')||favoriteDraggingEventId,ev=(data.events||[]).find(x=>x.id===id);if(!ev)return;ev.favoriteFolderId=folderId==='unfiled'?'':folderId;saveData(folderId==='unfiled'?'즐겨찾기 폴더에서 꺼내기':'즐겨찾기 폴더 이동');toast('즐겨찾기',folderId==='unfiled'?`${ev.title}을(를) 미분류로 이동했습니다`:`${ev.title}을(를) ${favoriteFolderById(folderId)?.name||'폴더'}에 넣었습니다`)
};
function renderFavoriteFolderBar(){
  const box=document.getElementById('favoriteFolderBar');if(!box)return;const folders=data.favoriteFolders||[],all=favoriteEvents(),unfiled=all.filter(e=>!e.favoriteFolderId).length;
  const system=(id,title,count,icon)=>`<div class="favorite-folder-tile system-folder ${favoriteFolderFilter===id?'active':''}" onclick="setFavoriteFolderFilter('${id}')" ondragover="favoriteFolderDragOver(event)" ondragleave="favoriteFolderDragLeave(event)" ondrop="favoriteFolderDrop('${id}',event)"><div class="favorite-folder-top"><span class="favorite-folder-icon">${icon}</span><span class="favorite-folder-system-title">${title}</span></div><div class="favorite-folder-system-count">${count}개 · 카드를 끌어 놓을 수 있습니다</div></div>`;
  box.innerHTML=system('all','전체',all.length,'★')+system('unfiled','미분류',unfiled,'⌂')+folders.map(f=>`<div class="favorite-folder-tile ${favoriteFolderFilter===f.id?'active':''}" data-favorite-folder-id="${f.id}" onclick="setFavoriteFolderFilter('${f.id}')" ondragover="favoriteFolderDragOver(event)" ondragleave="favoriteFolderDragLeave(event)" ondrop="favoriteFolderDrop('${f.id}',event)"><button type="button" class="ghost favorite-folder-delete" title="폴더 삭제" onclick="event.stopPropagation();deleteFavoriteFolder('${f.id}')">×</button><div class="favorite-folder-top"><span class="favorite-folder-icon">▰</span><input class="favorite-folder-name-input" value="${esc(f.name)}" onclick="event.stopPropagation()" oninput="renameFavoriteFolderDraft('${f.id}',this.value)" onchange="commitFavoriteFolderName('${f.id}',this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}"></div><div class="favorite-folder-meta">${favoriteFolderCount(f.id)}개 · 드래그해서 넣기</div></div>`).join('');
}
function filteredFavoriteEvents(){
  const q=(document.getElementById('favoriteScheduleSearch')?.value||'').trim().toLowerCase(),sort=document.getElementById('favoriteScheduleSort')?.value||'upcoming';
  let arr=favoriteEvents().filter(e=>!q||favoriteEventSearchText(e).includes(q));
  if(favoriteFolderFilter==='unfiled')arr=arr.filter(e=>!e.favoriteFolderId);else if(favoriteFolderFilter!=='all')arr=arr.filter(e=>e.favoriteFolderId===favoriteFolderFilter);
  const today=todayKST();
  if(sort==='dateAsc')arr.sort((a,b)=>favoriteEventTimestamp(a)-favoriteEventTimestamp(b));else if(sort==='dateDesc')arr.sort((a,b)=>favoriteEventTimestamp(b)-favoriteEventTimestamp(a));else if(sort==='titleAsc')arr.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'ko'));else arr.sort((a,b)=>{const au=(a.date||'')>=today,bu=(b.date||'')>=today;if(au!==bu)return au?-1:1;return au?favoriteEventTimestamp(a)-favoriteEventTimestamp(b):favoriteEventTimestamp(b)-favoriteEventTimestamp(a)});
  return arr
}
function renderFavoriteSchedules(){
  const all=favoriteEvents(),arr=filteredFavoriteEvents(),list=document.getElementById('favoriteScheduleList'),countTab=document.getElementById('favoriteScheduleCountChip'),total=document.getElementById('favoriteTotalChip'),upcoming=document.getElementById('favoriteUpcomingChip'),completed=document.getElementById('favoriteCompletedChip'),today=todayKST();
  if(countTab)countTab.textContent=String(all.length);if(total)total.textContent=`즐겨찾기 ${all.length}개`;if(upcoming)upcoming.textContent=`예정 ${all.filter(e=>(e.date||'')>=today).length}개`;if(completed)completed.textContent=`지난 일정 ${all.filter(e=>(e.date||'')<today).length}개`;renderFavoriteFolderBar();if(!list)return;
  list.innerHTML=arr.length?arr.map(e=>{const cat=category(e.categoryId),status=favoriteStatus(e),participantNames=(e.participants||[]).map(id=>contact(id)?.name).filter(Boolean),time=e.start==='TBD'?'미확정':formatTimeKorean(e.start),end=e.end==='TBD'?'미확정':formatTimeKorean(e.end),folder=favoriteFolderById(e.favoriteFolderId);return `<article class="favorite-schedule-card" draggable="true" data-event-id="${e.id}" style="border-left-color:${cat?.color||'var(--accent)'}" ondragstart="favoriteDragStart('${e.id}',event)" ondragend="favoriteDragEnd(event)" onclick="openEvent('${e.id}')"><span class="favorite-schedule-star" title="즐겨찾기">★</span><div class="favorite-schedule-title">${esc(e.title)}</div><div class="favorite-schedule-meta"><span>${formatDateWeekday(e.date)}</span><span>${time}${e.end?` - ${end}`:''}</span>${e.device?`<span class="chip device-chip">${esc(e.device)}</span>`:''}${cat?`<span class="chip" style="border-color:${cat.color}">${esc(cat.name)}</span>`:''}<span class="favorite-status ${status.key}">${status.label}</span></div>${folder?`<div class="favorite-schedule-folder-chip">▰ ${esc(folder.name)}</div>`:''}<div class="favorite-participants">${(e.participants||[]).length?(e.participants||[]).map(favoriteParticipantHTML).join(''):'<span class="muted small">참가자 없음</span>'}</div><div class="muted small" style="margin-top:11px">${participantNames.length?`참가자 ${participantNames.map(esc).join(', ')}`:'참가자 없음'}</div></article>`}).join(''):`<div class="favorite-empty">${all.length?'현재 폴더 또는 검색 조건에 맞는 즐겨찾기 컨텐츠가 없습니다.':'아직 즐겨찾기한 컨텐츠가 없습니다. 스케줄 수정창의 별을 눌러 추가해 보세요.'}</div>`
}
window.renderFavoriteSchedules=renderFavoriteSchedules;

function renderPosts(){
  if(!Array.isArray(data.posts))data.posts=[];if(activePostId&&!postById(activePostId))activePostId='';if(!activePostId&&data.posts.length)activePostId=data.posts[0].id;
  const count=document.getElementById('postSavedCount');if(count)count.textContent=`${data.posts.length}개`;const list=document.getElementById('postSavedList');if(list)list.innerHTML=data.posts.map(p=>`<div class="post-saved-item ${p.id===activePostId?'active':''}" onclick="selectPost('${p.id}')"><div class="post-saved-title">${esc(p.name)}</div><div class="post-saved-meta"><span>${p.comments?.length||0}개 댓글</span><span>${p.lastSyncAt?new Date(p.lastSyncAt).toLocaleString('ko-KR'):'미동기화'}</span></div></div>`).join('')||'<div class="empty small">등록된 게시글이 없습니다</div>';
  const p=postById(activePostId),empty=document.getElementById('postEmptyState'),detail=document.getElementById('postDetailView');if(empty)empty.style.display=p?'none':'';if(detail)detail.style.display=p?'':'none';if(!p){applyPostViewPrefs();return}
  const title=document.getElementById('postDisplayName');if(title&&document.activeElement!==title)title.value=p.name;const meta=document.getElementById('postDetailMeta');if(meta)meta.textContent=`${p.bjId} · 글 ${p.postNo} · ${p.lastSyncAt?'마지막 동기화 '+new Date(p.lastSyncAt).toLocaleString('ko-KR'):'아직 동기화하지 않음'}${p.sourceTitle&&p.nameManual?` · SOOP 원문 제목: ${p.sourceTitle}`:''}${p.lastError?' · 최근 오류 있음':''}`;
  const open=document.getElementById('postOpenBtn');if(open)open.onclick=()=>window.open(p.url,'_blank','noopener');const sync=document.getElementById('postSyncBtn');if(sync)sync.onclick=()=>syncSoopPost(p.id);const del=document.getElementById('postDeleteBtn');if(del)del.onclick=()=>deletePost(p.id);const game=document.getElementById('postRandomGameBtn');if(game)game.onclick=openPostGamePicker;setPostDetailMode(postDetailMode);renderPostSourceContent(p);
  const q=(document.getElementById('postApplicantSearch')?.value||'').trim().toLowerCase(),sf=document.getElementById('postApplicantStatusFilter')?.value||'',sort=document.getElementById('postApplicantSort')?.value||'recent';let arr=[...(p.comments||[])];if(q)arr=arr.filter(c=>(`${c.name} ${c.userId} ${c.comment}`).toLowerCase().includes(q));if(sf)arr=arr.filter(c=>(c.status==='excluded'?'nextchance':c.status)===sf);if(sort==='upDesc')arr.sort((a,b)=>(Number(b.upCount)||0)-(Number(a.upCount)||0)||String(b.regDate||'').localeCompare(String(a.regDate||'')));else if(sort==='upAsc')arr.sort((a,b)=>(Number(a.upCount)||0)-(Number(b.upCount)||0)||String(b.regDate||'').localeCompare(String(a.regDate||'')));else if(sort==='oldest')arr.sort((a,b)=>String(a.regDate||'').localeCompare(String(b.regDate||'')));else if(sort==='name')arr.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ko'));else arr.sort((a,b)=>String(b.regDate||'').localeCompare(String(a.regDate||'')));
  const unique=new Set((p.comments||[]).map(c=>c.userId).filter(Boolean)),selected=(p.comments||[]).filter(c=>c.status==='selected').length,nextchance=(p.comments||[]).filter(c=>c.status==='nextchance'||c.status==='excluded').length,matchedCount=uniquePostGameApplicants(p).filter(c=>c.contactId).length,newCount=(p.comments||[]).filter(c=>!findContactForSoopApplicant(c)).length,summary=document.getElementById('postApplicantSummary');if(summary)summary.innerHTML=`<span class="chip">댓글 ${p.comments.length}개</span><span class="chip">고유 작성자 ${unique.size}명</span><span class="chip" style="border-color:#38b77a">확정 ${selected}명</span><span class="chip">다음기회에 ${nextchance}명</span><span class="chip" style="border-color:#2ea676">연락처 연결 ${matchedCount}명</span>${newCount?`<span class="chip" style="border-color:#3aa9ff;color:#7ccaff">신규 ${newCount}개 댓글</span>`:''}`;
  const grid=document.getElementById('postApplicantGrid'),dups=applicantDuplicates(p);if(grid)grid.innerHTML=arr.map(c=>postApplicantCardHTML(p,c,dups)).join('')||'<div class="empty" style="grid-column:1/-1">조건에 맞는 신청자가 없습니다</div>';applyPostViewPrefs()
}
window.renderPosts=renderPosts;

// Ensure controls are synchronized after initialization and after data restores.
applyPostViewPrefs();renderFavoriteSchedules();
window.addEventListener('mawang:datachange',()=>{try{applyTextScale(data.textScale??100,false);applyPostViewPrefs()}catch(_){}});



/* =========================================================
   v4.5 runtime overrides
   ========================================================= */
function normalizeSoopContentValue(value,depth=0){
  if(value==null||depth>7)return'';
  if(typeof value==='string'){const raw=value.trim();if(raw==='[object Object]'||raw==='[object Array]')return'';return soopPlainText(value);}
  if(typeof value==='number'||typeof value==='boolean')return String(value);
  if(Array.isArray(value)){
    const parts=value.map(v=>normalizeSoopContentValue(v,depth+1)).filter(Boolean);
    return [...new Set(parts)].join('\n\n').trim();
  }
  if(typeof value==='object'){
    const preferred=['contents','content','html','text','body','value','memo','description','post_content','board_content','article','data'];
    for(const k of preferred){if(value[k]!=null){const s=normalizeSoopContentValue(value[k],depth+1);if(s&&s!=='[object Object]')return s}}
    const parts=[];
    for(const [k,v] of Object.entries(value)){
      if(/(?:url|src|image|photo|file|id|no|count|date|nick|title|subject)/i.test(k))continue;
      const s=normalizeSoopContentValue(v,depth+1);if(s&&s!=='[object Object]'&&!parts.includes(s))parts.push(s);
    }
    return parts.join('\n\n').trim();
  }
  return''
}
function collectSoopImageUrls(value,out=[],depth=0){
  if(value==null||depth>7||out.length>=40)return out;
  if(typeof value==='string'){
    const s=value.trim();if(/^https?:\/\//i.test(s)&&/\.(?:png|jpe?g|gif|webp)(?:\?|$)/i.test(s)&&!out.includes(normalizeSoopUrl(s)))out.push(normalizeSoopUrl(s));
    for(const u of soopPhotosFromHtml(s)){if(u&&!out.includes(u))out.push(u)}
    return out;
  }
  if(Array.isArray(value)){value.forEach(v=>collectSoopImageUrls(v,out,depth+1));return out}
  if(typeof value==='object'){for(const [k,v] of Object.entries(value)){if(/(?:image|photo|thumb|attach|file|url|src|contents|content|html)/i.test(k))collectSoopImageUrls(v,out,depth+1)}return out}
  return out
}
function metaFromSoopRecord(r){
  if(!r||typeof r!=='object')return{};
  const rawContent=r.contents??r.content??r.board_content??r.post_content??r.memo??r.article??'';
  const photos=collectSoopImageUrls(rawContent,[]);
  for(const x of [r.photos,r.photo,r.images,r.attachments,r.files,r.file_list,r.attach_file])collectSoopImageUrls(x,photos);
  return{
    title:cleanSoopPostTitle(r.title_name??r.title??r.subject??r.post_title??''),
    content:normalizeSoopContentValue(rawContent),
    author:String(r.user_nick??r.writer_nick??r.nick??r.author??''),
    authorId:String(r.user_id??r.writer_id??r.author_id??''),
    regDate:String(r.reg_date??r.write_date??r.created_at??''),
    viewCount:Math.max(0,Number(r.view_cnt??r.read_cnt??r.hit??r.view_count??0)||0),
    photos:photos.slice(0,30)
  }
}

function autoGrowPostTitle(el){if(!el)return;el.style.height='auto';el.style.height=Math.max(46,el.scrollHeight)+'px'}
window.autoGrowPostTitle=autoGrowPostTitle;
const postTitleV45=document.getElementById('postDisplayName');
if(postTitleV45)postTitleV45.addEventListener('input',()=>autoGrowPostTitle(postTitleV45));

/* 이용자 선택 */
function selfContact(){return data.selfContactId?contact(data.selfContactId):null}
function renderUserIdentitySettings(){
  const preview=document.getElementById('selfContactPreview'),picker=document.getElementById('selfContactPicker'),status=document.getElementById('selfContactStatus'),search=document.getElementById('selfContactSearch');if(!preview||!picker)return;
  const current=selfContact();if(status)status.textContent=current?`본인 · ${current.name}`:'미설정';
  if(current){
    const av=current.image?`<img class="self-contact-preview-avatar" src="${current.image}" loading="lazy">`:`<div class="self-contact-preview-avatar" style="display:grid;place-items:center;font-size:22px;font-weight:950">${esc(initials(current.name))}</div>`;
    preview.classList.remove('empty');preview.innerHTML=`<div class="self-contact-preview-card">${av}<div style="min-width:0"><div class="self-contact-preview-name">${esc(current.name)} <span class="contact-self-badge">MY PROFILE</span></div><div class="self-contact-preview-tags">${(current.labels||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join('')||'<span class="muted small">태그 없음</span>'}</div><div class="self-contact-preview-note">연락처 화면의 첫 번째 카드에 고정되고, 모든 컨텐츠 참가자에 자동 포함되며 전용 테두리와 광택 효과가 표시됩니다.</div></div></div>`
  }else{preview.classList.add('empty');preview.innerHTML='<div>아직 본인으로 지정한 연락처가 없습니다. 아래 연락처를 클릭해 선택하세요.</div>'}
  const q=String(search?.value||'').trim().toLowerCase();let arr=(data.contacts||[]).filter(c=>!q||contactMatches(c,q));arr.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  picker.innerHTML=arr.map(c=>{const selected=c.id===data.selfContactId,av=c.image?`<img src="${c.image}" loading="lazy">`:`<div class="self-contact-option-avatar">${esc(initials(c.name))}</div>`;return `<button type="button" class="self-contact-option ${selected?'selected':''}" onclick="setSelfContact('${c.id}')">${av}<div style="min-width:0"><div class="self-contact-option-name">${esc(c.name)}${selected?' · 본인':''}</div><div class="self-contact-option-tags">${esc((c.labels||[]).join(' · ')||'태그 없음')}</div></div></button>`}).join('')||'<div class="empty small" style="grid-column:1/-1">검색 조건에 맞는 연락처가 없습니다.</div>'
}
window.renderUserIdentitySettings=renderUserIdentitySettings;
function syncSelectedUserAcrossEvents(nextId){
  const next=String(nextId||'');
  let added=0,replaced=0,removed=0;
  (data.events||[]).forEach(e=>{
    if(e.restDay)return;
    if(!Array.isArray(e.participants))e.participants=[];
    if(!e.participantStatuses||typeof e.participantStatuses!=='object')e.participantStatuses={};
    const previousAuto=String(e.autoSelfParticipantId||'');
    if(previousAuto&&previousAuto!==next){
      const before=e.participants.length;
      e.participants=e.participants.filter(id=>id!==previousAuto);
      if(e.participantStatuses)delete e.participantStatuses[previousAuto];
      if(e.participants.length<before){next?replaced++:removed++}
      e.autoSelfParticipantId='';
    }
    if(next){
      if(!e.participants.includes(next)){
        e.participants.push(next);
        e.participantStatuses[next]='confirmed';
        e.autoSelfParticipantId=next;
        added++;
      }else{
        // Existing manual participation is preserved and not marked as system-managed.
        e.participantStatuses[next]=normalizeParticipantStatus(e.participantStatuses[next]||'confirmed');
      }
    }
  });
  return{added,replaced,removed};
}
window.syncSelectedUserAcrossEvents=syncSelectedUserAcrossEvents;
window.setSelfContact=id=>{
  const c=contact(id);if(!c)return;
  const oldId=String(data.selfContactId||'');
  data.selfContactId=c.id;
  const result=syncSelectedUserAcrossEvents(c.id);
  saveData('이용자 선택 · 전체 컨텐츠 참가자 동기화');
  toast('이용자 선택',`${c.name}을(를) 본인으로 지정했습니다 · 컨텐츠 ${result.added+result.replaced}개 동기화`);
  renderUserIdentitySettings();refreshContactViews();
};
window.clearSelfContact=()=>{
  const result=syncSelectedUserAcrossEvents('');
  data.selfContactId='';
  saveData('이용자 선택 해제');
  toast('이용자 선택',`본인 지정을 해제했습니다 · 자동 참가 ${result.removed}개 정리`);
  renderUserIdentitySettings();refreshContactViews();
};
document.getElementById('selfContactSearch')?.addEventListener('input',renderUserIdentitySettings);
document.getElementById('clearSelfContactBtn')?.addEventListener('click',clearSelfContact);
const renderSettingsV45Base=renderSettings;
renderSettings=function(){renderSettingsV45Base();renderUserIdentitySettings();applyTextScale(data.textScale??100,false)};

/* main contact cards */
function renderContacts(){
  if(!window.__mwsContactSearchRender)renderContactTagSidebar();
  renderContactTagBanner();let arr=filteredContacts();
  if(data.selfContactId)arr=[...arr].sort((a,b)=>(a.id===data.selfContactId?-1:b.id===data.selfContactId?1:0));
  const grid=document.getElementById('contactGrid');if(!grid)return;
  const mwsHistory=typeof normalizedCollaborationHistory==='function'?normalizedCollaborationHistory():null;
  const mwsLastByContact=new Map();
  if(mwsHistory)for(const row of mwsHistory)for(const id of row.participants||[])if(!mwsLastByContact.has(id))mwsLastByContact.set(id,row);
  const mwsUpcomingAll=upcomingEvents();
  grid.innerHTML=arr.map(c=>{
    const last=mwsHistory?(mwsLastByContact.get(c.id)||null):getLastCollab(c.id),upcoming=mwsUpcomingAll.filter(e=>!e.restDay&&(e.participants||[]).includes(c.id)).slice(0,8),isSelf=c.id===data.selfContactId;
    const avatar=c.image?`<img class="contact-card-avatar-lg" loading="lazy" src="${c.image}">`:`<div class="contact-card-avatar-lg">${esc(initials(c.name))}</div>`;
    return `<div class="contact-card ${isSelf?'is-self':''} ${c.pendingSetup?'pending-card':''} ${upcoming.length?'has-upcoming':''}" draggable="true" data-contact-id="${c.id}" ondragstart="contactCardDragStart('${c.id}',event)" ondragend="contactCardDragEnd(event)" onclick="openContact('${c.id}')"><div class="contact-card-core">${avatar}<div class="contact-card-info"><div class="contact-card-name-row"><div class="contact-card-name">${esc(c.name)}</div>${isSelf?'<span class="contact-self-badge">본인</span>':''}${upcoming.length?`<span class="upcoming-count-badge">UPCOMING ${upcoming.length}</span>`:''}</div><div class="contact-card-tags">${(c.labels||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join('')||'<span class="muted small">태그 없음</span>'}</div><div class="contact-card-last">${last?`최근 컨텐츠: <strong style="color:var(--text)">${esc(last.title)}</strong><br>${formatDateWeekday(last.date)} · ${daysSince(last.date)}일 전`:'합방 기록 없음'}</div><div class="contact-card-actions">${c.stationUrl?`<button type="button" class="station-link" onclick="event.stopPropagation();openContactStation('${c.id}')">방송국 열기</button>`:''}${c.pendingSetup?'<span class="chip">신규 추가</span>':''}</div></div></div>${contactUpcomingPopover(c)}</div>`
  }).join('')||'<div class="empty">연락처가 없습니다</div>'
}
window.renderContacts=renderContacts;

/* Larger Recent Collaboration rendering inherits existing logic; CSS handles portrait size. */

function renderPendingContacts(){
  const arr=filteredContacts({pendingOnly:true}),allCount=data.contacts.filter(c=>c.pendingSetup).length,btn=document.getElementById('pendingTabBtn');if(btn)btn.textContent=`신규 추가${allCount?` ${allCount}`:''}`;
  const box=document.getElementById('pendingContacts');if(!box)return;
  box.innerHTML=`<div class="space" style="margin-bottom:12px"><div><h3 style="margin:0">신규 추가 연락처</h3><div class="muted small" style="margin-top:4px">일정 등록 중 빠르게 추가한 연락처입니다. 정보를 채우면 일반 연락처로 이동합니다.</div></div><span class="chip">${arr.length}명</span></div><div class="contact-maintenance-grid">${arr.map(c=>{const av=c.image?`<img class="contact-maintenance-avatar" src="${c.image}" loading="lazy">`:`<div class="contact-maintenance-avatar">${esc(initials(c.name))}</div>`;return `<div class="contact-maintenance-card" onclick="openContact('${c.id}')">${av}<div style="min-width:0"><div class="contact-maintenance-title">${esc(c.name)}</div><div class="contact-maintenance-desc">프로필 이미지, 태그와 방송국 정보를 입력해 연락처를 완성하세요.</div><div class="contact-missing-badges"><span class="contact-missing-badge">신규 추가</span></div></div></div>`}).join('')||'<div class="empty" style="grid-column:1/-1">새로 정리할 연락처가 없습니다</div>'}</div>`
}
function renderIncompleteContacts(){
  const q=(document.getElementById('contactSearch')?.value||'').trim().toLowerCase(),sort=document.getElementById('contactSort')?.value||'nameAsc';let arr=(data.contacts||[]).filter(c=>contactMatches(c,q)&&contactNeedsCompletion(c));arr=sortContacts(arr,sort);
  const allCount=(data.contacts||[]).filter(contactNeedsCompletion).length,btn=document.getElementById('incompleteTabBtn');if(btn)btn.textContent=`정보 미완성${allCount?` ${allCount}`:''}`;const box=document.getElementById('incompleteContacts');if(!box)return;
  box.innerHTML=`<div class="space" style="margin-bottom:12px"><div><h3 style="margin:0">정보 미완성 연락처</h3><div class="muted small" style="margin-top:4px">태그 또는 방송국 URL이 비어 있는 연락처만 표시합니다.</div></div><span class="chip">${arr.length}명</span></div><div class="contact-maintenance-grid">${arr.map(c=>{const av=c.image?`<img class="contact-maintenance-avatar" src="${c.image}" loading="lazy">`:`<div class="contact-maintenance-avatar">${esc(initials(c.name))}</div>`;return `<div class="contact-maintenance-card" onclick="openContact('${c.id}')">${av}<div style="min-width:0"><div class="contact-maintenance-title">${esc(c.name)}</div><div class="contact-maintenance-desc">클릭해서 누락된 정보를 보완하세요.</div><div class="contact-missing-badges">${!(c.labels||[]).length?'<span class="contact-missing-badge">태그 없음</span>':''}${!String(c.stationUrl||'').trim()?'<span class="contact-missing-badge">URL 없음</span>':''}</div></div></div>`}).join('')||'<div class="empty" style="grid-column:1/-1">태그와 URL이 모두 입력되어 있습니다</div>'}</div>`
}
window.renderPendingContacts=renderPendingContacts;window.renderIncompleteContacts=renderIncompleteContacts;

/* source article rendering */
function renderPostSourceContent(p){
  const box=document.getElementById('postSourceContent');if(!box)return;const title=p.sourceTitle||p.name||`게시글 ${p.postNo}`,body=normalizeSoopContentValue(p.sourceContent).trim(),photos=Array.isArray(p.sourcePhotos)?p.sourcePhotos.filter(Boolean):[],author=p.sourceAuthor||p.bjId||'작성자 정보 없음',authorId=p.sourceAuthorId||p.bjId||'';
  const authorLink=authorId?`https://www.sooplive.com/station/${encodeURIComponent(authorId)}`:'';
  const authorBlock=`<div class="post-source-author"><div class="post-source-author-avatar">${esc(initials(author))}</div><div><div class="post-source-author-name">${authorLink?`<a href="${authorLink}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">${esc(author)}</a>`:esc(author)}</div><div class="post-source-author-id">${authorId?esc(authorId):'SOOP 게시글 작성자'}</div></div></div>`;
  box.innerHTML=`<div class="post-source-hero"><div><div class="post-source-title">${esc(title)}</div>${authorBlock}</div><div class="post-source-stats"><div class="post-source-stat"><div class="post-source-stat-label">작성일</div><div class="post-source-stat-value">${esc(p.sourceRegDate||'정보 없음')}</div></div><div class="post-source-stat"><div class="post-source-stat-label">조회수</div><div class="post-source-stat-value">${Number(p.sourceViewCount||0).toLocaleString('ko-KR')}</div></div><div class="post-source-stat"><div class="post-source-stat-label">글 번호</div><div class="post-source-stat-value">${esc(p.postNo)}</div></div><div class="post-source-stat"><div class="post-source-stat-label">첨부 이미지</div><div class="post-source-stat-value">${photos.length}개</div></div></div></div>${body&&body!=='[object Object]'?`<div class="post-source-body">${esc(body)}</div>`:'<div class="post-source-empty">본문 텍스트를 아직 가져오지 못했습니다. 댓글 다시 동기화를 누르면 본문을 다시 조회합니다.</div>'}${photos.length?`<div class="post-source-photos">${photos.map((u,i)=>`<img class="post-source-photo" src="${esc(u)}" loading="lazy" alt="게시글 첨부 이미지 ${i+1}">`).join('')}</div>`:''}`
}
window.renderPostSourceContent=renderPostSourceContent;

function postCommentIdentity(c){return String(c?.commentNo||c?.p_comment_no||`${c?.userId||c?.user_id||''}|${c?.regDate||c?.reg_date||''}`)}
window.deletePostApplicant=(postId,commentId)=>{
  const p=postById(postId),c=p?.comments?.find(x=>x.id===commentId);if(!p||!c)return;if(!confirm(`${c.name}의 신청 댓글을 이 게시글 목록에서 삭제하시겠습니까?\n다시 동기화해도 이 댓글은 자동 복구되지 않습니다.`))return;
  if(!Array.isArray(p.ignoredCommentKeys))p.ignoredCommentKeys=[];const key=postCommentIdentity(c);if(key&&!p.ignoredCommentKeys.includes(key))p.ignoredCommentKeys.push(key);p.comments=p.comments.filter(x=>x.id!==commentId);syncPostContactApplicationHistories(p);saveData('게시글 신청자 삭제');toast('게시글',`${c.name} 신청자를 삭제했습니다`);renderPosts()
};

function applicantStatusLabel(s){return s==='selected'?'확정':(s==='nextchance'||s==='excluded')?'다음기회에':'대기'}
function applicationStatusText(s){return applicantStatusLabel(s)}
function postApplicantCardHTML(post,c,dups){
  const matched=findContactForSoopApplicant(c),station=c.stationUrl||soopUserStationUrl(c.userId),avatar=c.profileImage?`<img class="post-applicant-avatar" src="${esc(c.profileImage)}" loading="lazy">`:`<div class="post-applicant-avatar">${esc(initials(c.name))}</div>`,st=c.status==='excluded'?'nextchance':(c.status||'pending');
  return `<div class="post-applicant-card ${st} ${matched?'':'new-applicant'}" data-comment-id="${c.id}">${matched?'':'<span class="post-new-badge">신규</span>'}<div class="post-applicant-top">${station?`<a class="post-applicant-avatar-link" href="${esc(station)}" target="_blank" rel="noopener noreferrer" title="${esc(c.name)} 방송국 열기">${avatar}</a>`:avatar}<div style="min-width:0"><div class="post-applicant-name">${esc(c.name)}${dups[c.userId]>1?' <span class="chip" style="font-size:7px">중복 댓글</span>':''}</div><div class="post-applicant-id">${esc(c.userId||'ID 없음')}</div>${matched?'<div class="post-contact-match">연락처 연결됨 · 신청 기록 자동 저장</div>':'<div class="post-applicant-id" style="color:#61baff;margin-top:3px">연락처에서 찾을 수 없음</div>'}</div><div class="post-status-block"><span class="post-status-badge ${st}">${applicantStatusLabel(st)}</span><div class="post-decision-row"><button type="button" class="post-decision-btn selected ${st==='selected'?'active':''}" onclick="setPostApplicantDecision('${post.id}','${c.id}','selected')">확정</button><button type="button" class="post-decision-btn nextchance ${st==='nextchance'?'active':''}" onclick="setPostApplicantDecision('${post.id}','${c.id}','nextchance')">다음기회에</button></div></div></div><div class="post-applicant-comment">${esc(c.comment||'(내용 없음)')}</div>${c.photoUrl?`<img class="post-applicant-photo" src="${esc(c.photoUrl)}" loading="lazy">`:''}<div class="post-applicant-foot"><div class="post-applicant-foot-left"><div class="post-applicant-date">${esc(c.regDate||'작성 시간 없음')}</div><span class="post-up-count">♡ UP ${Math.max(0,Number(c.upCount)||0)}</span></div><div class="post-applicant-actions"><button class="secondary post-contact-btn" onclick="${matched?`openMatchedPostContact('${matched.id}')`:`addPostApplicantToContacts('${post.id}','${c.id}')`}">${matched?'연락처 보기':'연락처 추가'}</button><button type="button" class="ghost post-contact-btn post-applicant-delete" onclick="deletePostApplicant('${post.id}','${c.id}')">삭제</button></div></div></div>`
}

/* Only confirmed applicants are eligible for games. */
function uniquePostGameApplicants(post){
  const map=new Map();for(const c of post.comments||[]){if(c.status!=='selected')continue;const key=String(c.userId||'').trim().toLowerCase()||`name:${normalizeContactName(c.name)}`;const prev=map.get(key);if(!prev||String(c.regDate||'')>String(prev.regDate||''))map.set(key,c)}
  return [...map.values()].map(c=>{const matched=findContactForSoopApplicant(c);return{id:crypto.randomUUID(),contactId:matched?.id||'',name:matched?.name||c.name,image:matched?.image||c.profileImage||'',sourceUserId:c.userId||''}})
}
window.openPostGamePicker=()=>{
  const p=postById(activePostId);if(!p)return;const arr=uniquePostGameApplicants(p),modal=document.getElementById('postGamePickerModal');if(modal&&modal.parentElement!==document.body)document.body.appendChild(modal);
  document.getElementById('postGamePickerSubtitle').textContent=`${p.name} · 확정된 게임 참가 대상 ${arr.length}명 (대기 / 다음기회에 / 중복 작성자 제외)`;
  const grid=document.getElementById('postGamePickerGrid');if(grid)grid.innerHTML=Object.entries(POST_GAME_DEFS).map(([key,g])=>{const tooMany=arr.length>g.cap,disabled=arr.length<2||tooMany;return `<button class="post-game-card" ${disabled?'disabled':''} onclick="launchPostApplicantsIntoGame('${key}')"><div class="post-game-card-kicker">MINI GAME</div><div class="post-game-card-title">${g.title}</div><div class="post-game-card-desc">${g.desc}</div><div class="post-game-card-cap">${tooMany?`확정 ${arr.length}명 · 최대 ${g.cap}명이라 사용 불가`:`확정 ${arr.length}명 준비 · 최대 ${g.cap}명`}</div></button>`}).join('');modal?.classList.add('open');syncModalInteractionState()
};

/* Re-sync while respecting manually removed comments. */
async function syncSoopPost(id,{quiet=false}={}){
  const post=postById(id);if(!post)return;setPostGlobalStatus('게시글 · 댓글 동기화 중','syncing');post.lastError='';renderPosts();
  try{
    const first=await fetchSoopJson(soopApiUrl(post,1)),meta=await fetchSoopPostMetaV43(post,first);
    if(meta.title){post.sourceTitle=meta.title;const placeholder=/^게시글\s+\d+$/u.test(String(post.name||'').trim());if(!post.nameManual||placeholder){post.name=meta.title;if(placeholder)post.nameManual=false}}
    if(typeof stripLegacyPostSourceV510==='function')stripLegacyPostSourceV510(post);
    const totalPages=Math.max(1,Math.min(100,Number(first?.meta?.last_page)||1));let raw=[...(Array.isArray(first?.data)?first.data:[])];for(let page=2;page<=totalPages;page++){setPostGlobalStatus(`댓글 동기화 ${page} / ${totalPages}`,'syncing');const j=await fetchSoopJson(soopApiUrl(post,page));if(Array.isArray(j?.data))raw.push(...j.data)}
    const ignored=new Set(post.ignoredCommentKeys||[]),prev=new Map((post.comments||[]).map(c=>[postCommentIdentity(c),c]));raw=raw.filter(c=>!ignored.has(String(c.p_comment_no||`${c.user_id||''}|${c.reg_date||''}`)));
    post.comments=raw.map(c=>{const key=String(c.p_comment_no||`${c.user_id||''}|${c.reg_date||''}`),old=prev.get(key),userId=String(c.user_id||'');return{id:old?.id||crypto.randomUUID(),commentNo:String(c.p_comment_no||''),userId,name:String(c.user_nick||c.user_id||'신청자'),profileImage:normalizeSoopUrl(c.profile_image||''),stationUrl:soopUserStationUrl(userId),comment:String(c.comment||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,''),regDate:String(c.reg_date||''),photoUrl:soopPhotoUrl(c.photo),upCount:extractSoopUpCount(c),status:old?.status==='excluded'?'nextchance':(old?.status||'pending')}});
    post.lastSyncAt=new Date().toISOString();post.lastError='';syncPostContactApplicationHistories(post);data.version=52;saveData('SOOP 게시글 · 댓글 동기화');setPostGlobalStatus(`${post.comments.length}개 댓글 동기화 완료`,'ok');if(!quiet)toast('게시글',`${post.name} · ${post.comments.length}개의 댓글을 불러왔습니다`)
  }catch(err){post.lastError=String(err?.message||err);saveData('SOOP 댓글 동기화 오류');setPostGlobalStatus('댓글 동기화 실패','error');if(!quiet)toast('게시글',post.lastError)}renderPosts()
}
window.syncSoopPost=syncSoopPost;

/* Extended text scaling. */
function applyTextScale(value,writeData=true){
  const n=Math.max(80,Math.min(200,Number(value)||100));if(writeData)data.textScale=n;document.body.style.setProperty('--ui-text-scale',String(n/100));
  const slider=document.getElementById('textScaleSlider'),label=document.getElementById('textScaleValue'),sample=document.getElementById('textScalePreview');if(slider&&document.activeElement!==slider)slider.value=String(n);if(label)label.textContent=`${n}%`;if(sample)sample.style.fontSize=`${(16*n/100).toFixed(1)}px`
}
window.applyTextScale=applyTextScale;applyTextScale(data.textScale??100,false);

/* Final v4.5 posts renderer: full title, confirmed labels, deleted comment support. */
function renderPosts(){
  if(!Array.isArray(data.posts))data.posts=[];if(activePostId&&!postById(activePostId))activePostId='';if(!activePostId&&data.posts.length)activePostId=data.posts[0].id;
  const count=document.getElementById('postSavedCount');if(count)count.textContent=`${data.posts.length}개`;const list=document.getElementById('postSavedList');if(list)list.innerHTML=data.posts.map(p=>`<div class="post-saved-item ${p.id===activePostId?'active':''}" onclick="selectPost('${p.id}')"><div class="post-saved-title">${esc(p.name)}</div><div class="post-saved-meta"><span>${p.comments?.length||0}개 댓글</span><span>${p.lastSyncAt?new Date(p.lastSyncAt).toLocaleString('ko-KR'):'미동기화'}</span></div></div>`).join('')||'<div class="empty small">등록된 게시글이 없습니다</div>';
  const p=postById(activePostId),empty=document.getElementById('postEmptyState'),detail=document.getElementById('postDetailView');if(empty)empty.style.display=p?'none':'';if(detail)detail.style.display=p?'':'none';if(!p){applyPostViewPrefs();return}
  const title=document.getElementById('postDisplayName');if(title&&document.activeElement!==title){title.value=p.name;requestAnimationFrame(()=>autoGrowPostTitle(title))}const meta=document.getElementById('postDetailMeta');if(meta)meta.textContent=`${p.bjId} · 글 ${p.postNo} · ${p.lastSyncAt?'마지막 동기화 '+new Date(p.lastSyncAt).toLocaleString('ko-KR'):'아직 동기화하지 않음'}${p.sourceTitle&&p.nameManual?` · SOOP 원문 제목: ${p.sourceTitle}`:''}${p.lastError?' · 최근 오류 있음':''}`;
  const open=document.getElementById('postOpenBtn');if(open)open.onclick=()=>window.open(p.url,'_blank','noopener');const sync=document.getElementById('postSyncBtn');if(sync)sync.onclick=()=>syncSoopPost(p.id);const del=document.getElementById('postDeleteBtn');if(del)del.onclick=()=>deletePost(p.id);const game=document.getElementById('postRandomGameBtn');if(game)game.onclick=openPostGamePicker;setPostDetailMode(postDetailMode);renderPostSourceContent(p);
  const q=(document.getElementById('postApplicantSearch')?.value||'').trim().toLowerCase(),sf=document.getElementById('postApplicantStatusFilter')?.value||'',sort=document.getElementById('postApplicantSort')?.value||'recent';let arr=[...(p.comments||[])];if(q)arr=arr.filter(c=>(`${c.name} ${c.userId} ${c.comment}`).toLowerCase().includes(q));if(sf)arr=arr.filter(c=>(c.status==='excluded'?'nextchance':c.status)===sf);if(sort==='upDesc')arr.sort((a,b)=>(Number(b.upCount)||0)-(Number(a.upCount)||0)||String(b.regDate||'').localeCompare(String(a.regDate||'')));else if(sort==='upAsc')arr.sort((a,b)=>(Number(a.upCount)||0)-(Number(b.upCount)||0)||String(b.regDate||'').localeCompare(String(a.regDate||'')));else if(sort==='oldest')arr.sort((a,b)=>String(a.regDate||'').localeCompare(String(b.regDate||'')));else if(sort==='name')arr.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ko'));else arr.sort((a,b)=>String(b.regDate||'').localeCompare(String(a.regDate||'')));
  const unique=new Set((p.comments||[]).map(c=>c.userId).filter(Boolean)),confirmed=(p.comments||[]).filter(c=>c.status==='selected').length,nextchance=(p.comments||[]).filter(c=>c.status==='nextchance'||c.status==='excluded').length,matchedCount=(p.comments||[]).filter(c=>findContactForSoopApplicant(c)).length,newCount=(p.comments||[]).filter(c=>!findContactForSoopApplicant(c)).length,summary=document.getElementById('postApplicantSummary');if(summary)summary.innerHTML=`<span class="chip">댓글 ${p.comments.length}개</span><span class="chip">고유 작성자 ${unique.size}명</span><span class="chip" style="border-color:#38b77a">확정 ${confirmed}명</span><span class="chip">다음기회에 ${nextchance}명</span><span class="chip" style="border-color:#2ea676">연락처 연결 ${matchedCount}개</span>${newCount?`<span class="chip" style="border-color:#3aa9ff;color:#7ccaff">신규 ${newCount}개 댓글</span>`:''}`;
  const grid=document.getElementById('postApplicantGrid'),dups=applicantDuplicates(p);if(grid)grid.innerHTML=arr.map(c=>postApplicantCardHTML(p,c,dups)).join('')||'<div class="empty" style="grid-column:1/-1">조건에 맞는 신청자가 없습니다</div>';applyPostViewPrefs()
}
window.renderPosts=renderPosts;

window.addEventListener('mawang:datachange',()=>{try{renderUserIdentitySettings()}catch(_){}});
renderUserIdentitySettings();



/* v4.5 contact application history cleanup for deleted post applicants */
function syncPostContactApplicationHistories(post){
  if(!post)return 0;
  for(const c of data.contacts||[]){
    if(!Array.isArray(c.applicationHistory))c.applicationHistory=[];
    c.applicationHistory=c.applicationHistory.filter(a=>a.postId!==post.id);
  }
  const groups=postApplicantGroupsByUser(post);let matched=0;
  for(const c of data.contacts||[]){
    const key=soopStationKey(c.stationUrl);if(!key)continue;const comments=groups.get(key);if(!comments?.length)continue;matched++;
    const dates=comments.map(x=>x.regDate).filter(Boolean).sort(),latest=[...comments].sort((a,b)=>String(b.regDate||'').localeCompare(String(a.regDate||'')))[0]||comments[0];
    c.applicationHistory.push({id:crypto.randomUUID(),postId:post.id,postNo:post.postNo,postTitle:post.name,postUrl:post.url,soopUserId:key,firstAppliedAt:dates[0]||'',lastAppliedAt:dates.at(-1)||'',commentCount:comments.length,latestComment:latest?.comment||'',status:aggregateApplicantStatus(comments),lastSyncedAt:post.lastSyncAt||new Date().toISOString()});
  }
  return matched
}
window.__syncPostContactApplicationHistories=syncPostContactApplicationHistories;



/* =========================================================
   v4.6 - resolution presets and readable ladder/contact UI
   ========================================================= */
const RESOLUTION_META={
  fhd:{label:'FHD',desc:'1920 × 1080 기준의 기본 균형 배치를 사용합니다.'},
  '2k':{label:'2K',desc:'2560 × 1440 화면에서 카드와 패널을 조금 더 크게 사용합니다.'},
  '4k':{label:'4K',desc:'3840 × 2160 화면에서 넓은 공간을 활용하도록 패널과 프로필 영역을 확대합니다.'},
  wide:{label:'와이드',desc:'21:9 울트라와이드 화면에서 가로 공간을 더 많이 활용합니다.'},
  mobile:{label:'모바일',desc:'세로 화면에 맞춰 사이드바를 상단 메뉴로 바꾸고 주요 화면을 1열로 배치합니다.'}
};
function applyResolutionMode(mode,writeData=true){
  mode=RESOLUTION_META[mode]?mode:'fhd';
  if(writeData)data.resolutionMode=mode;
  document.body.dataset.resolution=mode;
  document.querySelectorAll('[data-resolution-choice]').forEach(b=>b.classList.toggle('active',b.dataset.resolutionChoice===mode));
  const meta=RESOLUTION_META[mode];
  const status=document.getElementById('resolutionModeStatus'),desc=document.getElementById('resolutionModeDescription');
  if(status)status.textContent=meta.label;if(desc)desc.textContent=meta.desc;
}
window.applyResolutionMode=applyResolutionMode;
window.setResolutionMode=mode=>{applyResolutionMode(mode,true);mwsSaveDevicePrefs(data)};
applyResolutionMode(data.resolutionMode||'fhd',false);

const renderSettingsV46Base=renderSettings;
renderSettings=function(){renderSettingsV46Base();applyResolutionMode(data.resolutionMode||'fhd',false)};
window.renderSettings=renderSettings;

function ladderResultAvatarHTML(player){
  if(!player)return '<div class="ladder-result-avatar">?</div>';
  return player.image?`<div class="ladder-result-avatar"><img src="${player.image}" alt=""></div>`:`<div class="ladder-result-avatar">${esc(initials(player.name))}</div>`
}
function renderLadderAutoResultSlots(){
  const box=document.getElementById('ladderAutoResultSlots');if(!box)return;
  const prizes=data.miniGames.ladder.prizes,entries=miniGameRuntime.ladder.autoResultEntries||[];
  box.innerHTML=prizes.map((p,i)=>{
    const person=entries[i];
    return `<div class="ladder-auto-result-slot ${person?'revealed':''}" data-result-index="${i}">
      <div class="ladder-result-person-block">${ladderResultAvatarHTML(person)}<div><div class="ladder-result-caption">참가자</div><div class="ladder-result-person-name">${person?esc(person.name):'결과 대기'}</div></div></div>
      <div class="ladder-result-side"><div class="ladder-result-caption">결과</div><div class="result-label">${esc(p.label||`결과 ${i+1}`)}</div></div>
    </div>`
  }).join('');
}
window.renderLadderAutoResultSlots=renderLadderAutoResultSlots;

/* Larger canvas labels around the ladder. */
function drawLadder(highlightPoints=null,progress=1){
  const g=ladderGeometry();if(!g.canvas)return;const ctx=g.canvas.getContext('2d');ctx.clearRect(0,0,g.w,g.h);ctx.lineCap='round';ctx.strokeStyle='#54617a';ctx.lineWidth=4;g.xs.forEach(x=>{ctx.beginPath();ctx.moveTo(x,g.top);ctx.lineTo(x,g.bottom);ctx.stroke()});miniGameRuntime.ladder.rungs.forEach(r=>{const y=g.top+(g.bottom-g.top)*(r.row+1)/(g.rows+1);ctx.beginPath();ctx.moveTo(g.xs[r.left],y);ctx.lineTo(g.xs[r.left+1],y);ctx.stroke()});ctx.font='900 21px sans-serif';ctx.textAlign='center';ctx.fillStyle='#f5f7ff';data.miniGames.ladder.players.forEach((p,i)=>ctx.fillText(p.name.slice(0,9),g.xs[i],34));ctx.fillStyle='#ffd96a';ctx.font='900 20px sans-serif';data.miniGames.ladder.prizes.forEach((p,i)=>ctx.fillText((p.label||`결과 ${i+1}`).slice(0,10),g.xs[i],g.h-24));if(highlightPoints?.length)drawPolylineProgress(ctx,highlightPoints,progress)
}
window.drawLadder=drawLadder;

async function animateLadderPathAuto(index,duration=650){
  const player=data.miniGames.ladder.players[index],path=ladderPath(index);if(!player)return;
  miniGameRuntime.ladder.activePlayer=index;renderLadderPlayerButtons();
  await new Promise(resolve=>{const t0=performance.now();const frame=now=>{const t=Math.min(1,(now-t0)/duration);drawLadder(path.points,1-Math.pow(1-t,2.1));if(t<1)return requestAnimationFrame(frame);if(!Array.isArray(miniGameRuntime.ladder.autoResultEntries))miniGameRuntime.ladder.autoResultEntries=[];miniGameRuntime.ladder.autoResultEntries[path.resultIndex]={id:player.id,name:player.name,image:player.image||'',contactId:player.contactId||''};renderLadderAutoResultSlots();resolve()};requestAnimationFrame(frame)});
}
window.animateLadderPathAuto=animateLadderPathAuto;

window.autoStartLadder=async()=>{
  const players=data.miniGames.ladder.players,prizes=data.miniGames.ladder.prizes;
  if(players.length<2)return toast('사다리','참가자를 2명 이상 추가해 주세요');if(players.length>12)return toast('사다리','가독성을 위해 최대 12명까지 지원합니다');if(miniGameRuntime.ladder.autoRunning)return;
  ensureLadderPrizeCount();miniGameRuntime.ladder.autoRunning=true;miniGameRuntime.ladder.autoResultNames=[];miniGameRuntime.ladder.autoResultEntries=[];miniGameRuntime.ladder.generated=false;miniGameRuntime.ladder.activePlayer=-1;renderLadder();
  const status=document.getElementById('ladderStatus'),result=document.getElementById('ladderResult');result?.classList.remove('done');
  try{
    for(let i=0;i<10;i++){cryptoShuffleInPlace(players);cryptoShuffleInPlace(prizes);renderLadderOrderVisual();if(status)status.textContent=`자동 시작 · 순서 섞기 ${i+1} / 10`;await ladderSleep(38+Math.round(Math.pow(i/9,2)*150))}
    for(let i=0;i<20;i++){miniGameRuntime.ladder.rungs=makeRandomLadderRungs(players.length);miniGameRuntime.ladder.generated=true;drawLadder();if(status)status.textContent=`자동 시작 · 사다리 섞기 ${i+1} / 20`;await ladderSleep(28+Math.round(Math.pow(i/19,2.35)*235))}
    miniGameRuntime.ladder.generated=true;renderLadderPlayerButtons();if(status)status.textContent='자동 시작 · 왼쪽부터 결과 확인';if(result)result.textContent='왼쪽 참가자부터 차례대로 사다리를 내려갑니다.';
    for(let i=0;i<players.length;i++){await animateLadderPathAuto(i,Math.max(430,720-players.length*14));await ladderSleep(120)}
    miniGameRuntime.ladder.activePlayer=-1;if(status)status.textContent=`자동 사다리 완료 · ${players.length}명`;if(result){result.classList.add('done');result.textContent='모든 참가자의 결과가 공개되었습니다.'}
  }finally{miniGameRuntime.ladder.autoRunning=false;miniPersist();renderLadder()}
};

window.runLadderPath=index=>{
  if(!miniGameRuntime.ladder.generated||miniGameRuntime.ladder.animating)return;
  const player=data.miniGames.ladder.players[index],path=ladderPath(index),prize=data.miniGames.ladder.prizes[path.resultIndex];miniGameRuntime.ladder.animating=true;miniGameRuntime.ladder.activePlayer=index;renderLadderPlayerButtons();const t0=performance.now(),dur=2200;
  const frame=now=>{const t=Math.min(1,(now-t0)/dur);drawLadder(path.points,1-Math.pow(1-t,2.2));if(t<1)return requestAnimationFrame(frame);miniGameRuntime.ladder.animating=false;const result=document.getElementById('ladderResult');result.classList.add('done');result.innerHTML=`<div class="ladder-single-result"><div class="ladder-result-person-block">${ladderResultAvatarHTML(player)}<div><div class="ladder-result-caption">참가자</div><div class="ladder-result-person-name">${esc(player.name)}</div></div></div><div class="ladder-result-side"><div class="ladder-result-caption">결과</div><div class="result-label">${esc(prize?.label||`결과 ${path.resultIndex+1}`)}</div></div></div>`};requestAnimationFrame(frame)
};

/* Clear new result objects when the roster/order is changed manually. */
const generateLadderV46Base=window.generateLadder;
window.generateLadder=()=>{miniGameRuntime.ladder.autoResultEntries=[];return generateLadderV46Base()};
const shuffleLadderOrdersV46Base=window.shuffleLadderOrders;
window.shuffleLadderOrders=()=>{miniGameRuntime.ladder.autoResultEntries=[];return shuffleLadderOrdersV46Base()};

/* Contact name/photo header synchronization. */
function syncContactHeaderAvatar(){
  const name=String(document.getElementById('ctName')?.value||'').trim(),preview=document.getElementById('ctImagePreview'),headerImg=document.getElementById('ctHeaderAvatarImage'),fallback=document.getElementById('ctHeaderAvatarFallback');if(!headerImg||!fallback)return;const src=preview?.classList.contains('visible')?preview.src:'';if(src){headerImg.src=src;headerImg.style.display='block';fallback.style.display='none'}else{headerImg.style.display='none';headerImg.removeAttribute('src');fallback.style.display='grid';fallback.textContent=(name||'?').slice(0,1)}
}
document.getElementById('ctName')?.addEventListener('input',syncContactHeaderAvatar);
const resetGameRuntimeV46Base=resetGameRuntimeOnRosterChange;
resetGameRuntimeOnRosterChange=function(game){if(game==='ladder'){miniGameRuntime.ladder.autoResultEntries=[];miniGameRuntime.ladder.autoResultNames=[]}return resetGameRuntimeV46Base(game)};
const openContactV46Base=window.openContact;
window.openContact=function(id=null){openContactV46Base(id);requestAnimationFrame(syncContactHeaderAvatar)};

window.addEventListener('mawang:datachange',()=>{try{applyResolutionMode(data.resolutionMode||'fhd',false)}catch(_){}});



/* =========================================================
   v4.8 - 연락처 보정 + 모바일 UI + 본인 참가자 자동 동기화
   ========================================================= */

/* 게시글 상태 일괄 처리 */
window.bulkConfirmPostApplicants=()=>{
  const p=postById(activePostId);if(!p||!(p.comments||[]).length)return toast('게시글','확정할 신청자가 없습니다');
  const count=(p.comments||[]).filter(c=>c.status!=='selected').length;
  if(!count)return toast('게시글','이미 모든 신청자가 확정 상태입니다');
  if(!confirm(`현재 게시글의 신청자 ${p.comments.length}명을 모두 확정하시겠습니까?\n다음기회에 상태도 확정으로 변경됩니다.`))return;
  for(const c of p.comments)c.status='selected';
  syncPostContactApplicationHistories(p);saveData('게시글 신청자 전체 확정');renderPosts();toast('게시글',`${p.comments.length}명을 전체 확정했습니다`)
};
window.bulkCancelPostApplicants=()=>{
  const p=postById(activePostId);if(!p||!(p.comments||[]).length)return toast('게시글','취소할 신청자가 없습니다');
  const selected=(p.comments||[]).filter(c=>c.status==='selected').length;
  if(!selected)return toast('게시글','현재 확정된 신청자가 없습니다');
  if(!confirm(`확정된 ${selected}명의 확정을 모두 취소하고 대기 상태로 되돌리시겠습니까?\n다음기회에 상태는 그대로 유지됩니다.`))return;
  for(const c of p.comments)if(c.status==='selected')c.status='pending';
  syncPostContactApplicationHistories(p);saveData('게시글 신청자 전체 확정 취소');renderPosts();toast('게시글',`${selected}명의 확정을 취소했습니다`)
};

/* Gacha 뽑기 샘플 데이터 - 필요할 때 '샘플 참가자 10명 채우기'로 불러옵니다. */
const MULTI_DRAW_SAMPLE_PLAYERS=[
  {name:'마왕',image:'',description:'샘플 참가자 01'},{name:'루나',image:'',description:'샘플 참가자 02'},
  {name:'하치',image:'',description:'샘플 참가자 03'},{name:'유키',image:'',description:'샘플 참가자 04'},
  {name:'레오',image:'',description:'샘플 참가자 05'},{name:'미나',image:'',description:'샘플 참가자 06'},
  {name:'소라',image:'',description:'샘플 참가자 07'},{name:'렌',image:'',description:'샘플 참가자 08'},
  {name:'아리',image:'',description:'샘플 참가자 09'},{name:'제이',image:'',description:'샘플 참가자 10'}
];

miniGameRuntime.multiDraw={charging:false,animating:false,gauge:0,direction:1,lastTs:0,raf:0,winnerIds:[],currentWinnerId:'',round:0};

function multiDrawPlayers(){return data.miniGames.multiDraw?.players||[]}
function multiDrawRuntimeReset(){
  if(miniGameRuntime.multiDraw?.raf)cancelAnimationFrame(miniGameRuntime.multiDraw.raf);
  miniGameRuntime.multiDraw={charging:false,animating:false,gauge:0,direction:1,lastTs:0,raf:0,winnerIds:[],currentWinnerId:'',round:0};
}
function miniGameArray(game){
  if(game==='ladder')return data.miniGames.ladder.players;
  if(game==='rps')return data.miniGames.rps.players;
  if(game==='pachinko')return data.miniGames.pachinko.players;
  if(game==='multiDraw')return data.miniGames.multiDraw.players;
  return []
}
function resetGameRuntimeOnRosterChange(game){
  if(game==='ladder'){miniGameRuntime.ladder.generated=false;miniGameRuntime.ladder.rungs=[];miniGameRuntime.ladder.activePlayer=-1}
  if(game==='rps')resetRpsTournamentState(false);
  if(game==='pachinko')resetPachinkoState(false);
  if(game==='multiDraw')multiDrawRuntimeReset();
}
window.miniAddContact=(game,contactId)=>{
  if(!['ladder','rps','pachinko','multiDraw'].includes(game))return;
  const c=contact(contactId);if(!c)return;
  if(game==='pachinko'&&miniGameArray(game).length>=10)return toast('경마','가독성과 한 화면 표시를 위해 최대 10명까지 지원합니다');
  if(game==='multiDraw'&&miniGameArray(game).length>=150)return toast('Gacha 뽑기','최대 150명까지 지원합니다');
  if(!miniUniqueContact(game,contactId)){toast('미니게임',`${c.name}은(는) 이미 추가되어 있습니다`);return}
  const item=miniContactEntry(contactId);item.description='';miniGameArray(game).push(item);resetGameRuntimeOnRosterChange(game);miniPersist();renderMiniGame(game)
};
window.miniManualAdd=(game,inputId)=>{
  if(!['ladder','rps','multiDraw'].includes(game))return;
  const input=document.getElementById(inputId),name=String(input?.value||'').trim();if(!name)return;
  miniGameArray(game).push({id:crypto.randomUUID(),contactId:'',name,image:'',description:''});if(input)input.value='';resetGameRuntimeOnRosterChange(game);miniPersist();renderMiniGame(game)
};
window.miniRenameEntry=(game,id,value)=>{
  const x=miniGameArray(game).find(x=>x.id===id);if(!x)return;x.name=String(value||'').trim()||'참가자';miniPersist();
  if(game==='ladder'){renderLadderPlayerButtons();drawLadder()}if(game==='rps')renderRps();if(game==='pachinko')renderPachinko();if(game==='multiDraw')renderMultiDraw()
};
function renderMiniGame(game){({ladder:renderLadder,rps:renderRps,pachinko:renderPachinko,multiDraw:renderMultiDraw}[game]||(()=>{}))()}
function renderAllMiniGames(){renderLadder();renderRps();renderPachinko();renderMultiDraw()}

window.setMultiDrawTarget=value=>{
  const max=Math.max(1,multiDrawPlayers().length||150),n=Math.max(1,Math.min(max,Math.floor(Number(value)||8)));
  data.miniGames.multiDraw.targetCount=n;multiDrawRuntimeReset();miniPersist();renderMultiDraw()
};
window.resetMultiDraw=()=>{multiDrawRuntimeReset();renderMultiDraw();toast('Gacha 뽑기','선발 결과를 초기화했습니다')};
window.loadMultiDrawSample=()=>{
  if(multiDrawPlayers().length&&!confirm('현재 참가자 목록을 샘플 참가자 10명으로 교체하시겠습니까?'))return;
  data.miniGames.multiDraw.players=MULTI_DRAW_SAMPLE_PLAYERS.map(x=>({id:crypto.randomUUID(),contactId:'',name:x.name,image:x.image||'',description:x.description||''}));data.miniGames.multiDraw.targetCount=8;multiDrawRuntimeReset();miniPersist();renderMultiDraw()
};
window.copyMultiDrawResults=async()=>{
  const winners=multiDrawWinnerObjects();if(!winners.length)return toast('Gacha 뽑기','아직 당첨자가 없습니다');
  const text=winners.map((x,i)=>`${i+1}. ${x.name}`).join('\n');
  try{await navigator.clipboard.writeText(text);toast('Gacha 뽑기','당첨자 목록을 클립보드에 복사했습니다')}catch(_){prompt('아래 결과를 복사하세요',text)}
};
function multiDrawWinnerObjects(){const set=new Set(miniGameRuntime.multiDraw.winnerIds||[]);return (miniGameRuntime.multiDraw.winnerIds||[]).map(id=>multiDrawPlayers().find(x=>x.id===id)).filter(Boolean)}
function multiDrawCardHTML(player){
  if(!player)return '';
  const media=player.image?`<img src="${esc(player.image)}" alt="${esc(player.name)}">`:`<div class="gacha-card-initials">${esc(initials(player.name))}</div>`;
  return `<div class="gacha-card"><div class="gacha-card-inner"><div class="gacha-card-image">${media}</div><div class="gacha-card-info"><div class="gacha-card-kicker">SELECTED CARD</div><div class="gacha-card-name">${esc(player.name)}</div><div class="gacha-card-desc">${esc(player.description||'MAWANG RANDOM SELECT')}</div></div></div></div>`
}
function renderMultiDraw(){
  normalizeMiniGameData();renderMiniContactPalette('multiDraw');const arr=multiDrawPlayers(),rt=miniGameRuntime.multiDraw,target=Math.max(1,Math.min(arr.length||1,Number(data.miniGames.multiDraw.targetCount)||8));
  if(arr.length&&target!==data.miniGames.multiDraw.targetCount)data.miniGames.multiDraw.targetCount=target;
  const total=document.getElementById('multiDrawTotal'),ts=document.getElementById('multiDrawTargetStat'),pr=document.getElementById('multiDrawProgress'),pc=document.getElementById('multiDrawPlayerCount'),wc=document.getElementById('multiWinnerCountChip'),input=document.getElementById('multiDrawTarget');
  if(total)total.textContent=`${arr.length}명`;if(ts)ts.textContent=`${target}명`;if(pr)pr.textContent=`${rt.winnerIds.length} / ${target}`;if(pc)pc.textContent=`${arr.length}명`;if(wc)wc.textContent=`${rt.winnerIds.length}명`;if(input&&document.activeElement!==input){input.max=String(Math.max(1,arr.length));input.value=String(target)}
  const won=new Set(rt.winnerIds),list=document.getElementById('multiDrawEntryList');if(list)list.innerHTML=arr.map(x=>`<div class="mini-entry-row ${won.has(x.id)?'drawn':''}">${miniEntryAvatar(x)}<input type="text" value="${esc(x.name)}" onchange="miniRenameEntry('multiDraw','${x.id}',this.value)" ${won.has(x.id)?'disabled':''}><button class="ghost mini-delete" onclick="miniRemoveEntry('multiDraw','${x.id}')" ${rt.animating?'disabled':''}>×</button></div>`).join('')||'<div class="empty small">참가자를 추가해 주세요</div>';
  const slots=document.getElementById('multiWinnerSlots');if(slots){const winners=multiDrawWinnerObjects(),out=[];for(let i=0;i<target;i++){const p=winners[i];if(p){out.push(`<div class="multi-winner-slot"><div class="avatar">${p.image?`<img src="${esc(p.image)}">`:esc(initials(p.name))}</div><div style="min-width:0"><div class="multi-winner-order">WINNER ${String(i+1).padStart(2,'0')}</div><div class="multi-winner-name">${esc(p.name)}</div></div></div>`)}else out.push(`<div class="multi-empty-slot">${i+1}번째 카드 대기</div>`)}slots.innerHTML=out.join('')}
  const complete=arr.length>0&&rt.winnerIds.length>=target,completeBox=document.getElementById('multiDrawComplete');if(completeBox){completeBox.hidden=!complete;const names=document.getElementById('multiCompleteNames');if(names)names.textContent=multiDrawWinnerObjects().map(x=>x.name).join(' · ')}
  const btn=document.getElementById('multiFireBtn');if(btn){btn.disabled=arr.length<2||complete||rt.animating;btn.textContent=complete?'선발 완료':rt.charging?'손을 떼면 발사':'발사 버튼을 누르고 유지'}
  const status=document.getElementById('multiDrawStatus');if(status&&!rt.animating&&!rt.charging)status.textContent=complete?'목표 인원 선발 완료':arr.length<2?'참가자를 2명 이상 추가해 주세요':`${rt.winnerIds.length+1}번째 당첨 카드 대기`;
  updateMultiGaugeUI()
}
function updateMultiGaugeUI(){const rt=miniGameRuntime.multiDraw,g=Math.max(0,Math.min(1,rt.gauge||0)),fill=document.getElementById('multiGaugeFill'),pct=document.getElementById('multiGaugePct');if(fill)fill.style.width=`${(g*100).toFixed(1)}%`;if(pct)pct.textContent=`${Math.round(g*100)}%`}
function startMultiCharge(e){
  const rt=miniGameRuntime.multiDraw,arr=multiDrawPlayers(),target=Math.max(1,Math.min(arr.length||1,Number(data.miniGames.multiDraw.targetCount)||8));if(rt.animating||rt.charging||arr.length<2||rt.winnerIds.length>=target)return;
  e?.preventDefault();try{e?.currentTarget?.setPointerCapture?.(e.pointerId)}catch(_){};const stage=document.getElementById('multiDrawStage'),card=document.getElementById('multiRevealCard');stage?.classList.remove('doors-open','impact');if(card){card.classList.remove('emerge','settle');card.style.opacity='0'};rt.charging=true;rt.lastTs=performance.now();document.getElementById('multiFireBtn')?.classList.add('charging');const status=document.getElementById('multiDrawStatus');if(status)status.textContent='게이지 충전 중 · 원하는 순간에 손을 떼세요';
  const loop=now=>{if(!rt.charging)return;const dt=Math.min(.05,(now-rt.lastTs)/1000);rt.lastTs=now;rt.gauge+=rt.direction*dt*1.25;if(rt.gauge>=1){rt.gauge=1;rt.direction=-1}else if(rt.gauge<=0){rt.gauge=0;rt.direction=1}updateMultiGaugeUI();rt.raf=requestAnimationFrame(loop)};rt.raf=requestAnimationFrame(loop)
}
function stopMultiCharge(e){const rt=miniGameRuntime.multiDraw;if(!rt.charging)return;e?.preventDefault();rt.charging=false;if(rt.raf)cancelAnimationFrame(rt.raf);document.getElementById('multiFireBtn')?.classList.remove('charging');fireMultiDraw(rt.gauge)}
function chooseMultiDrawWinner(gauge){
  const rt=miniGameRuntime.multiDraw,remaining=multiDrawPlayers().filter(x=>!rt.winnerIds.includes(x.id));if(!remaining.length)return null;
  /* crypto 기반 균등 난수 + 게이지 salt. 균등 난수에 회전 오프셋을 더하는 방식이라 게이지가 결과를 바꾸지만 각 사람의 당첨 확률은 동일합니다. */
  const n=remaining.length,base=randomIntUnbiased(n),gaugeSalt=Math.floor(Math.max(0,Math.min(1,gauge))*0x100000)>>>0,cryptoSalt=cryptoUint32(),offset=((gaugeSalt^(cryptoSalt>>>9)^(cryptoSalt&0xffff))>>>0)%n,index=(base+offset)%n;return remaining[index]
}
const multiWait=ms=>new Promise(r=>setTimeout(r,ms));
async function fireMultiDraw(gauge){
  const rt=miniGameRuntime.multiDraw;if(rt.animating)return;const winner=chooseMultiDrawWinner(gauge);if(!winner)return;rt.animating=true;const stage=document.getElementById('multiDrawStage'),cannon=document.getElementById('multiCannon'),muzzle=document.getElementById('multiMuzzle'),shell=document.getElementById('multiShell'),ring=document.getElementById('multiImpactRing'),dust=document.getElementById('multiStageDust'),card=document.getElementById('multiRevealCard'),status=document.getElementById('multiDrawStatus'),btn=document.getElementById('multiFireBtn');if(btn)btn.disabled=true;if(status)status.textContent='발사!';
  stage?.classList.remove('doors-open','impact');card?.classList.remove('emerge','settle');if(card){card.style.opacity='0';card.innerHTML=multiDrawCardHTML(winner)};
  cannon?.classList.add('recoil');muzzle?.classList.add('fire');shell?.classList.add('fly');await multiWait(410);
  stage?.classList.add('impact');ring?.classList.add('boom');if(status)status.textContent='문 충돌 · 경고 시스템 작동';await multiWait(520);
  shell?.classList.remove('fly');cannon?.classList.remove('recoil');muzzle?.classList.remove('fire');ring?.classList.remove('boom');stage?.classList.add('doors-open');if(status)status.textContent='봉인 해제 · 카드 공개 중';await multiWait(430);
  if(card){card.style.opacity='';card.classList.add('emerge')}await multiWait(1000);card?.classList.remove('emerge');card?.classList.add('settle');dust?.classList.add('burst');stage?.classList.add('impact');await multiWait(560);dust?.classList.remove('burst');stage?.classList.remove('impact');
  rt.winnerIds.push(winner.id);rt.currentWinnerId=winner.id;rt.round+=1;rt.animating=false;rt.gauge=0;rt.direction=1;miniPersist();renderMultiDraw();const target=Math.max(1,Math.min(multiDrawPlayers().length,Number(data.miniGames.multiDraw.targetCount)||8));if(rt.winnerIds.length>=target){if(status)status.textContent='모든 당첨자 선발 완료';showMiniGameCelebration('SELECTION COMPLETE',`${target}명 선발 완료`)}else{if(status)status.textContent=`${winner.name} 당첨 · 다음 발사를 준비하세요`}
}
window.resetMultiDraw=()=>{const stage=document.getElementById('multiDrawStage'),card=document.getElementById('multiRevealCard');multiDrawRuntimeReset();stage?.classList.remove('doors-open','impact');if(card){card.className='multi-reveal-card';card.innerHTML=''}renderMultiDraw();toast('Gacha 뽑기','선발 결과를 초기화했습니다')};

/* pointer / touch compatible hold-to-charge */
document.addEventListener('pointerdown',e=>{if(e.target?.id==='multiFireBtn')startMultiCharge(e)});
document.addEventListener('pointerup',e=>{if(miniGameRuntime.multiDraw?.charging)stopMultiCharge(e)});
document.addEventListener('pointercancel',e=>{if(miniGameRuntime.multiDraw?.charging)stopMultiCharge(e)});

/* 게시글 → 게임 전달에 Gacha 뽑기 추가 */
const _launchPostApplicantsIntoGameV47=window.launchPostApplicantsIntoGame;
window.launchPostApplicantsIntoGame=game=>{
  if(game!=='multiDraw')return _launchPostApplicantsIntoGameV47(game);
  const p=postById(activePostId),g=POST_GAME_DEFS[game];if(!p||!g)return;const arr=uniquePostGameApplicants(p);if(arr.length<2)return toast('랜덤선별','확정된 참가자가 2명 이상 필요합니다');if(arr.length>g.cap)return toast(g.title,`확정 ${arr.length}명입니다. 최대 ${g.cap}명까지 지원합니다`);
  data.miniGames.multiDraw.players=arr.map(x=>({id:crypto.randomUUID(),contactId:x.contactId||'',name:x.name,image:x.image||'',description:''}));data.miniGames.multiDraw.targetCount=Math.min(8,arr.length);multiDrawRuntimeReset();normalizeMiniGameData();saveData('게시글 확정 신청자 → Gacha 뽑기');document.getElementById('postGamePickerModal')?.classList.remove('open');syncModalInteractionState();const tr=document.getElementById('postGameTransition');document.getElementById('postGameTransitionTitle').textContent='Gacha 뽑기';document.getElementById('postGameTransitionMeta').textContent=`확정 ${arr.length}명 · 기본 목표 ${Math.min(8,arr.length)}명`;tr?.classList.add('open');tr?.setAttribute('aria-hidden','false');setTimeout(()=>{setTab('gameMultiDraw');setTimeout(()=>{tr?.classList.remove('open');tr?.setAttribute('aria-hidden','true')},320)},650)
};

renderMultiDraw();



/* v4.8 runtime guards */
function syncContactMaintenanceLayout(){
  const board=document.querySelector('#contacts .contact-board-layout');
  if(board)board.classList.toggle('maintenance-mode',contactView==='pending'||contactView==='incomplete'||contactView==='favorite');
}
window.syncContactMaintenanceLayout=syncContactMaintenanceLayout;
window.addEventListener('mawang:datachange',()=>{try{syncContactMaintenanceLayout()}catch(_){}});



/* v4.9 - slower cinematic gacha flow + archived card dock */
function renderMultiStageWinners(){
  const rt=miniGameRuntime.multiDraw||{},box=document.getElementById('multiStageWinners'),empty=document.getElementById('multiDockEmpty'),count=document.getElementById('multiDockCount');
  if(!box)return;
  const archived=(rt.winnerIds||[]).filter(id=>id!==rt.currentWinnerId).map(id=>multiDrawPlayers().find(p=>p.id===id)).filter(Boolean);
  if(count)count.textContent=String(archived.length);
  if(empty)empty.style.display=archived.length?'none':'block';
  box.innerHTML=archived.map((p,i)=>`<div class="multi-selected-mini"><div class="thumb">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}">`:esc(initials(p.name))}</div><div class="name">${esc(p.name)}</div><div class="order">WINNER ${String(i+1).padStart(2,'0')}</div></div>`).join('');
}

const _renderMultiDrawV49Base=renderMultiDraw;
renderMultiDraw=function(){
  _renderMultiDrawV49Base();
  renderMultiStageWinners();
  const rt=miniGameRuntime.multiDraw,card=document.getElementById('multiRevealCard');
  if(card&&rt.currentWinnerId&&!rt.animating&&!card.innerHTML){const p=multiDrawPlayers().find(x=>x.id===rt.currentWinnerId);if(p){card.innerHTML=multiDrawCardHTML(p);card.style.opacity='1';card.classList.add('settle')}}
};

function playMultiSiren(duration=1500){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const ac=new AC(),gain=ac.createGain(),osc=ac.createOscillator(),lfo=ac.createOscillator(),depth=ac.createGain();
    osc.type='sawtooth';osc.frequency.value=690;lfo.type='sine';lfo.frequency.value=2.35;depth.gain.value=170;
    lfo.connect(depth);depth.connect(osc.frequency);osc.connect(gain);gain.connect(ac.destination);
    const t=ac.currentTime;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.035,t+.06);gain.gain.setValueAtTime(.035,t+duration/1000-.12);gain.gain.exponentialRampToValueAtTime(.0001,t+duration/1000);
    osc.start(t);lfo.start(t);osc.stop(t+duration/1000+.03);lfo.stop(t+duration/1000+.03);setTimeout(()=>ac.close().catch(()=>{}),duration+350)
  }catch(_){}
}

async function archiveCurrentMultiCard(){
  const rt=miniGameRuntime.multiDraw,card=document.getElementById('multiRevealCard'),dock=document.getElementById('multiSelectedDock');
  if(!rt.currentWinnerId||!card||!dock||!card.innerHTML)return;
  const cr=card.getBoundingClientRect(),dr=dock.getBoundingClientRect();
  const dx=(dr.left+dr.width*.52)-(cr.left+cr.width/2),dy=(dr.top+Math.min(160,dr.height*.32))-(cr.top+cr.height/2);
  card.classList.add('archiving');
  try{await card.animate([
    {transform:'translate(-50%,-44%) translateZ(92px) scale(1.025)',opacity:1,filter:'brightness(1)'},
    {offset:.25,transform:'translate(-50%,-48%) translateZ(130px) scale(1.08)',opacity:1,filter:'brightness(1.18)'},
    {transform:`translate(calc(-50% + ${dx}px),calc(-44% + ${dy}px)) translateZ(0) scale(.28)`,opacity:.15,filter:'brightness(.8)'}
  ],{duration:780,easing:'cubic-bezier(.2,.78,.18,1)',fill:'forwards'}).finished}catch(_){}
  rt.currentWinnerId='';card.getAnimations().forEach(a=>a.cancel());card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0';renderMultiStageWinners();
}

function resetMultiStageVisuals(){
  const stage=document.getElementById('multiDrawStage'),card=document.getElementById('multiRevealCard');
  stage?.classList.remove('doors-open','impact','alarm','smoke','light-leak');
  if(card&&!miniGameRuntime.multiDraw.currentWinnerId){card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0'}
}

startMultiCharge=function(e){
  const rt=miniGameRuntime.multiDraw,arr=multiDrawPlayers(),target=Math.max(1,Math.min(arr.length||1,Number(data.miniGames.multiDraw.targetCount)||8));if(rt.animating||rt.charging||arr.length<2||rt.winnerIds.length>=target)return;
  e?.preventDefault();try{e?.currentTarget?.setPointerCapture?.(e.pointerId)}catch(_){}
  if(rt.currentWinnerId)rt.archivePromise=archiveCurrentMultiCard();
  resetMultiStageVisuals();
  rt.charging=true;rt.lastTs=performance.now();document.getElementById('multiFireBtn')?.classList.add('charging');const status=document.getElementById('multiDrawStatus');if(status)status.textContent='게이지 충전 중 · 원하는 순간에 손을 떼세요';
  const loop=now=>{if(!rt.charging)return;const dt=Math.min(.05,(now-rt.lastTs)/1000);rt.lastTs=now;rt.gauge+=rt.direction*dt*.92;if(rt.gauge>=1){rt.gauge=1;rt.direction=-1}else if(rt.gauge<=0){rt.gauge=0;rt.direction=1}updateMultiGaugeUI();rt.raf=requestAnimationFrame(loop)};rt.raf=requestAnimationFrame(loop)
};

fireMultiDraw=async function(gauge){
  const rt=miniGameRuntime.multiDraw;if(rt.animating)return;
  rt.animating=true;
  if(rt.archivePromise){try{await rt.archivePromise}catch(_){}rt.archivePromise=null}
  const winner=chooseMultiDrawWinner(gauge);if(!winner){rt.animating=false;return}
  const stage=document.getElementById('multiDrawStage'),cannon=document.getElementById('multiCannon'),muzzle=document.getElementById('multiMuzzle'),shell=document.getElementById('multiShell'),ring=document.getElementById('multiImpactRing'),dust=document.getElementById('multiStageDust'),card=document.getElementById('multiRevealCard'),status=document.getElementById('multiDrawStatus'),btn=document.getElementById('multiFireBtn');
  if(btn)btn.disabled=true;
  resetMultiStageVisuals();
  if(card){card.className='multi-reveal-card';card.style.opacity='0';card.innerHTML=multiDrawCardHTML(winner)}

  // 1. 대포 발사
  if(status)status.textContent='발사!';cannon?.classList.add('recoil');muzzle?.classList.add('fire');shell?.classList.add('fly');await multiWait(700);
  // 2. 문 충돌 + 화면 흔들림 + 사이렌
  stage?.classList.add('impact','alarm');ring?.classList.add('boom');playMultiSiren(1550);if(status)status.textContent='충돌 감지 · 경고 사이렌 작동';await multiWait(1450);
  shell?.classList.remove('fly');cannon?.classList.remove('recoil');muzzle?.classList.remove('fire');ring?.classList.remove('boom');stage?.classList.remove('impact');
  // 3. 긴장감 있는 정적 후 문틈 연기
  if(status)status.textContent='봉인 압력 상승...';await multiWait(650);stage?.classList.add('smoke');if(status)status.textContent='문틈에서 연기가 새어 나옵니다';await multiWait(1150);
  // 4. 빛이 문틈에서 새어나옴
  stage?.classList.remove('alarm');stage?.classList.add('light-leak');if(status)status.textContent='내부 에너지 반응 · 빛이 새어 나옵니다';await multiWait(1050);
  // 5. 문 천천히 개방
  stage?.classList.add('doors-open');if(status)status.textContent='봉인문 개방 중...';await multiWait(1550);
  // 6. 카드 천천히 등장
  if(card){card.style.opacity='';card.classList.add('emerge')}if(status)status.textContent='당첨 카드 확인 중...';await multiWait(1800);
  card?.classList.remove('emerge');card?.classList.add('settle');dust?.classList.add('burst');stage?.classList.add('impact');await multiWait(760);dust?.classList.remove('burst');stage?.classList.remove('impact','smoke');

  rt.winnerIds.push(winner.id);rt.currentWinnerId=winner.id;rt.round+=1;rt.animating=false;rt.gauge=0;rt.direction=1;miniPersist();renderMultiDraw();
  const target=Math.max(1,Math.min(multiDrawPlayers().length,Number(data.miniGames.multiDraw.targetCount)||8));
  if(rt.winnerIds.length>=target){if(status)status.textContent='모든 당첨자 선발 완료';showMiniGameCelebration('SELECTION COMPLETE',`${target}명 선발 완료`)}else{if(status)status.textContent=`${winner.name} 당첨 · 다음 발사를 누르면 카드가 오른쪽 보관함으로 이동합니다`}
};

window.resetMultiDraw=()=>{const card=document.getElementById('multiRevealCard');multiDrawRuntimeReset();resetMultiStageVisuals();if(card){card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0'}renderMultiDraw();toast('Gacha 뽑기','선발 결과를 초기화했습니다')};



/* =========================================================
   v4.10 - mobile drawer behavior
   ========================================================= */
function isMobileResolution(){return document.body.dataset.resolution==='mobile'}
function setMobileDrawer(open){
  const shouldOpen=Boolean(open)&&isMobileResolution();
  document.body.classList.toggle('mobile-drawer-open',shouldOpen);
  const btn=document.getElementById('mobileNavToggle');
  const backdrop=document.getElementById('mobileNavBackdrop');
  if(btn){btn.setAttribute('aria-expanded',shouldOpen?'true':'false');btn.setAttribute('aria-label',shouldOpen?'메뉴 닫기':'메뉴 열기');btn.title=shouldOpen?'메뉴 닫기':'메뉴 열기'}
  if(backdrop)backdrop.setAttribute('aria-hidden',shouldOpen?'false':'true');
}
window.setMobileDrawer=setMobileDrawer;
window.toggleMobileDrawer=()=>setMobileDrawer(!document.body.classList.contains('mobile-drawer-open'));

document.getElementById('mobileNavToggle')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.toggleMobileDrawer()});
document.getElementById('mobileNavBackdrop')?.addEventListener('click',()=>setMobileDrawer(false));

/* Selecting any category closes the drawer immediately. */
document.querySelectorAll('.sidebar [data-tab]').forEach(btn=>{
  btn.addEventListener('click',()=>{if(isMobileResolution())setTimeout(()=>setMobileDrawer(false),0)})
});

/* ESC closes the drawer without interfering with existing modal ESC behavior. */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&isMobileResolution()&&document.body.classList.contains('mobile-drawer-open')){
    setMobileDrawer(false);
  }
},{capture:true});

/* Resolution changes must never leave an invisible drawer state behind. */
const applyResolutionModeV410Base=window.applyResolutionMode;
window.applyResolutionMode=function(mode,writeData=true){
  applyResolutionModeV410Base(mode,writeData);
  if(mode!=='mobile')setMobileDrawer(false);
  else requestAnimationFrame(()=>setMobileDrawer(false));
};
const setResolutionModeV410Base=window.setResolutionMode;
window.setResolutionMode=mode=>{
  window.applyResolutionMode(mode,true);
  mwsSaveDevicePrefs(data);
};

/* Re-apply current preset once after the new drawer bindings are installed. */
window.applyResolutionMode(data.resolutionMode||'fhd',false);


/* =========================================================
   v4.11 - headbutt gacha cinematic flow
   ========================================================= */
async function archiveCurrentMultiCardV411(){
  const rt=miniGameRuntime.multiDraw,card=document.getElementById('multiRevealCard'),dock=document.getElementById('multiSelectedDock');
  if(!rt.currentWinnerId||!card||!dock||!card.innerHTML)return;
  const cr=card.getBoundingClientRect(),list=document.getElementById('multiStageWinners'),lr=(list||dock).getBoundingClientRect();
  const dx=(lr.left+Math.min(lr.width*.38,120))-(cr.left+cr.width/2),dy=(lr.top+Math.min(150,lr.height*.22))-(cr.top+cr.height/2);
  try{await card.animate([
    {offset:0,transform:'translate(-50%,-48%) translateZ(122px) scale(1.02)',opacity:1,filter:'brightness(1)'},
    {offset:.22,transform:'translate(-50%,-49%) translateZ(155px) scale(1.07)',opacity:1,filter:'brightness(1.16)'},
    {offset:.58,transform:`translate(calc(-50% + ${dx*.58}px),calc(-48% + ${dy*.58}px)) translateZ(45px) scale(.57)`,opacity:.94,filter:'brightness(1)'},
    {offset:1,transform:`translate(calc(-50% + ${dx}px),calc(-48% + ${dy}px)) translateZ(0) scale(.27)`,opacity:.16,filter:'brightness(.82)'}
  ],{duration:1050,easing:'cubic-bezier(.19,.78,.18,1)',fill:'forwards'}).finished}catch(_){ }
  rt.currentWinnerId='';
  card.getAnimations().forEach(a=>a.cancel());card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0';
  renderMultiStageWinners();
}

function resetMultiStageVisualsV411(){
  const stage=document.getElementById('multiDrawStage'),card=document.getElementById('multiRevealCard');
  stage?.classList.remove('doors-open','impact','smoke','light-leak');
  document.getElementById('multiImpactRing')?.classList.remove('boom');
  document.getElementById('multiImpactFlash')?.classList.remove('boom');
  document.getElementById('multiHeadbuttSpark')?.classList.remove('boom');
  if(card&&!miniGameRuntime.multiDraw.currentWinnerId){card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0'}
}

async function playMascotHeadbuttV411(){
  const actor=document.getElementById('multiMascotActor'),door=document.getElementById('multiDoorFrame');
  if(!actor||!door){await multiWait(820);return}
  const ar=actor.getBoundingClientRect(),dr=door.getBoundingClientRect();
  const travel=Math.max(110,dr.left-ar.right+55);
  let dash;
  try{dash=actor.animate([
    {offset:0,transform:'translate3d(0,0,0) rotate(0deg) scale(1)',filter:'drop-shadow(0 24px 24px rgba(0,0,0,.48))'},
    {offset:.22,transform:'translate3d(-22px,5px,0) rotate(4deg) scale(.97)',filter:'drop-shadow(0 24px 24px rgba(0,0,0,.48))'},
    {offset:.58,transform:`translate3d(${travel*.72}px,-3px,0) rotate(-8deg) scale(1.06)`,filter:'drop-shadow(-18px 20px 15px rgba(0,0,0,.4))'},
    {offset:1,transform:`translate3d(${travel}px,0,0) rotate(-15deg) scale(1.09)`,filter:'drop-shadow(-25px 16px 12px rgba(0,0,0,.36))'}
  ],{duration:900,easing:'cubic-bezier(.18,.76,.15,1)',fill:'forwards'});await dash.finished}catch(_){await multiWait(900)}
  document.getElementById('multiHeadbuttSpark')?.classList.add('boom');
  const back=actor.animate([
    {transform:`translate3d(${travel}px,0,0) rotate(-15deg) scale(1.09)`},
    {offset:.22,transform:`translate3d(${travel-28}px,8px,0) rotate(8deg) scale(.96)`},
    {offset:.58,transform:'translate3d(-16px,3px,0) rotate(4deg) scale(.98)'},
    {transform:'translate3d(0,0,0) rotate(0deg) scale(1)'}
  ],{duration:760,easing:'cubic-bezier(.16,.75,.2,1)',fill:'forwards'});
  back.finished.then(()=>{back.cancel();actor.style.transform=''}).catch(()=>{});
}

startMultiCharge=function(e){
  const rt=miniGameRuntime.multiDraw,arr=multiDrawPlayers(),target=Math.max(1,Math.min(arr.length||1,Number(data.miniGames.multiDraw.targetCount)||8));
  if(rt.animating||rt.charging||arr.length<2||rt.winnerIds.length>=target)return;
  e?.preventDefault();try{e?.currentTarget?.setPointerCapture?.(e.pointerId)}catch(_){ }
  if(rt.currentWinnerId)rt.archivePromise=archiveCurrentMultiCardV411();
  resetMultiStageVisualsV411();
  rt.charging=true;rt.lastTs=performance.now();document.getElementById('multiFireBtn')?.classList.add('charging');
  const status=document.getElementById('multiDrawStatus');if(status)status.textContent='게이지 충전 중 · 손을 떼면 박치기합니다';
  const loop=now=>{if(!rt.charging)return;const dt=Math.min(.05,(now-rt.lastTs)/1000);rt.lastTs=now;rt.gauge+=rt.direction*dt*.9;if(rt.gauge>=1){rt.gauge=1;rt.direction=-1}else if(rt.gauge<=0){rt.gauge=0;rt.direction=1}updateMultiGaugeUI();rt.raf=requestAnimationFrame(loop)};rt.raf=requestAnimationFrame(loop)
};

fireMultiDraw=async function(gauge){
  const rt=miniGameRuntime.multiDraw;if(rt.animating)return;
  rt.animating=true;
  if(rt.archivePromise){try{await rt.archivePromise}catch(_){ }rt.archivePromise=null}
  const winner=chooseMultiDrawWinner(gauge);if(!winner){rt.animating=false;return}
  const stage=document.getElementById('multiDrawStage'),ring=document.getElementById('multiImpactRing'),flash=document.getElementById('multiImpactFlash'),dust=document.getElementById('multiStageDust'),card=document.getElementById('multiRevealCard'),status=document.getElementById('multiDrawStatus'),btn=document.getElementById('multiFireBtn');
  if(btn)btn.disabled=true;resetMultiStageVisualsV411();
  if(card){card.className='multi-reveal-card';card.style.opacity='0';card.innerHTML=multiDrawCardHTML(winner)}

  // 1. 왼쪽 마스코트가 봉인문으로 박치기
  if(status)status.textContent='돌진 준비...';await multiWait(300);
  const hitPromise=playMascotHeadbuttV411();
  await multiWait(880);
  stage?.classList.add('impact');ring?.classList.add('boom');flash?.classList.add('boom');if(status)status.textContent='강한 충돌 · 봉인문이 흔들립니다';
  await multiWait(680);stage?.classList.remove('impact');ring?.classList.remove('boom');flash?.classList.remove('boom');
  try{await hitPromise}catch(_){ }

  // 2. 문틈에서 짙은 연기가 충분히 새어 나옴
  if(status)status.textContent='문틈에서 연기가 쏟아집니다...';stage?.classList.add('smoke');await multiWait(1750);

  // 3. 현실적인 백색/보랏빛 광원이 점차 강해짐
  stage?.classList.add('light-leak');if(status)status.textContent='내부 광원이 문틈을 밀어냅니다...';await multiWait(1500);

  // 4. 거대한 문이 천천히 열림
  stage?.classList.add('doors-open');if(status)status.textContent='봉인문 개방 중...';await multiWait(2150);

  // 5. 큰 카드가 문 안쪽에서 천천히 전진
  if(card){card.style.opacity='';card.classList.add('emerge')}if(status)status.textContent='당첨 카드 공개 중...';await multiWait(2300);
  card?.classList.remove('emerge');card?.classList.add('settle');dust?.classList.add('burst');stage?.classList.add('impact');await multiWait(850);dust?.classList.remove('burst');stage?.classList.remove('impact','smoke');

  rt.winnerIds.push(winner.id);rt.currentWinnerId=winner.id;rt.round+=1;rt.animating=false;rt.gauge=0;rt.direction=1;miniPersist();renderMultiDraw();
  const target=Math.max(1,Math.min(multiDrawPlayers().length,Number(data.miniGames.multiDraw.targetCount)||8));
  if(rt.winnerIds.length>=target){if(status)status.textContent='모든 당첨자 선발 완료';showMiniGameCelebration('SELECTION COMPLETE',`${target}명 선발 완료`)}
  else if(status)status.textContent=`${winner.name} 당첨 · 다음 발사 버튼을 누르면 이 카드는 오른쪽으로 이동합니다`
};

const _renderMultiDrawV411Base=renderMultiDraw;
renderMultiDraw=function(){
  _renderMultiDrawV411Base();
  renderMultiStageWinners();
  const rt=miniGameRuntime.multiDraw,card=document.getElementById('multiRevealCard');
  if(card&&rt.currentWinnerId&&!rt.animating&&!card.innerHTML){const p=multiDrawPlayers().find(x=>x.id===rt.currentWinnerId);if(p){card.innerHTML=multiDrawCardHTML(p);card.style.opacity='1';card.classList.add('settle')}}
  const btn=document.getElementById('multiFireBtn');if(btn&&!btn.disabled){btn.textContent=rt.charging?'손을 떼면 박치기':'발사 버튼을 누르고 유지'}
};

window.resetMultiDraw=()=>{const card=document.getElementById('multiRevealCard');multiDrawRuntimeReset();resetMultiStageVisualsV411();if(card){card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0'}renderMultiDraw();toast('Gacha 뽑기','선발 결과를 초기화했습니다')};

/* 본인은 최근 합방/랭킹에 절대 노출하지 않도록 후처리도 보강. */
const _sniperFilteredContactsV411=sniperFilteredContacts;
sniperFilteredContacts=function(){return _sniperFilteredContactsV411().filter(c=>c.id!==data.selfContactId)};
const _rankingRowsV411=rankingRows;
rankingRows=function(){return _rankingRowsV411().filter(x=>x.contact.id!==data.selfContactId).map((x,i)=>({...x,rank:i+1}))};



/* =========================================================
   v4.12 - theater stage gacha flow + layout refinements
   ========================================================= */
function renderMultiStageWinnersV412(){
  const rt=miniGameRuntime.multiDraw||{},box=document.getElementById('multiStageWinners'),empty=document.getElementById('multiDockEmpty'),count=document.getElementById('multiDockCount');
  if(!box)return;
  const archived=(rt.winnerIds||[]).filter(id=>id!==rt.currentWinnerId).map(id=>multiDrawPlayers().find(p=>p.id===id)).filter(Boolean);
  if(count)count.textContent=String(archived.length);
  if(empty)empty.style.display=archived.length?'none':'block';
  box.innerHTML=archived.map((p,i)=>`<div class="multi-selected-mini"><div class="thumb">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}">`:esc(initials(p.name))}</div><div style="min-width:0"><div class="name">${esc(p.name)}</div><div class="order">WINNER ${String(i+1).padStart(2,'0')}</div></div></div>`).join('');
}

async function archiveCurrentMultiCardV412(){
  const rt=miniGameRuntime.multiDraw,card=document.getElementById('multiRevealCard'),list=document.getElementById('multiStageWinners');
  if(!rt.currentWinnerId||!card||!list||!card.innerHTML)return;
  const cr=card.getBoundingClientRect(),lr=list.getBoundingClientRect();
  const dx=(lr.left+Math.min(116,lr.width*.42))-(cr.left+cr.width/2),dy=(lr.top+Math.min(110,lr.height*.2))-(cr.top+cr.height/2);
  try{await card.animate([
    {offset:0,transform:'translate(-50%,-50%) scale(1)',opacity:1,filter:'brightness(1)'},
    {offset:.24,transform:'translate(-50%,-53%) scale(1.05)',opacity:1,filter:'brightness(1.12)'},
    {offset:.68,transform:`translate(calc(-50% + ${dx*.72}px),calc(-50% + ${dy*.72}px)) scale(.48)`,opacity:.95,filter:'brightness(1)'},
    {offset:1,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.24)`,opacity:.08,filter:'brightness(.8)'}
  ],{duration:980,easing:'cubic-bezier(.2,.8,.18,1)',fill:'forwards'}).finished}catch(_){ }
  rt.currentWinnerId='';
  card.getAnimations().forEach(a=>a.cancel());
  card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0';
  renderMultiStageWinnersV412();
}

function resetMultiStageVisualsV412(){
  const stage=document.getElementById('multiDrawStage'),card=document.getElementById('multiRevealCard');
  if(stage)stage.classList.remove('praise-charge','smoke','light-reveal','curtain-open','impact','card-settled');
  document.getElementById('multiImpactRing')?.classList.remove('boom');
  document.getElementById('multiImpactFlash')?.classList.remove('boom');
  document.getElementById('multiStageDust')?.classList.remove('burst');
  if(card&&!miniGameRuntime.multiDraw.currentWinnerId){card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0'}
}

startMultiCharge=function(e){
  const rt=miniGameRuntime.multiDraw,arr=multiDrawPlayers(),target=Math.max(1,Math.min(arr.length||1,Number(data.miniGames.multiDraw.targetCount)||8));
  if(rt.animating||rt.charging||arr.length<2||rt.winnerIds.length>=target)return;
  e?.preventDefault();try{e?.currentTarget?.setPointerCapture?.(e.pointerId)}catch(_){ }
  if(rt.currentWinnerId)rt.archivePromise=archiveCurrentMultiCardV412();
  resetMultiStageVisualsV412();
  document.getElementById('multiDrawStage')?.classList.add('praise-charge');
  rt.charging=true;rt.lastTs=performance.now();document.getElementById('multiFireBtn')?.classList.add('charging');
  const status=document.getElementById('multiDrawStatus');if(status)status.textContent='마로롱을 칭찬하는 중 · 손을 떼면 커튼 연출이 시작됩니다';
  const loop=now=>{if(!rt.charging)return;const dt=Math.min(.05,(now-rt.lastTs)/1000);rt.lastTs=now;rt.gauge+=rt.direction*dt*.82;if(rt.gauge>=1){rt.gauge=1;rt.direction=-1}else if(rt.gauge<=0){rt.gauge=0;rt.direction=1}updateMultiGaugeUI();rt.raf=requestAnimationFrame(loop)};rt.raf=requestAnimationFrame(loop)
};

fireMultiDraw=async function(gauge){
  const rt=miniGameRuntime.multiDraw;if(rt.animating)return;
  rt.animating=true;
  if(rt.archivePromise){try{await rt.archivePromise}catch(_){ }rt.archivePromise=null}
  const winner=chooseMultiDrawWinner(gauge);if(!winner){rt.animating=false;return}
  const stage=document.getElementById('multiDrawStage'),ring=document.getElementById('multiImpactRing'),flash=document.getElementById('multiImpactFlash'),dust=document.getElementById('multiStageDust'),card=document.getElementById('multiRevealCard'),status=document.getElementById('multiDrawStatus'),btn=document.getElementById('multiFireBtn');
  if(btn)btn.disabled=true;
  resetMultiStageVisualsV412();
  if(card){card.className='multi-reveal-card';card.style.opacity='0';card.innerHTML=multiDrawCardHTML(winner)}

  if(status)status.textContent='무대 뒤가 조용해지고 있습니다...';
  await multiWait(380);

  if(status)status.textContent='커튼 사이와 바닥에서 연기가 피어오릅니다';
  stage?.classList.add('smoke');
  await multiWait(1650);

  if(status)status.textContent='조명이 켜지며 무대가 깨어납니다';
  stage?.classList.add('light-reveal');ring?.classList.add('boom');flash?.classList.add('boom');
  await multiWait(1350);

  if(status)status.textContent='커튼 오픈 중...';
  stage?.classList.add('curtain-open');stage?.classList.add('impact');
  await multiWait(2100);
  stage?.classList.remove('impact');ring?.classList.remove('boom');flash?.classList.remove('boom');

  if(status)status.textContent='당첨 카드가 공개됩니다';
  if(card){card.style.opacity='1';card.classList.add('emerge')}
  await multiWait(1900);

  card?.classList.remove('emerge');card?.classList.add('settle');stage?.classList.add('card-settled','impact');dust?.classList.add('burst');
  if(status)status.textContent=`${winner.name} 당첨`;
  await multiWait(900);
  stage?.classList.remove('impact');dust?.classList.remove('burst');

  rt.winnerIds.push(winner.id);rt.currentWinnerId=winner.id;rt.round+=1;rt.animating=false;rt.gauge=0;rt.direction=1;miniPersist();renderMultiDraw();
  const target=Math.max(1,Math.min(multiDrawPlayers().length,Number(data.miniGames.multiDraw.targetCount)||8));
  if(rt.winnerIds.length>=target){if(status)status.textContent='모든 당첨자 선발 완료';showMiniGameCelebration('SELECTION COMPLETE',`${target}명 선발 완료`)}
  else if(status)status.textContent=`${winner.name} 당첨 · 다음 칭찬을 시작하면 이 카드가 오른쪽으로 이동합니다`;
};

const _renderMultiDrawV412Base=renderMultiDraw;
renderMultiDraw=function(){
  _renderMultiDrawV412Base();
  renderMultiStageWinnersV412();
  const rt=miniGameRuntime.multiDraw,card=document.getElementById('multiRevealCard'),btn=document.getElementById('multiFireBtn'),status=document.getElementById('multiDrawStatus');
  if(card&&rt.currentWinnerId&&!rt.animating&&!card.innerHTML){const p=multiDrawPlayers().find(x=>x.id===rt.currentWinnerId);if(p){card.innerHTML=multiDrawCardHTML(p);card.style.opacity='1';card.classList.add('settle')}}
  if(btn&&!btn.disabled)btn.textContent=rt.charging?'손을 떼면 무대 오픈':'마로롱 칭찬하기';
  const arr=multiDrawPlayers(),target=Math.max(1,Math.min(arr.length||1,Number(data.miniGames.multiDraw.targetCount)||8)),complete=arr.length>0&&rt.winnerIds.length>=target;
  if(status&&!rt.animating&&!rt.charging){
    if(complete)status.textContent='모든 당첨자 선발 완료';
    else if(arr.length<2)status.textContent='참가자를 2명 이상 추가해 주세요';
    else if(rt.currentWinnerId)status.textContent='다음 칭찬을 시작하면 현재 카드가 오른쪽 보관함으로 이동합니다';
    else status.textContent='마로롱 칭찬하기 버튼을 누르고 유지하세요';
  }
};

window.resetMultiDraw=()=>{const card=document.getElementById('multiRevealCard');multiDrawRuntimeReset();resetMultiStageVisualsV412();if(card){card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0'}renderMultiDraw();toast('Gacha 뽑기','선발 결과를 초기화했습니다')};
renderMultiDraw();



/* =========================================================
   v4.13 - ladder summary + theater gacha refresh
   ========================================================= */
function ladderAllResults(){
  const prizes=data.miniGames.ladder.prizes||[];
  const entries=miniGameRuntime.ladder.autoResultEntries||[];
  return prizes.map((p,i)=>({resultIndex:i,label:p?.label||`결과 ${i+1}`,player:entries[i]||null}));
}
function renderLadderFullResultList(){
  const box=document.getElementById('ladderFullResultList'),chip=document.getElementById('ladderSummaryCountChip');
  if(!box)return;
  const rows=ladderAllResults();
  const resolved=rows.filter(r=>r.player).length;
  if(chip)chip.textContent=`${resolved}건`;
  if(!rows.length){box.innerHTML='<div class="ladder-summary-empty">참가자를 추가하면 결과 요약이 여기에 표시됩니다.</div>';return}
  box.innerHTML=rows.map((r,i)=>`<div class="ladder-full-result-row ${r.player?'revealed':''}"><div class="ladder-full-result-left">${ladderResultAvatarHTML(r.player)}<div style="min-width:0"><div class="ladder-full-result-meta">참가자</div><div class="ladder-full-result-name">${r.player?esc(r.player.name):`${i+1}번째 결과 대기`}</div></div></div><div class="ladder-full-result-right"><div class="ladder-full-result-caption">결과</div><div class="ladder-full-result-label">${esc(r.label)}</div></div></div>`).join('');
}
window.renderLadderFullResultList=renderLadderFullResultList;
const _renderLadderV413Base=renderLadder;
renderLadder=function(){_renderLadderV413Base();renderLadderFullResultList()};
window.renderLadder=renderLadder;
window.resetLadderBoard=()=>{
  miniGameRuntime.ladder.generated=false;
  miniGameRuntime.ladder.rungs=[];
  miniGameRuntime.ladder.activePlayer=-1;
  miniGameRuntime.ladder.animating=false;
  miniGameRuntime.ladder.autoRunning=false;
  miniGameRuntime.ladder.autoResultEntries=[];
  miniGameRuntime.ladder.autoResultNames=[];
  const result=document.getElementById('ladderResult');
  if(result){result.classList.remove('done');result.textContent='자동 시작을 누르면 참가자별 결과가 공개됩니다.'}
  const status=document.getElementById('ladderStatus');
  if(status)status.textContent='초기화 완료 · 자동 시작으로 다시 진행할 수 있습니다';
  renderLadderPlayerButtons();
  drawLadder();
  renderLadderAutoResultSlots();
  renderLadderFullResultList();
  miniPersist();
  toast('사다리타기','현재 게임 상태를 초기화했습니다');
};
const _animateLadderPathAutoV413=animateLadderPathAuto;
animateLadderPathAuto=async function(index,duration=650){const out=await _animateLadderPathAutoV413(index,duration);renderLadderFullResultList();return out};
window.animateLadderPathAuto=animateLadderPathAuto;
const _runLadderPathV413=window.runLadderPath;
window.runLadderPath=index=>{
  if(!miniGameRuntime.ladder.generated||miniGameRuntime.ladder.animating)return;
  const player=data.miniGames.ladder.players[index],path=ladderPath(index);
  if(!player)return;
  if(!Array.isArray(miniGameRuntime.ladder.autoResultEntries))miniGameRuntime.ladder.autoResultEntries=[];
  miniGameRuntime.ladder.autoResultEntries[path.resultIndex]={id:player.id,name:player.name,image:player.image||'',contactId:player.contactId||''};
  renderLadderAutoResultSlots();renderLadderFullResultList();
  return _runLadderPathV413(index);
};
const _shuffleLadderOrdersV413=window.shuffleLadderOrders;
window.shuffleLadderOrders=()=>{miniGameRuntime.ladder.autoResultEntries=[];const r=_shuffleLadderOrdersV413();renderLadderFullResultList();return r};
const _generateLadderV413=window.generateLadder;
window.generateLadder=()=>{miniGameRuntime.ladder.autoResultEntries=[];const r=_generateLadderV413();renderLadderFullResultList();return r};

function playSpotlightCue(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const ac=new AC();
    const master=ac.createGain();master.gain.value=.0001;master.connect(ac.destination);
    const t=ac.currentTime;
    master.gain.exponentialRampToValueAtTime(.05,t+.02);master.gain.exponentialRampToValueAtTime(.0001,t+.7);
    const o1=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter();
    o1.type='triangle';o2.type='sine';o1.frequency.setValueAtTime(740,t);o1.frequency.exponentialRampToValueAtTime(1160,t+.25);o2.frequency.setValueAtTime(1480,t);o2.frequency.exponentialRampToValueAtTime(980,t+.35);
    f.type='lowpass';f.frequency.value=1800;
    o1.connect(f);o2.connect(f);f.connect(master);o1.start(t);o2.start(t+.02);o1.stop(t+.72);o2.stop(t+.66);
    setTimeout(()=>ac.close().catch(()=>{}),1100);
  }catch(_){ }
}
function renderMultiStageWinnersV413(){
  const rt=miniGameRuntime.multiDraw||{},box=document.getElementById('multiStageWinners'),empty=document.getElementById('multiDockEmpty'),count=document.getElementById('multiDockCount');
  if(!box)return;
  const archived=(rt.winnerIds||[]).filter(id=>id!==rt.currentWinnerId).map(id=>multiDrawPlayers().find(p=>p.id===id)).filter(Boolean);
  if(count)count.textContent=String(archived.length);
  if(empty)empty.style.display=archived.length?'none':'block';
  box.innerHTML=archived.map((p,i)=>`<div class="multi-selected-mini"><div class="thumb">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}">`:esc(initials(p.name))}</div><div style="min-width:0"><div class="name">${esc(p.name)}</div><div class="order">WINNER ${String(i+1).padStart(2,'0')}</div></div></div>`).join('');
}
function resetMultiStageVisualsV413(preserveCurrent=false){
  const stage=document.getElementById('multiDrawStage'),card=document.getElementById('multiRevealCard');
  stage?.classList.remove('praise-charge','smoke','light-reveal','curtain-open','impact','card-settled','flash');
  if(card&&!preserveCurrent){card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0'}
}
async function archiveCurrentMultiCardV413(){
  const rt=miniGameRuntime.multiDraw,card=document.getElementById('multiRevealCard'),list=document.getElementById('multiStageWinners');
  if(!rt.currentWinnerId||!card||!list||!card.innerHTML)return;
  const cr=card.getBoundingClientRect(),lr=list.getBoundingClientRect();
  const dx=(lr.left+Math.min(105,lr.width*.36))-(cr.left+cr.width/2),dy=(lr.top+Math.min(86,lr.height*.18))-(cr.top+cr.height/2);
  try{await card.animate([
    {transform:'translate(-50%,-50%) scale(1)',opacity:1,filter:'brightness(1)'},
    {offset:.28,transform:'translate(-50%,-54%) scale(1.04)',opacity:1,filter:'brightness(1.08)'},
    {offset:.7,transform:`translate(calc(-50% + ${dx*.78}px),calc(-50% + ${dy*.78}px)) scale(.52)`,opacity:.96,filter:'brightness(1)'},
    {offset:1,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.24)`,opacity:.08,filter:'brightness(.84)'}
  ],{duration:1000,easing:'cubic-bezier(.19,.8,.16,1)',fill:'forwards'}).finished}catch(_){ }
  rt.currentWinnerId='';
  card.getAnimations().forEach(a=>a.cancel());
  card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0';
  resetMultiStageVisualsV413(false);
  renderMultiStageWinnersV413();
}
window.multiDrawNextRound=async()=>{
  const rt=miniGameRuntime.multiDraw,btn=document.getElementById('multiNextBtn');
  if(rt.animating||!rt.currentWinnerId)return;
  if(btn)btn.disabled=true;
  await archiveCurrentMultiCardV413();
  if(btn)btn.disabled=false;
  renderMultiDraw();
};
const _renderMultiDrawV413Base=renderMultiDraw;
renderMultiDraw=function(){
  _renderMultiDrawV413Base();
  renderMultiStageWinnersV413();
  const rt=miniGameRuntime.multiDraw,card=document.getElementById('multiRevealCard'),btn=document.getElementById('multiFireBtn'),nextBtn=document.getElementById('multiNextBtn'),status=document.getElementById('multiDrawStatus');
  const arr=multiDrawPlayers(),target=Math.max(1,Math.min(arr.length||1,Number(data.miniGames.multiDraw.targetCount)||8)),complete=arr.length>0&&rt.winnerIds.length>=target;
  if(card&&rt.currentWinnerId&&!rt.animating&&!card.innerHTML){const p=multiDrawPlayers().find(x=>x.id===rt.currentWinnerId);if(p){card.innerHTML=multiDrawCardHTML(p);card.style.opacity='1';card.className='multi-reveal-card settle';resetMultiStageVisualsV413(true);document.getElementById('multiDrawStage')?.classList.add('card-settled','light-reveal','curtain-open')}}
  if(btn){
    btn.disabled=arr.length<2||complete||rt.animating||Boolean(rt.currentWinnerId);
    btn.textContent=complete?'선발 완료':rt.charging?'손을 떼면 무대 오픈':'마로롱 칭찬하기';
  }
  if(nextBtn)nextBtn.disabled=!rt.currentWinnerId||rt.animating;
  if(status&&!rt.animating&&!rt.charging){
    if(complete)status.textContent='모든 당첨자 선발 완료';
    else if(arr.length<2)status.textContent='참가자를 2명 이상 추가해 주세요';
    else if(rt.currentWinnerId)status.textContent='현재 카드를 확인한 뒤 다음 카드 정리를 눌러 주세요';
    else status.textContent='마로롱 칭찬하기 버튼을 누르고 유지하세요';
  }
};
window.renderMultiDraw=renderMultiDraw;
startMultiCharge=function(e){
  const rt=miniGameRuntime.multiDraw,arr=multiDrawPlayers(),target=Math.max(1,Math.min(arr.length||1,Number(data.miniGames.multiDraw.targetCount)||8));
  if(rt.animating||rt.charging||arr.length<2||rt.winnerIds.length>=target)return;
  if(rt.currentWinnerId){toast('Gacha 뽑기','먼저 다음 카드 정리를 눌러 현재 카드를 오른쪽에 배치해 주세요');return}
  e?.preventDefault();try{e?.currentTarget?.setPointerCapture?.(e.pointerId)}catch(_){ }
  resetMultiStageVisualsV413(false);
  document.getElementById('multiDrawStage')?.classList.add('praise-charge');
  playSpotlightCue();
  rt.charging=true;rt.lastTs=performance.now();document.getElementById('multiFireBtn')?.classList.add('charging');
  const status=document.getElementById('multiDrawStatus');if(status)status.textContent='마로롱을 칭찬하는 중 · 손을 떼면 커튼 연출이 시작됩니다';
  const loop=now=>{if(!rt.charging)return;const dt=Math.min(.05,(now-rt.lastTs)/1000);rt.lastTs=now;rt.gauge+=rt.direction*dt*.9;if(rt.gauge>=1){rt.gauge=1;rt.direction=-1}else if(rt.gauge<=0){rt.gauge=0;rt.direction=1}updateMultiGaugeUI();rt.raf=requestAnimationFrame(loop)};rt.raf=requestAnimationFrame(loop)
};
fireMultiDraw=async function(gauge){
  const rt=miniGameRuntime.multiDraw;if(rt.animating)return;rt.animating=true;
  const winner=chooseMultiDrawWinner(gauge);if(!winner){rt.animating=false;return}
  const stage=document.getElementById('multiDrawStage'),card=document.getElementById('multiRevealCard'),status=document.getElementById('multiDrawStatus'),btn=document.getElementById('multiFireBtn'),dust=document.getElementById('multiStageDust'),flash=document.getElementById('multiImpactFlash');
  if(btn)btn.disabled=true;
  resetMultiStageVisualsV413(false);
  if(card){card.className='multi-reveal-card';card.style.opacity='0';card.innerHTML=multiDrawCardHTML(winner)}
  if(status)status.textContent='무대가 조용해집니다...';
  await multiWait(500);
  stage?.classList.add('smoke');
  if(status)status.textContent='커튼 중앙과 바닥에서 연기가 퍼집니다';
  await multiWait(1700);
  stage?.classList.add('light-reveal','flash');
  if(status)status.textContent='조명과 빛이 무대를 가득 채웁니다';
  await multiWait(1100);
  stage?.classList.add('curtain-open','impact');
  if(status)status.textContent='커튼이 열리고 있습니다';
  await multiWait(1900);
  stage?.classList.remove('impact');
  if(card){card.style.opacity='1';card.classList.add('emerge')}
  if(status)status.textContent='당첨 카드 공개 중...';
  await multiWait(2100);
  card?.classList.remove('emerge');card?.classList.add('settle');stage?.classList.add('card-settled','impact');dust?.classList.add('burst');
  if(status)status.textContent=`${winner.name} 당첨`;
  await multiWait(860);
  stage?.classList.remove('impact');dust?.classList.remove('burst');stage?.classList.remove('flash');
  rt.winnerIds.push(winner.id);rt.currentWinnerId=winner.id;rt.round+=1;rt.animating=false;rt.gauge=0;rt.direction=1;miniPersist();renderMultiDraw();
  const target=Math.max(1,Math.min(multiDrawPlayers().length,Number(data.miniGames.multiDraw.targetCount)||8));
  if(rt.winnerIds.length>=target){if(status)status.textContent='모든 당첨자 선발 완료';showMiniGameCelebration('SELECTION COMPLETE',`${target}명 선발 완료`)}
  else if(status)status.textContent=`${winner.name} 당첨 · 다음 카드 정리를 누르면 오른쪽 보관함으로 이동합니다`;
};
window.resetMultiDraw=()=>{const card=document.getElementById('multiRevealCard');multiDrawRuntimeReset();resetMultiStageVisualsV413(false);if(card){card.className='multi-reveal-card';card.innerHTML='';card.style.opacity='0'}renderMultiDraw();toast('Gacha 뽑기','선발 결과를 초기화했습니다')};
renderLadderFullResultList();
renderMultiDraw();

