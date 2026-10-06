import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {runPhase301F1SpecClosureAudit} from './run-phase301-f1-spec-closure-audit.mjs';

export function runPhase304F1FinishResultClosureAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8');
 const patch=fs.readFileSync('assets/f1-racing-r291-r295.js','utf8');
 const css=fs.readFileSync('assets/f1-racing-r291-r295.css','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const legacyGate=fs.readFileSync('scripts/run-phase295-f1-final-regression-gate.mjs','utf8');

 for(const token of [
  "const VERSION304='phase304-f1-finish-result-closure';",
  'function movementDetailV304(row){',
  'data-result-delta-v304',
  'data-pit-stops-v304',
  'winner-v304',
  'winner-tag-v304',
  'window.mwsF1QaFinishResultClosureV304=qaFinishResultClosureV304;',
  'window.__mwsF1RacingV304=VERSION304;'
 ])if(!patch.includes(token))issues.push('Phase 304 result runtime missing: '+token);

 for(const token of [
  '.f1-racing-finish-results-v291 .row.winner-v304{',
  '.f1-racing-finish-results-v291 .movement-v304{',
  '.f1-racing-finish-podium-v291 .winner-tag-v304{',
  '@keyframes f1WinnerSweepV304'
 ])if(!css.includes(token))issues.push('Phase 304 result CSS missing: '+token);

 if(!legacyGate.includes("Number(cacheMatch[1])<295"))issues.push('Phase 295 cache gate is not future-safe');

 for(const token of [
  'assets/f1-racing-r291-r295.css?phase=304',
  'assets/f1-racing-r291-r295.js?phase=304'
 ])if(!index.includes(token))issues.push('Phase 304 cache revision missing: '+token);

 for(const token of [
  'Phase 304 runtime readiness',
  'Phase 304 final result headers incomplete',
  'Phase 304 result rows missing movement or PIT data',
  'Phase 304 P1 result winner emphasis missing',
  'Phase 304 podium winner emphasis missing',
  'Phase 304 finish result closure QA failed'
 ])if(!diag.includes(token))issues.push('Phase 304 Recovery H check missing: '+token);

 const closure=runPhase301F1SpecClosureAudit();
 if(Array.isArray(closure?.gaps)&&closure.gaps.length)issues.push('Phase 301 spec gaps remain after Phase 304: '+closure.gaps.join(','));
 if(Array.isArray(closure?.warnings)&&closure.warnings.length)warnings.push(...closure.warnings.map(row=>'Phase 301 closure: '+row));

 for(const file of ['assets/f1-racing-r291-r295.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }

 const result={phase:304,name:'f1-finish-result-closure',issues,warnings,legacySpecGaps:closure?.gaps||[],pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase304F1FinishResultClosureAudit();
