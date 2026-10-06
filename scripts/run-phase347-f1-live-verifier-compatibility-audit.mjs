import fs from 'node:fs';
// Production retrigger after Fast Race verifier compatibility
export function runPhase347F1LiveVerifierCompatibilityAudit(){
 const issues=[],warnings=[];
 const wf=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 for(const token of [
  "grep -Eq 'function buildRaceSnapshotV187\\([^)]*\\)\\{' /tmp/f1-racing-v1-phase187.js",
  "grep -Fq \"const raceMode=String(options?.raceMode||'NORMAL')\" /tmp/f1-racing-v1-phase187.js",
  "grep -Fq \"const requestedLaps=raceMode==='FAST'?RACE_COMPETITION_V345.fastLaps:draft.totalLaps;\" /tmp/f1-racing-v1-phase187.js"
 ])if(!wf.includes(token))issues.push('Phase 347 verifier missing: '+token);
 if(wf.includes("grep -Fq 'function buildRaceSnapshotV187(){'"))issues.push('Phase 347 obsolete exact Phase 187 signature remains');
 const result={phase:347,name:'f1-live-verifier-fast-race-compatibility',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase347F1LiveVerifierCompatibilityAudit();
