import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {runPhase308F1TrackOverlayHudFrequencyDiversityAudit} from './run-phase308-f1-track-overlay-hud-frequency-diversity-audit.mjs';
import {runPhase310F1FinalSpecClosureAudit} from './run-phase310-f1-final-spec-closure-audit.mjs';
import {runPhase315F1LiveParticipantDialogueDiversityAudit} from './run-phase315-f1-live-participant-dialogue-diversity-audit.mjs';

export function runPhase334F1DialogueAuditCompatibility(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const p308=runPhase308F1TrackOverlayHudFrequencyDiversityAudit();
 const p310=runPhase310F1FinalSpecClosureAudit();
 const p315=runPhase315F1LiveParticipantDialogueDiversityAudit();
 if(!p308.pass)issues.push('Phase 308 future-safe regression: '+p308.issues.join('; '));
 if(!p310.pass)issues.push('Phase 310 future-safe regression: '+p310.issues.join('; '));
 if(!p315.pass)issues.push('Phase 315 future-safe regression: '+p315.issues.join('; '));
 const recentLimit=Number(core.match(/const DIALOGUE_RECENT_TEXT_LIMIT_V279=(\d+);/)?.[1]||0);
 const diversity=core.match(/const LIVE_DIVERSITY_CONFIG_V315=Object\.freeze\(\{recentDriverLimit:(\d+),semanticWindow:(\d+)/);
 const recentDrivers=Number(diversity?.[1]||0),semanticWindow=Number(diversity?.[2]||0);
 if(recentLimit<140)issues.push('Phase 334 dialogue repeat window too small: '+recentLimit);
 if(recentDrivers<7||semanticWindow<4)issues.push('Phase 334 LIVE diversity guard too small: '+JSON.stringify({recentDrivers,semanticWindow}));
 for(const [file,obsolete] of [
  ['scripts/run-phase308-f1-track-overlay-hud-frequency-diversity-audit.mjs','DIALOGUE_RECENT_TEXT_LIMIT_V279=96'],
  ['scripts/run-phase310-f1-final-spec-closure-audit.mjs','DIALOGUE_RECENT_TEXT_LIMIT_V279=96'],
  ['scripts/run-phase315-f1-live-participant-dialogue-diversity-audit.mjs','recentDriverLimit:6"']
 ]){
  if(fs.readFileSync(file,'utf8').includes(obsolete))issues.push('Phase 334 obsolete exact-token audit remains in '+file+': '+obsolete);
 }
 for(const file of ['scripts/run-phase308-f1-track-overlay-hud-frequency-diversity-audit.mjs','scripts/run-phase310-f1-final-spec-closure-audit.mjs','scripts/run-phase315-f1-live-participant-dialogue-diversity-audit.mjs','scripts/run-phase334-f1-dialogue-audit-compatibility.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:334,name:'f1-dialogue-audit-compatibility',previous:{p308:p308.pass,p310:p310.pass,p315:p315.pass},config:{recentLimit,recentDrivers,semanticWindow},issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase334F1DialogueAuditCompatibility();
