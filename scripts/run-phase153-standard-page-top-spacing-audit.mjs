import fs from 'node:fs';

export function runPhase153StandardPageTopSpacingAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/ui-frame-presets.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  const cacheRef='assets/ui-frame-presets.css?v=3.0.0-space132-space153';
  if(!index.includes(cacheRef))issues.push('Phase 153 UI frame cache revision missing');

  for(const token of [
    '/* Phase 153: remove recurrent top blank bands from standard content pages.',
    '#contacts,#posts,#sniper,#targets,#friendFinder,',
    '#memos,#worldtime,#achievements,#export,#settings',
    'margin-top:0!important;',
    'padding-top:0!important;',
    'top:auto!important;'
  ])if(!css.includes(token))issues.push('Phase 153 spacing normalization missing: '+token);

  for(const protectedToken of [
    '/* Phase 132: normalize page-title to first-content spacing.',
    'body.mws-premium .topbar{',
    'body.mws-premium .main>.section.active>:first-child{'
  ])if(!css.includes(protectedToken))issues.push('Phase 153 lost protected Phase 132 spacing rule: '+protectedToken);

  const phase153=css.slice(css.indexOf('/* Phase 153: remove recurrent top blank bands'));
  for(const forbidden of ['#dashboard','#calendar','#wardogs','.mini-game-section','transform:none'])
    if(phase153.includes(forbidden))issues.push('Phase 153 must not normalize protected/special layout: '+forbidden);

  for(const token of [
    'run-phase153-standard-page-top-spacing-audit.mjs',
    '[phase153] standard page top spacing normalized',
    cacheRef,
    '#contacts,#posts,#sniper,#targets,#friendFinder,'
  ])if(!workflow.includes(token))issues.push('Phase 153 production verification missing: '+token);

  const summary={phase:153,name:'standard-page-top-spacing',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase153StandardPageTopSpacingAudit();
