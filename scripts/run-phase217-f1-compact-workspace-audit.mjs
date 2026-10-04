import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase217F1CompactWorkspaceAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<217)issues.push('Phase 217 asset cache missing');
  for(const token of [
    "const VERSION217='phase217-compact-three-panel-workspace';",
    "track:Object.freeze({x:0,y:0,w:8,h:8",
    "timing:Object.freeze({x:8,y:0,w:4,h:3",
    "commentary:Object.freeze({x:8,y:3,w:4,h:5",
    "const pairs=[['timing',timing],['track',track],['commentary',commentary]];",
    "toolbar.innerHTML='<div id=\"f1RacingWorkspacePanelTogglesRecoveryE\"",
    'function qaCompactWorkspaceV217(){',
    'window.mwsF1QaCompactWorkspaceV217=qaCompactWorkspaceV217;',
    'window.__mwsF1RacingV217=VERSION217;'
  ])if(!racing.includes(token))issues.push('Phase 217 runtime missing: '+token);
  if(racing.includes("radio:Object.freeze({label:'TEAM RADIO'")||racing.includes("speed:Object.freeze({label:'SPEED TRAP'"))issues.push('Obsolete Team Radio or Speed Trap remains in workspace metadata');
  for(const token of [
    '/* Phase 217: compact three-panel race workspace */',
    '#gameF1Racing[data-f1-screen="RACE"]>.f1-racing-head-v180{display:none!important}',
    '#gameF1Racing[data-f1-screen="RACE"] .f1-racing-console-top-v180{display:none!important}',
    '#f1RacingViewRaceV185 .f1-racing-workspace-toolbar-recovery-e{',
    '#f1RacingViewRaceV185 [data-f1-workspace-panel="track"]'
  ])if(!css.includes(token))issues.push('Phase 217 CSS missing: '+token);
  for(const token of ['Phase 217 compact workspace QA failed','after compact default','obsolete Team Radio or Speed Trap panel remains in workspace'])if(!diag.includes(token))issues.push('Phase 217 Chromium QA missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:217,name:'f1-compact-three-panel-workspace',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase217F1CompactWorkspaceAudit();
