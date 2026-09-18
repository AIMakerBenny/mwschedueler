import fs from 'node:fs';

export function runPhase59FriendLiveCardLayoutAudit(){
  const issues=[];
  const warnings=[];
  const friend=fs.readFileSync('assets/friend-finder-v120.js','utf8');

  if(!friend.includes('#friendFinderGridV5.mws-friend-live-grid-v120{grid-auto-rows:auto!important;align-items:start!important}'))issues.push('real Friend Finder grid does not allow variable-height LIVE cards');
  if(!friend.includes('#friendFinder .friend-finder-card-v5.mws-friend-live-card-v120{height:auto!important;min-height:0!important;max-height:none!important;overflow:hidden!important'))issues.push('real LIVE card layout override is missing');
  if(!friend.includes('grid-column:1/-1!important'))issues.push('LIVE thumbnail does not span both native Friend Finder card columns');
  if(!friend.includes("root.querySelectorAll('#friendFinderGridV5 .friend-finder-card-v5[data-id],.friend-finder-card-v5[data-id]')"))issues.push('Friend Finder cards are still resolved heuristically instead of by native card class');
  if(friend.includes('function cardFromStationButton('))issues.push('old station-button parent guessing still exists');

  const summary={phase:59,name:'friend-live-card-layout',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase59FriendLiveCardLayoutAudit();
