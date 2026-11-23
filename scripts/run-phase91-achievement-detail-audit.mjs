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
    "button.addEventListener('click',()=>{clearTilt();openDetail(card?.id)})",
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
  if(!css.includes('grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);'))issues.push('responsive desktop achievement split layout is missing');
  if(!css.includes('width:min(1240px,calc(100vw - 32px));')||!css.includes('height:min(970px,calc(100dvh - 32px));'))issues.push('desktop achievement detail dialog does not fit viewport');
  if(!css.includes('height:min(780px,calc(100dvh - 198px));')||!css.includes('aspect-ratio:2/3;'))issues.push('detail card stage must fit viewport and retain 2:3 ratio');
  if(!css.includes('padding:36px 54px;'))issues.push('achievement detail outer side spacing is not balanced');
  if(!css.includes('gap:clamp(20px,4vw,54px);'))issues.push('achievement detail column spacing is not adaptive');
  if(!css.includes('width:min(74vw,340px);')||!css.includes('aspect-ratio:2/3;'))issues.push('mobile detail viewer lacks responsive proportional card sizing');
  if(!css.includes('overflow-y:auto;')||!css.includes('scrollbar-width:none;'))issues.push('long descriptions must remain scrollable without visible scrollbar');
  if(!gallery.includes('aria-label="업적 상세 정보" tabindex="0"'))issues.push('long-description scroll must support keyboard focus');
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
