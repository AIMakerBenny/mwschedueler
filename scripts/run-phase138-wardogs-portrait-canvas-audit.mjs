import fs from 'node:fs';

export function runPhase138WardogsPortraitCanvasAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const data=fs.readFileSync('assets/wardogs-data-v1.js','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const managerCss=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const runtime=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const runtimeCss=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const worker=fs.readFileSync('src/cf-v111-auth.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "portraitScale:clampNumber(item.portraitScale,0.25,3,1)"
  ])if(!data.includes(token))issues.push('browser portrait scale range missing: '+token);

  for(const token of [
    "Math.max(0.25,Number.isFinite(Number(item.portraitScale))"
  ])if(!worker.includes(token))issues.push('server portrait scale range missing: '+token);

  for(const token of [
    "clampPortrait(next.scale,0.25,3,1)",
    "draftPortraitScale=clampPortrait(card?.portraitScale,0.25,3,1);",
    'type="range" min="0.25" max="3" step="0.05" value="1"',
    "stateEl.hidden=true;",
    "if(img.complete&&img.naturalWidth>0)queueMicrotask(ready);",
    "window.__mwsWardogsPortraitCanvasV138='quarter-scale-contain-black-no-loading-overlay';"
  ])if(!manager.includes(token))issues.push('manager Phase 138 runtime missing: '+token);

  for(const token of [
    "scale:clampPortraitValue(card?.portraitScale,0.25,3,1)",
    "view.placeholder.hidden=true;",
    "stateEl.hidden=true;",
    "if(img.complete&&img.naturalWidth>0)queueMicrotask(ready);",
    "window.__mwsWardogsPortraitCanvasV138='quarter-scale-contain-black-no-loading-overlay';"
  ])if(!runtime.includes(token))issues.push('gallery/detail Phase 138 runtime missing: '+token);

  for(const token of [
    'object-fit:contain;',
    '.wardogs-portrait-stage-v134{background:#000!important}',
    '.wardogs-gallery-placeholder-v124[hidden],',
    '.wardogs-detail-media-state-v125[hidden]{display:none!important}'
  ])if(!runtimeCss.includes(token))issues.push('gallery/detail black canvas CSS missing: '+token);

  for(const token of [
    'object-fit:contain;',
    '.wardogs-manager-drop-v122{background:#000}',
    '.wardogs-manager-drop-state-v122[hidden]{display:none!important}'
  ])if(!managerCss.includes(token))issues.push('manager black canvas CSS missing: '+token);

  for(const token of [
    'assets/wardogs-data-v1.js?v=1.0.0-phase120-webview130-zoom138',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-portrait138',
    'assets/wardogs-manager-v1.css?v=1.0.0-phase127-mobile129-portrait138',
    'assets/wardogs-v1.js?v=1.0.0-phase125-portrait138',
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136'
  ])if(!index.includes(token))issues.push('Phase 138 cache revision missing: '+token);

  for(const token of [
    'run-phase138-wardogs-portrait-canvas-audit.mjs',
    "__mwsWardogsPortraitCanvasV138='quarter-scale-contain-black-no-loading-overlay'",
    "portraitScale:clampNumber(item.portraitScale,0.25,3,1)",
    "Math.max(0.25,Number.isFinite(Number(item.portraitScale))",
    'type="range" min="0.25" max="3" step="0.05" value="1"',
    '.wardogs-manager-drop-state-v122[hidden]{display:none!important}',
    '.wardogs-detail-media-state-v125[hidden]{display:none!important}'
  ])if(!workflow.includes(token))issues.push('production Phase 138 verification missing: '+token);

  const summary={phase:138,name:'wardogs-portrait-canvas',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase138WardogsPortraitCanvasAudit();
