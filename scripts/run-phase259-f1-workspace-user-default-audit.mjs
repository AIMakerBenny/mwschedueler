import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase259F1WorkspaceUserDefaultAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<259)issues.push('Phase 259 asset cache missing');

  for(const token of [
    "const VERSION259='phase259-workspace-user-default-persistence';",
    'let workspaceUserDefaultV259=null;',
    'function workspaceLayoutSignatureV259(layout){',
    'function restoreWorkspaceUserDefaultV259(',
    'function checkpointWorkspaceUserDefaultV259(',
    "restoreWorkspaceUserDefaultV259('race-start');",
    "checkpointWorkspaceUserDefaultV259('cancel-race');",
    "checkpointWorkspaceUserDefaultV259('return-to-setup');",
    'function qaWorkspaceUserDefaultPersistenceV259(){',
    'persistedSignature===expected',
    'preservedAfterOtherSetting===expected',
    'restoredSignature===expected',
    'window.mwsF1RestoreWorkspaceUserDefaultV259=restoreWorkspaceUserDefaultV259;',
    'window.mwsF1QaWorkspaceUserDefaultPersistenceV259=qaWorkspaceUserDefaultPersistenceV259;',
    'window.__mwsF1RacingV259=VERSION259;'
  ])if(!racing.includes(token))issues.push('Phase 259 runtime missing: '+token);

  for(const token of [
    "if(Object.prototype.hasOwnProperty.call(patch,'workspaceLayout')){",
    'f1.workspaceLayout=layout&&typeof layout===',
    'workspaceLayout:typeof structuredClone'
  ])if(!app.includes(token))issues.push('Phase 259 patch-preserving app persistence missing: '+token);

  for(const token of [
    'mwsF1QaWorkspaceUserDefaultPersistenceV259',
    'Phase 259 workspace user-default persistence QA failed',
    'Phase 259 next-race workspace layout changed',
    'Phase 259 race-start restore marker missing'
  ])if(!live.includes(token))issues.push('Phase 259 Recovery H browser QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:259,name:'f1-workspace-user-default-persistence',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase259F1WorkspaceUserDefaultAudit();
