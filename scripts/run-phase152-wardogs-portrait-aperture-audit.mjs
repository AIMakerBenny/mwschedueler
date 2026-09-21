import fs from 'node:fs';

export function runPhase152WardogsPortraitApertureAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const managerJs=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const managerCss=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const wardogsJs=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const wardogsCss=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of ["assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136-aperture152","assets/wardogs-manager-v1.css?v=1.0.0-phase127-mobile129-frame140-frame144-aperture152","assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-frame140-frame144-frames150-aperture152","assets/wardogs-v1.js?v=1.0.0-phase125-portrait138-soopid141-frames150-aperture152"])
    if(!index.includes(token))issues.push('Phase 152 cache revision missing: '+token);

  for(const token of [
    'class="wardogs-manager-portrait-clip-v152" data-wardogs-manager-portrait-clip',
    "const portraitClip=modal?.querySelector('[data-wardogs-manager-portrait-clip]');",
    'portraitClip.replaceChildren();',
    'portraitClip.appendChild(img);',
    "window.__mwsWardogsPortraitApertureV152='fixed-inner-window-manager-gallery-detail';"
  ])if(!managerJs.includes(token))issues.push('Phase 152 manager clip runtime missing: '+token);
  if((managerJs.match(/portraitClip\.appendChild\(img\);/g)||[]).length!==3)
    issues.push('Phase 152 manager must route all three portrait sources through clip host');
  if(managerJs.includes('drop.appendChild(img);'))
    issues.push('Phase 152 manager still appends portrait directly to full card stage');

  for(const token of [
    "portraitClip.className='wardogs-portrait-clip-v152';",
    "portraitClip.dataset.wardogsPortraitClip='gallery';",
    'return {article,visual,portraitClip,placeholder,frameLayer};',
    'view.portraitClip.appendChild(img);',
    'data-wardogs-detail-portrait-clip',
    "const portraitClip=root.querySelector('[data-wardogs-detail-portrait-clip]');",
    "window.__mwsWardogsPortraitApertureV152='fixed-inner-window-manager-gallery-detail';"
  ])if(!wardogsJs.includes(token))issues.push('Phase 152 gallery/detail clip runtime missing: '+token);
  if((wardogsJs.match(/view\.portraitClip\.appendChild\(img\);/g)||[]).length!==2)
    issues.push('Phase 152 gallery must route both portrait sources through clip host');
  if((wardogsJs.match(/(^|[^.])portraitClip\.appendChild\(img\);/gm)||[]).length!==2)
    issues.push('Phase 152 detail must route both portrait sources through clip host');
  if(wardogsJs.includes('view.visual.insertBefore(img,view.frameLayer);')||wardogsJs.includes('frame.insertBefore(img,frameLayer);'))
    issues.push('Phase 152 direct portrait insertion outside fixed aperture remains');

  for(const [name,css,selector] of [
    ['manager',managerCss,'.wardogs-manager-portrait-clip-v152{'],
    ['gallery/detail',wardogsCss,'.wardogs-portrait-clip-v152{']
  ]){
    if(!css.includes(selector))issues.push('Phase 152 '+name+' clip CSS missing');
    if(!css.includes('clip-path:inset(12% 13% 24% 16%);'))issues.push('Phase 152 '+name+' fixed aperture geometry missing');
    if(!css.includes('overflow:hidden;pointer-events:none;'))issues.push('Phase 152 '+name+' clip isolation missing');
  }

  for(const token of [
    "transform:scale(var(--wd-manager-portrait-scale,1));",
    "object-position:var(--wd-manager-portrait-x,50%) var(--wd-manager-portrait-y,50%);"
  ])if(!managerCss.includes(token))issues.push('Phase 152 manager pan/zoom behavior lost: '+token);
  for(const token of [
    "transform:scale(var(--wd-portrait-scale,1));",
    "object-position:var(--wd-portrait-x,50%) var(--wd-portrait-y,50%);",
    '.wardogs-class-frame-layer-v134{'
  ])if(!wardogsCss.includes(token))issues.push('Phase 152 gallery/detail render behavior lost: '+token);

  for(const token of [
    'run-phase152-wardogs-portrait-aperture-audit.mjs',
    '[phase152] WARDOGS portrait aperture clipping',
    'wardogs-manager-portrait-clip-v152',
    'wardogs-portrait-clip-v152'
  ])if(!workflow.includes(token))issues.push('Phase 152 production verification missing: '+token);

  const summary={phase:152,name:'wardogs-portrait-aperture',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase152WardogsPortraitApertureAudit();
