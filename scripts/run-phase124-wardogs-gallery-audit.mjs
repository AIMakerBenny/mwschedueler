import fs from 'node:fs';

export function runPhase124WardogsGalleryAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const gallery=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const css=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const cloud=fs.readFileSync('assets/cloud-v1.1.js','utf8');
  const staged=fs.readFileSync('assets/cloud-runtime-v130.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!/assets\/wardogs-v1\.css\?v=1\.0\.0-phase(?:124|1[2-9][5-9]|[2-9][0-9]{2,})/.test(index))issues.push('WARDOGS gallery stylesheet is not loaded by index');
  if(!/assets\/wardogs-v1\.js\?v=1\.0\.0-phase(?:124|1[2-9][5-9]|[2-9][0-9]{2,})/.test(index))issues.push('WARDOGS gallery runtime is not loaded by index');
  for(const token of [
    'id="wardogsPersonnelCountV124"',
    'id="wardogsGalleryV124"',
    'id="wardogsEmptyV124"'
  ])if(!index.includes(token))issues.push('WARDOGS gallery shell missing: '+token);

  for(const token of [
    "function linkedActiveCards(classId)",
    "api.getCards(classId,{activeOnly:true})",
    "filter(card=>api.resolveContactLink?.(card)?.linked===true)",
    "function updateClassCounts()",
    "function makeGalleryCard(card)",
    "article.dataset.wardogsCardId=String(card?.id||'');",
    "async function loadGalleryImage(card,view,token)",
    "const blob=await media.getBlob(imageId);",
    "img.loading='lazy';",
    "img.decoding='async';",
    "function renderGallery()",
    "count.textContent=`PERSONNEL ${String(list.length).padStart(3,'0')}`;",
    "window.mwsRenderWardogsGalleryV124=renderGallery;",
    "window.__mwsWardogsGalleryV124='active-linked-order-preserving';",
    "if(parts.includes('wardogs'))void renderGallery();",
    "if(!String(event?.detail?.reason||'').startsWith('WARDOGS'))return;",
    "window.addEventListener('mws:wardogs-media-ready',()=>void renderGallery());",
    "revokeGalleryUrls();revokeDetailImageUrl()"
  ])if(!gallery.includes(token))issues.push('WARDOGS gallery runtime missing: '+token);

  if(/\.sort\s*\(/.test(gallery.split('function linkedActiveCards')[1]?.split('function updateClassCounts')[0]||'')){
    issues.push('WARDOGS gallery must preserve data-layer class order instead of re-sorting');
  }
  if(/addEventListener\(['"]click['"][^\n]*wardogs-gallery-card/i.test(gallery)||/openDetail|openWardogsDetail/i.test(gallery)){
    warnings.push('Phase 124 appears to include detail-click behavior reserved for Phase 125');
  }

  for(const token of [
    '.wd-class-count-v124{',
    '.wardogs-gallery-v124{',
    '.wardogs-gallery-card-v124{',
    '.wardogs-gallery-visual-v124 img{',
    'width:100%;height:auto;max-width:100%;',
    'object-fit:contain;',
    '.wardogs-gallery-footer-v124{',
    '@media(max-width:390px)'
  ])if(!css.includes(token))issues.push('WARDOGS gallery CSS missing: '+token);
  if(/\.wardogs-gallery-visual-v124 img\{[^}]*height:\s*\d+px/s.test(css))issues.push('WARDOGS gallery image must not force a fixed pixel height');

  for(const [name,source] of [['cloud-v1.1',cloud],['cloud-runtime-v130',staged]]){
    for(const token of [
      "new CustomEvent('mws:parts-loaded',{detail:{tab,parts:[...extras]}})",
      "if(changed){normalizeAndRender(`${tab} lazy data`);"
    ])if(!source.includes(token))issues.push(name+' lazy part event missing: '+token);
  }

  for(const token of [
    'run-phase124-wardogs-gallery-audit.mjs',
    'assets/wardogs-v1.js?v=1.0.0-phase125',
    'assets/wardogs-v1.css?v=1.0.0-phase125',
    "window.__mwsWardogsGalleryV124='active-linked-order-preserving';",
    "api.getCards(classId,{activeOnly:true})",
    "filter(card=>api.resolveContactLink?.(card)?.linked===true)",
    "const blob=await media.getBlob(imageId);",
    "new CustomEvent('mws:parts-loaded',{detail:{tab,parts:[...extras]}})",
    'id="wardogsGalleryV124"'
  ])if(!workflow.includes(token))issues.push('production Phase 124 verification missing: '+token);

  const summary={phase:124,name:'wardogs-class-gallery',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase124WardogsGalleryAudit();
