import fs from 'node:fs';

export function runPhase151WardogsGalleryPortraitTransparencyAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  if(index.includes('assets/wardogs-gallery-phase142.css'))issues.push('retired Phase 142/151 override stylesheet is still wired in index');
  if(fs.existsSync('assets/wardogs-gallery-phase142.css'))issues.push('retired Phase 142/151 override stylesheet still exists');

  const sheet='assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136-aperture152-medicaperture165-classapertures166-unassigned168-framepreload169-consolidated170';
  if(!index.includes(sheet))issues.push('Phase 151 stylesheet cache revision missing: '+sheet);

  for(const token of [
    '/* Phase 151: remove the remaining black fill from the gallery portrait image layer only. */',
    '.wardogs-gallery-visual-v124 img.wardogs-portrait-image-v134{background:transparent!important}'
  ])if(!css.includes(token))issues.push('Phase 151 gallery portrait transparency CSS missing: '+token);

  for(const token of [
    '.wardogs-gallery-visual-v124 img.wardogs-portrait-image-v134,',
    '.wardogs-detail-media-frame-v125 img.wardogs-portrait-image-v134{',
    'border-radius:0;background:#05070a;',
    '.wardogs-portrait-stage-v134{background:#000!important}',
    '.wardogs-gallery-footer-v124{',
    'border:1px solid var(--wd-line);border-radius:10px;',
    '.wardogs-class-frame-layer-v134{'
  ])if(!css.includes(token))issues.push('protected WARDOGS base styling missing: '+token);

  if(/wardogs-detail[^\n{]*\{[^}]*background\s*:\s*transparent!important/s.test(css))
    issues.push('Phase 151 must not make detail portrait/canvas transparent');
  if(/wardogs-gallery-footer[^\n{]*\{[^}]*background\s*:\s*transparent!important/s.test(css))
    issues.push('Phase 151 must not change gallery footer background');
  if(/wardogs-gallery-card[^\n{]*\{[^}]*border\s*:\s*(?:0|none)/s.test(css))
    issues.push('Phase 151 must preserve the outer gallery card border');

  for(const token of [
    'run-phase151-wardogs-gallery-portrait-transparency-audit.mjs',
    '[phase151] WARDOGS gallery portrait black fill removed',
    sheet,
    '.wardogs-gallery-visual-v124 img.wardogs-portrait-image-v134{background:transparent!important}'
  ])if(!workflow.includes(token))issues.push('Phase 151 production verification missing: '+token);

  const summary={phase:151,name:'wardogs-gallery-portrait-transparency',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase151WardogsGalleryPortraitTransparencyAudit();
