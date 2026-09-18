import fs from 'node:fs';

export function runPhase70CloudRuntimeFinalizationAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const online=fs.readFileSync('assets/online-v5-loader.js','utf8');
  const loader=fs.readFileSync('assets/cloud-runtime-loader-v130.js','utf8');
  const cloud=fs.readFileSync('assets/cloud-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const path of ['assets/cloud-v5.5.js','assets/cloud-v1.1.js','assets/cloud-v1.1-loader.js']){
    if(fs.existsSync(path))issues.push(`legacy cloud file still exists: ${path}`);
  }
  if(!online.includes('cloud-runtime-loader-v130.js?v=1.3.0-final70'))issues.push('online loader does not use finalized cloud loader');
  if(online.includes('cloud-v5.5.js')||online.includes('mws:v55-features-ready'))issues.push('online loader still references the v5.5 cloud path');
  if(!loader.includes('__mwsCloudRuntimeLoaderV130'))issues.push('final cloud loader marker is missing');
  if(!loader.includes('/assets/cloud-runtime-v130.js?v=1.3.0-final70'))issues.push('final cloud loader does not load final cloud core');
  if(!cloud.includes('__mwsCloudRuntimeV130'))issues.push('final cloud runtime marker is missing');
  if(!cloud.includes("const CACHE_DB='mawang_data_v130'"))issues.push('final cloud runtime is not on the v1.3.0 cache database');
  if(/Mawang Scheduler v\.1\.1\.0|__mwsCloudV110Loaded/.test(cloud))issues.push('legacy v1.1 cloud identity remains');
  if(index.includes('test-v5.5.js')||index.includes('test-v5.6.js'))issues.push('source HTML still references deleted test runtimes');
  if(index.includes('<script src="assets/perf-runtime.js"')||index.includes('<script src="assets/device-ui.js'))issues.push('source HTML still preloads post-login runtime modules');
  if(!index.includes('online-v5-loader.js?v=1.3.0-final70')||!index.includes('post-login-runtime-v130.js?v=1.3.0-auth-isolated'))issues.push('source HTML is missing finalized runtime entrypoints');
  if(!entry.includes("url.pathname==='/assets/cloud-runtime-v130.js'"))issues.push('Worker does not normalize the finalized cloud runtime');
  if(entry.includes("url.pathname==='/assets/cloud-v5.5.js'")||entry.includes("'/assets/cloud-v1.1.js'"))issues.push('Worker still exposes a legacy cloud route');

  const summary={phase:70,name:'cloud-runtime-finalization',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase70CloudRuntimeFinalizationAudit();
