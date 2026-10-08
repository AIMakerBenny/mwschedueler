import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase206F1PitStrategyAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  const cachePhase=Number(index.match(/recovery=[K-Z][0-9]+&phase=(\d+)/)?.[1]||0);
  if(cachePhase<206)issues.push('Phase 206+ asset cache missing');
  for(const token of [
    "const VERSION206='phase206-pit-strategy-ai';",
    "const PIT_STRATEGIES_V206=Object.freeze(['NONE','BOX_NOW','UNDERCUT','OVERCUT','GO_LONG','COVER_UNDERCUT']);",
    'function pitLossSecondsV206(track=activeRaceSnapshotV187?.track){',
    'function choosePitCompoundV206(vehicle,remainingLaps){',
    'function pitStrategyContextV206(vehicle){',
    'function evaluatePitStrategyV206(vehicle,options={}){',
    "decision='BOX_NOW';reason='TYRE_STATE_CRITICAL';",
    "decision='OVERCUT';reason='RIVAL_PIT_STAY_OUT';",
    "decision='GO_LONG';reason='TYRE_MANAGEMENT_MARGIN';",
    'requested=requestPitStopV205(vehicle.id,compound,decision);',
    'function updatePitStrategiesV206(stepMs){',
    'updatePitStrategiesV206(stepMs);',
    "row.dataset.pitStrategy=String(vehicle.strategyDecision||'NONE');",
    'window.mwsF1EvaluatePitStrategyV206=evaluatePitStrategyV206;',
    'window.mwsF1GetPitStrategyStatesV206=getPitStrategyStatesV206;',
    'window.mwsF1QaPitStrategyV206=qaPitStrategyV206;',
    'window.__mwsF1RacingV206=VERSION206;'
  ])if(!racing.includes(token))issues.push('Phase 206 runtime missing: '+token);
  // Accept the original Phase 206 branches or the Phase 391 economic approval
  // branches, but require both the real decisions and their exact reasons.
  for(const [oldBranch,newBranch] of [
    ["decision='COVER_UNDERCUT';reason='COVER_RIVAL_PIT';", "decision=tacticalV391.approve?'COVER_UNDERCUT':'GO_LONG';"],
    ["decision='UNDERCUT';reason='ATTACK_CAR_AHEAD';", "decision=tacticalV391.approve?'UNDERCUT':'GO_LONG';"]
  ])if(!racing.includes(oldBranch)&&!racing.includes(newBranch))issues.push('Phase 206 strategy branch missing: '+oldBranch);
  if(racing.includes("decision=tacticalV391.approve?'COVER_UNDERCUT':'GO_LONG';")&&
     (!racing.includes("reason=tacticalV391.approve?'COVER_RIVAL_PIT':'COVER_PIT_VALUE_INSUFFICIENT_V391';")||
      !racing.includes("reason=tacticalV391.approve?'ATTACK_CAR_AHEAD':'UNDERCUT_PIT_VALUE_INSUFFICIENT_V391';")||
      !racing.includes('const tacticalV391=tacticalPitValueV391(context,criticalTyre,finalStintEconomicsV374);')))
    issues.push('Phase 391 guarded strategy must retain exact reasons and real economics');
  const legacyShouldPit="const shouldPit=decision==='BOX_NOW'||decision==='UNDERCUT'||decision==='COVER_UNDERCUT';";
  const tyreAwareShouldPit="const shouldPit=(decision==='BOX_NOW'||decision==='UNDERCUT'||decision==='COVER_UNDERCUT')&&(wearReady||criticalTyre)&&!safeTyre;";
  if(!racing.includes(legacyShouldPit)&&!racing.includes(tyreAwareShouldPit))issues.push('Phase 206 runtime missing: compatible shouldPit decision gate');

  for(const token of [
    "mwsF1QaPitStrategyV206?.(strategyDriver,'BOX_NOW')",
    "strategyQa?.decision==='BOX_NOW'",
    "strategyQa?.pitRequested===true&&strategyQa?.requestReason==='BOX_NOW'",
    'Phase 206 strategy did not expose tyre evidence'
  ])if(!diag.includes(token))issues.push('Phase 206 live QA missing: '+token);

  for(const token of ['node --check scripts/run-phase206-f1-pit-strategy-audit.mjs',"echo '[phase206] F1 pit strategy AI'"])if(!workflow.includes(token))issues.push('Phase 206 workflow missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:206,name:'f1-pit-strategy-ai',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase206F1PitStrategyAudit();
