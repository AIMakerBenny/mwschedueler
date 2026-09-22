import fs from 'node:fs';

export function runPhase142WardogsGalleryTransparentCanvasAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  if(index.includes('assets/wardogs-gallery-phase142.css'))issues.push('retired Phase 142 override stylesheet is still wired in index');
  if(fs.existsSync('assets/wardogs-gallery-phase142.css'))issues.push('retired Phase 142 override stylesheet still exists');

  for(const token of [
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136-aperture152-medicaperture165-classapertures166-unassigned168-framepreload169-consolidated170'
  ])if(!index.includes(token))issues.push('Phase 142 consolidated stylesheet wiring missing: '+token);

  for(const token of [
    '/* Phase 142: gallery portrait stage uses the page/card surface instead of a forced black canvas. */',
    '.wardogs-gallery-visual-v124.wardogs-portrait-stage-v134{background:transparent!important}'
  ])if(!css.includes(token))issues.push('Phase 142 transparent gallery canvas CSS missing after consolidation: '+token);

  for(const token of [
    '.wardogs-portrait-stage-v134{background:#000!important}',
    '.wardogs-gallery-footer-v124{',
    'border:1px solid var(--wd-line);border-radius:10px;',
    '.wardogs-class-frame-layer-v134{'
  ])if(!css.includes(token))issues.push('protected WARDOGS visual styling missing: '+token);

  if(/wardogs-detail[^\n{]*\{[^}]*background\s*:\s*transparent!important/s.test(css))issues.push('Phase 142 must not make detail canvas transparent');
  if(/wardogs-gallery-footer[^\n{]*\{[^}]*background\s*:\s*transparent!important/s.test(css))issues.push('Phase 142 must not change gallery footer background');

  for(const token of [
    'run-phase142-wardogs-gallery-transparent-canvas-audit.mjs',
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136-aperture152-medicaperture165-classapertures166-unassigned168-framepreload169-consolidated170',
    '.wardogs-gallery-visual-v124.wardogs-portrait-stage-v134{background:transparent!important}'
  ])if(!workflow.includes(token))issues.push('production Phase 142 verification missing: '+token);

  const summary={phase:142,name:'wardogs-gallery-transparent-canvas',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase142WardogsGalleryTransparentCanvasAudit();
