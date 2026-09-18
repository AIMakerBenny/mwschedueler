import fs from 'node:fs';

export function runPhase65CloudSuccessorAudit(){
  const issues=[];
  const warnings=[];
  const oldCore=fs.readFileSync('assets/cloud-v1.1.js','utf8');
  const oldLoader=fs.readFileSync('assets/cloud-v1.1-loader.js','utf8');
  const nextCore=fs.readFileSync('assets/cloud-runtime-v130.js','utf8');
  const nextLoader=fs.readFileSync('assets/cloud-runtime-loader-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(!oldCore.includes('__mwsCloudV110Loaded'))issues.push('existing production cloud core was changed or removed during staging');
  if(!oldLoader.includes("/assets/cloud-v1.1.js?v=1.3.0-auth-decoupled"))issues.push('existing production login loader no longer points to its proven core');
  if(!entry.includes("url.pathname==='/assets/cloud-v1.1.js'"))issues.push('existing cloud-v1.1 Worker route was removed');
  if(!entry.includes("url.pathname==='/assets/cloud-v5.5.js'"))issues.push('existing cloud-v5.5 compatibility route was removed');
  if(!nextCore.includes('__mwsCloudRuntimeV130'))issues.push('staged cloud core marker is missing');
  if(nextCore.includes("document.body.dataset.buildVersion='Mawang Scheduler v.1.1.0'"))issues.push('staged cloud core still writes the old visible version');
  if(!nextLoader.includes('__mwsCloudRuntimeLoaderV130'))issues.push('staged cloud loader marker is missing');
  if(!nextLoader.includes("/assets/cloud-runtime-v130.js?v=1.3.0-stage65"))issues.push('staged cloud loader does not point to staged cloud core');
  if(!entry.includes("url.pathname==='/assets/cloud-runtime-v130.js'"))issues.push('Worker does not expose staged cloud core for production verification');

  const summary={phase:65,name:'cloud-successor-staging',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase65CloudSuccessorAudit();
