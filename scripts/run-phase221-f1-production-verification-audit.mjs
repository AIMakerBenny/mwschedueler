import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase221F1ProductionVerificationAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<221)issues.push('Phase 221 asset cache missing');
  for(const token of [
    "const VERSION221='phase221-production-verification-compatibility';",
    'window.__mwsF1RacingV221=VERSION221;'
  ])if(!racing.includes(token))issues.push('Phase 221 runtime marker missing: '+token);
  for(const token of [
    "grep -Fq '<span>격차</span><span>앞차</span><span>타이어</span>' /tmp/index.html",
    "echo '[phase191] F1 official position gap and interval'"
  ])if(!workflow.includes(token))issues.push('Phase 221 live verification compatibility missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:221,name:'f1-production-verification-compatibility',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase221F1ProductionVerificationAudit();
