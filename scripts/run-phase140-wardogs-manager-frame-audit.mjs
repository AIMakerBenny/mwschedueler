import fs from 'node:fs';

export function runPhase140WardogsManagerFrameAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const css=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'function renderPortraitFrame(){',
    'const frameSrc=CLASS_FRAMES[classId]||CLASS_FRAMES.assault;',
    "if(layer.getAttribute('src')!==frameSrc)layer.setAttribute('src',frameSrc);",
    'layer.hidden=false;',
    '<img class="wardogs-manager-frame-v140" data-wardogs-manager-frame alt="" draggable="false" aria-hidden="true">',
    "window.__mwsWardogsManagerFrameV140='img-layer-class-frame';"
  ])if(!manager.includes(token))issues.push('manager frame runtime missing: '+token);

  const legacyPortraitCleanup="drop.querySelectorAll('.wardogs-manager-portrait-image-v137').forEach(img=>img.remove());";
  const aperturePortraitCleanup='portraitClip.replaceChildren();';
  if(!manager.includes(legacyPortraitCleanup)&&!manager.includes(aperturePortraitCleanup)){
    issues.push('manager portrait cleanup path missing');
  }

  if(manager.includes("drop.querySelectorAll('img').forEach(img=>img.remove());")){
    issues.push('generic manager preview image cleanup can delete the class frame');
  }
  if(manager.includes('layer.style.backgroundImage=')){
    issues.push('legacy manager frame background-image path remains active');
  }

  for(const token of [
    '.wardogs-manager-drop-v122 img.wardogs-manager-frame-v140{',
    'position:absolute;inset:0;z-index:2;pointer-events:none;',
    'display:block;width:100%;height:100%;max-width:none;max-height:none;',
    'object-fit:fill;object-position:center;transform:none;transform-origin:center;',
    'background:transparent;user-select:none'
  ])if(!css.includes(token))issues.push('manager frame CSS missing: '+token);

  if(!index.includes('assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-frame140'))issues.push('Phase 140 manager JS cache revision missing');
  if(!index.includes('assets/wardogs-manager-v1.css?v=1.0.0-phase127-mobile129-frame140'))issues.push('Phase 140 manager CSS cache revision missing');

  for(const token of [
    'run-phase140-wardogs-manager-frame-audit.mjs',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-frame140',
    'assets/wardogs-manager-v1.css?v=1.0.0-phase127-mobile129-frame140',
    "__mwsWardogsManagerFrameV140='img-layer-class-frame'",
    "if(layer.getAttribute('src')!==frameSrc)layer.setAttribute('src',frameSrc);",
    "portraitClip.replaceChildren();",
    '.wardogs-manager-drop-v122 img.wardogs-manager-frame-v140{'
  ])if(!workflow.includes(token))issues.push('production Phase 140 verification missing: '+token);

  const summary={phase:140,name:'wardogs-manager-frame-image-layer',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase140WardogsManagerFrameAudit();
