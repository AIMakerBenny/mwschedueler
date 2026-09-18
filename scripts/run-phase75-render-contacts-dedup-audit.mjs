import fs from 'node:fs';

export function runPhase75RenderContactsDedupAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const declarations=(app.match(/function\s+renderContacts\s*\(\)\s*\{/g)||[]).length;
  if(declarations!==1)issues.push('app-core must contain exactly one canonical renderContacts declaration, found '+declarations);
  if(!app.includes('window.renderContacts=renderContacts;'))issues.push('canonical renderContacts is not exported');
  if(!app.includes("if(data.selfContactId)arr=[...arr].sort"))issues.push('canonical renderContacts lost self-contact ordering');
  if(!app.includes('contactUpcomingPopover(c)'))issues.push('canonical renderContacts lost upcoming-content popover');
  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:7[5-9]|[89][0-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search75');
  const summary={phase:75,name:'dead-render-contacts-removal',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase75RenderContactsDedupAudit();
