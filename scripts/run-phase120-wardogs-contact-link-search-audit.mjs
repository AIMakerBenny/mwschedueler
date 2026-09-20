import fs from 'node:fs';

export function runPhase120WardogsContactLinkSearchAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const wardogs=fs.readFileSync('assets/wardogs-data-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!index.includes('assets/wardogs-data-v1.js?v=1.0.0-phase120')){
    issues.push('WARDOGS data runtime cache revision is not Phase 120');
  }

  const ownerFunctions=[
    ['mwsTextMatches',/function\s+mwsTextMatches\s*\(/g],
    ['contactMatches',/function\s+contactMatches\s*\(/g]
  ];
  for(const [name,re] of ownerFunctions){
    const count=(app.match(re)||[]).length;
    if(count!==1)issues.push('app-core '+name+' owner count is '+count+', expected 1');
  }
  for(const token of [
    "window.mwsTextMatches=mwsTextMatches;",
    "window.contactMatches=contactMatches;",
    "window.__mwsSearchOwnerV130='app-core-search71';",
    "return mwsKoreanInitials(text).includes(queryInitials);"
  ])if(!app.includes(token))issues.push('canonical search owner missing: '+token);

  for(const token of [
    "function contacts()",
    "function resolveContactLink(cardOrContactId)",
    "linked:Boolean(contact)",
    "orphaned:Boolean(contactId&&!contact)",
    "function contactMatcher()",
    "if(typeof window.contactMatches==='function')return window.contactMatches;",
    "if(typeof window.mwsTextMatches==='function')",
    "function searchContacts(query='',options={})",
    "includePending=options?.includePending===true",
    "contact.pendingSetup!==true",
    "matcher(contact,q)",
    "localeCompare(String(b.name||''),'ko-KR',{sensitivity:'base'})",
    "resolveContactLink,",
    "searchContacts",
    "window.__mwsWardogsContactSearchV120='app-core-search71-consumer';"
  ])if(!wardogs.includes(token))issues.push('WARDOGS contact linkage/search foundation missing: '+token);

  if(/function\s+mwsTextMatches\s*\(/.test(wardogs))issues.push('WARDOGS must not define a second mwsTextMatches owner');
  if(/function\s+contactMatches\s*\(/.test(wardogs))issues.push('WARDOGS must not define a second contactMatches owner');
  if(/window\.mwsTextMatches\s*=/.test(wardogs))issues.push('WARDOGS must not override window.mwsTextMatches');
  if(/window\.contactMatches\s*=/.test(wardogs))issues.push('WARDOGS must not override window.contactMatches');
  if(/filter\([^\n]*findContact|filter\([^\n]*linked/.test(wardogs))warnings.push('review WARDOGS filtering to ensure orphaned card records remain preserved');

  for(const token of [
    'run-phase120-wardogs-contact-link-search-audit.mjs',
    'assets/wardogs-data-v1.js?v=1.0.0-phase120',
    "window.__mwsSearchOwnerV130='app-core-search71';",
    "window.__mwsWardogsContactSearchV120='app-core-search71-consumer';",
    "if(typeof window.contactMatches==='function')return window.contactMatches;",
    "function resolveContactLink(cardOrContactId)",
    "function searchContacts(query='',options={})"
  ])if(!workflow.includes(token))issues.push('production Phase 120 verification missing: '+token);

  const summary={phase:120,name:'wardogs-contact-link-search',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase120WardogsContactLinkSearchAudit();
