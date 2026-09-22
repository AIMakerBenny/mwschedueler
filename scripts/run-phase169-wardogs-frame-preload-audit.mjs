import fs from 'node:fs';

export function runPhase169WardogsFramePreloadAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const js=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const css=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136-aperture152-medicaperture165-classapertures166-unassigned168-framepreload169",
    "assets/wardogs-v1.js?v=1.0.0-phase125-portrait138-soopid141-frames150-aperture152-assault166-medic165-recon163-support166-driver161-pilot166-unassigned168-framepreload169"
  ])if(!index.includes(token))issues.push('Phase 169 cache token missing: '+token);

  for(const token of [
    "const framePreloadCache=new Map();",
    "function preloadClassFrame(classId){",
    "function preloadAllClassFrames(){",
    "void preloadAllClassFrames();",
    "const frameReady=preloadClassFrame(card?.classId);",
    "await frameReady;",
    "wardogs-composite-pending-v169",
    "wardogs-composite-ready-v169",
    "window.__mwsWardogsCompositeLoadV169='frame-preload-synchronized-reveal';"
  ])if(!js.includes(token))issues.push('Phase 169 runtime token missing: '+token);

  if((js.match(/const frameReady=preloadClassFrame\(card\?\.classId\);/g)||[]).length<2)
    issues.push('Phase 169 gallery/detail frame preload is not applied to both renderers');
  if((js.match(/if\(img\.complete&&img\.naturalWidth>0\)queueMicrotask\(ready\);/g)||[]).length<2)
    issues.push('Phase 169 cached portrait fast path is missing');
  if(!js.includes("frame.classList.add('wardogs-composite-pending-v169');"))
    issues.push('Phase 169 detail pending state missing');

  for(const token of [
    '/* Phase 169: synchronize portrait and frame reveal after frame preload. */',
    '.wardogs-portrait-stage-v134.wardogs-composite-pending-v169 .wardogs-portrait-clip-v152,',
    '.wardogs-portrait-stage-v134.wardogs-composite-pending-v169 .wardogs-class-frame-layer-v134{',
    'opacity:0!important;',
    '.wardogs-portrait-stage-v134.wardogs-composite-ready-v169 .wardogs-class-frame-layer-v134{',
    'transition:opacity .08s linear;'
  ])if(!css.includes(token))issues.push('Phase 169 CSS token missing: '+token);

  for(const token of [
    'run-phase169-wardogs-frame-preload-audit.mjs',
    "__mwsWardogsCompositeLoadV169='frame-preload-synchronized-reveal'",
    'wardogs-composite-pending-v169'
  ])if(!workflow.includes(token))issues.push('Phase 169 workflow verification missing: '+token);

  const summary={phase:169,name:'wardogs-frame-preload-synchronized-reveal',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase169WardogsFramePreloadAudit();
