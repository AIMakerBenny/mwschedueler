import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryFF1WorkspaceDefaultAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!/assets\/f1-racing-v1\.css\?v=1\.0\.0-phase180-shell&p=196&recovery=[F-Z][0-9]+/.test(index))issues.push('Recovery F+ CSS asset cache missing');
  if(!/assets\/f1-racing-v1\.js\?v=1\.0\.0-phase180-shell&p=203&recovery=[F-Z][0-9]+/.test(index))issues.push('Recovery F+ JS asset cache missing');
  for(const token of ['순위 · 격차 · 텔레메트리','실시간 이벤트 피드'])if(!index.includes(token))issues.push('Recovery F HTML label missing: '+token);

  for(const token of [
    "track:Object.freeze({x:0,y:0,w:8,h:8",
    "timing:Object.freeze({x:8,y:0,w:4,h:3",
    "commentary:Object.freeze({x:8,y:3,w:4,h:5",
    "activeTabs:Object.freeze({})",
    'const source=Number(candidate.version)>=5?candidate:{};',
    "tabGroup:Object.prototype.hasOwnProperty.call(row,'tabGroup')?String(row.tabGroup||''):String(base.tabGroup||'')",
    "for(const [group,id] of Object.entries(defaults.activeTabs||{})){",
    "window.__mwsF1RecoveryF='race-workspace-default-redesign-v1';"
  ])if(!racing.includes(token))issues.push('Recovery F default workspace missing: '+token);
  if(!racing.includes('version:5,')&&!racing.includes('version:F1_WORKSPACE_LAYOUT_VERSION_V249,'))issues.push('Recovery F default workspace schema version missing');

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
