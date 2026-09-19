import fs from 'node:fs';

export function runPhase102AchievementMediaScopeAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  for(const token of [
    'const referencedIds=new Set(achievementBackupReferencedIds(payload));',
    "const mime=String(item?.mime||'').trim().toLowerCase();",
    'if(!sourceId||!referencedIds.has(sourceId)||!encoded||remap.has(sourceId))continue;',
    "if(!mime.startsWith('image/'))continue;",
    'const blob=backupBase64ToBlob(encoded,mime);',
    'const missingRefs=remapAchievementBackupMediaReferences(backup,payload,remap);'
  ]){
    if(!core.includes(token))issues.push('achievement media restore scope guard missing: '+token);
  }

  const restoreStart=core.indexOf('async function restoreAchievementBackupMedia(backup,payload)');
  const restoreEnd=core.indexOf('window.restoreAchievementBackupMedia=restoreAchievementBackupMedia;',restoreStart);
  const restoreBody=restoreStart>=0&&restoreEnd>restoreStart?core.slice(restoreStart,restoreEnd):'';
  if(!restoreBody)issues.push('achievement media restore function not found');
  if(restoreBody){
    const refIndex=restoreBody.indexOf('const referencedIds=new Set(achievementBackupReferencedIds(payload));');
    const putIndex=restoreBody.indexOf('await media.put(blob,{');
    if(refIndex<0||putIndex<0||refIndex>putIndex)issues.push('referenced media scope is not established before Blob persistence');
    if(!restoreBody.includes("if(!mime.startsWith('image/'))continue;"))issues.push('non-image backup assets can still be persisted');
  }

  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:102|1[1-9][0-9]|[2-9][0-9]{2,})/.test(index)){
    issues.push('app-core cache-bust is older than search102');
  }

  const summary={phase:102,name:'achievement-media-restore-scope',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase102AchievementMediaScopeAudit();
