import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';

function read(path){return fs.readFileSync(path,'utf8')}

function unpackLegacyFeatures(loader,issues){
  const match=loader.match(/const PAYLOAD='([^']+)'/);
  if(!match){issues.push('online V5 compressed payload is missing');return ''}
  try{
    const all=gunzipSync(Buffer.from(match[1],'base64')).toString('utf8');
    const head=all.split('\n/*__MWS_SPLIT_FEATURES_CSS__*/\n')[0];
    const parts=head.split('\n/*__MWS_SPLIT_CLOUD_FEATURES__*/\n');
    if(parts.length!==2){issues.push('online V5 compressed feature split is invalid');return ''}
    return parts[1];
  }catch(error){
    issues.push('online V5 compressed payload could not be decoded: '+String(error?.message||error));
    return '';
  }
}

export function runPhase114ContactImageEndToEndOwnershipAudit(){
  const issues=[];
  const warnings=[];
  const app=read('assets/app-core.js');
  const perf=read('assets/perf-runtime.js');
  const maintenance=read('assets/maintenance-runtime-v130.js');
  const postLogin=read('assets/post-login-runtime-v130.js');
  const contactRuntime=read('assets/contact-runtime-v130.js');
  const mobileDay=read('assets/mobile-calendar-day-detail-v130.js');
  const loader=read('assets/online-v5-loader.js');
  const worker=read('src/cf-v111-auth.js');
  const entry=read('src/cf-v111-entry.js');
  const wrangler=read('wrangler.jsonc');
  const workflow=read('.github/workflows/deploy-cloudflare-production.yml');
  const legacyFeatures=unpackLegacyFeatures(loader,issues);

  for(const token of [
    "document.getElementById('ctImage').onchange=async e=>",
    'verifyContactImageDecodable(raw)',
    'candidate.image=await mwsCompressContactImageV113(raw);',
    "saveResult=await persistContactSaveAndWait('연락처 수정',editingContactId,{requireManagedImage:imageChanged});",
    'cloudSaved=await window.mwsV55SaveNow();',
    "if(!String(stored?.image||'').startsWith('/media/contact/'))",
    'const mwsCompressContactImageV113=compressContactImage;',
    'window.mwsCompressContactImageV113=mwsCompressContactImageV113;'
  ])if(!app.includes(token))issues.push('browser upload chain missing: '+token);

  for(const token of [
    "async function storeDataImage(env,kind,key,dataUrl,authoritative=true,saveContext=null)",
    "env.DB.prepare('SELECT version,source_url FROM image_sources WHERE kind=? AND item_key=?')",
    "return mediaUrl(kind,key,version,token);",
    "if(part==='contacts')",
    "item.image=await storeDataImage(env,'contact',id,item.image,true,saveContext)",
    'normalized[part]=value;',
    'return json({versions,normalized,savedBy:admin.id});',
    "if(path.startsWith('/api/parts/')&&request.method==='GET')return handlePart",
    "if(path==='/api/bootstrap'&&request.method==='GET')return handleBootstrap",
    "const media=path.match(/^\\/media\\/(contact|workspace)\\/([^/]+)$/)"
  ])if(!worker.includes(token))issues.push('Worker contact media chain missing: '+token);

  if(!worker.includes("function mediaUrl(kind,key,version=1,token='')"))issues.push('canonical managed media URL builder missing');
  if(!worker.includes("const CONTACT_MEDIA_REVISION='2';"))issues.push('contact media revision guard missing');
  if(!worker.includes("await repairStoredContactImageRefs(env)"))issues.push('refresh-time contact media repair missing');
  if(!worker.includes("async function canonicalizeManagedContactRefs(env,raw)"))issues.push('managed contact canonicalizer missing');
  if(!worker.includes("async function canonicalizeLegacyR2ContactRefs(env,raw)"))issues.push('legacy R2 contact canonicalizer missing');

  for(const token of [
    "const DB_NAME='mawang_data_v130';",
    'window.mwsScheduleImageTune=scheduleImageTune;',
    'maintenance-runtime-v130.js?v=1.3.0-stage68-contact-media-canonical2'
  ])if(!perf.includes(token))issues.push('performance/runtime ownership missing: '+token);

  for(const token of [
    "const CACHE_DB='mawang_data_v130';",
    'function canonicalMediaUrl(value)',
    "if(u.origin===location.origin)",
    "if(kind==='contact')params.set('r','2');"
  ])if(!maintenance.includes(token))issues.push('maintenance canonical media ownership missing: '+token);

  if(perf.includes('window.compressContactImage=')||perf.includes('compressContactImage=preserveOriginalImage'))issues.push('performance runtime overrides canonical contact processor');
  if(maintenance.includes('window.compressContactImage=')||maintenance.includes('compressContactImageV571'))issues.push('maintenance runtime overrides canonical contact processor');
  if(contactRuntime.includes('window.compressContactImage=')||contactRuntime.includes('function compressContactImage('))issues.push('contact runtime defines a second contact image processor');

  if(legacyFeatures){
    const forbidden=[
      /(?:^|[^\w$])(?:async\s+)?function\s+compressContactImage\s*\(/m,
      /(?:window\.)?compressContactImage\s*=/m,
      /mwsCompressContactImageV113\s*=/m
    ];
    if(forbidden.some(re=>re.test(legacyFeatures)))issues.push('compressed legacy V5 features still own or overwrite the contact image processor');
  }

  for(const token of [
    'function mwsRecoverContactMediaImageV110(img)',
    'const mwsContactMediaObserverV111=new MutationObserver'
  ])if(!app.includes(token))issues.push('shared contact image recovery missing: '+token);
  if(!app.includes("img.src=\`/media/contact/\${encodeURIComponent(id)}?fallback=110&cb=\${Date.now()}\`"))issues.push('same-origin contact retry URL missing');

  if(!mobileDay.includes("typeof window.mwsRecoverContactMediaImageV110==='function'&&window.mwsRecoverContactMediaImageV110(target)"))issues.push('mobile calendar does not delegate participant image failure to shared contact recovery');

  if(!entry.includes("out=out.replace(\"const CACHE_DB='mawang_data';\",\"const CACHE_DB='mawang_data_v130';\")"))issues.push('served cloud core cache DB normalization missing');
  if(!entry.includes('const serverValue=hasNormalized?normalized[part]:sentValue'))issues.push('served cloud core does not adopt normalized server media values');
  if(!entry.includes('if(!changedAfterSend&&hasNormalized)mergePart(part,serverValue,data)'))issues.push('served cloud core normalized merge guard missing');
  if(!wrangler.includes('"main": "src/cf-v111-entry.js"'))issues.push('production Worker entry is not cf-v111-entry.js');
  if(!postLogin.includes('/assets/perf-runtime.js?v=1.4.0-phase113-contact-image-owner1'))issues.push('post-login runtime does not load the Phase 113 image-owner revision');

  for(const token of [
    'run-phase114-contact-image-end-to-end-ownership-audit.mjs',
    'compressed legacy V5 features still own or overwrite the contact image processor'
  ])if(!workflow.includes(token))issues.push('production Phase 114 verification missing: '+token);

  if(read('src/cf-v57.js').includes('function directMediaUrl(value, base)')){
    warnings.push('legacy cf-v57 direct-R2 rewrite remains below the current auth wrapper but contact APIs are intercepted by cf-v111-auth before fallback');
  }

  const summary={phase:114,name:'contact-image-end-to-end-ownership',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase114ContactImageEndToEndOwnershipAudit();
