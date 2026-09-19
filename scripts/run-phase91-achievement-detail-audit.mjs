import fs from 'node:fs';

export function runPhase91AchievementDetailAudit(){
  const issues=[];
  const warnings=[];
  const gallery=fs.readFileSync('assets/achievement-gallery-v1621.js','utf8');
  const css=fs.readFileSync('assets/achievement-gallery-v1621.css','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const token of [
    "button.className='achievement-card-open'",
    "button.addEventListener('click',()=>openDetail(card?.id))",
    "root.id='achievementDetailModal'",
    "root.setAttribute('role','dialog')",
    "root.setAttribute('aria-modal','true')",
    "data-achievement-detail=\"game\"",
    "data-achievement-detail=\"content\"",
    "data-achievement-detail=\"description\"",
    "window.mwsOpenAchievementDetailV1621=openDetail",
    "window.mwsCloseAchievementDetailV1621=closeDetail",
    "if(event.key!=='Escape')return;",
    "URL.revokeObjectURL(url)"
  ]){
    if(!gallery.includes(token))issues.push('achievement detail runtime missing: '+token);
  }
  if(!gallery.includes("root.querySelector('[data-achievement-detail=\"game\"]').textContent"))issues.push('game name is not populated in achievement detail');
  if(!gallery.includes("root.querySelector('[data-achievement-detail=\"content\"]').textContent"))issues.push('content name is not populated in achievement detail');
  if(!gallery.includes("root.querySelector('[data-achievement-detail=\"description\"]').textContent"))issues.push('description is not populated in achievement detail');
  if(!gallery.includes('clearDetailObjectUrls();'))issues.push('detail object URL cleanup is missing');
  if(!gallery.includes("if(detailModal&&!detailModal.hidden){event.preventDefault();closeDetail()}"))issues.push('Escape no longer closes the achievement detail modal');
  if(!gallery.includes("detailLastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;"))issues.push('detail modal does not preserve the opening focus target');

  for(const token of [
    '.achievement-detail-modal{',
    '.achievement-detail-dialog{',
    '.achievement-detail-layout{',
    '.achievement-detail-card{',
    '.achievement-detail-fields{',
    'body.mws-achievement-modal-open{overflow:hidden!important}'
  ]){
    if(!css.includes(token))issues.push('achievement detail CSS missing: '+token);
  }
  if(!css.includes('grid-template-columns:minmax(720px,820px) minmax(420px,1fr);'))issues.push('desktop achievement detail enlarged split layout is missing');
  if(!css.includes('width:min(1720px,99vw);'))issues.push('desktop achievement detail dialog is not enlarged');
  if(!css.includes('width:min(100%,620px,calc((96vh - 120px)*2/3));'))issues.push('desktop achievement card stage size changed unexpectedly');
  if(!css.includes('padding:32px 72px;'))issues.push('achievement detail outer side spacing is not widened');
  if(!css.includes('gap:56px;'))issues.push('achievement detail content spacing is not widened');
  if(!css.includes('width:min(90vw,400px)'))issues.push('mobile achievement card viewer is still too small');
  if(!css.includes('width:100%;'))issues.push('mobile achievement detail dialog does not use full width');
  if(!css.includes('white-space:pre-wrap;'))issues.push('achievement description multiline rendering is missing');

  if(!/achievement-gallery-v1621\.css\?v=1\.6\.21-phase(?:9[1-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement detail CSS cache is older than Phase 91');
  if(!/achievement-gallery-v1621\.js\?v=1\.6\.21-phase(?:9[1-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement detail runtime cache is older than Phase 91');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:9[1-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than Phase 91');

  const summary={phase:91,name:'achievement-detail-modal',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase91AchievementDetailAudit();
