import fs from 'node:fs';

export function runPhase62NestedLivePayloadAudit(){
  const issues=[];
  const warnings=[];
  const backend=fs.readFileSync('src/cf-v120-friend.js','utf8');
  const friend=fs.readFileSync('assets/friend-finder-v120.js','utf8');
  const loader=fs.readFileSync('assets/cloud-v1.1-loader.js','utf8');

  if(!backend.includes('function normalizeLivePayload(root)'))issues.push('Worker nested LIVE payload normalizer is missing');
  if(!backend.includes("firstLiveScalar(value,['broadNo','broad_no','bno'])"))issues.push('Worker does not search nested broadcast number variants');
  if(!backend.includes('const row=attachNormalizedLive(await fetchText(target))'))issues.push('Worker batch rows are not enriched with normalized live metadata');
  if(!backend.includes('return live?{...row,live}:row'))issues.push('Worker does not expose normalized live metadata as row.live');

  if(!friend.includes('function normalizeLivePayload(root)'))issues.push('Friend Finder nested LIVE fallback normalizer is missing');
  if(!friend.includes("const live=row?.live&&typeof row.live==='object'?row.live:normalizeLivePayload(parsed)"))issues.push('Friend Finder does not prefer row.live normalized metadata');
  if(!friend.includes('liveByUserId.set(id,{at:Date.now(),status:Number(row.status)||0,data:live,url:row.url})'))issues.push('Friend Finder does not store normalized live metadata');
  if(!friend.includes("const hint=baseLiveHint(card),bno=liveBroadNo(entry)||hint.bno"))issues.push('thumbnail visibility is not driven by normalized broadcast number');
  if(!loader.includes('friend-finder-v120.js?v=1.3.0-phase62'))issues.push('Phase 62 Friend Finder cache revision is missing');

  const summary={phase:62,name:'nested-live-payload-normalization',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase62NestedLivePayloadAudit();
