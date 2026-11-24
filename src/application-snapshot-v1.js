import {normalizeCampaigns,parseCommentPage,uniqueApplicants} from '../assets/content-applications-model-v1.js';

const PAGE_BUDGET=9,MAX_PAGES=100,MAX_BYTES=850000,LEASE_MS=180000,TTL=60000;
const schema=new WeakMap();
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const sig=c=>c.entries.map(e=>e.id).join('|');
const configKey=c=>JSON.stringify([c.deadline,c.entries.map(e=>[e.id,e.userId,e.title])]);
const expired=c=>!c||Date.parse(c.deadline)<=Date.now();
const parse=s=>{try{return JSON.parse(s)}catch{return null}};
const fits=value=>new TextEncoder().encode(value).length<=MAX_BYTES;
async function ensure(env){
 if(!schema.has(env.DB))schema.set(env.DB,env.DB.batch([
  env.DB.prepare('CREATE TABLE IF NOT EXISTS mws_application_snapshots(campaign_id TEXT PRIMARY KEY,signature TEXT NOT NULL,checked_at TEXT NOT NULL,payload TEXT NOT NULL)'),
  env.DB.prepare('CREATE TABLE IF NOT EXISTS mws_application_sync_jobs(campaign_id TEXT PRIMARY KEY,config_key TEXT NOT NULL,started_at INTEGER NOT NULL,lease_token TEXT NOT NULL,lease_until INTEGER NOT NULL,state TEXT NOT NULL)')
 ]).catch(error=>{schema.delete(env.DB);throw error}));
 await schema.get(env.DB);
}
async function campaigns(env){
 const row=await env.DB.prepare("SELECT data FROM workspace_parts WHERE scope='public' AND part='core'").first();
 return normalizeCampaigns(parse(row?.data)?.contentApplications);
}
function validSnapshot(row,c){
 const value=parse(row?.payload);
 if(!value||value.signature!==sig(c)||!Array.isArray(value.applicants)||typeof value.complete!=='boolean'||!Number.isFinite(Date.parse(value.checkedAt)))return null;
 return value;
}
export async function readApplicationSnapshots(env){
 await ensure(env);const current=new Map((await campaigns(env)).map(c=>[c.id,c]));
 const {results=[]}=await env.DB.prepare('SELECT campaign_id,payload FROM mws_application_snapshots').all();
 return results.flatMap(row=>{const c=current.get(row.campaign_id),s=c&&validSnapshot(row,c);return s?[{id:c.id,...s}]:[]});
}
async function readPage(proxy,origin,source,page){
 try{
  const target=new URL('https://chapi.sooplive.co.kr/api/'+encodeURIComponent(source.station)+'/title/'+encodeURIComponent(source.postNo)+'/comment');
  target.searchParams.set('page',String(page));target.searchParams.set('orderby','reg_date');
  const request=new URL('/api/soop/proxy',origin);request.searchParams.set('url',target.href);
  const res=await proxy(new Request(request,{headers:{accept:'application/json'}}));
  if(!res.ok)throw Error('SOOP HTTP '+res.status);
  const value=parseCommentPage(await res.json(),source);if(value.page!==page)throw Error('page mismatch');return value;
 }catch{return null}
}
export async function handleApplicationSync(request,env,proxy){
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 const url=new URL(request.url),id=url.searchParams.get('id')||'';
 if(!id||id.length>80)return json({error:'Invalid campaign'},400);
 await ensure(env);
 const c=(await campaigns(env)).find(x=>x.id===id);if(!c)return json({error:'Campaign not found'},404);
 const previous=validSnapshot(await env.DB.prepare('SELECT payload FROM mws_application_snapshots WHERE campaign_id=?').bind(id).first(),c);
 if(expired(c))return json({done:true,expired:true,snapshot:previous});
 const now=Date.now(),force=url.searchParams.get('force')==='1',key=configKey(c);
 const continuation=url.searchParams.get('continue')==='1';
 if(previous&&now-Date.parse(previous.checkedAt)<(force?3000:TTL)){
  const pending=continuation?await env.DB.prepare('SELECT config_key FROM mws_application_sync_jobs WHERE campaign_id=?').bind(id).first():null;
  if(!pending||pending.config_key!==key)return json({done:true,snapshot:previous,cached:true});
 }
 const token=crypto.randomUUID();
 const initial={sources:c.entries.map(()=>({next:1,pages:0,total:null,rows:[],failed:false})),complete:c.entries.length>0};
 const initialText=JSON.stringify(initial);
 const locked=await env.DB.prepare("INSERT INTO mws_application_sync_jobs(campaign_id,config_key,started_at,lease_token,lease_until,state) VALUES(?,?,?,?,?,?) ON CONFLICT(campaign_id) DO UPDATE SET config_key=excluded.config_key,started_at=CASE WHEN config_key=excluded.config_key AND started_at>? THEN started_at ELSE excluded.started_at END,state=CASE WHEN config_key=excluded.config_key AND started_at>? THEN state ELSE excluded.state END,lease_token=excluded.lease_token,lease_until=excluded.lease_until WHERE lease_until<=?").bind(id,key,now,token,now+LEASE_MS,initialText,now-300000,now-300000,now).run();
 if(!locked.meta?.changes)return json({done:false,busy:true,retryAfterMs:1800,snapshot:previous});
 try{
  const job=await env.DB.prepare('SELECT started_at,state FROM mws_application_sync_jobs WHERE campaign_id=? AND lease_token=?').bind(id,token).first();
  if(!job)return json({done:false,busy:true,retryAfterMs:1800,snapshot:previous});
  const state=parse(job.state)||initial;
  let used=0;
  while(used<PAGE_BUDGET&&!expired(c)){
   const tasks=[];
   for(let i=0;i<state.sources.length&&tasks.length<Math.min(3,PAGE_BUDGET-used);i++){
    const x=state.sources[i];if(!x.failed&&x.next===1){tasks.push({i,page:1});x.next=2}
   }
   for(let i=0;i<state.sources.length&&tasks.length<Math.min(3,PAGE_BUDGET-used);i++){
    const x=state.sources[i];while(!x.failed&&x.pages&&x.next<=Math.min(MAX_PAGES,x.pages)&&tasks.length<Math.min(3,PAGE_BUDGET-used))tasks.push({i,page:x.next++});
   }
   if(!tasks.length)break;used+=tasks.length;
   const rows=await Promise.all(tasks.map(t=>readPage(proxy,url,c.entries[t.i],t.page)));
   for(let j=0;j<tasks.length;j++){
    const t=tasks[j],x=state.sources[t.i],row=rows[j];
    if(!row){x.failed=true;state.complete=false;continue}
    if(t.page===1){x.pages=row.pages;x.total=row.total;if(row.pages>MAX_PAGES)state.complete=false}
    else if(x.pages!==row.pages||x.total!==row.total)state.complete=false;
    x.rows.push(...row.applicants);
   }
  }
  const latest=(await campaigns(env)).find(x=>x.id===id);
  if(expired(latest)||configKey(latest)!==key){
   await env.DB.prepare('DELETE FROM mws_application_sync_jobs WHERE campaign_id=? AND lease_token=?').bind(id,token).run();
   return json({done:true,expired:expired(latest),snapshot:latest?validSnapshot({payload:JSON.stringify(previous)},latest):null});
  }
  const unfinished=state.sources.some(x=>!x.failed&&(x.next===1||x.pages&&x.next<=Math.min(MAX_PAGES,x.pages)));
  if(unfinished){
   const packed=JSON.stringify(state);
   if(!fits(packed)){await env.DB.prepare('DELETE FROM mws_application_sync_jobs WHERE campaign_id=? AND lease_token=?').bind(id,token).run();return json({done:true,oversize:true,snapshot:previous})}
   await env.DB.prepare('UPDATE mws_application_sync_jobs SET state=?,lease_until=0 WHERE campaign_id=? AND lease_token=?').bind(packed,id,token).run();
   return json({done:false,snapshot:previous});
  }
  const value={signature:sig(c),applicants:uniqueApplicants(state.sources.flatMap(x=>x.rows)),complete:state.complete,checkedAt:new Date(job.started_at).toISOString()};
  if(!value.complete&&!value.applicants.length&&!previous){
   await env.DB.prepare('DELETE FROM mws_application_sync_jobs WHERE campaign_id=? AND lease_token=?').bind(id,token).run();
   return json({done:true,snapshot:null,partial:true});
  }
  const chosen=(!value.complete&&previous&&(previous.complete||!value.applicants.length))?previous:value;
  const payload=JSON.stringify(chosen);
  if(!fits(payload)){await env.DB.prepare('DELETE FROM mws_application_sync_jobs WHERE campaign_id=? AND lease_token=?').bind(id,token).run();return json({done:true,oversize:true,snapshot:previous})}
  await env.DB.batch([
   env.DB.prepare("INSERT INTO mws_application_snapshots(campaign_id,signature,checked_at,payload) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM mws_application_sync_jobs WHERE campaign_id=? AND lease_token=?) ON CONFLICT(campaign_id) DO UPDATE SET signature=excluded.signature,checked_at=excluded.checked_at,payload=excluded.payload WHERE (signature<>excluded.signature OR checked_at<excluded.checked_at) AND payload<>excluded.payload").bind(id,chosen.signature,chosen.checkedAt,payload,id,token),
   env.DB.prepare('DELETE FROM mws_application_sync_jobs WHERE campaign_id=? AND lease_token=?').bind(id,token)
  ]);
  return json({done:true,snapshot:chosen,partial:!value.complete});
 }catch(error){
  await env.DB.prepare('UPDATE mws_application_sync_jobs SET lease_until=0 WHERE campaign_id=? AND lease_token=?').bind(id,token).run().catch(()=>{});
  throw error;
 }
}
