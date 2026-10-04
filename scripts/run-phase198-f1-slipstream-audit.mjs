import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase198F1SlipstreamAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of ['assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=198'])if(!index.includes(token))issues.push('Phase 198 asset link missing: '+token);
  for(const token of [
    "const VERSION198='phase198-slipstream';",
    'const SLIPSTREAM_CONFIG_V198=Object.freeze({',
    'function resolveSlipstreamV198(vehicle,vehicles=raceMotionV189.vehicles){',
    'gapEffect*alignmentEffect*lateralEffect*straightEffect*wakeEffect',
    'vehicle.slipstreamDragReduction=dragReduction;',
    'function updateSlipstreamStatesV198(){',
    'updateSlipstreamStatesV198();',
    'const dragRelief=Math.max(0,Number(vehicle.slipstreamDragReduction)||0);',
    'const straightCap=(Number(track?.geometry?.maxStraightKph)||335)+towStrength*SLIPSTREAM_CONFIG_V198.maxTargetBonusKph;',
    "row.dataset.slipstream=(Number(vehicle.slipstreamStrength)||0).toFixed(3);",
    'window.mwsF1ResolveSlipstreamV198=resolveSlipstreamV198;',
    'window.__mwsF1RacingV198=VERSION198;'
  ])if(!racing.includes(token))issues.push('Phase 198 slipstream runtime missing: '+token);

  for(const token of ['node --check scripts/run-phase198-f1-slipstream-audit.mjs',"echo '[phase198] F1 slipstream wake model'"])if(!workflow.includes(token))issues.push('Phase 198 workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:198,name:'f1-slipstream-wake-model',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase198F1SlipstreamAudit();
