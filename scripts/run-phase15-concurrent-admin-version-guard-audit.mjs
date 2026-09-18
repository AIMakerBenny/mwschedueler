import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase15ConcurrentAdminVersionGuardAudit(){
  const issues=[];
  const warnings=[];
  const auth=fs.readFileSync('src/cf-v111-auth.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(!auth.includes('CREATE TABLE IF NOT EXISTS save_conflict_guard'))issues.push('transaction conflict guard table is missing');
  if(!auth.includes('INSERT OR IGNORE INTO save_conflict_guard(id) VALUES(1)'))issues.push('transaction conflict guard sentinel is not initialized');
  if(!auth.includes('const expectedVersions=body?.versions'))issues.push('save API does not require client baseline versions');
  if(!auth.includes("COALESCE((SELECT version FROM workspace_parts WHERE scope='public' AND part=?),0)<>?"))issues.push('save transaction has no per-part version guard');
  if(!auth.includes("conflicts},409"))issues.push('stale save conflict is not reported as HTTP 409');
  if(!entry.includes('versions:Object.fromEntries(partsToSave.map(part=>[part,Number(manifest?.parts?.[part])||0]))'))issues.push('client save request does not send baseline manifest versions');

  if(!auth.includes("crypto.randomUUID().replace(/-/g,'')"))issues.push('concurrent media staging lacks a unique save token');
  if(!auth.includes('mws-r2:'))issues.push('image metadata does not retain the winning media token');
  if(!auth.includes('&h='))issues.push('saved media URL does not carry its unique token');
  if(!auth.includes('r2VersionedKey(kind,key,requested,explicitToken)'))issues.push('media route does not resolve the exact committed media token');

  let serverVersion=5;
  const attempt=expected=>{
    if(expected!==serverVersion)return {ok:false,status:409,current:serverVersion};
    serverVersion++;
    return {ok:true,status:200,current:serverVersion};
  };
  const a=attempt(5);
  const b=attempt(5);
  if(!a.ok||a.current!==6)issues.push('first matching-version save did not commit in regression model');
  if(b.ok||b.status!==409||b.current!==6)issues.push('second stale save is not rejected in regression model');

  const authSyntax=spawnSync(process.execPath,['--check','src/cf-v111-auth.js'],{encoding:'utf8'});
  if(authSyntax.status!==0)issues.push('src/cf-v111-auth.js syntax check failed: '+String(authSyntax.stderr||authSyntax.stdout||'').trim());
  const entrySyntax=spawnSync(process.execPath,['--check','src/cf-v111-entry.js'],{encoding:'utf8'});
  if(entrySyntax.status!==0)issues.push('src/cf-v111-entry.js syntax check failed: '+String(entrySyntax.stderr||entrySyntax.stdout||'').trim());

  const result={phase:15,name:'concurrent-admin-stale-save-version-guard',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase15ConcurrentAdminVersionGuardAudit();
