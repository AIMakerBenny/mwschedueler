import fs from 'node:fs';

export function runPhase58FriendThumbnailLoadAudit(){
  const issues=[];
  const warnings=[];
  const friend=fs.readFileSync('assets/friend-finder-v120.js','utf8');

  const matchIndex=friend.indexOf("let match=true;if(selected)");
  const screenIndex=friend.indexOf("let screen=card.querySelector('.mws-live-screen-v120')");
  if(matchIndex<0||screenIndex<0||matchIndex>screenIndex)issues.push('category visibility is not resolved before thumbnail work');
  if(!friend.includes("if(!live||!bno||!match){if(screen)screen.hidden=true;continue}"))issues.push('hidden or filtered cards can still perform thumbnail work');
  if(!friend.includes('loading="lazy"'))issues.push('LIVE thumbnails are not lazy loaded');
  if(!friend.includes('fetchpriority="low"'))issues.push('LIVE thumbnails are not low priority');
  if(!friend.includes("img.loading='lazy'"))issues.push('existing LIVE images are not normalized to lazy loading');
  if(!friend.includes("img.fetchPriority='low'"))issues.push('existing LIVE images are not normalized to low priority');
  if(friend.includes('loading="eager"'))issues.push('eager LIVE thumbnail loading remains');
  if(friend.includes('fetchpriority="high"'))issues.push('high-priority LIVE thumbnail loading remains');

  const summary={phase:58,name:'friend-thumbnail-load-budget',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase58FriendThumbnailLoadAudit();
