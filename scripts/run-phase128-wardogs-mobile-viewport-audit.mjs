import fs from 'node:fs';

export function runPhase128WardogsMobileViewportAudit(){
  const issues=[];
  const warnings=[];
  const managerCss=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const detailCss=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'min-height:100dvh;',
    'max-height:94dvh;',
    'padding-top:max(8px,env(safe-area-inset-top));',
    'padding-bottom:max(8px,env(safe-area-inset-bottom));',
    'overscroll-behavior:contain;',
    '-webkit-overflow-scrolling:touch;',
    'grid-template-rows:minmax(150px,30dvh) minmax(0,1fr);'
  ])if(!managerCss.includes(token))issues.push('WARDOGS manager mobile viewport CSS missing: '+token);

  for(const token of [
    'min-height:100dvh;',
    'max-height:94dvh;',
    'padding-top:max(8px,env(safe-area-inset-top));',
    'padding-bottom:max(8px,env(safe-area-inset-bottom));',
    'overscroll-behavior:contain;',
    '-webkit-overflow-scrolling:touch;',
    'max-height:calc(94dvh - 150px);',
    'grid-template-rows:minmax(280px,55dvh) minmax(0,1fr);',
    'max-height:calc(55dvh - 26px);',
    'grid-template-rows:minmax(240px,48dvh) minmax(0,1fr);',
    'max-height:calc(48dvh - 24px);'
  ])if(!detailCss.includes(token))issues.push('WARDOGS detail mobile viewport CSS missing: '+token);

  if(!managerCss.includes('max-height:94vh;')||!detailCss.includes('max-height:94vh;')){
    issues.push('vh fallback must remain before dvh for older WebView/browser compatibility');
  }
  if(/position:s*fixed[^}]*height:s*100vh/s.test(managerCss)||/position:s*fixed[^}]*height:s*100vh/s.test(detailCss)){
    warnings.push('fixed overlay contains hard 100vh height; review mobile browser chrome behavior');
  }

  for(const token of [
    'run-phase128-wardogs-mobile-viewport-audit.mjs',
    'min-height:100dvh;',
    'max-height:94dvh;',
    'padding-top:max(8px,env(safe-area-inset-top));',
    'grid-template-rows:minmax(280px,55dvh) minmax(0,1fr);',
    '-webkit-overflow-scrolling:touch;'
  ])if(!workflow.includes(token))issues.push('production Phase 128 verification missing: '+token);

  const summary={phase:128,name:'wardogs-mobile-viewport',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase128WardogsMobileViewportAudit();
