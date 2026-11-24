// Read-only control-plane verification. Never access the Worker hostname.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export function activeDeployment(body){
 assert.equal(body?.success,true,'Cloudflare API did not confirm success');
 const rows=body.result?.deployments;
 assert(Array.isArray(rows)&&rows.length,'No deployment records');
 const latest=[...rows].sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
 assert(Number.isFinite(Date.parse(latest.created_on)),'Invalid deployment date');
 assert(Array.isArray(latest.versions)&&latest.versions.length===1&&Number(latest.versions[0].percentage)===100,'Expected one fully active Worker version');
 assert(/^[a-f0-9-]{36}$/i.test(latest.versions[0].version_id),'Invalid active version ID');
 return {id:latest.id,createdOn:latest.created_on,versionId:latest.versions[0].version_id};
}
export function verifyVersion(body,active,expected){
 assert.equal(body?.success,true);
 const version=body.result;
 assert.equal(version?.id,active.versionId,'Deployment/version ID mismatch');
 const message=version.annotations?.['workers/message']||'';
 const tag=version.annotations?.['workers/tag']||'';
 const matched=message==='git:'+expected||tag===expected||tag==='git:'+expected;
 return {deploymentId:active.id,deployedAt:active.createdOn,versionId:active.versionId,expectedCommit:expected,commitMatched:matched};
}
export async function verify({account,token,expected,fetchImpl=fetch}){
 assert(/^[a-f0-9]{32}$/i.test(account||''),'Missing or invalid account ID');
 assert(token,'Cloudflare token unavailable');
 assert(/^[a-f0-9]{40}$/i.test(expected||''),'Expected full Git SHA');
 const base='https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/mawang-scheduler';
 const get=async suffix=>{
  const response=await fetchImpl(base+suffix,{method:'GET',redirect:'error',headers:{authorization:'Bearer '+token,accept:'application/json'},signal:AbortSignal.timeout(20000)});
  assert(response.ok,'Cloudflare management HTTP '+response.status);
  return response.json();
 };
 const active=activeDeployment(await get('/deployments'));
 const result=verifyVersion(await get('/versions/'+active.versionId),active,expected);
 console.log('MWS_MANAGEMENT_DEPLOYMENT '+JSON.stringify(result));
 assert(result.commitMatched,'Active version lacks the exact expected Git SHA annotation; deployment identity not verified');
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 await verify({account:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN,expected:process.env.MWS_EXPECTED_SHA});
}
