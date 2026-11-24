// Read only Cloudflare control plane. No object contents or Worker requests.
import assert from 'node:assert/strict';
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert(/^[a-f0-9]{32}$/i.test(account||'')&&token,'Missing management credentials');
const base='https://api.cloudflare.com/client/v4';
async function get(path){
 try{
  const r=await fetch(base+path,{method:'GET',redirect:'error',headers:{authorization:'Bearer '+token,accept:'application/json'},signal:AbortSignal.timeout(15000)});
  const j=await r.json();
  return {status:r.status,ok:r.ok&&j.success===true,result:j.result,info:j.result_info};
 }catch(_){return {status:'unavailable',ok:false}}
}
const prefix='/accounts/'+account;
const z=await get('/zones?account.id='+account+'&per_page=50');
const zones=z.ok&&Array.isArray(z.result)?z.result.map(x=>({name:x.name,status:x.status})):null;
const b=await get(prefix+'/r2/buckets');
const buckets=b.ok&&Array.isArray(b.result?.buckets)?b.result.buckets:null;
const domains=[];
if(buckets){
 // Only read bucket-domain metadata. Never list or fetch image objects.
 for(const x of buckets.slice(0,50)){
  const p=prefix+'/r2/buckets/'+encodeURIComponent(x.name)+'/domains/';
  const [m,c]=await Promise.all([get(p+'managed'),get(p+'custom')]);
  const custom=c.result?.domains??c.result;
  domains.push({bucket:x.name,managedStatus:m.status,managed:m.ok?{domain:m.result?.domain,enabled:m.result?.enabled}:null,customStatus:c.status,custom:c.ok&&Array.isArray(custom)?custom.map(y=>({domain:y.domain,enabled:y.enabled,status:y.status})):null});
 }
}
console.log('MWS_V4_MANAGEMENT_INVENTORY '+JSON.stringify({zoneStatus:z.status,zones,zoneTotalPages:z.info?.total_pages??null,bucketStatus:b.status,bucketCount:buckets?.length??null,domains,domainScanTruncated:!!buckets&&buckets.length>50}));
