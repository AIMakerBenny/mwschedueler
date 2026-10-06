import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {runPhase313F1GachaStartingGridAudit} from './run-phase313-f1-gacha-starting-grid-audit.mjs';
import {runPhase314F1RaceDynamicsRebalanceAudit} from './run-phase314-f1-race-dynamics-rebalance-audit.mjs';
import {runPhase315F1LiveParticipantDialogueDiversityAudit} from './run-phase315-f1-live-participant-dialogue-diversity-audit.mjs';

export function runPhase316F1FeedbackProductionClosureAudit(){
 const issues=[],warnings=[];
 const p313=runPhase313F1GachaStartingGridAudit(),p314=runPhase314F1RaceDynamicsRebalanceAudit(),p315=runPhase315F1LiveParticipantDialogueDiversityAudit();
 if(!p313.pass)issues.push('Phase 313 regression: '+p313.issues.join('; '));
 if(!p314.pass)issues.push('Phase 314 regression: '+p314.issues.join('; '));
 if(!p315.pass)issues.push('Phase 315 regression: '+p315.issues.join('; '));
 const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const current=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 for(const token of [
  'node --check scripts/run-phase313-f1-gacha-starting-grid-audit.mjs',
  'node --check scripts/run-phase314-f1-race-dynamics-rebalance-audit.mjs',
  'node --check scripts/run-phase315-f1-live-participant-dialogue-diversity-audit.mjs',
  'node --check scripts/run-phase316-f1-feedback-production-closure-audit.mjs',
  '- name: Deploy to Cloudflare Workers',
  '- name: Recovery H F1 live browser QA',
  '- name: Verify live Worker',
  '- name: Report Cloudflare production status'
 ])if(!workflow.includes(token))issues.push('Phase 316 workflow missing: '+token);
 for(const token of [
  'Phase 313 runtime readiness','Phase 314 runtime readiness','Phase 315 runtime readiness',
  'Phase 313 Gacha starting grid QA failed','Phase 313 P-grid dock is not on the right side',
  'Phase 314 race dynamics QA failed','Phase 314 rear position percentage catch-up bonus invalid',
  'Phase 314 front-position mistake pressure gradient invalid','Phase 315 LIVE participant diversity QA failed',
  'Phase 315 dialogue semantic diversity QA failed'
 ])if(!diag.includes(token))issues.push('Phase 316 Recovery H missing: '+token);
 for(const token of [
  'recentDrivers:[...liveCutinStateV264.recentDriverIds]',
  'recentSemanticKeys:[...liveCutinStateV264.recentSemanticKeys]',
  'driverExposure:Object.fromEntries(liveCutinStateV264.driverExposure)'
 ])if(!core.includes(token))issues.push('Phase 316 diversity diagnostics missing: '+token);
 for(const token of [
  "import {runPhase316F1FeedbackProductionClosureAudit} from './run-phase316-f1-feedback-production-closure-audit.mjs';",
  'export function runPhase316FullIntegrationAudit()'
 ])if(!current.includes(token))issues.push('Phase 316 cumulative chain missing: '+token);
 const currentPhase316=Number(current.match(/runCurrentFullIntegrationAudit\(\)\{return runPhase(\d+)FullIntegrationAudit\(\);?\}/)?.[1]||0);
 if(currentPhase316<316)issues.push('Phase 316 cumulative chain regressed below Phase 316: '+currentPhase316);
 for(const file of ['assets/f1-racing-v1.js','assets/f1-racing-r308.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs','scripts/run-phase316-f1-feedback-production-closure-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:316,name:'f1-feedback-production-closure',previous:{p313:p313.pass,p314:p314.pass,p315:p315.pass},issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase316F1FeedbackProductionClosureAudit();
