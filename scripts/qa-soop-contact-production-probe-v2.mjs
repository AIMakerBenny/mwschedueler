// Read-only SOOP diagnostic of real production API for one public station ID.
// Does not authenticate, query contact lists, or print personal data.
const base='https://mawang-scheduler.majoku.workers.dev';
for(const id of ['kwakchunshik','larothy']){
  const t=Date.now();
  try{
    const res=await fetch(base+'/api/soop/contact-station?id='+id+'&diagnostics=1',{headers:{accept:'application/json','cache-control':'no-cache'},signal:AbortSignal.timeout(45000)});
    const body=await res.json().catch(()=>null);
    console.log('SOOP_PRODUCTION_PROBE',JSON.stringify({id,status:res.status,elapsedMs:Date.now()-t,ok:body?.ok===true,nicknameAvailable:Boolean(body?.name),hasProfile:body?.hasProfile??null,attempts:body?.upstreamAttempts||null}));
  }catch(e){console.log('SOOP_PRODUCTION_PROBE',JSON.stringify({id,status:'network-error',elapsedMs:Date.now()-t,errorType:e?.name||'unknown'}));}
}
