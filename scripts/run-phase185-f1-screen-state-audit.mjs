import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase185F1ScreenStateAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const state of ['SETUP','TRANSITION','GRID','RACE','FINISHING','PODIUM','RESULT'])if(!index.includes('data-f1-view="'+state+'"'))issues.push('Missing F1 view '+state);
  for(const token of ["const VERSION185='phase185-screen-state-machine';","const F1_STATES_V185=Object.freeze(['SETUP','TRANSITION','GRID','RACE','FINISHING','PODIUM','RESULT']);","let f1ScreenStateV185='SETUP';",'function applyScreenStateV185(){','function canTransitionF1V185(next){','function setScreenStateV185(next,options={}){','window.mwsF1SetScreenStateV185=setScreenStateV185;','window.__mwsF1RacingV185=VERSION185;'])if(!js.includes(token))issues.push('Phase 185 state runtime missing: '+token);
  for(const token of ['.f1-racing-view-v185[hidden]{display:none!important}','.f1-racing-state-placeholder-v185{'])if(!css.includes(token))issues.push('Phase 185 CSS missing: '+token);
  for(const token of ['node --check scripts/run-phase185-f1-screen-state-audit.mjs',"echo '[phase185] F1 internal screen state machine'"])if(!workflow.includes(token))issues.push('Phase 185 workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:185,name:'f1-screen-state-machine',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase185F1ScreenStateAudit();
