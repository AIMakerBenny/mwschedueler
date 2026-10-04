import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase184F1SmoothMarkerAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of ['id="f1RacingPreviewStatusV184"','id="f1RacingPreviewStopV184"','id="f1RacingPreviewStartV184"','주행 미리보기'])if(!index.includes(token))issues.push('Phase 184 preview UI missing: '+token);
  for(const token of ['.f1-racing-preview-car-v184{','.f1-racing-preview-controls-v184{','@keyframes f1PreviewPulseV184'])if(!css.includes(token))issues.push('Phase 184 preview CSS missing: '+token);
  for(const token of ["const VERSION184='phase184-smooth-single-marker';",'const previewStateV184={running:false,progress:0,lastTimestamp:0,rafId:0,lapDurationMs:18000};','function positionPreviewMarkerV184(progress=previewStateV184.progress){','function previewFrameV184(timestamp){','previewStateV184.rafId=requestAnimationFrame(previewFrameV184);','const delta=Math.min(50,Math.max(0,timestamp-previewStateV184.lastTimestamp));','previewStateV184.progress=(previewStateV184.progress+delta/previewStateV184.lapDurationMs)%1;','function startPreviewV184(){','function stopPreviewV184(reset=false){','cancelAnimationFrame(previewStateV184.rafId);','window.mwsF1StartPreviewV184=startPreviewV184;','window.__mwsF1RacingV184=VERSION184;'])if(!js.includes(token))issues.push('Phase 184 smooth marker runtime missing: '+token);
  if(js.includes('setInterval(previewFrameV184')||js.includes('setTimeout(previewFrameV184'))issues.push('Smooth marker must not be driven by interval or timeout');
  if(!js.includes("document.addEventListener('visibilitychange'"))issues.push('Background visibility guard missing');
  for(const token of ['node --check scripts/run-phase184-f1-smooth-marker-audit.mjs',"echo '[phase184] F1 Racing requestAnimationFrame single marker preview'"])if(!workflow.includes(token))issues.push('Phase 184 workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 Racing JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:184,name:'f1-smooth-single-marker',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase184F1SmoothMarkerAudit();
