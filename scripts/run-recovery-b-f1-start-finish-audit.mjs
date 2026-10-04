import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

export function runRecoveryBF1StartFinishAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const trackSource=fs.readFileSync('assets/f1-track-v1.js','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  const sandbox={};vm.createContext(sandbox);
  try{vm.runInContext(trackSource,sandbox,{filename:'assets/f1-track-v1.js'})}catch(error){issues.push('Track model evaluation failed: '+String(error))}
  for(const [id,track] of Object.entries(sandbox.MWS_F1_TRACKS_V182||{})){
    if(Number(track.startFinish)!==0)issues.push('Start/finish must match current lap wrap coordinate 0 for '+id);
  }
  for(const token of [
    'id="f1RacingTrackAnnotationsV183"',
    'id="f1RacingRaceAnnotationsRecoveryB"',
    /assets\/f1-racing-v1\.css\?v=1\.0\.0-phase180-shell&p=196&recovery=[B-Z][0-9]+/.test(index)?'__RECOVERY_CSS_OK__':'__RECOVERY_CSS_MISSING__',
    /assets\/f1-racing-v1\.js\?v=1\.0\.0-phase180-shell&p=203&recovery=[B-Z][0-9]+/.test(index)?'__RECOVERY_JS_OK__':'__RECOVERY_JS_MISSING__'
  ])if(token==='__RECOVERY_JS_OK__'||token==='__RECOVERY_CSS_OK__'?false:token==='__RECOVERY_JS_MISSING__'||token==='__RECOVERY_CSS_MISSING__'?true:!index.includes(token))issues.push('Recovery B HTML/cache missing: '+token);

  for(const token of [
    'function startFinishGeometryRecoveryB(path,track){',
    "const progress=normalizedProgressV190(Number(track.startFinish)||0);",
    'function addStartFinishLineRecoveryB(layer,path,track,scope=',
    "class:'f1-racing-start-finish-recovery-b '+scope",
    "label.textContent='출발 / 결승선';",
    'window.mwsF1StartFinishGeometryRecoveryB=startFinishGeometryRecoveryB;',
    "window.__mwsF1RecoveryB='start-finish-line-v1';"
  ])if(!racing.includes(token))issues.push('Recovery B renderer missing: '+token);
  if(!racing.includes("addStartFinishLineRecoveryB(layer,path,track,'setup');")&&!racing.includes("renderTrackMarkersV211(layer,path,track,'setup');"))issues.push("Recovery B renderer missing: setup start/finish owner");
  if(!racing.includes("if(path&&annotations)renderRaceStartFinishRecoveryB(annotations,path,snapshot.track);")&&!racing.includes("if(path&&annotations)renderTrackMarkersV211(annotations,path,snapshot.track,'race');"))issues.push("Recovery B renderer missing: race start/finish owner");

  if(racing.includes("addTrackAnnotationV183(layer,path,'start','START',track.startFinish);"))issues.push('Legacy start-dot annotation still owns setup start marker');
  for(const token of [
    '.f1-racing-start-finish-recovery-b .finish-underlay{',
    '.f1-racing-start-finish-recovery-b .finish-stripe{',
    '.f1-racing-start-finish-recovery-b .finish-label{',
    'stroke-dasharray:9 7'
  ])if(!css.includes(token))issues.push('Recovery B CSS missing: '+token);

  for(const token of ['node --check scripts/run-recovery-b-f1-start-finish-audit.mjs',"echo '[recovery-b] F1 visible start finish line'"])if(!workflow.includes(token))issues.push('Recovery B workflow verification missing: '+token);
  for(const file of ['assets/f1-track-v1.js','assets/f1-racing-v1.js']){
    const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  }
  const result={phase:'recovery-b',name:'f1-visible-start-finish-line',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryBF1StartFinishAudit();
