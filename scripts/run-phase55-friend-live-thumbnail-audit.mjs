import fs from 'node:fs';

export function runPhase55FriendLiveThumbnailAudit(){
  const issues=[];
  const warnings=[];
  const friend=fs.readFileSync('assets/friend-finder-v120.js','utf8');

  if(!friend.includes("screen=document.createElement('div');screen.className='mws-live-screen-v120'"))issues.push('LIVE thumbnail container is not created in Friend Finder');
  if(!friend.includes("screen.innerHTML='<img alt="현재 방송 화면""))issues.push('LIVE thumbnail image element is not attached to the card');
  if(!friend.includes("card.appendChild(screen)"))issues.push('LIVE thumbnail container is not inserted into the rendered card');
  if(!friend.includes("function activeFriendRoot()"))issues.push('active Friend Finder root guard is missing');
  if(!friend.includes("const ACTIVE_REFRESH_MS=30000"))issues.push('active Friend Finder LIVE refresh cadence is missing');
  if(!friend.includes("await refreshActiveFriendLive(true)"))issues.push('active Friend Finder does not periodically refresh LIVE state');
  if(!friend.includes("window.addEventListener('mawang:datachange'"))issues.push('Friend Finder does not redecorate after data rerenders');
  if(!friend.includes("document.addEventListener('visibilitychange'"))issues.push('Friend Finder LIVE refresh does not pause/resume with visibility');
  if(friend.includes('setInterval('))issues.push('Friend Finder uses an always-on interval instead of active-tab scheduling');

  const summary={phase:55,name:'friend-live-thumbnail-dom-refresh',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase55FriendLiveThumbnailAudit();
