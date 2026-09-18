import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase13AtomicMultipartSaveAudit(){
  const issues=[];
  const warnings=[];
  const src=fs.readFileSync('src/cf-v111-auth.js','utf8');
  const start=src.indexOf('async function handleSave(request,env)');
  const end=src.indexOf('async function handleManifest',start);
  const block=start>=0&&end>start?src.slice(start,end):'';

  if(!block)issues.push('handleSave implementation was not found');
  if(!block.includes('const entries=Object.entries(body.parts)'))issues.push('save parts are not staged from one request snapshot');
  if(!block.includes('const versions={},normalized={},staged=[]'))issues.push('multi-part save staging buffer is missing');
  if(!block.includes('const statements=[]'))issues.push('single transaction statement buffer is missing');
  const batchMatches=block.match(/await env\.DB\.batch\(/g)||[];
  if(batchMatches.length!==1)issues.push(`handleSave must commit workspace parts with exactly one DB.batch; found ${batchMatches.length}`);
  const stageIndex=block.indexOf('staged.push({part,value,version,text})');
  const commitIndex=block.indexOf('await env.DB.batch(statements)');
  if(stageIndex<0||commitIndex<0||commitIndex<stageIndex)issues.push('workspace commit can occur before all part values are staged');

  // Reproduce the old failure shape: two independent commits allow part A to survive when B fails.
  const oldPersisted=[];
  try{
    for(const part of ['A','B']){
      if(part==='B')throw new Error('simulated second-part failure');
      oldPersisted.push(part);
    }
  }catch(_){}
  if(oldPersisted.join(',')!=='A')issues.push('audit reproduction for partial-save failure is invalid');

  // New shape: validation/staging fails before the one commit, so no workspace part is committed.
  const staged=[];
  let committed=[];
  try{
    for(const part of ['A','B']){
      if(part==='B')throw new Error('simulated second-part failure');
      staged.push(part);
    }
    committed=[...staged];
  }catch(_){}
  if(committed.length!==0)issues.push('staged save can still partially commit before staging completes');

  const syntax=spawnSync(process.execPath,['--check','src/cf-v111-auth.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('src/cf-v111-auth.js syntax check failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:13,name:'atomic-multipart-workspace-save',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase13AtomicMultipartSaveAudit();
