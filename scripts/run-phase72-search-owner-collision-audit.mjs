import fs from 'node:fs';
import zlib from 'node:zlib';

export function runPhase72SearchOwnerCollisionAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime-base.js','utf8');
  const online=fs.readFileSync('assets/online-v5-loader.js','utf8');
  const perfLoader=fs.readFileSync('assets/perf-runtime.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(!app.includes("window.__mwsSearchOwnerV130='app-core-search71'"))issues.push('app-core is not marked as the authoritative search owner');
  if(perf.includes('contactMatches=function'))issues.push('perf-runtime-base still overrides contactMatches');
  if(perf.includes('if(e?.isComposing)return'))issues.push('perf-runtime-base still suppresses search during IME composition');
  if(!perf.includes('e?.isComposing?0:80'))issues.push('perf-runtime-base has no IME-composition search scheduling');
  for(const marker of ['legacyContactMatcher','safeFeatures=features.replace','run(safeFeatures)','sharedSearchOwner']){
    if(!online.includes(marker))issues.push('online-v5-loader legacy matcher guard missing: '+marker);
  }
  if(online.includes('run(features);'))issues.push('online-v5-loader still executes unpatched legacy features directly');

  const payload=online.match(/const PAYLOAD='([^']+)'/);
  if(!payload)issues.push('online V5 payload missing');
  else{
    try{
      const decoded=zlib.gunzipSync(Buffer.from(payload[1],'base64')).toString('utf8');
      const legacy=/window\.mwsKoreanInitials=koreanInitials;\s*contactMatches=function\(c,q\)\{[\s\S]*?\};\s*window\.contactMatches=contactMatches;/;
      if(!legacy.test(decoded))warnings.push('legacy payload matcher no longer exists; sanitizer can be removed in a later cleanup');
      const sanitized=decoded.replace(legacy,'window.mwsKoreanInitials=window.mwsKoreanInitials||koreanInitials;');
      if(/contactMatches=function\(c,q\)/.test(sanitized)||/window\.contactMatches=contactMatches/.test(sanitized))issues.push('legacy payload matcher survives runtime sanitization');
    }catch(error){issues.push('online V5 payload collision test failed: '+String(error?.message||error))}
  }

  if(!perfLoader.includes('assets/perf-runtime-base.js?v=1.3.0-search73'))issues.push('perf base cache-bust is not search73');
  if(!post.includes('/assets/perf-runtime.js?v='))issues.push('post-login runtime no longer loads the perf runtime');
  if(post.includes('/assets/perf-runtime.js?v=1.3.0-post-login'))issues.push('post-login runtime regressed to the pre-search-owner perf cache key');
  if(!index.includes('assets/online-v5-loader.js?v=1.3.0-search73'))issues.push('online V5 loader cache-bust is not search73');
  if(!entry.includes('post-login-runtime-v130.js?v='))issues.push('Worker no longer injects the post-login runtime');

  const summary={phase:72,name:'single-search-owner',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase72SearchOwnerCollisionAudit();
