import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryEF1WorkspaceAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!/assets\/f1-racing-v1\.css\?v=1\.0\.0-phase180-shell&p=196&recovery=[E-Z][0-9]+/.test(index))issues.push('Recovery E+ CSS asset cache missing');
  if(!/assets\/f1-racing-v1\.js\?v=1\.0\.0-phase180-shell&p=203&recovery=[E-Z][0-9]+/.test(index))issues.push('Recovery E+ JS asset cache missing');

  for(const token of [
    'const F1_WORKSPACE_PANEL_META_RECOVERY_E=Object.freeze({',
    'const F1_WORKSPACE_DEFAULT_LAYOUT_RECOVERY_E=Object.freeze({',
    'function installF1WorkspaceRecoveryE(){',
    "workspace.id='f1RacingWorkspaceRecoveryE';",
    "toolbar.id='f1RacingWorkspaceToolbarRecoveryE';",
    "guide.id='f1RacingWorkspaceDockGuideRecoveryE';",
    "const pairs=[['timing',timing],['track',track],['commentary',commentary],['radio',radio],['speed',speed]];",
    "workspace.addEventListener('pointerdown',event=>{",
    "window.addEventListener('pointermove',onWorkspacePointerMoveRecoveryE);",
    "window.addEventListener('pointerup',onWorkspacePointerUpRecoveryE);",
    'function workspaceDockLayoutRecoveryE(id,zone){',
    'function workspaceTabGroupRecoveryE(sourceId,targetId){',
    'function workspaceToggleMaximizeRecoveryE(id){',
    'function workspaceTogglePanelRecoveryE(id){',
    'function resetWorkspaceRecoveryE(){',
    'function onWorkspacePointerMoveRecoveryE(event){',
    'function persistWorkspaceLayoutRecoveryE(){',
    'persistF1SettingsRecoveryD({workspaceLayout:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE)})',
    'window.mwsF1DockPanelRecoveryE=workspaceDockLayoutRecoveryE;',
    "window.__mwsF1RecoveryE='premiere-workspace-foundation-v1';"
  ])if(!racing.includes(token))issues.push('Recovery E workspace runtime missing: '+token);

  for(const token of [
    '.f1-racing-workspace-recovery-e{',
    '.f1-racing-workspace-panel-recovery-e{',
    '.f1-racing-workspace-resize-recovery-e{',
    '.f1-racing-workspace-tabs-recovery-e{',
    '.f1-racing-workspace-dock-guide-recovery-e.left{',
    '.f1-racing-workspace-recovery-e.has-maximized'
  ])if(!css.includes(token))issues.push('Recovery E workspace CSS missing: '+token);

  for(const token of ['node --check scripts/run-recovery-e-f1-workspace-audit.mjs',"echo '[recovery-e] F1 Premiere workspace foundation'"])if(!workflow.includes(token))issues.push('Recovery E workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:'recovery-e',name:'f1-premiere-workspace-foundation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryEF1WorkspaceAudit();
