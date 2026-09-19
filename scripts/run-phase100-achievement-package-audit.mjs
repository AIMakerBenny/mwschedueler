import fs from 'node:fs';

export function runPhase100AchievementPackageAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  for(const token of [
    'function mwsAchievementImportCardsV1621(items=[])',
    'id:crypto.randomUUID(),',
    "const reason='업적 패키지 가져오기';",
    "renderAll('업적 패키지 가져오기 실패');",
    'importCards:mwsAchievementImportCardsV1621',
    'async function buildAchievementPackageObjectAsync()',
    "format:'MAWANG_ACHIEVEMENT_PACKAGE'",
    'assetSchema:2,',
    'cards,',
    'assets:{achievementMedia:packed.items}',
    "function remapAchievementBackupMediaReferences(backup,payload,remap)",
    "const strictEmbedded=Number(backup?.assetSchema||0)>=2;",
    "frontImageId:mappedFront||(strictEmbedded?'':front)",
    "backImageId:mappedBack||(strictEmbedded?'':back)",
    "document.getElementById('achievementExportPackageBtn').onclick=async()=>",
    "document.getElementById('achievementImportPackageInput').onchange=async e=>",
    "if(pack?.format!=='MAWANG_ACHIEVEMENT_PACKAGE'||!Array.isArray(pack.cards))",
    'const result=api.importCards(payload.achievementCards);',
    'let committed=false;',
    'if(!committed){'
  ]){
    if(!core.includes(token))issues.push('achievement package integration missing: '+token);
  }

  const importStart=core.indexOf('function mwsAchievementImportCardsV1621(items=[])');
  const importEnd=core.indexOf('window.mwsAchievementCardsV1621=Object.freeze({',importStart);
  const importBody=importStart>=0&&importEnd>importStart?core.slice(importStart,importEnd):'';
  if(!importBody)issues.push('achievement package import API not found');
  if(importBody&&!importBody.includes('data.achievementCards.push(...imported);'))issues.push('achievement package import does not append to existing cards');
  if(importBody&&/raw\?\.id|raw\.id/.test(importBody))issues.push('achievement package import reuses source card IDs instead of generating new IDs');

  const packageStart=core.indexOf('async function buildAchievementPackageObjectAsync()');
  const packageEnd=core.indexOf('window.buildAchievementPackageObjectAsync=buildAchievementPackageObjectAsync;',packageStart);
  const packageBody=packageStart>=0&&packageEnd>packageStart?core.slice(packageStart,packageEnd):'';
  if(!packageBody)issues.push('achievement package builder not found');
  if(packageBody&&!packageBody.includes('await buildAchievementBackupMedia(payload)'))issues.push('achievement package does not reuse Blob backup serializer');

  for(const token of [
    'id="achievementExportPackageBtn"',
    'id="achievementImportPackageInput"',
    '업적 내보내기',
    '업적 가져오기',
    '패키지 가져오기는 기존 카드를 지우지 않고 뒤에 추가합니다.'
  ]){
    if(!index.includes(token))issues.push('achievement package UI missing: '+token);
  }

  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:100|1[0-9]{2,}|[2-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search100');

  const summary={phase:100,name:'achievement-package-transfer',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase100AchievementPackageAudit();
