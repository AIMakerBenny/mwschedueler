import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase315F1LiveParticipantDialogueDiversityAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),hud=fs.readFileSync('assets/f1-racing-r308.js','utf8');
 for(const token of [
  "const VERSION315='phase315-f1-live-participant-dialogue-diversity';","const LIVE_DIVERSITY_CONFIG_V315=Object.freeze({recentDriverLimit:6",
  "const LIVE_CUTIN_STATUS_V315=Object.freeze([","FOLLOWING:'RACE_STATUS'","function liveSemanticKeyV315(","function rememberLiveDriverV315(",
  "driverExposure:new Map(),recentDriverIds:[],recentSemanticKeys:[]","function liveCandidateScoreV315(","function chooseLiveCandidateV315(",
  "rearCoverage=rearRatio*LIVE_DIVERSITY_CONFIG_V315.rearCoverageWeight","const candidate=chooseLiveCandidateV315(standings,mover)",
  "const preview=liveCutinMessageStateV307(event,vehicle,target,false)","function qaLiveDiversityV315(){","window.mwsF1QaLiveDiversityV315=qaLiveDiversityV315;"
 ])if(!core.includes(token))issues.push('Phase 315 core missing: '+token);
 for(const token of [
  "const VERSION315HUD='phase315-dialogue-semantic-diversity';","semanticWindow:2","recentSpeakerLimit:6","recentSemantic:[],recentSpeakers:[]",
  "function dialogueSemanticKeyV315(","stateV308.recentSpeakers.slice(-2).includes(name)","stateV308.recentSemantic.slice(-HUD_CONFIG_V308.semanticWindow)",
  "window.mwsF1QaDialogueSemanticV315=function()","window.__mwsF1RacingHudV315=VERSION315HUD;"
 ])if(!hud.includes(token))issues.push('Phase 315 HUD missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','assets/f1-racing-r308.js','scripts/run-phase315-f1-live-participant-dialogue-diversity-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:315,name:'f1-live-participant-dialogue-diversity',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase315F1LiveParticipantDialogueDiversityAudit();
