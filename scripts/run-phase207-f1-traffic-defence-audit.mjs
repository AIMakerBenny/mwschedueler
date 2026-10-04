import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase207F1TrafficDefenceAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  if(!/recovery=N1&phase=207/.test(index))issues.push('Phase 207 asset cache missing');
  for(const token of [
    "const VERSION207='phase207-traffic-slipstream-defence';",
    "const TRAFFIC_STATES_V207=Object.freeze(['CLEAR','FOLLOWING','TOWING','PRESSURE','DEFENDING']);",
    'function updateTrafficAndDefenceV207(){',
    "vehicle.racingLineMode='ATTACK_INSIDE';",
    "ahead.racingLineMode='DEFENSIVE_INSIDE';",
    'updateTrafficAndDefenceV207();',
    "marker.dataset.trafficState=String(vehicle.trafficState||'CLEAR');",
    "row.dataset.trafficState=String(vehicle.trafficState||'CLEAR');",
    'window.mwsF1GetTrafficStatesV207=getTrafficStatesV207;',
    'window.mwsF1QaTrafficV207=qaTrafficV207;',
    'window.__mwsF1RacingV207=VERSION207;'
  ])if(!racing.includes(token))issues.push('Phase 207 runtime missing: '+token);
  for(const token of [
    "mwsF1QaTrafficV207?.()",
    "trafficQa?.follower?.state==='PRESSURE'",
    "trafficQa?.follower?.lineIntent==='ATTACK_INSIDE'",
    "trafficQa?.ahead?.defenceActive===true&&trafficQa?.ahead?.lineIntent==='DEFENSIVE_INSIDE'"
  ])if(!diag.includes(token))issues.push('Phase 207 live QA missing: '+token);
  for(const token of ['node --check scripts/run-phase207-f1-traffic-defence-audit.mjs',"echo '[phase207] F1 traffic slipstream battle and defence'"])if(!workflow.includes(token))issues.push('Phase 207 workflow missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:207,name:'f1-traffic-slipstream-defence',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase207F1TrafficDefenceAudit();
