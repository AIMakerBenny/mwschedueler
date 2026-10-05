import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase285F1ZoomLinkedMarkerScaleAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),patch=fs.readFileSync('assets/f1-racing-r283-r287.js','utf8');
 for(const token of ["const VERSION285='phase285-f1-r10-zoom-linked-marker-scale';",'function zoomMarkerScaleV285(zoom){','function syncZoomMarkerScaleV285(){','function installZoomMarkerObserverV285(){','function qaZoomLinkedMarkerScaleV285(){','window.__mwsF1RacingV285=VERSION285;'])if(!patch.includes(token))issues.push('Phase 285 patch missing: '+token);
 if(!index.includes('assets/f1-racing-r283-r287.js?phase='))issues.push('Phase 285 patch cache link missing');
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r283-r287.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('Phase 285 patch syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:285,name:'f1-r10-zoom-linked-marker-scale',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase285F1ZoomLinkedMarkerScaleAudit();
