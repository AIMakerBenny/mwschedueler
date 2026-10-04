import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

export function runPhase220F1DiverseTrackCatalogAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const trackSource=fs.readFileSync('assets/f1-track-v1.js','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<220)issues.push('Phase 220 asset cache missing');
  if(!index.includes('recoveryA-tracks7&phase=220'))issues.push('Seven-track cache revision missing');
  const sandbox={};vm.createContext(sandbox);
  try{vm.runInContext(trackSource,sandbox,{filename:'assets/f1-track-v1.js'})}catch(error){issues.push('Track runtime evaluation failed: '+String(error))}
  const tracks=sandbox.MWS_F1_TRACKS_V182||{};
  const required=['majoku-ring-v1','castle-street-circuit-v1','blue-coast-speedway-v1','mawang-speed-park-v1','royal-street-circuit-v1','infinity-eight-circuit-v1','highland-flow-ring-v1'];
  if(Object.keys(tracks).length<7)issues.push('Expected at least 7 tracks, found '+Object.keys(tracks).length);
  for(const id of required){
    const track=tracks[id];if(!track){issues.push('Track missing: '+id);continue}
    const validation=sandbox.mwsValidateF1TrackV182?.(sandbox.mwsGetF1TrackV182?.(id))||['validator unavailable'];
    if(validation.length)issues.push('Track validation '+id+': '+validation.join(', '));
  }
  if(new Set(required.map(id=>String(tracks[id]?.path||''))).size!==7)issues.push('Track silhouettes are not unique');
  if(new Set(required.map(id=>String(tracks[id]?.archetype||''))).size<6)issues.push('Track driving archetypes are not diverse enough');
  for(const token of [
    "const VERSION220='phase220-diverse-track-catalog';",
    'function qaDiverseTrackCatalogV220(){',
    "catalog.length>=7",
    "window.mwsF1QaDiverseTrackCatalogV220=qaDiverseTrackCatalogV220;",
    'window.__mwsF1RacingV220=VERSION220;'
  ])if(!racing.includes(token))issues.push('Phase 220 runtime integration missing: '+token);
  const trackSyntax=spawnSync(process.execPath,['--check','assets/f1-track-v1.js'],{encoding:'utf8'});
  const raceSyntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(trackSyntax.status!==0)issues.push('Track JS syntax failed: '+String(trackSyntax.stderr||trackSyntax.stdout||'').trim());
  if(raceSyntax.status!==0)issues.push('F1 JS syntax failed: '+String(raceSyntax.stderr||raceSyntax.stdout||'').trim());
  const result={phase:220,name:'f1-diverse-track-catalog',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase220F1DiverseTrackCatalogAudit();
