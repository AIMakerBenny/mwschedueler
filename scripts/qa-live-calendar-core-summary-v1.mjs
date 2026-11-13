/* Read-only aggregate diagnostics. Never prints individual user schedules, group IDs,
   titles, names, media, tokens, or credentials. Never performs any writes. */
const base=process.env.MWS_LIVE_BASE||'https://mawang-scheduler.majoku.workers.dev';
const read=async path=>{
  const response=await fetch(base+path,{headers:{accept:'application/json','cache-control':'no-cache'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(path+' HTTP '+response.status);
  return await response.json();
};
try{
  const [manifest,coreRow,eventsRow]=await Promise.all([
    read('/api/manifest'),read('/api/parts/core'),read('/api/parts/events')
  ]);
  const core=coreRow?.data&&typeof coreRow.data==='object'?coreRow.data:{};
  const groups=Array.isArray(core.contentGroups)?core.contentGroups:[];
  const gameLibrary=Array.isArray(core.gameLibrary)?core.gameLibrary:[];
  const events=Array.isArray(eventsRow?.data)?eventsRow.data:[];
  const ids=new Set(groups.map(x=>String(x?.id||'')).filter(Boolean));
  const linked=events.filter(e=>Boolean(String(e?.contentGroupId||'')));
  const missing=linked.filter(e=>!ids.has(String(e.contentGroupId||'')));
  const summary={
    available:true,
    coreVersion:Number(coreRow.version)||0,
    eventsVersion:Number(eventsRow.version)||0,
    manifestCoreVersion:Number(manifest?.parts?.core)||0,
    manifestEventsVersion:Number(manifest?.parts?.events)||0,
    coreContainsGroupField:Object.hasOwn(core,'contentGroups'),
    coreContainsGameLibraryField:Object.hasOwn(core,'gameLibrary'),
    contentGroupCount:groups.length,
    gameLibraryCount:gameLibrary.length,
    eventCount:events.length,
    linkedEventCount:linked.length,
    unresolvedEventGroupLinks:missing.length,
    unresolvedUniqueGroupIds:new Set(missing.map(e=>String(e.contentGroupId))).size
  };
  console.log('MWS_READ_ONLY_CORE_HEALTH',JSON.stringify(summary));
}catch(error){
  console.log('MWS_READ_ONLY_CORE_HEALTH',JSON.stringify({available:false,reason:String(error.message||error)}));
  process.exitCode=0;
}
