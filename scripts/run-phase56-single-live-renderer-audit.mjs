import fs from 'node:fs';

export function runPhase56SingleLiveRendererAudit(){
  const issues=[];
  const warnings=[];
  const friend=fs.readFileSync('assets/friend-finder-v120.js','utf8');
  const contactFix=fs.readFileSync('assets/v130-live-contact-fix.js','utf8');

  if(!friend.includes('/api/soop/live-batch'))issues.push('Friend Finder is no longer the LIVE batch owner');
  if(!friend.includes("screen=document.createElement('div');screen.className='mws-live-screen-v120'"))issues.push('Friend Finder no longer owns LIVE card rendering');
  if(!friend.includes('function scheduleActiveRefresh'))issues.push('Friend Finder no longer owns active LIVE refresh scheduling');
  for(const token of ['/api/soop/live-batch','decorateLiveCard','scheduleLive','LIVE_INTERVAL','rawFetch']){
    if(contactFix.includes(token))issues.push(`contact fix still contains duplicate LIVE responsibility: ${token}`);
  }
  if(!contactFix.includes('window.visitContactStationV55=visitStation'))issues.push('contact station visit reliability fix was lost');
  if(!contactFix.includes('function normalizeHttp(raw)'))issues.push('contact station URL normalization was lost');

  const summary={phase:56,name:'single-live-renderer-owner',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase56SingleLiveRendererAudit();
