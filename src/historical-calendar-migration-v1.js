import '../assets/career-activities-data-v1.js';

const archive=globalThis.mwsCareerActivitiesDataV1;
const KEY='historical_calendar_import_v1';
const basisLabels={event:'활동일',publication:'공개·보도일',announcement:'개설 공지일',record:'기록 기준'};
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const calendarAliases={
  '2026-02-14|레귤러원 F1 시즌 2':'F1 본선',
  '2026-03-28|파블로프 VR 대전쟁':'파블로프 전쟁',
  '2026-04-24|제5회 버종리 배그':'버종리 배그',
  '2026-04-30|문명 6 멀티 대회':'문명',
  '2026-08-01|STALZONE 크루대전':'스탈존 대회',
  '2026-08-08|제2회 파블로프 VR 대전쟁':'파블로프'
};
const isDay=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
// Keep the original date basis and source. A publication date is not a broadcast time.
export function planHistoricalEvents(events,records=archive){
  if(!Array.isArray(events))throw new Error('Invalid historical calendar target');
  const result=events.slice(),ids=new Set(events.map(e=>String(e?.id||''))),keys=new Set(events.filter(e=>!e?.restDay).map(e=>`${e?.date}|${norm(e?.title)}`));
  let added=0,duplicates=0,monthOnly=0;
  for(const [i,r] of records.entries()){
    if(!isDay(r.date)){monthOnly++;continue}
    const id=`mws-history-v1-${String(i+1).padStart(3,'0')}`,key=`${r.date}|${norm(r.title)}`;
    const alias=calendarAliases[`${r.date}|${r.title}`];
    if(ids.has(id)||keys.has(key)||(alias&&keys.has(`${r.date}|${norm(alias)}`))){duplicates++;continue}
    const basis=basisLabels[r.basis]||'기록 기준';
    const dateNote=r.end?`${r.date} ~ ${r.end}`:r.date;
    result.push({id,title:r.title,date:r.date,start:'TBD',end:'TBD',restDay:false,device:'',categoryId:'',color:'#64748b',participants:[],participantStatuses:{},autoSelfParticipantId:'',favorite:false,checklist:[],reminder:'',url:r.url||'',description:`${r.context}\n\n과거 자료 · ${basis}: ${dateNote}\n출처: ${r.source}${r.basis==='publication'?'\n공개일은 실제 진행일과 다를 수 있습니다.':''}`,memoTitle:'과거 콘텐츠 기록',memoContent:`${basis}: ${dateNote}\n출처: ${r.source}`,historicalRecord:{version:1,basis:r.basis,source:r.source,kind:r.kind,endDate:r.end||'',datePrecision:'day'}});
    ids.add(id);keys.add(key);added++;
  }
  return {events:result,added,duplicates,monthOnly};
}

let complete=false,inflight;
async function apply(env){
  if(await env.DB.prepare('SELECT value FROM app_meta WHERE key=?').bind(KEY).first())return true;
  const {results=[]}=await env.DB.prepare("SELECT scope,version,data FROM workspace_parts WHERE part='events' AND scope IN ('public','admin') ORDER BY scope").all();
  if(results.length!==2)return false; // Never replace an uninitialized workspace.
  const plans=results.map(row=>({...row,plan:planHistoricalEvents(JSON.parse(row.data))}));
  const statements=[env.DB.prepare('INSERT INTO save_conflict_guard(id) SELECT 1 WHERE EXISTS(SELECT 1 FROM app_meta WHERE key=?)').bind(KEY)];
  for(const row of plans)statements.push(env.DB.prepare("INSERT INTO save_conflict_guard(id) SELECT 1 WHERE NOT EXISTS(SELECT 1 FROM workspace_parts WHERE scope=? AND part='events' AND version=? AND data=?)").bind(row.scope,row.version,row.data));
  for(const row of plans)if(row.plan.added)statements.push(env.DB.prepare("UPDATE workspace_parts SET data=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE scope=? AND part='events'").bind(JSON.stringify(row.plan.events),row.scope));
  const summary=Object.fromEntries(plans.map(r=>[r.scope,{added:r.plan.added,duplicates:r.plan.duplicates,monthOnly:r.plan.monthOnly}]));
  statements.push(env.DB.prepare('INSERT INTO app_meta(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)').bind(KEY,JSON.stringify(summary)));
  try{await env.DB.batch(statements);console.log('Historical calendar import',JSON.stringify(summary));return true}
  catch(error){if(await env.DB.prepare('SELECT value FROM app_meta WHERE key=?').bind(KEY).first())return true;throw error}
}
export async function ensureHistoricalCalendarMigration(env){
  if(complete||env.MWS_ENV!=='cloudflare-production')return;
  if(!inflight)inflight=apply(env).then(done=>{complete=done}).finally(()=>{inflight=null});
  // Atomic version-checked import; an active Admin save causes a retry next request.
  try{await inflight}catch(error){console.error('Historical calendar import retry',String(error?.message||error))}
}
