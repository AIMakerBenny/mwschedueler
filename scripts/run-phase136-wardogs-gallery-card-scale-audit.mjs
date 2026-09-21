import fs from 'node:fs';

export function runPhase136WardogsGalleryCardScaleAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    '/* Phase 136: enlarged WARDOGS gallery cards */',
    '@media(min-width:981px){',
    'grid-template-columns:repeat(auto-fill,minmax(320px,360px));',
    'gap:22px;',
    'padding:24px',
    'font-size:17px',
    '@media(min-width:641px) and (max-width:980px){',
    'grid-template-columns:repeat(auto-fill,minmax(280px,320px));'
  ])if(!css.includes(token))issues.push('gallery scale CSS missing: '+token);

  for(const token of [
    '@media(max-width:640px){',
    '.wardogs-gallery-v124{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:9px}',
    '@media(max-width:390px){',
    '.wardogs-gallery-v124{grid-template-columns:1fr}'
  ])if(!css.includes(token))issues.push('mobile gallery layout regression: '+token);

  if(!index.includes('assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait135-gallery136'))issues.push('Phase 136 CSS cache revision missing from index');

  for(const token of [
    'run-phase136-wardogs-gallery-card-scale-audit.mjs',
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait135-gallery136',
    '/* Phase 136: enlarged WARDOGS gallery cards */',
    'grid-template-columns:repeat(auto-fill,minmax(320px,360px));',
    'grid-template-columns:repeat(auto-fill,minmax(280px,320px));'
  ])if(!workflow.includes(token))issues.push('production Phase 136 verification missing: '+token);

  const summary={phase:136,name:'wardogs-gallery-card-scale',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase136WardogsGalleryCardScaleAudit();
