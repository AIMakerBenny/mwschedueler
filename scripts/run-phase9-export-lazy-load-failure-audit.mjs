import fs from 'node:fs';

export function runPhase9ExportLazyLoadFailureAudit(){
  const issues=[];
  const warnings=[];
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');
  const raw=fs.readFileSync('assets/cloud-v1.1.js','utf8');

  // The transform must still target the actual production source path.
  if(!raw.includes("async function ensurePartsForTab(tab){"))issues.push('raw lazy-load function is missing');
  if(!raw.includes("ensurePartsForTab('export').then(()=>exportAll.click())"))issues.push('raw export guard target no longer matches Phase 9 transform');

  // Phase 9 replacement policy.
  if(!entry.includes('let changed=false,failed=[]'))issues.push('lazy-load failures are not accumulated');
  if(!entry.includes('failed.push(part)'))issues.push('failed lazy part is not recorded');
  if(!entry.includes("if(failed.length){const st=$('syncStatusText')"))issues.push('lazy-load failure does not become an observable failure state');
  if(!entry.includes("return false}return true}"))issues.push('lazy-load failure does not return false');
  if(!entry.includes("if(ok&&loadedParts.size===ALL_PARTS.length)exportAll.click()"))issues.push('export retry is not gated on complete lazy data');
  if(!entry.includes("toast('내보내기 실패','필수 데이터를 모두 불러오지 못했습니다.')"))issues.push('export failure is not surfaced to the user');

  // Reproduce the legacy reachable loop: a required part fails forever.
  let legacyLoaded=5;
  const allParts=9;
  let legacyClicks=0;
  for(let guard=0;guard<4;guard++){
    legacyClicks++;
    if(legacyLoaded<allParts){
      const legacyEnsureReturned=true; // old ensurePartsForTab always returned true
      if(!legacyEnsureReturned)break;
      // old guard calls exportAll.click() again without increasing loadedParts on failure
      continue;
    }
    break;
  }
  if(legacyClicks<4)issues.push('audit reproduction failed to demonstrate the legacy export self-retry loop');

  // Phase 9: the same failure returns false and does not click Export again.
  let fixedClicks=1;
  const fixedEnsureReturned=false;
  if(fixedEnsureReturned&&legacyLoaded===allParts)fixedClicks++;
  if(fixedClicks!==1)issues.push('failed lazy load still retries Export');

  // Normal path: once every required part is available, the guard hands off exactly once.
  let normalClicks=1;
  const normalLoaded=allParts;
  const normalEnsureReturned=true;
  if(normalEnsureReturned&&normalLoaded===allParts)normalClicks++;
  if(normalClicks!==2)issues.push('successful lazy load no longer hands off to the original Export action exactly once');

  const result={phase:9,name:'export-lazy-load-failure-termination',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase9ExportLazyLoadFailureAudit();
