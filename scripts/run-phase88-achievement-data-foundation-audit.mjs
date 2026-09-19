import fs from 'node:fs';

export function runPhase88AchievementDataFoundationAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const media=fs.readFileSync('assets/achievement-media-v1621.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  if(!core.includes('achievementCards:[]'))issues.push('default data does not include achievementCards');
  if(!core.includes('if(!Array.isArray(data.achievementCards))data.achievementCards=[];'))issues.push('achievementCards normalization guard is missing');
  for(const token of ['gameName:String(card.gameName||\'\').trim()','contentName:String(card.contentName||\'\').trim()','description:String(card.description||\'\')','frontImageId:String(card.frontImageId||\'\')','backImageId:String(card.backImageId||\'\')']){
    if(!core.includes(token))issues.push('achievement card field normalization missing: '+token);
  }
  if(!core.includes(".sort((a,b)=>a.order-b.order).map((card,order)=>({...card,order}))"))issues.push('achievement card ordering is not normalized');
  if(!core.includes('achievementCards:(payload.achievementCards||[]).length'))issues.push('full backup metadata does not count achievement cards');

  if(!media.includes("const DB_NAME='mws_achievement_media_v1';"))issues.push('achievement media database name is missing');
  if(!media.includes("const STORE='media';"))issues.push('achievement media object store is missing');
  if(!media.includes("createObjectStore(STORE,{keyPath:'id'})"))issues.push('achievement media store is not keyed by id');
  if(!media.includes("if(!(blob instanceof Blob))throw new TypeError('Achievement media must be a Blob')"))issues.push('achievement media runtime does not enforce Blob storage');
  for(const token of ['put,','get,','getBlob,','has,','remove,','listIds']){
    if(!media.includes(token))issues.push('achievement media API missing: '+token);
  }
  if(/localStorage\./.test(media))issues.push('achievement media runtime must not store image bytes in localStorage');
  if(/toDataURL\(|readAsDataURL\(/.test(media))issues.push('achievement media runtime must not Base64-encode stored card images');

  if(!/load\('achievement-media-v1621','\/assets\/achievement-media-v1621\.js\?v=1\.6\.21-phase(?:88|[1-9][0-9]{2,})(?:-[^']+)?','__mwsAchievementMediaRuntimeV1621'\)/.test(post))issues.push('achievement media runtime is not loaded after login');
  for(const token of [
    "function cloudUrl(id){return '/media/achievement/'",
    "function cloudApiUrl(id){return '/api/achievement-media/'",
    "async function fetchCloudBlob(id)",
    "async function uploadCloud(id,blob)",
    "async function syncReferencedToCloud()",
    "setTimeout(()=>{syncReferencedToCloud()",
    "if(local?.blob instanceof Blob)return local;",
    "const blob=await fetchCloudBlob(id);"
  ]){
    if(!media.includes(token))issues.push('achievement cloud media sync/fallback missing: '+token);
  }
  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:8[8-9]|9[0-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search88');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:8[8-9]|9[0-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than phase88');

  const summary={phase:88,name:'achievement-data-foundation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase88AchievementDataFoundationAudit();
