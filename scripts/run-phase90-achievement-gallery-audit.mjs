import fs from 'node:fs';

export function runPhase90AchievementGalleryAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const gallery=fs.readFileSync('assets/achievement-gallery-v1621.js','utf8');
  const css=fs.readFileSync('assets/achievement-gallery-v1621.css','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const token of ['id="achievementCountChip"','id="achievementEmptyState"','id="achievementGallery"']){
    if(!index.includes(token))issues.push('achievement gallery shell missing: '+token);
  }
  if(!index.includes('id="achievementGallery" aria-live="polite" hidden'))issues.push('achievement gallery does not start hidden with polite live region');
  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:9[0-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search90');

  if(!core.includes('window.mwsGetAchievementCardsV1621=()=>Array.isArray(data?.achievementCards)?data.achievementCards:[];'))issues.push('achievement metadata getter is missing');
  if(!core.includes("if(tab==='achievements')safeRenderView('업적',()=>window.mwsRenderAchievementGalleryV1621?.());"))issues.push('achievement tab does not invoke the gallery renderer');

  for(const token of [
    'window.mwsRenderAchievementGalleryV1621=render;',
    "media.getBlob(imageId)",
    "img.loading='lazy'",
    "img.decoding='async'",
    'URL.createObjectURL(blob)',
    'URL.revokeObjectURL(url)',
    'clearGalleryObjectUrls();',
    'count.textContent=',
    'empty.hidden=list.length>0',
    'grid.hidden=list.length===0'
  ]){
    if(!gallery.includes(token))issues.push('achievement gallery runtime missing: '+token);
  }
  if(!gallery.includes("sort((a,b)=>(Number(a?.order)||0)-(Number(b?.order)||0))"))issues.push('achievement gallery does not respect stored card order');
  if(/readAsDataURL\(|toDataURL\(/.test(gallery))issues.push('achievement gallery should not Base64-encode card images');

  if(!css.includes('#achievementGallery{'))issues.push('achievement gallery grid CSS is missing');
  if(!css.includes('aspect-ratio:2/3;'))issues.push('achievement card thumbnail does not preserve the 2:3 card ratio');
  if(!css.includes('grid-template-columns:repeat(2,minmax(0,1fr));'))issues.push('mobile achievement gallery two-column layout is missing');

  if(!/loadStyle\('achievement-gallery-v1621','\/assets\/achievement-gallery-v1621\.css\?v=1\.6\.21-phase(?:9[0-9]|[1-9][0-9]{2,})'\)/.test(post))issues.push('achievement gallery stylesheet cache is older than Phase 90');
  if(!/load\('achievement-gallery-v1621','\/assets\/achievement-gallery-v1621\.js\?v=1\.6\.21-phase(?:9[0-9]|[1-9][0-9]{2,})','__mwsAchievementGalleryRuntimeV1621'\)/.test(post))issues.push('achievement gallery runtime cache is older than Phase 90');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:9[0-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than phase90');

  const summary={phase:90,name:'achievement-gallery',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase90AchievementGalleryAudit();
