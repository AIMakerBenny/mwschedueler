import fs from 'node:fs';

export function runPhase134WardogsPortraitRenderAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const runtime=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const css=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "function portraitSpec(card)",
    "const source=card?.portraitSource==='custom'?'custom':'contact';",
    "imageId:String(card?.portraitImageId||card?.imageId||'').trim(),",
    "url:String(contact?.image||'').trim(),",
    "portraitPositionX",
    "portraitPositionY",
    "portraitScale",
    "function applyPortraitGeometry(img,spec)",
    "img.style.setProperty('--wd-portrait-x',spec.x+'%');",
    "img.style.setProperty('--wd-portrait-y',spec.y+'%');",
    "img.style.setProperty('--wd-portrait-scale',String(spec.scale));",
    "view.visual.dataset.wardogsPortraitSource=spec.source;",
    "view.frameLayer.dataset.wardogsClassFrame=String(card?.classId||'');",
    "frameLayer.dataset.wardogsClassFrame=String(card?.classId||'');",
    "const blob=await media.getBlob(imageId);",
    "const blob=await mediaApi()?.getBlob?.(imageId);",
    "const contactChanged=reason.includes('연락처')||/contact/i.test(reason);",
    "window.__mwsWardogsPortraitRenderV134='contact-custom-transform-frame-slot';"
  ])if(!runtime.includes(token))issues.push('portrait render runtime missing: '+token);

  if(runtime.includes('<span>IMAGE LINK</span><strong>LOADING</strong>')){
    issues.push('legacy IMAGE LINK / LOADING placeholder remains in WARDOGS portrait renderer');
  }

  for(const token of [
    '.wardogs-portrait-stage-v134{',
    '.wardogs-gallery-visual-v124 img.wardogs-portrait-image-v134,',
    'object-fit:contain;',
    'object-position:var(--wd-portrait-x,50%) var(--wd-portrait-y,50%);',
    'transform:scale(var(--wd-portrait-scale,1));',
    '.wardogs-class-frame-layer-v134{'
  ])if(!css.includes(token))issues.push('portrait render CSS missing: '+token);

  for(const token of [
    'assets/wardogs-v1.js?v=1.0.0-phase125-portrait138',
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136'
  ])if(!index.includes(token))issues.push('portrait render cache revision missing: '+token);

  for(const token of [
    'run-phase134-wardogs-portrait-render-audit.mjs',
    'assets/wardogs-v1.js?v=1.0.0-phase125-portrait138',
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136',
    "__mwsWardogsPortraitRenderV134='contact-custom-transform-frame-slot'",
    "function portraitSpec(card)",
    "imageId:String(card?.portraitImageId||card?.imageId||'').trim(),",
    "url:String(contact?.image||'').trim(),",
    '.wardogs-class-frame-layer-v134{'
  ])if(!workflow.includes(token))issues.push('production Phase 134 verification missing: '+token);

  // Phase 135 verifies the six class frame assets and mapping.
  const summary={phase:134,name:'wardogs-portrait-render',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase134WardogsPortraitRenderAudit();
