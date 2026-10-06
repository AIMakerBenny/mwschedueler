import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase340F1WorkspaceFillViewportAudit(){
 const issues=[],warnings=[],fit=fs.readFileSync('assets/f1-racing-r288-r290.js','utf8'),ui309=fs.readFileSync('assets/f1-racing-r309.js','utf8'),css=fs.readFileSync('assets/f1-racing-r335-r341.css','utf8'),index=fs.readFileSync('index.html','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION340='phase340-f1-workspace-fill-viewport';",
  'const target=available;',
  'trailingOverhead=0',
  'const trailingOverhead=Math.max(0,Number(raceRect?.bottom||0)-Number(rect.bottom||0));',
  'computeWorkspaceFitV288(viewport,rect.top,usedRows,gap,trailingOverhead)',
  'blankPx:Math.max(0,available-height)',
  'fillViewport:true',
  'row.blankPx<=1',
  'liveBlank<=2',
  'window.mwsF1QaWorkspaceFillViewportV340=qaWorkspaceViewportFitV288;',
  'window.__mwsF1RacingV340=VERSION340;'
 ])if(!fit.includes(token))issues.push('Phase 340 fit runtime missing: '+token);
 for(const token of ['const expectedHeight=','const fillViewportOk=','defaultHeightOk=fillViewportOk'])if(!ui309.includes(token))issues.push('Phase 340 Phase 309 compatibility missing: '+token);
 for(const token of ['/* Phase 340: use the available vertical viewport instead of a fixed short letterbox */','flex:1 1 auto!important','height:auto!important'])if(!css.includes(token))issues.push('Phase 340 CSS missing: '+token);
 if(!index.includes('fit=309&fill=340'))issues.push('Phase 340 cache link missing');
 for(const token of ['Phase 340 runtime did not propagate to Recovery H browser','Phase 340 viewport-fill QA failed','Phase 340 workspace did not fill current viewport','Phase 340 race view exceeds current viewport'])if(!diag.includes(token))issues.push('Phase 340 Recovery H missing: '+token);
 if(diag.includes('Phase 309 default reset workspace remains too tall'))issues.push('Phase 340 obsolete 642px Recovery H criterion remains');
 for(const file of ['assets/f1-racing-r288-r290.js','assets/f1-racing-r309.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase340-f1-workspace-fill-viewport-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:340,name:'f1-workspace-fill-viewport',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase340F1WorkspaceFillViewportAudit();
