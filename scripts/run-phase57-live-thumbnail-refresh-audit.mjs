import fs from 'node:fs';

export function runPhase57LiveThumbnailRefreshAudit(){
  const issues=[];
  const warnings=[];
  const friend=fs.readFileSync('assets/friend-finder-v120.js','utf8');

  if(!friend.includes('function liveThumbStamp()'))issues.push('thumbnail refresh stamp helper is missing');
  if(!friend.includes('img.dataset.thumbStamp=stamp'))issues.push('thumbnail refresh stamp is not stored on the image');
  if(!friend.includes('img.dataset.bno!==bno||img.dataset.thumbStamp!==thumbStamp'))issues.push('same-broadcast thumbnail refresh condition is missing');
  if(!friend.includes('setLiveImage(img,screen,bno,thumbStamp)'))issues.push('thumbnail refresh does not pass the current stamp');
  if(friend.includes("if(img&&img.dataset.bno!==bno){img.dataset.bno=bno;setLiveImage(img,screen,bno)}"))issues.push('old broadcast-number-only thumbnail refresh remains');

  const summary={phase:57,name:'live-thumbnail-refresh-stamp',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase57LiveThumbnailRefreshAudit();
