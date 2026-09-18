import fs from 'node:fs';

export function runPhase76SelectorWrapperDedupAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const perfBase=fs.readFileSync('assets/perf-runtime-base.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(/getLastCollab=id=>/.test(perfBase))issues.push('perf-runtime-base still overrides getLastCollab');
  if(/upcomingEventsForContact=id=>/.test(perfBase))issues.push('perf-runtime-base still overrides upcomingEventsForContact');
  if(perfBase.includes('optimizedRenderContacts')&&!perfBase.includes('const last=latest.get(c.id)||null,upcoming=upMap.get(c.id)||[]'))issues.push('optimized contact renderer lost its local cached maps');
  if(!app.includes('function getLastCollab(contactId)'))issues.push('canonical getLastCollab is missing');
  if(!app.includes('function upcomingEventsForContact(contactId)'))issues.push('canonical upcomingEventsForContact is missing');
  if(!perf.includes('assets/perf-runtime-base.js?v=1.4.0-phase'))issues.push('perf runtime no longer loads a phase-tagged perf base');
  if(!post.includes('/assets/perf-runtime.js?v=1.4.0-phase'))issues.push('post-login no longer loads a phase-tagged perf runtime');
  if(!index.includes('assets/perf-runtime.js?v=1.4.0-phase'))issues.push('index no longer loads a phase-tagged perf runtime');
  if(!entry.includes('post-login-runtime-v130.js?v=1.4.0-phase'))issues.push('Worker no longer injects a phase-tagged post-login runtime');

  const history=[
    {date:'2026-09-18',participants:['a','b']},
    {date:'2026-09-17',participants:['b','c']},
    {date:'2026-09-16',participants:['a']}
  ];
  const originalLast=id=>history.find(row=>(row.participants||[]).includes(id))||null;
  const map=new Map();for(const row of history)for(const id of row.participants||[])if(!map.has(id))map.set(id,row);
  const cachedLast=id=>map.get(id)||null;
  for(const id of ['a','b','c','z'])if(originalLast(id)!==cachedLast(id))issues.push('getLastCollab equivalence test failed for '+id);

  const upcoming=[
    {id:'1',participants:['a','b']},
    {id:'2',participants:['b']},
    {id:'3',participants:['a']},
    {id:'4',participants:['a']},
    {id:'5',participants:['a']},
    {id:'6',participants:['a']},
    {id:'7',participants:['a']},
    {id:'8',participants:['a']},
    {id:'9',participants:['a']}
  ];
  const originalUpcoming=id=>upcoming.filter(row=>(row.participants||[]).includes(id)).slice(0,8);
  const upMap=new Map();for(const row of upcoming)for(const id of row.participants||[]){if(!upMap.has(id))upMap.set(id,[]);const arr=upMap.get(id);if(arr.length<8)arr.push(row)}
  const cachedUpcoming=id=>upMap.get(id)||[];
  for(const id of ['a','b','z']){
    const a=JSON.stringify(originalUpcoming(id)),b=JSON.stringify(cachedUpcoming(id));
    if(a!==b)issues.push('upcomingEventsForContact equivalence test failed for '+id);
  }

  const summary={phase:76,name:'selector-wrapper-dedup',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase76SelectorWrapperDedupAudit();
