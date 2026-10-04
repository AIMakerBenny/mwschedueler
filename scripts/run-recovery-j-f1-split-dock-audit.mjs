import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryJF1SplitDockAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!/assets\/f1-racing-v1\.js\?v=1\.0\.0-phase180-shell&p=203&recovery=[J-Z][0-9]+/.test(index))issues.push('Recovery J+ JS cache missing');
  if(!/assets\/f1-racing-v1\.css\?v=1\.0\.0-phase180-shell&p=196&recovery=[J-Z][0-9]+/.test(index))issues.push('Recovery J+ CSS cache missing');
  for(const token of [
    'function workspaceDockSplitRecoveryJ(id,zone){',
    'function workspacePackRegionRecoveryJ(layout,excludeId,region){',
    'function workspaceAdjacentSlotsRecoveryJ(layout,id,edge){',
    'function workspaceResizeSplitRecoveryJ(pointer,dw,dh){',
    "layoutStart:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE)",
    'workspaceResizeSplitRecoveryJ(state,dw,dh);',
    'function workspaceDropPreviewRectRecoveryJ(drop,sourceId){',
    "guide.dataset.preview=drop.kind==='tab'?'TAB':drop.kind==='free'?'MOVE':String(drop.zone||'DOCK').toUpperCase();",
    'return workspaceDockSplitRecoveryJ(id,zone);',
    'window.mwsF1DockSplitRecoveryJ=workspaceDockSplitRecoveryJ;',
    "window.__mwsF1RecoveryJ='split-resize-dock-preview-v1';"
  ])if(!racing.includes(token))issues.push('Recovery J runtime missing: '+token);
  for(const token of [
    '/* Recovery J: explicit drop preview for move, dock and tab targets */',
    '.f1-racing-workspace-dock-guide-recovery-e.free{',
    '.f1-racing-workspace-dock-guide-recovery-e::after{'
  ])if(!css.includes(token))issues.push('Recovery J CSS missing: '+token);
  for(const token of ['node --check scripts/run-recovery-j-f1-split-dock-audit.mjs',"echo '[recovery-j] F1 split resize and dock preview'"])if(!workflow.includes(token))issues.push('Recovery J workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:'recovery-j',name:'f1-split-resize-dock-preview',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryJF1SplitDockAudit();
