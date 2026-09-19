import fs from 'node:fs';

export function runPhase103AchievementPackageValidationAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  for(const token of [
    'const ACHIEVEMENT_PACKAGE_LIMITS=Object.freeze({',
    'maxFileBytes:512*1024*1024',
    'maxCards:5000',
    'maxImageBytes:32*1024*1024',
    'maxGameName:120',
    'maxContentName:160',
    'maxDescription:4000',
    'function achievementBase64DecodedBytes(base64)',
    "value.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(value)",
    'function validateAchievementEmbeddedMedia(backup,payload,{packageMode=false}={})',
    'if(cards.length>ACHIEVEMENT_PACKAGE_LIMITS.maxCards)',
    'if(packed.length>structuralMax)',
    'if(decodedBytes>ACHIEVEMENT_PACKAGE_LIMITS.maxImageBytes)',
    "if(backup?.format!=='MAWANG_ACHIEVEMENT_PACKAGE'||Number(backup?.version)!==1||Number(backup?.assetSchema)!==2)",
    'if(file.size>ACHIEVEMENT_PACKAGE_LIMITS.maxFileBytes)',
    'validateAchievementEmbeddedMedia(pack,payload,{packageMode:true});',
    'if(Number(obj?.assetSchema||0)>=2)validateAchievementEmbeddedMedia(obj,payload);'
  ]){
    if(!core.includes(token))issues.push('achievement package validation missing: '+token);
  }

  const handlerStart=core.indexOf("document.getElementById('achievementImportPackageInput').onchange=async e=>");
  const handlerEnd=core.indexOf("document.getElementById('importAllInput').onchange=async e=>",handlerStart);
  const handler=handlerStart>=0&&handlerEnd>handlerStart?core.slice(handlerStart,handlerEnd):'';
  if(!handler)issues.push('achievement package import handler not found');
  if(handler){
    const sizeCheck=handler.indexOf('if(file.size>ACHIEVEMENT_PACKAGE_LIMITS.maxFileBytes)');
    const readCheck=handler.indexOf('await file.text()');
    const validateCheck=handler.indexOf('validateAchievementEmbeddedMedia(pack,payload,{packageMode:true});');
    const restoreCheck=handler.indexOf('await restoreAchievementBackupMedia(pack,payload)');
    if(sizeCheck<0||readCheck<0||sizeCheck>readCheck)issues.push('package file size is not checked before reading JSON');
    if(validateCheck<0||restoreCheck<0||validateCheck>restoreCheck)issues.push('package content is not validated before Blob restore');
  }

  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:10[3-9]|1[1-9][0-9]|[2-9][0-9]{2,})/.test(index)){
    issues.push('app-core cache-bust is older than search103');
  }

  const summary={phase:103,name:'achievement-package-input-validation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase103AchievementPackageValidationAudit();
