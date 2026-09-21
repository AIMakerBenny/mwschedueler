import fs from 'node:fs';

export function runPhase154MainOverlayFlowAudit(){
  const issues=[];
  const warnings=[];
  const premium=fs.readFileSync('assets/mawang-premium-v1621.css','utf8');
  const appCss=fs.readFileSync('assets/app-core.css','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const diagnostic=fs.readFileSync('scripts/diagnose-phase154-live-layout.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  const broad='body.mws-premium .main>*{position:relative;z-index:1}';
  if(premium.includes(broad))issues.push('broad premium direct-child positioning still overrides overlay positioning');
  for(const token of [
    'body.mws-premium .main>.topbar,',
    'body.mws-premium .main>.section{position:relative;z-index:1}'
  ])if(!premium.includes(token))issues.push('scoped premium stacking rule missing: '+token);

  if(!appCss.includes('.post-game-transition{position:fixed;'))issues.push('post-game transition fixed positioning missing');
  if(!appCss.includes('.modal{position:fixed;'))issues.push('base modal fixed positioning missing');

  const transition=index.indexOf('id="postGameTransition"');
  const sniper=index.indexOf('id="sniper" class="section"');
  if(transition<0||sniper<0||transition>sniper)issues.push('post-game transition DOM ordering changed; Phase154 root-cause contract needs review');

  if(!index.includes('assets/mawang-premium-v1621.css?v=1.6.21-premium2-phase154')){
    issues.push('Phase154 premium stylesheet cache revision missing');
  }

  for(const token of [
    "const pageIds=['contacts','posts','sniper','targets','friendFinder','memos','worldtime','achievements','wardogs','export','settings','contentPlanner'];",
    'row.firstGap>24',
    'Phase154 oversized title/content gap remains'
  ])if(!diagnostic.includes(token))issues.push('live geometry regression guard missing: '+token);

  for(const token of [
    'node --check scripts/run-phase154-main-overlay-flow-audit.mjs',
    'Phase 154 live layout geometry',
    '[phase154] premium overlay flow restored',
    'premium2-phase154'
  ])if(!workflow.includes(token))issues.push('production Phase154 verification missing: '+token);

  const summary={phase:154,name:'main-overlay-flow',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase154MainOverlayFlowAudit();
