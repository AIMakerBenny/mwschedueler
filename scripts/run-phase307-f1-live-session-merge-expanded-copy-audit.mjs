import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase307F1LiveSessionMergeExpandedCopyAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8');
 const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const css=fs.readFileSync('assets/f1-racing-r307.css','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phase264=fs.readFileSync('scripts/run-phase264-f1-live-overtake-cutin-audit.mjs','utf8');

 for(const token of [
  "const VERSION307='phase307-live-session-merge-expanded-copy';",
  'const LIVE_CUTIN_TEXT_PARTS_V307=Object.freeze({',
  'const LIVE_CUTIN_LIBRARY_V307=buildLiveCutinLibraryV307();',
  'maxActive:1,queueLimit:1',
  'globalCadenceMs:',
  'mergeWindowMs:',
  'minDurationMs:',
  'maxDurationMs:',
  'mergeDurationMs:',
  'function liveCutinSessionKeyV307(',
  'function liveCutinMessageStateV307(',
  'function updateLiveCutinV307(',
  'function findLiveCutinSessionV307(',
  'function qaLiveCutinPolicyV307(){',
  'window.mwsF1QaLiveCutinPolicyV307=qaLiveCutinPolicyV307;',
  'window.__mwsF1RacingV307=VERSION307;'
 ])if(!racing.includes(token))issues.push('Phase 307 runtime missing: '+token);

 const eventBlocks=['ATTACK','SIDE_BY_SIDE','COUNTER_ATTACK','PASS_SUCCESS'];
 for(const event of eventBlocks){
  const lead=(racing.match(new RegExp(event+':Object\\.freeze\\(\\{[\\s\\S]*?lead:Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\),'))||[])[1]||'';
  if(!lead)warnings.push('Could not statically isolate '+event+' lead block');
 }
 const liveCadence=Number(racing.match(/liveCadenceMs:(\\d+)/)?.[1]||0);\n if(liveCadence<6200)issues.push('Phase 307 Phase 303 auxiliary LIVE cadence was not reduced');
 if(!racing.includes('all.length>=256&&uniqueTexts.size===all.length'))issues.push('Phase 307 256+ unique copy QA missing');

 for(const token of [
  '[data-f1-live-merge-count-v307]',
  '.is-merged-v307',
  '@keyframes f1LiveMergeCopyV307'
 ])if(!css.includes(token))issues.push('Phase 307 CSS missing: '+token);

 if(!index.includes('assets/f1-racing-r307.css?phase=307'))issues.push('Phase 307 CSS cache link missing');
 if(!index.includes('live307=1'))issues.push('Phase 307 core JS cache bust missing');

 for(const token of [
  'Phase 307 runtime readiness',
  'Phase 307 LIVE phrase library QA failed',
  'Phase 307 LIVE frequency or duration policy failed',
  'Phase 307 consecutive LIVE events were not merged',
  'Phase 307 merge counter did not advance',
  'Phase 307 merged LIVE badge missing',
  'Phase 307 LIVE card did not remain visible long enough'
 ])if(!diag.includes(token))issues.push('Phase 307 Recovery H QA missing: '+token);

 if(phase264.includes('maxActive:3,dedupeMs:1000,minDurationMs:1500,maxDurationMs:2500'))issues.push('Phase 264 audit still hard-codes obsolete LIVE policy');

 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:307,name:'f1-live-session-merge-expanded-copy',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase307F1LiveSessionMergeExpandedCopyAudit();
