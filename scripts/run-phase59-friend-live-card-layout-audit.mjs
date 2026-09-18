import fs from 'node:fs';

export function runPhase59FriendLiveCardLayoutAudit(){
  const issues=[];
  const warnings=[];
  const friend=fs.readFileSync('assets/friend-finder-v120.js','utf8');

  if(!friend.includes('.mws-friend-live-grid-v120{grid-auto-rows:auto!important;align-items:start!important}'))issues.push('Friend Finder live grid does not allow auto-height rows');
  if(!friend.includes('.mws-friend-live-card-v120{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important'))issues.push('LIVE card still risks clipping the thumbnail');
  if(!friend.includes("card.parentElement?.classList.add('mws-friend-live-grid-v120')"))issues.push('Friend Finder grid is not marked for live auto-height');
  if(!friend.includes("card.classList.toggle('mws-friend-live-card-v120',showLive)"))issues.push('LIVE cards are not marked for expansion');
  if(!friend.includes("const bno=liveBroadNo(entry),title=liveTitle(entry),showLive=Boolean(live&&bno&&match)"))issues.push('LIVE card expansion state is not tied to visible live entries');

  const summary={phase:59,name:'friend-live-card-layout',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase59FriendLiveCardLayoutAudit();
