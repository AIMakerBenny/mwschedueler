// Read-only production recovery checkpoint. Never reads or logs user records from Cloudflare D1.
// Cloudflare's Time Travel bookmark is a short-lived point-in-time recovery handle,
// NOT a downloadable/off-site backup. No restoration or mutation is performed here.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const account=process.env.CLOUDFLARE_ACCOUNT_ID||'';
const token=process.env.CLOUDFLARE_API_TOKEN||'';
assert(account&&token,'Cloudflare metadata/read credentials required');
const scriptName='mawang-scheduler';
const cfRoot='https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(account);
async function getApi(path){
  const res=await fetch(cfRoot+path,{
    headers:{Authorization:'Bearer '+token,Accept:'application/json'},
    signal:AbortSignal.timeout(20000)
  });
  const body=await res.json().catch(()=>({}));
  if(!res.ok||body.success!==true)throw new Error('Cloudflare read API rejected '+path.split('/').slice(-2).join('/')+' HTTP '+res.status);
  return body.result;
}
const deployments=await getApi('/workers/scripts/'+scriptName+'/deployments?per_page=1');
const first=deployments?.deployments?.[0];
assert(first,'No active Worker deployment found');
const active=first.versions?.filter(v=>Number(v.percentage)>0)||[];
assert(active.length===1&&Number(active[0].percentage)===100,'Expected a single production Worker version');
const version=await getApi('/workers/scripts/'+scriptName+'/versions/'+encodeURIComponent(active[0].version_id));
const rawBindings=version?.resources?.bindings;
const flat=Array.isArray(rawBindings)?rawBindings:
  Object.entries(rawBindings||{}).flatMap(([group,value])=>{
    const values=Array.isArray(value)?value:[value];
    return values.filter(x=>x&&typeof x==='object').map(x=>({...x,_group:group}));
  });
const candidates=flat.filter(x=>x.name==='DB'&&(String(x.type||x._group||'').toLowerCase().includes('d1')||x.database_id||x.id));
assert(candidates.length===1,'Cannot safely identify production DB binding from active Worker version');
const dbId=String(candidates[0].id||candidates[0].database_id||candidates[0].database||'');
assert(/^[a-f0-9-]{32,36}$/i.test(dbId),'Bound D1 database ID not available');
const bookmark=await getApi('/d1/database/'+encodeURIComponent(dbId)+'/time_travel/bookmark');
assert(/^[a-f0-9-]+$/i.test(String(bookmark?.bookmark||'')),'Valid D1 recovery bookmark not returned');

const base='https://mawang-scheduler.majoku.workers.dev';
async function readPart(path){
  const res=await fetch(base+path+'?audit='+Date.now(),{
    headers:{accept:'application/json','cache-control':'no-cache'},signal:AbortSignal.timeout(20000),cache:'no-store'
  });
  assert.equal(res.status,200,'Public read failed for '+path);
  return await res.json();
}
const [manifest,core,events]=await Promise.all([
  readPart('/api/manifest'),readPart('/api/parts/core'),readPart('/api/parts/events')
]);
assert(Number(core?.version)===Number(manifest?.parts?.core),'core manifest version mismatch');
assert(Number(events?.version)===Number(manifest?.parts?.events),'events manifest version mismatch');
assert(Array.isArray(events?.data),'events must be an array');
const groups=Array.isArray(core?.data?.contentGroups)?core.data.contentGroups:[];
const games=Array.isArray(core?.data?.gameLibrary)?core.data.gameLibrary:[];
const linked=events.data.filter(e=>Boolean(String(e?.contentGroupId||'')));
const known=new Set(groups.map(g=>String(g?.id||'')));
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const result={
  ok:true,checkedAt:new Date().toISOString(),recoveryKind:'Cloudflare D1 Time Travel bookmark, no export',
  workerVersionId:active[0].version_id,
  // Bookmark is a recovery pointer, not a secret or an authorization token.
  bookmark:bookmark.bookmark,
  coreVersion:Number(core.version),
  eventsVersion:Number(events.version),
  coreSha256:sha(core.data),eventsSha256:sha(events.data),
  eventCount:events.data.length,groupCount:groups.length,gameLibraryCount:games.length,
  linkedEventCount:linked.length,orphanLinkedCount:linked.filter(e=>!known.has(String(e.contentGroupId))).length,
  missingGroupCount:new Set(linked.filter(e=>!known.has(String(e.contentGroupId))).map(e=>String(e.contentGroupId))).size
};
console.log('MWS_D1_READONLY_RECOVERY_CHECKPOINT '+JSON.stringify(result));
