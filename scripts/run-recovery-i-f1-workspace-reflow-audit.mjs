import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryIF1WorkspaceReflowAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!/assets\/f1-racing-v1\.js\?v=1\.0\.0-phase180-shell&p=203&recovery=[I-Z][0-9]+/.test(index))issues.push('Recovery I+ runtime cache missing');
  for(const token of [
    "timing:Object.freeze({label:'LIVE TIMING',minW:6,minH:2})",
    "track:Object.freeze({label:'TRACK MAP',minW:4,minH:4})",
    'const F1_WORKSPACE_MAX_ROWS_RECOVERY_I=32;',
    'function workspaceRectsOverlapRecoveryI(a,b){',
    'function workspaceSlotLeadersRecoveryI(layout){',
    'function workspaceFindFreeRectRecoveryI(id,desired,occupied){',
    'function workspaceReflowRecoveryI(layout,preferredId=',
    'function workspaceOverlapPairsRecoveryI(layout=workspaceLayoutRecoveryE){',
    'return workspaceReflowRecoveryI(result);',
    'workspaceReflowRecoveryI(workspaceLayoutRecoveryE,pointer.id,{x:drop.x,y:drop.y,w:state.w,h:state.h});',
    'window.mwsF1WorkspaceOverlapPairsRecoveryI=function(){return workspaceOverlapPairsRecoveryI().map(pair=>pair.slice())};',
    "window.__mwsF1RecoveryI='collision-free-reflow-v1';"
  ])if(!racing.includes(token))issues.push('Recovery I reflow runtime missing: '+token);

  for(const token of ['node --check scripts/run-recovery-i-f1-workspace-reflow-audit.mjs',"echo '[recovery-i] F1 collision-free workspace reflow'"])if(!workflow.includes(token))issues.push('Recovery I workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:'recovery-i',name:'f1-collision-free-workspace-reflow',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryIF1WorkspaceReflowAudit();
