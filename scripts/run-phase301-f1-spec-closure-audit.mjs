import fs from 'node:fs';
export function runPhase301F1SpecClosureAudit(){
 const issues=[],warnings=[],gaps=[];
 const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const r283=fs.readFileSync('assets/f1-racing-r283-r287.js','utf8');
 const r288=fs.readFileSync('assets/f1-racing-r288-r290.js','utf8');
 const r291=fs.readFileSync('assets/f1-racing-r291-r295.js','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

 const checks={
  conversationChain:racing.includes('phase277-character-dialogue-engine')&&racing.includes('phase281-dialogue-cadence-repeat-guard'),
  liveNarrative:racing.includes('phase263-race-narrative-engine'),
  overtaking:r283.includes('phase283-f1-r08-general-overtake-defence')&&diag.includes('averageOvertakes'),
  rankingBase:r283.includes('function syncTrackRankingV284(force=false){'),
  shuffle:r288.includes("const VERSION290='phase290-f1-r15-starting-grid-shuffle-smoothness';"),
  finishBase:r291.includes("const VERSION291='phase291-f1-r16-finish-podium-result-overlay';"),
  browserRegression:diag.includes('errors.length===0')&&diag.includes('mwsF1QaDialogueLongRunDesktopV282')
 };
 if(!Object.values(checks).every(Boolean))issues.push('Phase 301 baseline completion contract missing');

 const rankingHasStatus=/data-f1-rank-status|rank-status|rankingStatus/.test(r283);
 const rankingHasFlip=/flip|FLIP|rank-move|translateY/.test(r283.slice(r283.indexOf('function ensureTrackRankingV284'),r283.indexOf('function zoomMarkerScaleV285')));
 if(!rankingHasStatus||!rankingHasFlip)gaps.push('ranking-status-flip');

 const finishHasPit=/pitStopCount|PIT/.test(r291.slice(0,r291.indexOf("const VERSION292=")));
 const finishHasDelta=/position delta|data-delta|movement.*results|rankDelta|START.*MOVE/.test(r291.slice(0,r291.indexOf("const VERSION292=")));
 const finishHasWinner=/winner|confetti|light-burst|celebration/i.test(r291.slice(0,r291.indexOf("const VERSION292=")));
 if(!finishHasPit||!finishHasDelta||!finishHasWinner)gaps.push('finish-pit-delta-winner');

 if(gaps.includes('ranking-status-flip'))warnings.push('Spec gap: live ranking still lacks max-2 status badges and FLIP movement');
 if(gaps.includes('finish-pit-delta-winner'))warnings.push('Spec gap: final result still lacks pit count, full-table start delta, or winner emphasis');

 const result={phase:301,name:'f1-spec-closure-audit',checks,gaps,issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase301F1SpecClosureAudit();
