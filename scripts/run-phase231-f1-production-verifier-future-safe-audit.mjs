import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase231F1ProductionVerifierFutureSafeAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<231)issues.push('Phase 231 asset cache missing');
  if(!racing.includes("const VERSION231='phase231-production-verifier-future-safe';"))issues.push('Phase 231 runtime marker missing');
  if(!racing.includes('window.__mwsF1RacingV231=VERSION231;'))issues.push('Phase 231 runtime export missing');
  const forbidden=[
    'phase=(20[4-9]|21[0-9]|22[0-9])',
    'phase=(20[5-9]|21[0-9]|22[0-9])',
    'phase=(20[6-9]|21[0-9]|22[0-9])',
    'phase=(20[7-9]|21[0-9]|22[0-9])',
    'phase=(20[8-9]|21[0-9]|22[0-9])',
    'phase=(209|21[0-9]|22[0-9])',
    'phase=(210|21[1-9]|22[0-9])'
  ];
  for(const token of forbidden)if(workflow.includes(token))issues.push('Legacy bounded live phase verifier remains: '+token);
  for(const min of [204,205,206,207,208,209,210]){
    if(!workflow.includes('Number(m[1])<'+min))issues.push('Numeric future-safe live phase verifier missing for '+min);
  }
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:231,name:'f1-production-verifier-future-safe',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase231F1ProductionVerifierFutureSafeAudit();
