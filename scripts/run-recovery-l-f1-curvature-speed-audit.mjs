import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryLF1CurvatureSpeedAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const geometry=fs.readFileSync('assets/f1-track-geometry-v2.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!index.includes('assets/f1-track-geometry-v2.js?v=1.0.0-phase195-speed-profile&recovery=L1'))issues.push('Recovery L geometry cache missing');
  for(const token of [
    'function curvatureSeverityRecoveryL(track,curvature){',
    'const soft=threshold*.45;',
    'const full=threshold*2.35;',
    'function curvatureWeightedZoneLimitRecoveryL(track,sample,maxKph){',
    "if(type==='straight')return maxKph;",
    'const zoneLimit=curvatureWeightedZoneLimitRecoveryL(track,sample,maxKph);',
    'return Math.min(maxKph,zoneLimit,curveLimit);',
    'root.mwsF1CurvatureSeverityRecoveryL=curvatureSeverityRecoveryL;',
    "root.__mwsF1RecoveryL='curvature-weighted-speed-v1';"
  ])if(!geometry.includes(token))issues.push('Recovery L engine missing: '+token);

  try{
    const holder={};
    Function('globalThis',geometry+';return globalThis;')(holder);
    const mildTrack={geometry:{cornerCurvatureThreshold:.0018},zones:[{type:'fastCorner',start:0,end:1,targetKph:220}]};
    const sharpTrack={geometry:{cornerCurvatureThreshold:.0018},zones:[{type:'hairpin',start:0,end:1,targetKph:90}]};
    const mild=holder.mwsF1CurvatureWeightedZoneLimitRecoveryL?.(mildTrack,{progress:.5,curvatureRadPerMeter:.0009},335);
    const sharp=holder.mwsF1CurvatureWeightedZoneLimitRecoveryL?.(sharpTrack,{progress:.5,curvatureRadPerMeter:.012},335);
    if(!(Number(mild)>280))issues.push('Gentle bend still slows too much: '+mild);
    if(!(Number(sharp)<130))issues.push('Sharp corner does not slow enough: '+sharp);
    if(!(Number(mild)>Number(sharp)+120))issues.push('Curvature separation too small: mild='+mild+' sharp='+sharp);
  }catch(error){issues.push('Recovery L smoke test failed: '+String(error?.message||error))}

  for(const token of ['node --check scripts/run-recovery-l-f1-curvature-speed-audit.mjs',"echo '[recovery-l] F1 curvature weighted corner speed'"])if(!workflow.includes(token))issues.push('Recovery L workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-track-geometry-v2.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('Geometry JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:'recovery-l',name:'f1-curvature-weighted-corner-speed',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryLF1CurvatureSpeedAudit();
