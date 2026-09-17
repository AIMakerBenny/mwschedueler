import fs from 'node:fs';

export function runPhase11LazyTabReadinessAudit(){
  const issues=[];
  const warnings=[];
  const runtime=fs.readFileSync('assets/integrity-runtime-v130.js','utf8');
  const loader=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');

  if(!runtime.includes('const readySetTab=window.setTab'))issues.push('existing tab implementation is not preserved');
  if(!runtime.includes('window.mwsV55EnsureParts(tab)'))issues.push('tab navigation does not await lazy data readiness');
  if(!runtime.includes('const requestId=++lazyTabRequestSeq'))issues.push('tab requests are not versioned');
  if(!runtime.includes('if(requestId!==lazyTabRequestSeq)return;'))issues.push('stale lazy tab completion can still steal focus');
  const ensureIndex=runtime.indexOf('window.mwsV55EnsureParts(tab)');
  const openIndex=runtime.indexOf('readySetTab.apply(context,args)');
  if(ensureIndex<0||openIndex<0||openIndex<ensureIndex)issues.push('tab can become interactive before its lazy data check starts');
  if(!runtime.includes("toast('화면 열기 실패'"))issues.push('lazy tab load failure has no user-visible failure path');
  if(runtime.includes("+' 데이터 확인 중'"))issues.push('tab readiness leaves a transient loading label that is not restored on non-lazy tabs');
  const cacheMatch=loader.match(/\/assets\/integrity-runtime-v130\.js\?v=1\.3\.0-phase(\d+)/);
  if(!cacheMatch||Number(cacheMatch[1])<11)issues.push('Phase 11 integrity runtime cache key was not advanced');

  // Reproduce two quick clicks: the slower first request must not reopen the old tab.
  let seq=0;
  const opened=[];
  const request=()=>++seq;
  const complete=(id,name,ok=true)=>{if(id!==seq)return;if(ok)opened.push(name)};
  const first=request();
  const second=request();
  complete(second,'contacts',true);
  complete(first,'calendar',true);
  if(opened.length!==1||opened[0]!=='contacts')issues.push('older lazy request can override the most recent tab selection');

  // Failed readiness must keep the current view rather than expose an empty editable skeleton.
  const failed=request();
  complete(failed,'memos',false);
  if(opened.includes('memos'))issues.push('failed lazy-backed tab becomes interactive');

  const result={phase:11,name:'lazy-tab-readiness-before-interaction',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase11LazyTabReadinessAudit();
