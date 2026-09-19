import fs from 'node:fs';

export function runPhase96AchievementImageEditorAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const gallery=fs.readFileSync('assets/achievement-gallery-v1621.js','utf8');
  const css=fs.readFileSync('assets/achievement-gallery-v1621.css','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const token of [
    'const previous=mwsAchievementCardClone(card);',
    "const reason='업적 카드 저장';",
    'const saved=persist();',
    'Object.assign(card,previous);',
    "renderAll('업적 카드 저장 실패');",
    "new CustomEvent('mawang:datachange',{detail:{reason}})",
    'return {ok:true,saved:true,card:mwsAchievementCardClone(card)};'
  ]){
    if(!core.includes(token))issues.push('atomic achievement metadata update missing: '+token);
  }

  for(const token of [
    'data-achievement-manager-file="front"',
    'data-achievement-manager-file="back"',
    'accept="image/*"',
    'data-achievement-manager-drop="front"',
    'data-achievement-manager-drop="back"',
    'data-achievement-manager-preview="front"',
    'data-achievement-manager-preview="back"',
    'function renderManagerMediaPreviews(card)',
    'async function replaceManagerImage(kind,file)',
    'managerImageFile(event.dataTransfer?.files)',
    'media.put(file,{kind,width,height})',
    'api.update(cardId,patch)',
    'await media.remove(createdId)',
    '기존 이미지는 유지됩니다.',
    'function cleanupUnreferencedManagerMedia(ids)'
  ]){
    if(!gallery.includes(token))issues.push('achievement image editor runtime missing: '+token);
  }
  if(/readAsDataURL\(|toDataURL\(|localStorage\.setItem\([^\n]*(?:frontImage|backImage|achievement)/i.test(gallery)){
    issues.push('achievement image editor regressed to Base64/localStorage image storage');
  }
  if(/data\.achievementCards\s*(?:=|\.push\(|\.splice\()/.test(gallery)){
    issues.push('achievement image editor mutates achievementCards directly');
  }

  const deleteStart=gallery.indexOf('function deleteManagerCard()');
  const deleteEnd=gallery.indexOf('function syncManagerShellCount()',deleteStart);
  const deleteBody=deleteStart>=0&&deleteEnd>deleteStart?gallery.slice(deleteStart,deleteEnd):'';
  if(!deleteBody)issues.push('achievement card deletion function not found for media policy audit');
  if(deleteBody.includes('media.remove(')&&!deleteBody.includes('cleanupUnreferencedManagerMedia(mediaIds)')){
    issues.push('card deletion removes media without the Phase 98 reference scan successor');
  }

  for(const token of [
    '.achievement-manager-media-grid{',
    'grid-template-columns:repeat(2,minmax(0,1fr));',
    '.achievement-manager-dropzone{',
    '.achievement-manager-dropzone.is-dragover{',
    '.achievement-manager-media-preview{',
    'aspect-ratio:2/3;',
    '.achievement-manager-media-preview img{',
    '.achievement-manager-media-hint{display:none}'
  ]){
    if(!css.includes(token))issues.push('achievement image editor CSS missing: '+token);
  }

  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:9[6-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than Phase 96');
  if(!/achievement-gallery-v1621\.css\?v=1\.6\.21-phase(?:9[6-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement image CSS cache is older than Phase 96');
  if(!/achievement-gallery-v1621\.js\?v=1\.6\.21-phase(?:9[6-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement image runtime cache is older than Phase 96');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:9[6-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than Phase 96');

  const summary={phase:96,name:'achievement-image-editor',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase96AchievementImageEditorAudit();
