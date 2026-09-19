import fs from 'node:fs';

export function runPhase101AchievementMediaIntegrityAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  for(const token of [
    'function remapAchievementBackupMediaReferences(backup,payload,remap)',
    "const strictEmbedded=Number(backup?.assetSchema||0)>=2;",
    "if(strictEmbedded&&front&&!mappedFront)missingRefs++;",
    "if(strictEmbedded&&back&&!mappedBack)missingRefs++;",
    "frontImageId:mappedFront||(strictEmbedded?'':front)",
    "backImageId:mappedBack||(strictEmbedded?'':back)",
    'if(!packed.length){',
    'const missingRefs=remapAchievementBackupMediaReferences(backup,payload,remap);',
    'return {createdIds,restored:0,legacy:!strictEmbedded,remap,missingRefs};',
    'return {createdIds,restored:createdIds.length,legacy:!strictEmbedded,remap,missingRefs};',
    '누락된 이미지 연결'
  ]){
    if(!core.includes(token))issues.push('achievement media integrity guard missing: '+token);
  }

  const restoreStart=core.indexOf('async function restoreAchievementBackupMedia(backup,payload)');
  const restoreEnd=core.indexOf('window.restoreAchievementBackupMedia=restoreAchievementBackupMedia;',restoreStart);
  const restoreBody=restoreStart>=0&&restoreEnd>restoreStart?core.slice(restoreStart,restoreEnd):'';
  if(!restoreBody)issues.push('achievement media restore function not found');
  if(restoreBody){
    const emptyIndex=restoreBody.indexOf('if(!packed.length){');
    const remapIndex=restoreBody.indexOf('remapAchievementBackupMediaReferences(backup,payload,remap)',emptyIndex);
    if(emptyIndex<0||remapIndex<emptyIndex)issues.push('empty embedded media path returns before reference sanitization');
    if(/if\(!packed\.length\)return\s*\{createdIds:\[\],restored:0,legacy:true\}/.test(restoreBody)){
      issues.push('legacy early return can preserve stale assetSchema 2 image IDs');
    }
  }

  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:10[1-9]|1[1-9][0-9]|[2-9][0-9]{2,})/.test(index)){
    issues.push('app-core cache-bust is older than search101');
  }

  const summary={phase:101,name:'achievement-media-reference-integrity',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase101AchievementMediaIntegrityAudit();
