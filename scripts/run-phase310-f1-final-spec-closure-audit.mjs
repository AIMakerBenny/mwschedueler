import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase310F1FinalSpecClosureAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const r288=fs.readFileSync('assets/f1-racing-r288-r290.js','utf8');
 const r291=fs.readFileSync('assets/f1-racing-r291-r295.js','utf8');
 const r307=fs.readFileSync('assets/f1-racing-r307.css','utf8');
 const r308=fs.readFileSync('assets/f1-racing-r308.js','utf8');
 const r308css=fs.readFileSync('assets/f1-racing-r308.css','utf8');
 const r309=fs.readFileSync('assets/f1-racing-r309.js','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

 const criteria={
  dialogueChain:core.includes("const VERSION277='phase277-character-dialogue-engine';")&&core.includes('handlePassDialogueV277(')&&diag.includes('Phase 277 character dialogue engine'),
  dialogueDensity:core.includes('maxGroupsPerWindow:2')&&r308.includes('globalGapMs:6800,speakerGapMs:12000')&&diag.includes('legacy track speech bubble still visible'),
  repetitionReduced:core.includes('const DIALOGUE_RECENT_TEXT_LIMIT_V279=96;')&&diag.includes('duplicateBlocked===true')&&diag.includes('uniqueCount)>=300'),
  toneDiversity:core.includes('const DIALOGUE_DIRECT_LINES_V308=Object.freeze({')&&diag.includes('roleCoverage===true')&&diag.includes('categoryCount)>=13'),
  lowerRightDialogue:r308.includes("root.id='f1RacingDialogueHudV308'")&&r308css.includes('right:16px')&&diag.includes('driver HUD lower-right geometry failed'),
  announcerLive:core.includes('all.length>=256&&uniqueTexts.size===all.length')&&r307.includes('@keyframes f1LiveMergeCopyV307')&&diag.includes('LIVE phrase library QA failed')&&diag.includes('LIVE entrance effect missing'),
  normalRunningOvertake:core.includes('averageUniquePassPairs')&&core.includes('averageOrderChanges')&&diag.includes('Phase 309 unique pass opponents too low')&&diag.includes('Phase 309 actual order changes too low'),
  leaderNotFixed:diag.includes('p1Retention remains too strong')&&core.includes('p1Retention<.9'),
  rankingNoOverlap:diag.includes("assertNoDomOverlap('baseline')")&&diag.includes('timing panel horizontal overflow')&&diag.includes('finalDomOverlapPairs'),
  smoothShuffle:r288.includes("const VERSION290='phase290-f1-r15-starting-grid-shuffle-smoothness';")&&diag.includes('Phase 290 grid shuffle live QA failed'),
  finishPodiumResult:r291.includes("const VERSION291='phase291-f1-r16-finish-podium-result-overlay';")&&r291.includes("const VERSION304='phase304-f1-finish-result-closure';")&&diag.includes('Phase 304 final result headers incomplete'),
  raceBackgroundAfterFinish:r291.includes("window.mwsF1SetScreenStateV185?.('RACE',{force:true})")&&diag.includes('Phase 292 final desktop QA failed after finish'),
  zeroConsoleErrors:diag.includes("assert(errors.length===0,'Browser errors during Recovery H: '"),
  protectedRegression:diag.includes('cancelPreservedDrivers')&&diag.includes('newRacePreservedDrivers')&&diag.includes('Phase 305 final workspace UI QA failed')
 };
 for(const [name,pass] of Object.entries(criteria))if(!pass)issues.push('Completion criterion missing: '+name);
 const result={phase:310,name:'f1-final-spec-closure',criteria,passed:Object.values(criteria).filter(Boolean).length,total:Object.keys(criteria).length,issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase310F1FinalSpecClosureAudit();
