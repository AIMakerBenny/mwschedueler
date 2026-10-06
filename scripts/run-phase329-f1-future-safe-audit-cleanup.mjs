import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {runPhase309F1ViewportMarkerOvertakeFlowAudit} from './run-phase309-f1-viewport-marker-overtake-flow-audit.mjs';
import {runPhase313F1GachaStartingGridAudit} from './run-phase313-f1-gacha-starting-grid-audit.mjs';
import {runPhase316F1FeedbackProductionClosureAudit} from './run-phase316-f1-feedback-production-closure-audit.mjs';
import {runPhase319F1UiSpacingBattleAudit} from './run-phase319-f1-ui-spacing-battle-audit.mjs';
import {runPhase323F1GachaHostAudit} from './run-phase323-f1-gacha-host-audit.mjs';
import {runPhase325F1SupersededAuditCompatibility} from './run-phase325-f1-superseded-audit-compatibility.mjs';

export function runPhase329F1FutureSafeAuditCleanup(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 for(const marker of ['Phase 325 compatibility markers for superseded static audits','Phase 319 compatibility literals:']){
  if(core.includes(marker))issues.push('Phase 329 compatibility-only source marker remains: '+marker);
 }
 const results={
  phase309:runPhase309F1ViewportMarkerOvertakeFlowAudit(),
  phase313:runPhase313F1GachaStartingGridAudit(),
  phase316:runPhase316F1FeedbackProductionClosureAudit(),
  phase319:runPhase319F1UiSpacingBattleAudit(),
  phase323:runPhase323F1GachaHostAudit(),
  phase325:runPhase325F1SupersededAuditCompatibility()
 };
 for(const [name,result] of Object.entries(results))if(!result.pass)issues.push(name+' regression: '+result.issues.join('; '));
 const sourceChecks=[
  ['scripts/run-phase309-f1-viewport-marker-overtake-flow-audit.mjs','marker label/order geometry relation invalid'],
  ['scripts/run-phase313-f1-gacha-starting-grid-audit.mjs','Pxx position label generation missing'],
  ['scripts/run-phase319-f1-ui-spacing-battle-audit.mjs','spacing thresholds regressed'],
  ['scripts/run-phase323-f1-gacha-host-audit.mjs','data-gacha-renderer-v324="deterministic"']
 ];
 for(const [file,token] of sourceChecks)if(!fs.readFileSync(file,'utf8').includes(token))issues.push('Phase 329 future-safe audit contract missing in '+file+': '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/run-phase309-f1-viewport-marker-overtake-flow-audit.mjs','scripts/run-phase313-f1-gacha-starting-grid-audit.mjs','scripts/run-phase319-f1-ui-spacing-battle-audit.mjs','scripts/run-phase323-f1-gacha-host-audit.mjs','scripts/run-phase325-f1-superseded-audit-compatibility.mjs','scripts/run-phase329-f1-future-safe-audit-cleanup.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:329,name:'f1-future-safe-audit-cleanup',previous:Object.fromEntries(Object.entries(results).map(([name,result])=>[name,result.pass])),issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase329F1FutureSafeAuditCleanup();
