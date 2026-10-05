import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase249F1PanelRemovalAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const tracks=fs.readFileSync('assets/f1-track-v1.js','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<249)issues.push('Phase 249 asset cache missing');

  for(const token of ['id="f1RacingTeamRadioV188"','id="f1RacingSpeedTrapV188"','class="f1-racing-race-side-v188"']){
    if(index.includes(token))issues.push('Obsolete race side UI remains in HTML: '+token);
  }
  for(const token of ['.f1-racing-race-side-v188','.f1-racing-side-empty-v188']){
    if(css.includes(token))issues.push('Obsolete race side CSS remains: '+token);
  }

  for(const token of [
    "const VERSION249='phase249-remove-obsolete-race-panels';",
    'const F1_WORKSPACE_LAYOUT_VERSION_V249=6;',
    'version:F1_WORKSPACE_LAYOUT_VERSION_V249,',
    "reasons.push((id==='radio'||id==='speed'?'obsolete-panel:':'unknown-panel:')+id);",
    'const source=Number(candidate.version)>=5?candidate:{};',
    'normalized.version=F1_WORKSPACE_LAYOUT_VERSION_V249;',
    'function qaWorkspacePanelMigrationV249(){',
    "reasons.includes('obsolete-panel:radio')",
    "reasons.includes('obsolete-panel:speed')",
    'window.mwsF1QaWorkspacePanelMigrationV249=qaWorkspacePanelMigrationV249;',
    'window.__mwsF1RacingV249=VERSION249;'
  ])if(!racing.includes(token))issues.push('Phase 249 workspace migration runtime missing: '+token);

  if(!tracks.includes('speedTraps:Object.freeze(track.speedTraps.map'))||!tracks.includes('speedTraps:[')){
    issues.push('Internal speed trap calculation data was removed');
  }

  for(const token of [
    'mwsF1QaWorkspacePanelMigrationV249',
    'Phase 249 obsolete static race panels remain',
    'Phase 249 saved layout migration failed',
    'obsolete-panel:radio',
    'obsolete-panel:speed'
  ])if(!live.includes(token))issues.push('Phase 249 Recovery H migration QA missing: '+token);

  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs']){
    const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  }
  const result={phase:249,name:'f1-obsolete-panel-removal-migration',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase249F1PanelRemovalAudit();
