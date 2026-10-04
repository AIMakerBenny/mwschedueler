import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase186F1SetupTrackSelectAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'class="f1-racing-setup-layout-v186"',
    'id="f1RacingContactListV181"',
    'id="f1RacingSelectedListV181"',
    'id="f1RacingTrackOptionsV186"',
    'id="f1RacingTrackCountV186"',
    'id="f1RacingTrackSvgV183"',
    '트랙 미리보기'
  ])if(!index.includes(token))issues.push('Phase 186 setup UI missing: '+token);

  for(const forbidden of ['id="f1RacingPreviewStartV184"','id="f1RacingPreviewStopV184"','id="f1RacingPreviewStatusV184"','주행 미리보기'])if(index.includes(forbidden))issues.push('Phase 184 user-facing preview control should be removed: '+forbidden);

  for(const token of [
    "const VERSION186='phase186-setup-track-select';",
    'function getTrackCatalogV186(){',
    'function selectTrackV186(trackId){',
    'function renderTrackChoicesV186(){',
    'window.mwsF1SelectTrackV186=selectTrackV186;',
    'window.mwsF1GetTrackCatalogV186=getTrackCatalogV186;',
    'window.__mwsF1RacingV186=VERSION186;'
  ])if(!js.includes(token))issues.push('Phase 186 setup runtime missing: '+token);

  for(const token of [
    '.f1-racing-setup-layout-v186{',
    '.f1-racing-track-options-v186{',
    '.f1-racing-track-card-v186.selected{',
    '.f1-racing-track-preview-v186{'
  ])if(!css.includes(token))issues.push('Phase 186 CSS missing: '+token);

  if(js.includes("bindPreviewControlsV184();"))issues.push('Setup render still binds removed preview controls');

  for(const token of [
    'node --check scripts/run-phase186-f1-setup-track-select-audit.mjs',
    "echo '[phase186] F1 setup driver and track selection'"
  ])if(!workflow.includes(token))issues.push('Phase 186 production verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:186,name:'f1-setup-track-select',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase186F1SetupTrackSelectAudit();
