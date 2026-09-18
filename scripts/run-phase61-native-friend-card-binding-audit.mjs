import fs from 'node:fs';
import zlib from 'node:zlib';

function decodedV5(){
  const source=fs.readFileSync('assets/online-v5-loader.js','utf8');
  const match=source.match(/const PAYLOAD='([^']+)'/);
  if(!match)throw new Error('online V5 payload missing');
  return zlib.gunzipSync(Buffer.from(match[1],'base64')).toString('utf8');
}

export function runPhase61NativeFriendCardBindingAudit(){
  const issues=[];
  const warnings=[];
  const friend=fs.readFileSync('assets/friend-finder-v120.js','utf8');
  const loader=fs.readFileSync('assets/cloud-v1.1-loader.js','utf8');
  const legacy=decodedV5();

  if(!legacy.includes("sec.id='friendFinder'"))issues.push('native Friend Finder section id changed');
  if(!legacy.includes('id="friendFinderGridV5" class="friend-finder-grid-v5"'))issues.push('native Friend Finder grid id/class changed');
  if(!legacy.includes('return `<article class="friend-finder-card-v5'))issues.push('native Friend Finder card markup changed');
  if(!legacy.includes('grid.innerHTML=arr.map(c=>'))issues.push('native Friend Finder full-grid rerender behavior changed');
  if(!friend.includes("document.getElementById('friendFinder')"))issues.push('thumbnail runtime does not bind the native Friend Finder section directly');
  if(!friend.includes("root.querySelectorAll('#friendFinderGridV5 .friend-finder-card-v5[data-id],.friend-finder-card-v5[data-id]')"))issues.push('thumbnail runtime does not bind native cards by class and data-id');
  if(!friend.includes('function baseLiveHint(card)'))issues.push('native LIVE card broadcast hint fallback is missing');
  if(!friend.includes("card.querySelector?.('[data-watch]')"))issues.push('native LIVE watch URL is not used as a broadcast hint');
  if(!friend.includes("friendGridObserver.observe(grid,{childList:true})"))issues.push('native full-grid rerenders are not observed');
  if(friend.includes('friendGridObserver.observe(grid,{childList:true,subtree:true})'))issues.push('Friend Finder observer is broader than necessary');
  if(!friend.includes('grid-column:1/-1!important'))issues.push('thumbnail does not span the native two-column card');
  if(friend.includes('function cardFromStationButton('))issues.push('old station-button parent guessing remains');
  if(!loader.includes('friend-finder-v120.js?v=1.3.0-phase61'))issues.push('Phase 61 Friend Finder cache revision is missing');

  const summary={phase:61,name:'native-friend-card-thumbnail-binding',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase61NativeFriendCardBindingAudit();
