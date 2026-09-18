import fs from 'node:fs';

export function runPhase80CanonicalContactRenderPerfAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(!app.includes('const mwsUpcomingByContact=new Map();'))issues.push('canonical renderContacts does not pre-index upcoming events');
  if(!app.includes('upcoming=mwsUpcomingByContact.get(c.id)||[]'))issues.push('canonical renderContacts still lacks O(1) upcoming lookup');
  if(app.includes('mwsUpcomingAll.filter(e=>!e.restDay&&(e.participants||[]).includes(c.id)).slice(0,8)'))issues.push('canonical renderContacts still filters all upcoming events per contact');
  if(!app.includes('loading="lazy" decoding="async"'))issues.push('canonical contact avatar lost async decode optimization');
  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:8[0-9]|9[0-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search80');

  const upcoming=[
    {id:'1',restDay:false,participants:['a','b']},
    {id:'2',restDay:false,participants:['b']},
    {id:'3',restDay:true,participants:['a']},
    {id:'4',restDay:false,participants:['a']}
  ];
  const original=id=>upcoming.filter(e=>!e.restDay&&(e.participants||[]).includes(id)).slice(0,8).map(e=>e.id);
  const map=new Map();
  for(const row of upcoming){
    if(row.restDay)continue;
    for(const id of row.participants||[]){
      if(!map.has(id))map.set(id,[]);
      const list=map.get(id);
      if(list.length<8)list.push(row);
    }
  }
  for(const id of ['a','b','z']){
    const expected=JSON.stringify(original(id));
    const actual=JSON.stringify((map.get(id)||[]).map(e=>e.id));
    if(expected!==actual)issues.push('upcoming map equivalence failed for '+id);
  }

  const summary={phase:80,name:'canonical-contact-render-performance-parity',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase80CanonicalContactRenderPerfAudit();
