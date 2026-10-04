import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryKF1WorkspaceRepairAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!index.includes('assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=203&recovery=K1'))issues.push('Recovery K JS cache missing');
  for(const token of [
    'version:4,',
    'let workspaceRepairReportRecoveryK={repaired:false,reasons:[],version:4};',
    'function workspaceRawIssuesRecoveryK(raw){',
    "reasons.push('overlap:'+a.id+':'+b.id);",
    'function workspaceCompactRecoveryK(layout,preferredId=',
    'return workspaceCompactRecoveryK(layout,preferredId);',
    'function workspaceUsedRowsRecoveryK(layout=workspaceLayoutRecoveryE){',
    "rawIssues.push('fallback-default-layout');",
    'workspaceRepairReportRecoveryK={repaired:rawIssues.length>0',
    "workspace.style.setProperty('min-height'",
    'window.mwsF1AuditWorkspaceLayoutRecoveryK=workspaceAuditLayoutRecoveryK;',
    "window.__mwsF1RecoveryK='saved-layout-repair-dom-overlap-qa-v1';"
  ])if(!racing.includes(token))issues.push('Recovery K runtime missing: '+token);

  for(const token of [
    "const domOverlapPairs=()=>{",
    "assertNoDomOverlap('baseline');",
    "assertNoDomOverlap('after resize');",
    "assertNoDomOverlap('after tab switch');",
    "assertNoDomOverlap('after dock');",
    "assertNoDomOverlap('after reset');",
    'Malformed saved layout was not repaired',
    "assert(Number(persisted?.version)>=4,'Workspace layout did not persist as repaired schema');",
    'finalDomOverlapPairs:domOverlapPairs()'
  ])if(!diag.includes(token))issues.push('Recovery K live DOM QA missing: '+token);

  for(const token of ['node --check scripts/run-recovery-k-f1-workspace-repair-audit.mjs',"echo '[recovery-k] F1 saved layout repair and DOM overlap QA'"])if(!workflow.includes(token))issues.push('Recovery K workflow verification missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs']){
    const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  }
  const result={phase:'recovery-k',name:'f1-saved-layout-repair-dom-overlap-qa',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryKF1WorkspaceRepairAudit();
