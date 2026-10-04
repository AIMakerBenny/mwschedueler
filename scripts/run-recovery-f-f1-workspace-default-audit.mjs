import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryFF1WorkspaceDefaultAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/f1-racing-v1.css?v=1.0.0-phase180-shell&p=196&recovery=F1',
    'assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=203&recovery=F1',
    'POSITION · GAP · TELEMETRY',
    'LIVE EVENT FEED'
  ])if(!index.includes(token))issues.push('Recovery F HTML/cache missing: '+token);

  for(const token of [
    'version:2,',
    "timing:Object.freeze({x:0,y:0,w:12,h:2",
    "track:Object.freeze({x:0,y:2,w:7,h:6",
    "commentary:Object.freeze({x:7,y:2,w:5,h:3",
    "radio:Object.freeze({x:7,y:5,w:5,h:3,hidden:false,maximized:false,tabGroup:'race-side'})",
    "speed:Object.freeze({x:7,y:5,w:5,h:3,hidden:false,maximized:false,tabGroup:'race-side'})",
    "activeTabs:Object.freeze({'race-side':'radio'})",
    'const source=Number(candidate.version)>=2?candidate:{};',
    "window.__mwsF1RecoveryF='race-workspace-default-redesign-v1';"
  ])if(!racing.includes(token))issues.push('Recovery F default workspace missing: '+token);

  for(const token of [
    '/* Recovery F: dense race-control default presentation */',
    '#f1RacingViewRaceV185 .f1-racing-workspace-recovery-e{',
    'min-height:571px!important',
    '#f1RacingViewRaceV185 .f1-racing-workspace-panel-recovery-e{',
    '#f1RacingViewRaceV185 .f1-racing-race-header-v188{'
  ])if(!css.includes(token))issues.push('Recovery F dense layout CSS missing: '+token);

  for(const token of ['node --check scripts/run-recovery-f-f1-workspace-default-audit.mjs',"echo '[recovery-f] F1 dense default workspace'"])if(!workflow.includes(token))issues.push('Recovery F workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:'recovery-f',name:'f1-dense-default-workspace',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryFF1WorkspaceDefaultAudit();
