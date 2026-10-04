import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase208F1PassStateAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const cachePhase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(cachePhase<208)issues.push('Phase 208+ asset cache missing');
  for(const token of [
    "const VERSION208='phase208-pass-state-machine';",
    "const PASS_STATES_V208=Object.freeze(['FOLLOWING','CLOSING','TOWING','PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','PASS_COMPLETED','PASS_FAILED','COUNTER_ATTACK']);",
    'function nextPassStateV208(current,ctx={}){','function updatePassStateMachineV208(stepMs){',
    "vehicle.racingLineMode='ATTACK_INSIDE';","vehicle.racingLineMode='OUTSIDE';",
    "next==='PASS_COMPLETED'","next==='PASS_FAILED'",
    "+(Number(vehicle.battleSpeedBiasKph)||0);",'updatePassStateMachineV208(stepMs);',
    "marker.dataset.battleState=String(vehicle.battleState||'FOLLOWING');",
    "row.dataset.battleState=String(vehicle.battleState||'FOLLOWING');",
    'window.mwsF1QaPassStateMachineV208=qaPassStateMachineV208;','window.__mwsF1RacingV208=VERSION208;'
  ])if(!racing.includes(token))issues.push('Phase 208 runtime missing: '+token);
  for(const token of ["mwsF1QaPassStateMachineV208?.()","expectedPassSequence=['FOLLOWING','CLOSING','TOWING'","passQa?.failed==='PASS_FAILED'"])if(!diag.includes(token))issues.push('Phase 208 live QA missing: '+token);
  for(const token of ['node --check scripts/run-phase208-f1-pass-state-audit.mjs',"echo '[phase208] F1 pass state machine'"])if(!workflow.includes(token))issues.push('Phase 208 workflow missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:208,name:'f1-pass-state-machine',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase208F1PassStateAudit();
