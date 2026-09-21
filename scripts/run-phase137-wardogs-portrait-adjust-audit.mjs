import fs from 'node:fs';

export function runPhase137WardogsPortraitAdjustAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const data=fs.readFileSync('assets/wardogs-data-v1.js','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const css=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "portraitPositionX:clampNumber(item.portraitPositionX,0,100,50)",
    "portraitPositionY:clampNumber(item.portraitPositionY,0,100,50)",
    "portraitScale:clampNumber(item.portraitScale,0.25,3,1)"
  ])if(!data.includes(token))issues.push('portrait schema regression: '+token);

  for(const token of [
    "const CLASS_FRAMES=Object.freeze({",
    "assault:'assets/wardogs-frames/assault.webp'",
    "medic:'assets/wardogs-frames/medic.webp'",
    "recon:'assets/wardogs-frames/recon.webp'",
    "support:'assets/wardogs-frames/support.webp'",
    "driver:'assets/wardogs-frames/driver.webp'",
    "pilot:'assets/wardogs-frames/pilot.webp'",
    "let draftPortraitX=50;",
    "let draftPortraitY=50;",
    "let draftPortraitScale=1;",
    "function renderPortraitFrame()",
    "function applyDraftPortraitGeometry(img)",
    "img.style.setProperty('--wd-manager-portrait-x',draftPortraitX+'%');",
    "img.style.setProperty('--wd-manager-portrait-y',draftPortraitY+'%');",
    "img.style.setProperty('--wd-manager-portrait-scale',String(draftPortraitScale));",
    "function handlePortraitPointerDown(event)",
    "function handlePortraitPointerMove(event)",
    "const dx=(event.clientX-portraitPointerStartClientX)/rect.width*100;",
    "const dy=(event.clientY-portraitPointerStartClientY)/rect.height*100;",
    "setDraftPortraitGeometry({x:portraitPointerStartX-dx,y:portraitPointerStartY-dy});",
    "data-wardogs-manager-frame",
    "data-wardogs-manager-portrait-scale",
    'type="range" min="0.25" max="3" step="0.05"',
    "data-wardogs-manager-portrait-reset",
    "drop?.addEventListener('pointerdown',handlePortraitPointerDown);",
    "drop?.addEventListener('pointermove',handlePortraitPointerMove);",
    "drop?.addEventListener('pointerup',handlePortraitPointerEnd);",
    "drop?.addEventListener('pointercancel',handlePortraitPointerEnd);",
    "addEventListener('change',()=>{markDirty();renderPortraitFrame()})",
    "portraitPositionX:draftPortraitX",
    "portraitPositionY:draftPortraitY",
    "portraitScale:draftPortraitScale",
    "window.__mwsWardogsPortraitAdjustV137='drag-position-zoom-frame-preview';"
  ])if(!manager.includes(token))issues.push('portrait adjustment runtime missing: '+token);

  if(/touchstart|touchmove|touchend/.test(manager)){
    warnings.push('portrait adjustment should continue to use Pointer Events instead of duplicate legacy touch handlers');
  }

  for(const token of [
    '/* Phase 137: portrait framing controls */',
    '.wardogs-manager-drop-v122.has-portrait-v137{',
    'touch-action:none',
    '.wardogs-manager-drop-v122 img.wardogs-manager-portrait-image-v137{',
    'object-fit:contain;',
    'object-position:var(--wd-manager-portrait-x,50%) var(--wd-manager-portrait-y,50%);',
    'transform:scale(var(--wd-manager-portrait-scale,1));',
    '.wardogs-manager-drop-v122 img.wardogs-manager-frame-v140{',
    'background-size:100% 100%',
    '.wardogs-manager-portrait-tools-v137{',
    '@media(max-width:560px)'
  ])if(!css.includes(token))issues.push('portrait adjustment CSS missing: '+token);

  if(!index.includes('assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-frame140'))issues.push('Phase 137 manager JS cache revision missing');
  if(!index.includes('assets/wardogs-manager-v1.css?v=1.0.0-phase127-mobile129-frame140'))issues.push('Phase 137 manager CSS cache revision missing');

  for(const token of [
    'run-phase137-wardogs-portrait-adjust-audit.mjs',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-frame140',
    'assets/wardogs-manager-v1.css?v=1.0.0-phase127-mobile129-frame140',
    "__mwsWardogsPortraitAdjustV137='drag-position-zoom-frame-preview'",
    "function handlePortraitPointerMove(event)",
    "portraitPositionX:draftPortraitX",
    "portraitPositionY:draftPortraitY",
    "portraitScale:draftPortraitScale",
    '.wardogs-manager-drop-v122 img.wardogs-manager-frame-v140{',
    'object-position:var(--wd-manager-portrait-x,50%) var(--wd-manager-portrait-y,50%);'
  ])if(!workflow.includes(token))issues.push('production Phase 137 verification missing: '+token);

  const summary={phase:137,name:'wardogs-portrait-adjust',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase137WardogsPortraitAdjustAudit();
