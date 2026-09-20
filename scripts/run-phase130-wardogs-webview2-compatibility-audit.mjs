import fs from 'node:fs';

export function runPhase130WardogsWebView2CompatibilityAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const data=fs.readFileSync('assets/wardogs-data-v1.js','utf8');
  const media=fs.readFileSync('assets/wardogs-media-v1.js','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const intro=fs.readFileSync('assets/wardogs-intro-v1.js','utf8');
  const managerCss=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const detailCss=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/wardogs-data-v1.js?v=1.0.0-phase120-webview130',
    'assets/wardogs-media-v1.js?v=1.0.0-phase121-backup126-webview130',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130'
  ])if(!index.includes(token))issues.push('WebView2 compatibility asset revision missing: '+token);

  for(const token of [
    'function createId(){',
    "typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'",
    "typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function'",
    'crypto.getRandomValues(bytes);',
    'createId,'
  ])if(!data.includes(token))issues.push('WebView2-safe WARDOGS ID fallback missing: '+token);

  if((media.match(/crypto\.randomUUID\(\)/g)||[]).length)issues.push('media runtime still directly requires crypto.randomUUID');
  if((manager.match(/crypto\.randomUUID\(\)/g)||[]).length)issues.push('manager runtime still directly requires crypto.randomUUID');

  for(const token of [
    "if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return}",
    'async function tryGetLocal(id)',
    'async function tryStoreLocal(blob,meta={})',
    'async function tryDeleteLocal(id)',
    'const previous=await tryGetLocal(id);',
    'const record=await tryStoreLocal(blob,{...meta,id});',
    'await uploadCloud(id,blob);',
    'const local=await tryGetLocal(id);',
    'const blob=await fetchCloudBlob(id);',
    'const cached=await tryStoreLocal(blob,{id,mime:blob.type});',
    'if(await tryGetLocal(id))return true;',
    'await tryDeleteLocal(id);',
    "window.__mwsWardogsMediaStorageV130='r2-with-indexeddb-cache-fallback';"
  ])if(!media.includes(token))issues.push('WebView2 IndexedDB/R2 resilience missing: '+token);

  for(const token of [
    "if(typeof createImageBitmap!=='function')return {width:0,height:0};",
    'const shared=window.mwsWardogsDataV119?.createId;',
    "if(typeof shared==='function')return shared();"
  ])if(!manager.includes(token))issues.push('WebView2 manager feature fallback missing: '+token);

  for(const token of [
    "try{return sessionStorage.getItem(SESSION_KEY)==='1'}catch(_){return fallbackSeen}",
    "try{sessionStorage.setItem(SESSION_KEY,'1')}catch(_){}",
    'new MutationObserver('
  ])if(!intro.includes(token))issues.push('WebView2 intro storage/runtime guard missing: '+token);

  if(!manager.includes('handle.setPointerCapture?.(event.pointerId)')||
     !manager.includes('handle.hasPointerCapture?.(pointerOrderId)')||
     !manager.includes('handle.releasePointerCapture(pointerOrderId)')){
    issues.push('pointer capture must remain optional for embedded browser resilience');
  }

  for(const [name,css] of [['manager',managerCss],['detail',detailCss]]){
    if(!css.includes('max-height:94vh;')||!css.includes('max-height:94dvh;')){
      issues.push(name+' modal must retain vh fallback before dvh');
    }
  }

  if(/localStorage|readAsDataURL|data:image/i.test(media))issues.push('WARDOGS media must not use localStorage/Base64 persistence');
  if(!media.includes("credentials:'same-origin'"))issues.push('WARDOGS R2 requests must preserve same-origin auth/session behavior');

  for(const token of [
    'run-phase130-wardogs-webview2-compatibility-audit.mjs',
    'assets/wardogs-data-v1.js?v=1.0.0-phase120-webview130',
    'assets/wardogs-media-v1.js?v=1.0.0-phase121-backup126-webview130',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130',
    "window.__mwsWardogsMediaStorageV130='r2-with-indexeddb-cache-fallback';",
    'async function tryGetLocal(id)',
    "typeof crypto.getRandomValues==='function'"
  ])if(!workflow.includes(token))issues.push('production Phase 130 verification missing: '+token);

  warnings.push('Native WebView2 host configuration and User Data Folder policy are outside this repository and cannot be verified here.');
  const summary={phase:130,name:'wardogs-webview2-compatibility',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase130WardogsWebView2CompatibilityAudit();
