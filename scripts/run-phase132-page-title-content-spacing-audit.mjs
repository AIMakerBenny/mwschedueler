import fs from 'node:fs';

export function runPhase132PageTitleContentSpacingAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/ui-frame-presets.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  const required=[
    '/* Phase 132: normalize page-title to first-content spacing.',
    'body.mws-premium .topbar{',
    'min-height:58px;',
    'margin-bottom:14px!important;',
    'padding-bottom:10px;',
    'body.mws-premium .main>.section.active>:first-child{',
    'margin-top:0!important;',
    'body[data-ui-frame="workshop"] .topbar{',
    'height:62px!important;',
    'body[data-ui-frame="agenda"] .topbar,',
    'body[data-ui-frame="notion"] .topbar{',
    'body[data-ui-frame="linear"] .topbar{',
    'margin-bottom:12px!important;'
  ];
  for(const token of required)if(!css.includes(token))issues.push('page spacing normalization missing: '+token);

  const finalBlock=css.lastIndexOf('/* Phase 132: normalize page-title');
  if(finalBlock<0)issues.push('Phase 132 spacing block missing');
  for(const legacy of [
    'margin:0 0 22px !important;',
    'margin-bottom:26px!important',
    'margin-bottom:32px!important'
  ]){
    const pos=css.lastIndexOf(legacy);
    if(pos>finalBlock)issues.push('oversized title/content gap overrides Phase 132 later in CSS: '+legacy);
  }

  if(!index.includes('assets/ui-frame-presets.css?v=3.0.0-space132')){
    issues.push('Phase 132 UI frame cache revision missing from index');
  }

  for(const token of [
    'run-phase132-page-title-content-spacing-audit.mjs',
    'assets/ui-frame-presets.css?v=3.0.0-space132',
    'Phase 132: normalize page-title to first-content spacing',
    'body.mws-premium .main>.section.active>:first-child{',
    'height:62px!important;'
  ])if(!workflow.includes(token))issues.push('production Phase 132 verification missing: '+token);

  const summary={phase:132,name:'page-title-content-spacing',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase132PageTitleContentSpacingAudit();
