import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase183F1SvgTrackAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of ['id="f1RacingTrackSvgV183"','id="f1RacingTrackPathV183"','id="f1RacingTrackAnnotationsV183"','id="f1RacingVehicleLayerV183"'])if(!index.includes(token))issues.push('Phase 183 track UI missing: '+token);
  for(const token of ['.f1-racing-track-panel-v183{','.f1-racing-track-path-v183{','.f1-racing-track-annotation-v183.sector circle{','.f1-racing-track-annotation-v183.trap circle{'])if(!css.includes(token))issues.push('Phase 183 track CSS missing: '+token);
  for(const token of ["const VERSION183='phase183-svg-track';",'function pointAtProgressV183(path,progress){','function addTrackAnnotationV183(layer,path,kind,label,progress){','function renderTrackMapV183(){',"path.setAttribute('d',track.path);","glow.setAttribute('d',track.path);",'window.mwsF1RenderTrackMapV183=renderTrackMapV183;','window.__mwsF1RacingV183=VERSION183;'])if(!js.includes(token))issues.push('Phase 183 renderer missing: '+token);
  if(!(js.includes("addTrackAnnotationV183(layer,path,'sector','S1',track.sectors[0].end);")&&js.includes("addTrackAnnotationV183(layer,path,'pit','PIT IN',track.pit.entry);"))&&!js.includes("function renderTrackMarkersV211(layer,path,track,scope='race'){"))issues.push('Sector or pit annotations are not wired to track metadata');
  for(const token of ['node --check scripts/run-phase183-f1-svg-track-audit.mjs',"echo '[phase183] F1 Racing SVG circuit rendering'"])if(!workflow.includes(token))issues.push('Phase 183 workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 Racing JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:183,name:'f1-svg-track-render',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase183F1SvgTrackAudit();
