import fs from 'node:fs';
import zlib from 'node:zlib';

export function runPhase74RuntimeOwnershipAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const tools=fs.readFileSync('assets/tools.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const perfBase=fs.readFileSync('assets/perf-runtime-base.js','utf8');
  const planner=fs.readFileSync('assets/content-planner-host.js','utf8');
  const online=fs.readFileSync('assets/online-v5-loader.js','utf8');
  const cloud=fs.readFileSync('assets/cloud-v1.1.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(tools.includes("const CHO='"))issues.push('tools still owns a duplicate Korean-initial table');
  if(/function\s+initials\s*\(/.test(tools))issues.push('tools still owns a duplicate initials extractor');
  if(!tools.includes("typeof window.mwsTextMatches==='function'"))issues.push('tools does not delegate person search to shared mwsTextMatches');
  if(!tools.includes('이름 또는 초성 검색'))issues.push('tools search placeholder does not advertise shared initial search');
  if(tools.includes("setAttribute('data-build-version'")||tools.includes('#mwsBuildVersion'))issues.push('tools still owns visible app version output');
  if(perf.includes("setAttribute('data-build-version'")||perf.includes("label.textContent='Mawang Scheduler"))issues.push('perf runtime still owns visible app version output');
  if(planner.includes("const BUILD='Mawang Scheduler v1.0'"))issues.push('planner still carries obsolete app-version state');
  if(perfBase.includes('contactMatches=function'))issues.push('perf-base still owns contact matching');
  if(!online.includes('run(safeFeatures)'))issues.push('online legacy payload bypasses the sanitizer');

  const payload=online.match(/const PAYLOAD='([^']+)'/);
  if(payload){
    try{
      const decoded=zlib.gunzipSync(Buffer.from(payload[1],'base64')).toString('utf8');
      if(/contactMatches=function\(c,q\)/.test(decoded))warnings.push('online V5 compressed payload still contains a legacy contact matcher, but the live loader strips it before execution');
    }catch(error){issues.push('cannot inspect online V5 payload: '+String(error?.message||error))}
  }else issues.push('online V5 payload missing');

  if(/renderContacts=optimizedRenderContacts/.test(perfBase))issues.push('perf runtime still overrides canonical renderContacts');
  if((app.match(/function\s+renderContacts\s*\(/g)||[]).length>1)warnings.push('app-core contains multiple renderContacts declarations; inspect execution order before any deletion');
  if(cloud.includes("versionLabel.textContent='Mawang Scheduler v.1.1.0'")){
    if(entry.includes("window.mwsApplyAppVersionV120?.()"))warnings.push('protected cloud core still contains legacy version text statically, but Worker normalization neutralizes it at runtime; do not delete the cloud core');
    else issues.push('protected cloud core legacy version writer is not neutralized by Worker normalization');
  }

  const summary={phase:74,name:'runtime-ownership-and-safe-dedup',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase74RuntimeOwnershipAudit();
