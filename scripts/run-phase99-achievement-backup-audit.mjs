import fs from 'node:fs';

export function runPhase99AchievementBackupAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  for(const token of [
    "achievementMedia:[]",
    "function achievementBackupReferencedIds(payload)",
    "function blobToBackupBase64(blob)",
    "reader.readAsDataURL(blob);",
    "function backupBase64ToBlob(base64,mime='application/octet-stream')",
    "async function buildAchievementBackupMedia(payload)",
    "async function buildFullBackupObjectAsync()",
    "backup.assets.achievementMedia=achievementPacked.items;",
    "backup.meta.achievementMedia=achievementPacked.items.length;",
    "function remapAchievementBackupMediaReferences(backup,payload,remap)",
    "async function restoreAchievementBackupMedia(backup,payload)",
    "const packed=Array.isArray(backup?.assets?.achievementMedia)?backup.assets.achievementMedia:[];",
    "const stored=await media.put(blob,{",
    "frontImageId:mappedFront||(strictEmbedded?'':front)",
    "backImageId:mappedBack||(strictEmbedded?'':back)",
    "await Promise.allSettled(createdIds.map(id=>media.remove(id)));",
    "async function cleanupAchievementMediaAfterImport()",
    "let committed=false;",
    "if(!saved)throw new Error('브라우저 저장 공간이 부족해 기존 데이터를 유지했습니다');",
    "committed=true;",
    "if(!committed){",
    "document.getElementById('exportAllBtn').onclick=async()=>",
    "document.getElementById('importAllInput').onchange=async e=>"
  ]){
    if(!core.includes(token))issues.push('achievement full-backup integration missing: '+token);
  }

  const backupStart=core.indexOf('function buildFullBackupObject(){');
  const backupEnd=core.indexOf('window.buildFullBackupObject=buildFullBackupObject;',backupStart);
  const backupBody=backupStart>=0&&backupEnd>backupStart?core.slice(backupStart,backupEnd):'';
  if(!backupBody)issues.push('full backup builder not found');
  if(backupBody.includes('base64:'))issues.push('achievement binary leaked into synchronous metadata backup builder');

  const exportStart=core.indexOf('async function buildAchievementBackupMedia(payload)');
  const importStart=core.indexOf('async function restoreAchievementBackupMedia(backup,payload)');
  if(exportStart<0||importStart<0||importStart<=exportStart)issues.push('achievement backup encode/restore boundary is invalid');

  if(!core.includes("const payload=mwsStripDevicePrefs(data);"))issues.push('full backup no longer strips device preferences');
  if(!core.includes("const previousData=typeof structuredClone==='function'?structuredClone(data):JSON.parse(JSON.stringify(data));"))issues.push('full import rollback snapshot missing');
  if(!core.includes("try{await cleanupAchievementMediaAfterImport()}"))issues.push('post-commit orphan cleanup is not isolated from import commit');
  if(!core.includes("const currentImage=typeof c.image==='string'?c.image:'';"))issues.push('full backup restore does not preserve existing cloud contact image references');
  if(!core.includes("return {...c,image:currentImage||embeddedImage};"))issues.push('full backup restore can blank non-Base64 contact images');

  if(!/assetSchema:(?:2|[3-9]|[1-9][0-9]+)/.test(core))issues.push('achievement full-backup asset schema is older than 2');
  for(const token of [
    '업적 카드',
    '백업 파일 안에 포함',
    'id="fullBackupAssetStatus" class="backup-asset-status">백업 이미지 확인 중'
  ]){
    if(!index.includes(token))issues.push('achievement backup UI copy missing: '+token);
  }
  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:99|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search99');

  const summary={phase:99,name:'achievement-full-backup-media',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase99AchievementBackupAudit();
