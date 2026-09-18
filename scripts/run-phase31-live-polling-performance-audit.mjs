import fs from 'node:fs';

export function runPhase31LivePollingPerformanceAudit(){
  const issues=[];
  const warnings=[];
  const friend=fs.readFileSync('assets/friend-finder-v120.js','utf8');
  const contactFix=fs.readFileSync('assets/v130-live-contact-fix.js','utf8');
  const loader=fs.readFileSync('assets/cloud-v1.1-loader.js','utf8');

  if(!friend.includes('const ACTIVE_REFRESH_MS=30000'))issues.push('active Friend Finder LIVE refresh interval is missing');
  if(!friend.includes('function activeFriendRoot()'))issues.push('LIVE refresh is not limited to the active Friend Finder section');
  if(!friend.includes('if(document.hidden||!activeFriendRoot())return'))issues.push('LIVE refresh is not suspended in hidden browser tabs');
  if(!friend.includes('function stopActiveRefresh()'))issues.push('LIVE polling has no explicit stop path');
  if(!friend.includes("document.addEventListener('visibilitychange'"))issues.push('LIVE polling does not react to tab visibility');
  if(friend.includes('setInterval('))issues.push('LIVE refresh uses an always-on interval');
  if(friend.includes("new MutationObserver(()=>{if(friendRoot())"))issues.push('Friend Finder still relies on broad DOM mutation polling');
  if(contactFix.includes('/api/soop/live-batch'))issues.push('contact fix still performs duplicate LIVE batch requests');
  if(contactFix.includes('decorateLiveCard'))issues.push('contact fix still contains a duplicate LIVE card renderer');
  if(!loader.includes("friend-finder-v120.js?v=1.3.0"))issues.push('Friend Finder production loader is missing');
  if(!loader.includes('v130-live-contact-fix.js?v=1.3.0-perf31'))issues.push('contact station reliability fix loader is missing');

  const summary={phase:31,name:'live-active-tab-polling-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase31LivePollingPerformanceAudit();
