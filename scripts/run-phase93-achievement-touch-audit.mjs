import fs from 'node:fs';

export function runPhase93AchievementTouchAudit(){
  const issues=[];
  const warnings=[];
  const gallery=fs.readFileSync('assets/achievement-gallery-v1621.js','utf8');
  const css=fs.readFileSync('assets/achievement-gallery-v1621.css','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const token of [
    "const TOUCH_DRAG_THRESHOLD=8;",
    "const TOUCH_HORIZONTAL_RATIO=1.18;",
    "const TOUCH_ROTATE_X_PER_PX=.28;",
    "const TOUCH_ROTATE_Y_PER_PX=1.18;",
    "pointerType==='touch'?'pending':'rotate'",
    "if(detailDrag.pointerType==='touch'&&detailDrag.mode==='pending')",
    "if(Math.max(ax,ay)<TOUCH_DRAG_THRESHOLD)return",
    "if(ay>ax){",
    "detailDrag.mode='scroll';",
    "if(ax<ay*TOUCH_HORIZONTAL_RATIO)return",
    "if(detailDrag.pointerType==='touch'){",
    "detailRotation.x=clamp(detailDrag.rotateX-clamp(dy,-120,120)*TOUCH_ROTATE_X_PER_PX,-32,32)",
    "detailRotation.y=detailDrag.rotateY+dx*TOUCH_ROTATE_Y_PER_PX",
    "stage.classList.remove('dragging','touch-dragging')",
    "achievement-detail-hint-touch"
  ]){
    if(!gallery.includes(token))issues.push('mobile achievement gesture runtime missing: '+token);
  }

  if(gallery.includes("if(event.pointerType&&event.pointerType!=='mouse')return"))issues.push('legacy touch-blocking guard still prevents mobile card rotation');
  if(!gallery.includes("if(pointerType==='touch')return;"))issues.push('touch pointerdown should defer capture until direction is known');
  if(!gallery.includes("activateDetailDrag(stage,event);"))issues.push('direction-locked touch gesture never activates card rotation');

  for(const token of [
    'touch-action:pan-y pinch-zoom;',
    '@media(pointer:coarse){',
    '.achievement-detail-hint-mouse{display:none}',
    '.achievement-detail-hint-touch{display:inline}',
    '.achievement-detail-stage{width:min(72vw,286px)}',
    'max-height:none;',
    'overflow:auto;'
  ]){
    if(!css.includes(token))issues.push('mobile achievement touch CSS missing: '+token);
  }
  if(css.includes('touch-action:none'))issues.push('achievement card touch CSS blocks native scrolling');

  if(!/achievement-gallery-v1621\.css\?v=1\.6\.21-phase(?:9[3-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement mobile CSS cache is older than Phase 93');
  if(!/achievement-gallery-v1621\.js\?v=1\.6\.21-phase(?:9[3-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement mobile runtime cache is older than Phase 93');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:9[3-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than Phase 93');

  const summary={phase:93,name:'achievement-mobile-touch',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase93AchievementTouchAudit();
