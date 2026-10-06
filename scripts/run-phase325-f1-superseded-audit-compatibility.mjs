import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {runPhase309F1ViewportMarkerOvertakeFlowAudit} from './run-phase309-f1-viewport-marker-overtake-flow-audit.mjs';
import {runPhase313F1GachaStartingGridAudit} from './run-phase313-f1-gacha-starting-grid-audit.mjs';
import {runPhase316F1FeedbackProductionClosureAudit} from './run-phase316-f1-feedback-production-closure-audit.mjs';
import {runPhase319F1UiSpacingBattleAudit} from './run-phase319-f1-ui-spacing-battle-audit.mjs';
import {runPhase323F1GachaHostAudit} from './run-phase323-f1-gacha-host-audit.mjs';

export function runPhase325F1SupersededAuditCompatibility(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 for(const marker of ['Phase 325 compatibility markers for superseded static audits','Phase 319 compatibility literals:']){
  if(core.includes(marker))issues.push('Phase 325 dummy compatibility source remains: '+marker);
 }
 const audits=[
  ['309',runPhase309F1ViewportMarkerOvertakeFlowAudit()],
  ['313',runPhase313F1GachaStartingGridAudit()],
  ['316',runPhase316F1FeedbackProductionClosureAudit()],
  ['319',runPhase319F1UiSpacingBattleAudit()],
  ['323',runPhase323F1GachaHostAudit()]
 ];
 for(const [phase,result] of audits)if(!result.pass)issues.push('Phase '+phase+' future-safe regression: '+result.issues.join('; '));
 const obsoleteByFile=[
  ['scripts/run-phase309-f1-viewport-marker-overtake-flow-audit.mjs',['x:-14,y:27,width:28,height:13',"x:0,y:36.2,'text-anchor':'middle'"]],
  ['scripts/run-phase313-f1-gacha-starting-grid-audit.mjs',["kicker:'STARTING GRID'","orderLabel:'P'+String(position).padStart(2,'0')"]],
  ['scripts/run-phase319-f1-ui-spacing-battle-audit.mjs',['normalDisplayGapMeters:52','blockedDisplayGapMeters:72','"r:22"','"r:13.5"','"width:21.2,height:21.2"']],
  ['scripts/run-phase323-f1-gacha-host-audit.mjs',['const shared=window.multiDrawCardHTML(player']]
 ];
 for(const [file,tokens] of obsoleteByFile){
  const source=fs.readFileSync(file,'utf8');
  for(const token of tokens)if(source.includes(token))issues.push('Phase 325 obsolete exact-token audit remains in '+file+': '+token);
 }
 for(const file of ['assets/f1-racing-v1.js','scripts/run-phase309-f1-viewport-marker-overtake-flow-audit.mjs','scripts/run-phase313-f1-gacha-starting-grid-audit.mjs','scripts/run-phase316-f1-feedback-production-closure-audit.mjs','scripts/run-phase319-f1-ui-spacing-battle-audit.mjs','scripts/run-phase323-f1-gacha-host-audit.mjs','scripts/run-phase325-f1-superseded-audit-compatibility.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:325,name:'f1-superseded-audit-compatibility',audits:Object.fromEntries(audits.map(([phase,result])=>[phase,result.pass])),issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase325F1SupersededAuditCompatibility();
