import fs from 'node:fs';

export function runPhase92Achievement3dAudit(){
  const issues=[];
  const warnings=[];
  const gallery=fs.readFileSync('assets/achievement-gallery-v1621.js','utf8');
  const css=fs.readFileSync('assets/achievement-gallery-v1621.css','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const token of [
    "data-achievement-stage",
    "data-achievement-card3d",
    "achievement-detail-front",
    "achievement-detail-back",
    "achievement-detail-back-default",
    "class=\"achievement-detail-reset\"",
    "stage?.addEventListener('pointerdown',beginDetailDrag)",
    "stage?.addEventListener('pointermove',moveDetailDrag)",
    "stage?.addEventListener('pointerup',endDetailDrag)",
    "if(event.pointerType&&event.pointerType!=='mouse')return",
    "detailRotation.x=clamp(detailDrag.rotateX-dy*.34,-35,35)",
    "detailRotation.y=detailDrag.rotateY+dx*.58",
    "rotateX(",
    "rotateY(",
    "window.mwsResetAchievementCardV1621=resetDetailRotation",
    "String(card.backImageId)",
    "카드 뒷면"
  ]){
    if(!gallery.includes(token))issues.push('achievement 3D runtime missing: '+token);
  }
  if(!gallery.includes("root.querySelector('.achievement-detail-reset')?.addEventListener('click',resetDetailRotation)"))issues.push('front reset button is not wired');
  if(!gallery.includes("stage?.addEventListener('dblclick'"))issues.push('double-click front reset is missing');
  if(!gallery.includes("back.classList.add('loading-image')"))issues.push('custom back image loading state is missing');
  if(!gallery.includes("await Promise.allSettled(pending)"))issues.push('front/back detail image loads are not isolated');

  for(const token of [
    'perspective:1400px;',
    'transform-style:preserve-3d;',
    'backface-visibility:hidden;',
    '.achievement-detail-front{transform:rotateY(0deg)}',
    'transform:rotateY(180deg);',
    '.achievement-detail-stage.dragging .achievement-detail-card3d{transition:none}',
    '.achievement-detail-back-default{',
    '.achievement-detail-reset{'
  ]){
    if(!css.includes(token))issues.push('achievement 3D CSS missing: '+token);
  }
  if(!css.includes('aspect-ratio:2/3;'))issues.push('3D achievement card lost its 2:3 aspect ratio');

  if(!post.includes("achievement-gallery-v1621.css?v=1.6.21-phase92"))issues.push('Phase 92 achievement 3D CSS cache is missing');
  if(!post.includes("achievement-gallery-v1621.js?v=1.6.21-phase92"))issues.push('Phase 92 achievement 3D runtime cache is missing');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:9[2-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than Phase 92');

  const summary={phase:92,name:'achievement-3d-viewer',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase92Achievement3dAudit();
