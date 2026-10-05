import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase251F1LiveTimingIdentityAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<251)issues.push('Phase 251 asset cache missing');

  for(const token of [
    "const VERSION251='phase251-live-timing-driver-identity';",
    'function timingAvatarV251(',
    'function bindTimingIdentityImagesV251(',
    'f1-racing-driver-color-v251',
    'f1-racing-timing-avatar-v251',
    'f1-racing-driver-copy-v251',
    'bindTimingIdentityImagesV251(list)',
    'function qaLiveTimingIdentityV251(){',
    'window.mwsF1QaLiveTimingIdentityV251=qaLiveTimingIdentityV251;',
    'window.__mwsF1RacingV251=VERSION251;'
  ])if(!racing.includes(token))issues.push('Phase 251 runtime missing: '+token);

  for(const token of [
    '.f1-racing-driver-color-v251',
    '.f1-racing-timing-avatar-v251',
    '.f1-racing-timing-avatar-v251 img',
    '.f1-racing-driver-copy-v251'
  ])if(!css.includes(token))issues.push('Phase 251 CSS missing: '+token);

  for(const token of [
    'mwsF1QaLiveTimingIdentityV251',
    'Phase 251 Live Timing identity QA failed',
    'Phase 251 timing avatar geometry invalid',
    'Phase 251 driver color strip geometry invalid'
  ])if(!live.includes(token))issues.push('Phase 251 Recovery H browser QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:251,name:'f1-live-timing-driver-identity',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase251F1LiveTimingIdentityAudit();
