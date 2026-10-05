import fs from 'node:fs';import {spawnSync} from 'node:child_process';
export function runPhase280F1EventDialogueCoverageAudit(){
 const issues=[],warnings=[],index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<280)issues.push('Phase 280 asset cache missing');
 for(const token of ["const VERSION280='phase280-event-dialogue-coverage';",'BURST_END:[\'SPECIAL\',\'DEFENDER\']','function recordDialogueCoverageV280(','function getDialogueCoverageV280(){','function qaEventDialogueCoverageV280(){','window.mwsF1QaEventDialogueCoverageV280=qaEventDialogueCoverageV280;','window.__mwsF1RacingV280=VERSION280;'])if(!racing.includes(token))issues.push('Phase 280 runtime missing: '+token);
 for(const token of ['Phase 280 event-dialogue coverage QA failed','Phase 280 unmapped micro event found','Phase 280 empty dialogue pool found'])if(!live.includes(token))issues.push('Phase 280 Recovery H missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:280,name:'f1-event-dialogue-coverage',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase280F1EventDialogueCoverageAudit();