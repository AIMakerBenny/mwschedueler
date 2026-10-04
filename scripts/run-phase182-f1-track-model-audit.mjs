import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase182F1TrackModelAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const track=fs.readFileSync('assets/f1-track-v1.js','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of ['assets/f1-track-v1.js?v=',"id:'majoku-ring-v1'","name:'Majoku Ring'",'lengthMeters:5280','speedTraps:[','overtakeZones:[',"root.__mwsF1TrackModelV182='majoku-ring-metadata-v1';"])if(!(index+track).includes(token))issues.push('Phase 182 track token missing: '+token);
  for(const token of ["const VERSION182='phase182-track-model';","let activeTrackId='majoku-ring-v1';",'function getActiveTrack(){','function updateTrackFoundationStatusV182(){','window.mwsF1GetActiveTrackV182=getActiveTrack;','window.__mwsF1RacingV182=VERSION182;'])if(!racing.includes(token))issues.push('Phase 182 integration missing: '+token);
  for(const token of ["id:'majoku-ring-v1'","id:'castle-street-circuit-v1'","id:'blue-coast-speedway-v1'","root.__mwsF1TrackRecoveryA='three-track-catalog-v1';"])if(!track.includes(token))issues.push('Phase 182+ multi-track compatibility missing: '+token);
  const zoneMatches=[...track.matchAll(/type:'(?:straight|fastCorner|mediumCorner|slowCorner|hairpin)',start:(0(?:\.\d+)?|1(?:\.0+)?),end:(0(?:\.\d+)?|1(?:\.0+)?),targetKph:(\d+)/g)];
  if(zoneMatches.length<10||zoneMatches.length%10!==0)issues.push('Expected complete 10-zone track groups, found '+zoneMatches.length);
  for(const token of ['node --check assets/f1-track-v1.js','node --check scripts/run-phase182-f1-track-model-audit.mjs',"echo '[phase182] F1 Racing track data model'"])if(!workflow.includes(token))issues.push('Phase 182 workflow verification missing: '+token);
  for(const file of ['assets/f1-track-v1.js','assets/f1-racing-v1.js']){const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim())}
  const result={phase:182,name:'f1-track-data-model',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase182F1TrackModelAudit();
