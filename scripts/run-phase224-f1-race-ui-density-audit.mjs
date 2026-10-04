import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase224F1RaceUiDensityAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<224)issues.push('Phase 224 asset cache missing');
  for(const token of [
    "const VERSION224='phase224-race-ui-density-qa';",
    '<em data-f1-current-sector>그리드</em>',
    "pos===1?'선두':'--.---'",
    'window.__mwsF1RacingV224=VERSION224;'
  ])if(!racing.includes(token))issues.push('Phase 224 runtime missing: '+token);
  for(const token of [
    '/* Phase 224: desktop race UI density QA */',
    '.f1-racing-race-header-v188{min-height:38px!important',
    '.f1-racing-workspace-recovery-e{grid-auto-rows:68px!important',
    '.f1-racing-timing-row-v188>.gear',
    '.f1-racing-timing-row-v188>.rpm'
  ])if(!css.includes(token))issues.push('Phase 224 compact UI CSS missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:224,name:'f1-race-ui-density-qa',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase224F1RaceUiDensityAudit();
