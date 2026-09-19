import fs from 'node:fs';

export function runPhase104AchievementDirectUploadLimitAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const gallery=fs.readFileSync('assets/achievement-gallery-v1621.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const token of [
    'maxImageBytes:32*1024*1024',
    'window.mwsAchievementPackageLimitsV1621=ACHIEVEMENT_PACKAGE_LIMITS;'
  ]){
    if(!core.includes(token))issues.push('shared achievement image limit missing: '+token);
  }

  for(const token of [
    'function managerImageMaxBytes()',
    'window.mwsAchievementPackageLimitsV1621?.maxImageBytes',
    'if(file.size>managerImageMaxBytes()){',
    "setManagerStatus('업적 카드 이미지는 한 장당 32MB 이하만 등록할 수 있습니다.','error');",
    '이미지당 32MB 이하'
  ]){
    if(!gallery.includes(token))issues.push('direct achievement upload limit missing: '+token);
  }

  const replaceStart=gallery.indexOf('async function replaceManagerImage(kind,file)');
  const replaceEnd=gallery.indexOf('function ensureManagerModal()',replaceStart);
  const replaceBody=replaceStart>=0&&replaceEnd>replaceStart?gallery.slice(replaceStart,replaceEnd):'';
  if(!replaceBody)issues.push('achievement image replacement function not found');
  if(replaceBody){
    const sizeIndex=replaceBody.indexOf('if(file.size>managerImageMaxBytes()){');
    const decodeIndex=replaceBody.indexOf('await managerImageDimensions(file)');
    const putIndex=replaceBody.indexOf('await media.put(file,{kind,width,height})');
    if(sizeIndex<0||decodeIndex<0||sizeIndex>decodeIndex)issues.push('direct upload size is not checked before image decode');
    if(sizeIndex<0||putIndex<0||sizeIndex>putIndex)issues.push('direct upload size is not checked before IndexedDB persistence');
  }

  if((gallery.match(/이미지당 32MB 이하/g)||[]).length<2)issues.push('both front and back manager hints do not show the 32MB limit');
  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:10[4-9]|1[1-9][0-9]|[2-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search104');
  if(!/achievement-gallery-v1621\.js\?v=1\.6\.21-phase(?:104|10[5-9]|1[1-9][0-9]|[2-9][0-9]{2,})/.test(post))issues.push('achievement gallery runtime cache is older than Phase 104');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:104|10[5-9]|1[1-9][0-9]|[2-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than Phase 104');

  const summary={phase:104,name:'achievement-direct-upload-limit',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase104AchievementDirectUploadLimitAudit();
