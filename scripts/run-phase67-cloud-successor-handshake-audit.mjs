import fs from 'node:fs';

export function runPhase67CloudSuccessorHandshakeAudit(){
  const issues=[];
  const warnings=[];
  const oldCore=fs.readFileSync('assets/cloud-v1.1.js','utf8');
  const oldLoader=fs.readFileSync('assets/cloud-v1.1-loader.js','utf8');
  const nextCore=fs.readFileSync('assets/cloud-runtime-v130.js','utf8');
  const nextLoader=fs.readFileSync('assets/cloud-runtime-loader-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(!oldCore.includes('__mwsCloudV110Loaded'))issues.push('proven cloud core is no longer present');
  if(!oldLoader.includes("/assets/cloud-v1.1.js?v=1.3.0-auth-decoupled"))issues.push('proven login loader was changed during successor hardening');
  if(!entry.includes("url.pathname==='/assets/cloud-v5.5.js'"))issues.push('cloud-v5.5 compatibility route was removed');
  if(!nextCore.includes('window.__mwsCloudRuntimeV130Ready=false'))issues.push('staged cloud core does not begin unready');
  if(!nextCore.includes('window.__mwsCloudRuntimeV130Ready=true'))issues.push('staged cloud core never publishes readiness');
  if(!nextCore.includes('window.__mwsCloudV110Loaded=true'))issues.push('staged cloud core does not claim compatibility after startup');
  if(!nextLoader.includes("/assets/cloud-runtime-v130.js?v=1.3.0-stage67"))issues.push('staged loader cache-bust was not advanced');
  if(!nextLoader.includes("if(!window.__mwsCloudRuntimeV130Ready)throw new Error('cloud-runtime-v130 readiness handshake failed')"))issues.push('staged loader trusts download completion without runtime readiness');
  const readyPos=nextCore.indexOf('window.__mwsCloudRuntimeV130Ready=true');
  const initPos=nextCore.indexOf('const initPromise=init();');
  if(readyPos<0||initPos<0||readyPos<initPos)issues.push('staged cloud runtime announces readiness before init starts');

  const summary={phase:67,name:'cloud-successor-handshake',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase67CloudSuccessorHandshakeAudit();
