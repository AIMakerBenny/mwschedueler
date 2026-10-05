import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase296F1FutureSafeCacheAudit(){
 const issues=[],warnings=[];
 const a289=fs.readFileSync('scripts/run-phase289-f1-prerace-screen-compression-audit.mjs','utf8');
 const a292=fs.readFileSync('scripts/run-phase292-f1-integrated-desktop-qa-audit.mjs','utf8');
 const index=fs.readFileSync('index.html','utf8');
 for(const token of [
  "Number(jsMatch[1])<289",
  "Number(cssMatch[1])<289"
 ])if(!a289.includes(token))issues.push('Phase 296 Phase289 future-safe cache check missing: '+token);
 for(const token of [
  "Number(jsMatch[1])<292",
  "Number(cssMatch[1])<292"
 ])if(!a292.includes(token))issues.push('Phase 296 Phase292 future-safe cache check missing: '+token);
 if(a289.includes("js?phase=289')")||a292.includes("js?phase=292')"))issues.push('Phase 296 legacy exact cache pin still present');
 const final291=index.match(/assets\/f1-racing-r291-r295\.js\?phase=(\d+)/);
 if(!final291||Number(final291[1])<292)issues.push('Phase 296 final r291-r295 asset cache is stale');
 for(const file of ['scripts/run-phase289-f1-prerace-screen-compression-audit.mjs','scripts/run-phase292-f1-integrated-desktop-qa-audit.mjs']){
  const run=spawnSync(process.execPath,[file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:296,name:'f1-future-safe-cache-audit',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase296F1FutureSafeCacheAudit();
