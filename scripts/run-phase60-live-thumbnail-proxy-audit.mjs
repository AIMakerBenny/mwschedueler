import fs from 'node:fs';

export function runPhase60LiveThumbnailProxyAudit(){
  const issues=[];
  const warnings=[];
  const friend=fs.readFileSync('assets/friend-finder-v120.js','utf8');
  const backend=fs.readFileSync('src/cf-v120-friend.js','utf8');
  const loader=fs.readFileSync('assets/cloud-v1.1-loader.js','utf8');

  if(!friend.includes('/api/soop/live-thumb?bno=${id}&v=${stamp}'))issues.push('Friend Finder does not prefer the same-origin thumbnail proxy');
  if(!backend.includes("const THUMB_HOSTS=['liveimg.sooplive.com','liveimg.sooplive.co.kr']"))issues.push('Worker thumbnail CDN fallback hosts are missing');
  if(!backend.includes('function validBroadcastNo(raw)'))issues.push('thumbnail proxy broadcast number validation is missing');
  if(!backend.includes('async function fetchLiveThumb(target)'))issues.push('thumbnail proxy upstream fetch helper is missing');
  if(!backend.includes('async function handleLiveThumb(request)'))issues.push('thumbnail proxy handler is missing');
  if(!backend.includes("type.startsWith('image/')"))issues.push('thumbnail proxy does not validate image content type');
  if(!backend.includes("'cache-control':'public, max-age=5, s-maxage=10'"))issues.push('thumbnail proxy short cache policy is missing');
  if(!backend.includes("url.pathname==='/api/soop/live-thumb'&&request.method==='GET'"))issues.push('thumbnail proxy route is not wired');
  if(!loader.includes("friend-finder-v120.js?v=1.3.0-phase60"))issues.push('Phase 60 Friend Finder cache-bust revision is missing');

  const summary={phase:60,name:'same-origin-live-thumbnail-proxy',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase60LiveThumbnailProxyAudit();
