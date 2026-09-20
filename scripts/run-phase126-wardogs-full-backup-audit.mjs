import fs from 'node:fs';

export function runPhase126WardogsFullBackupAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const media=fs.readFileSync('assets/wardogs-media-v1.js','utf8');
  const cloud=fs.readFileSync('assets/cloud-v1.1.js','utf8');
  const staged=fs.readFileSync('assets/cloud-runtime-v130.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/app-core.js?v=1.3.0-search115-wardogs116-backup126',
    'assets/wardogs-media-v1.js?v=1.0.0-phase121-backup126',
    'WARDOGS 카드와 각 카드 이미지를 저장합니다.',
    '프로필·업적·WARDOGS 이미지는 백업 파일 안에 포함'
  ])if(!index.includes(token))issues.push('WARDOGS full-backup UI/cache revision missing: '+token);

  for(const token of [
    "assetSchema:3,",
    "wardogsCards:wardogsCards.length,",
    "wardogsMedia:0,",
    "wardogsMediaMissing:0",
    "wardogsMedia:[]",
    "function wardogsBackupCards(payload)",
    "function wardogsBackupReferencedIds(payload)",
    "const WARDOGS_BACKUP_LIMITS=Object.freeze({",
    "window.mwsWardogsBackupLimitsV126=WARDOGS_BACKUP_LIMITS;",
    "function validateWardogsEmbeddedMedia(backup,payload)",
    "window.validateWardogsEmbeddedMediaV126=validateWardogsEmbeddedMedia;",
    "async function buildWardogsBackupMedia(payload)",
    "window.buildWardogsBackupMediaV126=buildWardogsBackupMedia;",
    "buildWardogsBackupMedia(backup.data)",
    "backup.assets.wardogsMedia=wardogsPacked.items;",
    "backup.meta.wardogsMedia=wardogsPacked.items.length;",
    "backup.meta.wardogsMediaMissing=wardogsPacked.missing;",
    "function remapWardogsBackupMediaReferences(backup,payload,remap)",
    "const strictEmbedded=Number(backup?.assetSchema||0)>=3;",
    "imageId:mapped||(strictEmbedded?'':imageId)",
    "async function restoreWardogsBackupMedia(backup,payload)",
    "const adminMode=document.body?.dataset?.mwsMode==='admin';",
    "const putMedia=adminMode?media?.put:media?.putLocal;",
    "const removeMedia=adminMode?media?.remove:media?.removeLocal;",
    "window.restoreWardogsBackupMediaV126=restoreWardogsBackupMedia;",
    "async function cleanupWardogsMediaAfterImport()",
    "if(!payload.wardogs||typeof payload.wardogs!=='object'||Array.isArray(payload.wardogs))payload.wardogs={schemaVersion:1,cards:[]};",
    "if(window.mwsWardogsDataV119?.normalize)payload.wardogs=window.mwsWardogsDataV119.normalize(payload.wardogs);",
    "if(Number(obj?.assetSchema||0)>=3||Array.isArray(obj?.assets?.wardogsMedia))validateWardogsEmbeddedMedia(obj,payload);",
    "const wardogsResult=await restoreWardogsBackupMedia(obj,payload);",
    "wardogsCreatedIds=wardogsResult.createdIds;",
    "const cloudSaved=await window.mwsV55SaveNow();",
    "if(!cloudSaved)throw new Error('Cloudflare 온라인 데이터 저장에 실패해 기존 데이터를 복구합니다');",
    "try{await cleanupWardogsMediaAfterImport()}",
    "const missingRefs=Number(achievementResult.missingRefs||0)+Number(wardogsResult.missingRefs||0);",
    "window.saveData('전체 백업 가져오기 롤백');await window.mwsV55SaveNow()"
  ])if(!app.includes(token))issues.push('WARDOGS full-backup runtime missing: '+token);

  if(!app.includes("if(!payload?.wardogs||typeof payload.wardogs!=='object')return 0;")){
    issues.push('legacy backups must remain valid when WARDOGS metadata is absent');
  }
  if(!app.includes("return {...card,imageId:mapped||(strictEmbedded?'':imageId)};")){
    issues.push('legacy schema 1/2 backups must retain original WARDOGS image IDs instead of forcibly clearing them');
  }
  if(/localStorage\.setItem\([^\n]*wardogs/i.test(app)||/readAsDataURL\([^\n]*wardogs/i.test(app)){
    warnings.push('review WARDOGS backup code for accidental persistent Base64/localStorage storage');
  }

  for(const token of [
    "async function putLocal(blob,meta={})",
    "async function removeLocal(id)",
    "putLocal,",
    "removeLocal,"
  ])if(!media.includes(token))issues.push('WARDOGS backup local restore support missing: '+token);

  for(const [name,source] of [['cloud-v1.1',cloud],['cloud-runtime-v130',staged]]){
    if(!source.includes("export:['contactMeta','miniGames','notebook','clipboard','wardogs']")){
      issues.push(name+' export lazy-load must include WARDOGS before full backup');
    }
  }

  for(const token of [
    'run-phase126-wardogs-full-backup-audit.mjs',
    'assets/app-core.js?v=1.3.0-search115-wardogs116-backup126',
    'assets/wardogs-media-v1.js?v=1.0.0-phase121-backup126',
    'assetSchema:3,',
    'async function buildWardogsBackupMedia(payload)',
    'async function restoreWardogsBackupMedia(backup,payload)',
    "const putMedia=adminMode?media?.put:media?.putLocal;",
    "if(Number(obj?.assetSchema||0)>=3||Array.isArray(obj?.assets?.wardogsMedia))validateWardogsEmbeddedMedia(obj,payload);",
    "const wardogsResult=await restoreWardogsBackupMedia(obj,payload);",
    "const cloudSaved=await window.mwsV55SaveNow();",
    "async function putLocal(blob,meta={})",
    "export:['contactMeta','miniGames','notebook','clipboard','wardogs']"
  ])if(!workflow.includes(token))issues.push('production Phase 126 verification missing: '+token);

  const summary={phase:126,name:'wardogs-full-backup',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase126WardogsFullBackupAudit();
