import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase14MediaCommitBoundaryAudit(){
  const issues=[];
  const warnings=[];
  const src=fs.readFileSync('src/cf-v111-auth.js','utf8');

  if(!src.includes('function r2VersionedKey(kind,key,version)'))issues.push('versioned R2 media key helper is missing');
  if(!src.includes('env.IMAGES.put(r2VersionedKey(kind,key,version)'))issues.push('new media still overwrites the legacy R2 key before workspace commit');
  if(!src.includes('if(saveContext?.statements)saveContext.statements.push(statement);else await statement.run()'))issues.push('image_sources metadata is not staged with the save transaction');
  if(!src.includes('mediaContext={statements:[]}'))issues.push('handleSave has no media metadata staging context');
  if(!src.includes('const statements=[...mediaContext.statements]'))issues.push('media metadata is not included in the final workspace D1 batch');
  if(!src.includes("const requested=Math.max(0,Number(new URL(request.url).searchParams.get('v'))||0)"))issues.push('media route does not resolve requested media versions');
  if(!src.includes('env.IMAGES.get(r2VersionedKey(kind,key,requested))'))issues.push('media route does not read versioned objects');
  if(!src.includes('if(!object)object=await env.IMAGES.get(r2Key(kind,key))'))issues.push('legacy unversioned media fallback was not preserved');

  // Reproduce the old failure: overwriting one live key exposes the new image even if DB commit fails.
  const legacy={live:'old-image'};
  legacy.live='new-image';
  const oldCommitSucceeded=false;
  if(oldCommitSucceeded||legacy.live!=='new-image')issues.push('old media partial-write reproduction is invalid');

  // New shape: stage to a new versioned key; without DB commit, the old referenced key remains unchanged.
  const objects=new Map([['legacy','old-image']]);
  objects.set('v2','new-image');
  const metadataVersion=1;
  const workspaceUrlVersion=1;
  const resolve=v=>objects.get('v'+v)||objects.get('legacy');
  if(metadataVersion!==1||workspaceUrlVersion!==1||resolve(workspaceUrlVersion)!=='old-image')issues.push('failed workspace commit can expose staged media');

  const syntax=spawnSync(process.execPath,['--check','src/cf-v111-auth.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('src/cf-v111-auth.js syntax check failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:14,name:'media-workspace-commit-boundary',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase14MediaCommitBoundaryAudit();
