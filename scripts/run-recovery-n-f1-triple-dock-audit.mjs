import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryNF1TripleDockAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  const jsAsset=(index.match(/assets\/f1-racing-v1\.js\?[^\"'\s>]+/)||[])[0]||'';
  const cssAsset=(index.match(/assets\/f1-racing-v1\.css\?[^\"'\s>]+/)||[])[0]||'';
  const jsPhase=Number((jsAsset.match(/[?&]phase=(\d+)/)||[])[1]||0);
  const cssPhase=Number((cssAsset.match(/[?&]phase=(\d+)/)||[])[1]||0);
  if(jsPhase<206)issues.push('Recovery N JS cache missing or stale: '+jsAsset);
  if(cssPhase<204)issues.push('Recovery N CSS cache missing or stale: '+cssAsset);

  for(const token of [
    "timing:Object.freeze({label:'실시간 순위',minW:4,minH:2})",
    'const F1_TRIPLE_DOCK_COLUMNS_RECOVERY_N=Object.freeze({',
    "left:Object.freeze({x:0,w:4})",
    "center:Object.freeze({x:4,w:4})",
    "right:Object.freeze({x:8,w:4})",
    'function workspaceTripleDockRectRecoveryN(id,zone){',
    'function workspacePackRemainingTripleColumnsRecoveryN(layout,excludeId,zone){',
    'function workspaceDockTripleRecoveryN(id,zone){',
    "if(['left','center','right'].includes(String(zone||'')))return workspaceDockTripleRecoveryN(id,String(zone));",
    "if(rx>=.46&&rx<=.54)return {kind:'dock',zone:'center'};",
    'window.mwsF1DockTripleRecoveryN=workspaceDockTripleRecoveryN;',
    "window.__mwsF1RecoveryN='left-center-right-triple-dock-v1';"
  ])if(!racing.includes(token))issues.push('Recovery N runtime missing: '+token);

  for(const token of [
    '.f1-racing-workspace-dock-guide-recovery-e.left{left:0!important;top:0!important;width:33.3333%!important;height:100%!important}',
    '.f1-racing-workspace-dock-guide-recovery-e.center{left:33.3333%!important;top:0!important;width:33.3333%!important;height:100%!important}',
    '.f1-racing-workspace-dock-guide-recovery-e.right{left:66.6667%!important;top:0!important;width:33.3333%!important;height:100%!important}',
    '/* Recovery N: left / center / right triple-column dock preview */'
  ])if(!css.includes(token))issues.push('Recovery N CSS missing: '+token);

  for(const token of [
    "assert(centerDocked.x===4&&centerDocked.w===4,'Recovery N Commentary did not dock to center third: '+JSON.stringify(centerDocked));",
    "assert(centerXs.includes(0)&&centerXs.includes(8),'Recovery N remaining panels did not redistribute to left and right columns: '+centerXs.join(','));",
    "assertNoDomOverlap('after center dock');",
    'curvatureSpeedQa:{mildLimit:Number(mildLimit)||0,sharpLimit:Number(sharpLimit)||0}',
    'centerTripleDock:centerDocked'
  ])if(!diag.includes(token))issues.push('Recovery N live browser QA missing: '+token);

  for(const token of ['node --check scripts/run-recovery-n-f1-triple-dock-audit.mjs',"echo '[recovery-n] F1 left center right triple dock'"])if(!workflow.includes(token))issues.push('Recovery N workflow verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:'recovery-n',name:'f1-left-center-right-triple-dock',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryNF1TripleDockAudit();
