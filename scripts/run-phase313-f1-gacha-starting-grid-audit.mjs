import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase313F1GachaStartingGridAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8');
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const css=fs.readFileSync('assets/f1-racing-r313.css','utf8');
 for(const token of [
  "const VERSION313='phase313-f1-gacha-starting-grid';",
  'const GRID_GACHA_CONFIG_V313=Object.freeze({',
  'function runStartingGridGachaRevealV313(',
  "stage.id='f1RacingGridGachaStageV313'",
  "setGridRevealControlsV273(false)",
  'const runStartingGridRevealLegacyV273=runStartingGridRevealV273;',
  'runStartingGridRevealV273=runStartingGridGachaRevealV313;',
  'window.mwsF1QaGachaStartingGridV313=qaGachaStartingGridV313;',
  'window.__mwsF1RacingV313=VERSION313;'
 ])if(!core.includes(token))issues.push('Phase 313 core missing: '+token);
 const cardStart=core.indexOf('function gridGachaCardHtmlV313(');
 const cardEnd=core.indexOf('function gridGachaDockItemV313(',cardStart);
 const cardSource=cardStart>=0&&cardEnd>cardStart?core.slice(cardStart,cardEnd):'';
 if(!cardSource.includes("sharedAvailable=typeof window.multiDrawCardHTML==='function'")||!cardSource.includes('window.multiDrawCardHTML(player)'))issues.push('Phase 313 real Gacha style reuse missing');
 if(!/positionText='P'\+String\(position\)\.padStart\(2,'0'\)/.test(cardSource))issues.push('Phase 313 Pxx position label generation missing');
 if(!cardSource.includes('gacha-card-kicker')||!cardSource.includes('STARTING GRID')||!cardSource.includes('gacha-card-desc')||!cardSource.includes('+positionText+'))issues.push('Phase 313 Starting Grid card content structure missing');
 for(const token of [
  '#f1RacingGridListV272.f1-racing-grid-gacha-active-v313',
  '.f1-racing-grid-gacha-stage-v313',
  '.f1-grid-gacha-dock-v313',
  '.f1-grid-gacha-dock-item-v313',
  '@keyframes f1GridGachaPulseV313'
 ])if(!css.includes(token))issues.push('Phase 313 CSS missing: '+token);
 if(!index.includes('assets/f1-racing-r313.css?phase=313'))issues.push('Phase 313 CSS link missing');
 for(const file of ['assets/f1-racing-v1.js','scripts/run-phase313-f1-gacha-starting-grid-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:313,name:'f1-gacha-starting-grid',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase313F1GachaStartingGridAudit();
