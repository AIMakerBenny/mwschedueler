import fs from 'node:fs';

export function runPhase106ContactImmediateCloudCommitAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "async function persistContactSaveAndWait(reason,contactId,{requireManagedImage=false}={})",
    "const localSaved=saveData(reason);",
    "const adminMode=document.body.dataset.mwsMode==='admin';",
    "if(typeof window.mwsV55SaveNow!=='function')return {ok:false,stage:'bridge'};",
    "cloudSaved=await window.mwsV55SaveNow();",
    "if(!String(stored?.image||'').startsWith('/media/contact/'))",
    "function contactSaveFailureMessage(result)",
    "새로고침하지 말고 다시 저장해 주세요"
  ]){
    if(!core.includes(token))issues.push('immediate contact cloud commit guard missing: '+token);
  }

  const start=core.indexOf("document.getElementById('saveContactBtn').onclick=async()=>{");
  const end=core.indexOf("\ndocument.getElementById('deleteContactBtn').onclick=",start);
  const body=start>=0&&end>start?core.slice(start,end):'';
  if(!body)issues.push('contact save handler not found');
  if(body){
    for(const token of [
      "await persistContactSaveAndWait('연락처 저장',savedContactId,{requireManagedImage:Boolean(file)})",
      "await persistContactSaveAndWait('연락처 중복 교체',sameName.id,{requireManagedImage:Boolean(file)})"
    ])if(!body.includes(token))issues.push('contact save path does not await cloud commit: '+token);

    const normalAwait=body.indexOf("await persistContactSaveAndWait('연락처 저장'");
    const normalClose=body.lastIndexOf("document.getElementById('contactModal').classList.remove('open');");
    if(normalAwait<0||normalClose<0||normalClose<normalAwait)issues.push('normal contact modal closes before cloud commit');

    const requireManaged=body.indexOf("{requireManagedImage:Boolean(file)}");
    if(requireManaged<0)issues.push('new profile upload is not required to normalize to managed media');
  }

  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:109|1[1-9][0-9]|[2-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search109');
  for(const token of [
    'persistContactSaveAndWait',
    'contactSaveFailureMessage',
    'app-core.js?v=1.3.0-search'
  ])if(!workflow.includes(token))issues.push('production verification missing Phase 106 token: '+token);

  const summary={phase:106,name:'contact-immediate-cloud-commit',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase106ContactImmediateCloudCommitAudit();
