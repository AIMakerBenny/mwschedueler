import fs from 'node:fs';

export function runPhase98AchievementMediaCleanupAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const gallery=fs.readFileSync('assets/achievement-gallery-v1621.js','utf8');
  const media=fs.readFileSync('assets/achievement-media-v1621.js','utf8');
  const css=fs.readFileSync('assets/achievement-gallery-v1621.css','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const token of [
    'function mwsAchievementDeleteCardV1621(id)',
    'const previous=data.achievementCards.map(mwsAchievementCardClone);',
    "const reason='업적 카드 삭제';",
    "renderAll('업적 카드 삭제 실패');",
    'data.achievementCards=previous;',
    'return {ok:true,saved:true,card:mwsAchievementCardClone(removed)};'
  ]){
    if(!core.includes(token))issues.push('atomic achievement deletion missing: '+token);
  }

  for(const token of [
    'function managerReferencedMediaIds()',
    'async function cleanupUnreferencedManagerMedia(ids)',
    'if(referenced.has(id)){kept++;continue}',
    'await media.remove(id)',
    'async function cleanupManagerOrphans()',
    'const ids=await media.listIds();',
    'async function removeManagerImage(kind)',
    'data-achievement-manager-remove="front"',
    'data-achievement-manager-remove="back"',
    'data-achievement-manager-cleanup',
    'const previousImageId=String(latest?.[field]||\'\');',
    'const cleanup=await cleanupUnreferencedManagerMedia([previousImageId]);',
    'const mediaIds=[String(card.frontImageId||\'\'),String(card.backImageId||\'\')].filter(Boolean);',
    'const cleanup=await cleanupUnreferencedManagerMedia(mediaIds);',
    '같은 파일을 사용하는 다른 카드는 유지됩니다.'
  ]){
    if(!gallery.includes(token))issues.push('reference-safe achievement media cleanup missing: '+token);
  }

  for(const token of [
    'async function remove(id)',
    'async function listIds()',
    'remove,',
    'listIds'
  ]){
    if(!media.includes(token))issues.push('achievement media storage cleanup API missing: '+token);
  }

  if(/readAsDataURL\(|toDataURL\(|localStorage\.setItem\([^\n]*(?:frontImage|backImage|achievement)/i.test(gallery)){
    issues.push('reference-safe cleanup regressed to Base64/localStorage image storage');
  }
  if(/data\.achievementCards\s*(?:=|\.push\(|\.splice\()/.test(gallery)){
    issues.push('achievement media manager mutates achievementCards directly instead of app-core API');
  }

  for(const token of [
    '.achievement-manager-list-tools{',
    '.achievement-manager-cleanup{',
    'grid-template-columns:repeat(2,minmax(0,1fr));',
    '.achievement-manager-image-remove{',
    '.achievement-manager-image-remove:disabled{',
    '.achievement-manager-list-tools{width:100%;justify-content:stretch}'
  ]){
    if(!css.includes(token))issues.push('reference-safe media cleanup CSS missing: '+token);
  }

  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:9[8-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than Phase 98');
  if(!/achievement-gallery-v1621\.css\?v=1\.6\.21-phase(?:9[8-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement cleanup CSS cache is older than Phase 98');
  if(!/achievement-gallery-v1621\.js\?v=1\.6\.21-phase(?:9[8-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement cleanup runtime cache is older than Phase 98');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:9[8-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than Phase 98');

  const summary={phase:98,name:'achievement-reference-safe-media-cleanup',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase98AchievementMediaCleanupAudit();
