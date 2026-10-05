import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase258F1VisualLateralSmoothingAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<258)issues.push('Phase 258 asset cache missing');

  for(const token of [
    "const VERSION258='phase258-visual-lateral-smoothing';",
    'const VISUAL_LATERAL_RESPONSE_V258=Object.freeze(',
    'function physicalLateralOffsetV258(',
    'function updateVisualLateralOffsetV258(',
    'visualLateralOffsetMeters',
    'targetVisualLateralOffsetMeters',
    'visualLateralVelocity',
    'const lateralStateV258=updateVisualLateralOffsetV258(vehicle,frameMs,false);',
    'raceLinePointV197(path,vehicle.progress,lateralStateV258.visual)',
    'function qaVisualLateralSmoothingV258(){',
    'function qaVisualLateralDomV258(){',
    'window.mwsF1QaVisualLateralSmoothingV258=qaVisualLateralSmoothingV258;',
    'window.mwsF1QaVisualLateralDomV258=qaVisualLateralDomV258;',
    'window.__mwsF1RacingV258=VERSION258;'
  ])if(!racing.includes(token))issues.push('Phase 258 runtime missing: '+token);

  if(racing.includes('raceLinePointV197(path,vehicle.progress,vehicle.lateralOffsetMeters)'))issues.push('Render still uses unsmoothed physical lateral offset');

  for(const token of [
    'mwsF1QaVisualLateralSmoothingV258',
    'mwsF1QaVisualLateralDomV258',
    'Phase 258 visual lateral smoothing QA failed',
    'Phase 258 visual lateral DOM QA failed'
  ])if(!live.includes(token))issues.push('Phase 258 Recovery H browser QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:258,name:'f1-visual-lateral-smoothing',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase258F1VisualLateralSmoothingAudit();
