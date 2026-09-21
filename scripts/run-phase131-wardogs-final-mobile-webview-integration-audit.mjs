import fs from 'node:fs';

export function runPhase131WardogsFinalMobileWebViewIntegrationAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const data=fs.readFileSync('assets/wardogs-data-v1.js','utf8');
  const media=fs.readFileSync('assets/wardogs-media-v1.js','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const managerCss=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const wardogs=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const wardogsCss=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const intro=fs.readFileSync('assets/wardogs-intro-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  const scriptOrder=[
    'assets/app-core.js?v=1.3.0-search115-wardogs116-backup126',
    'assets/wardogs-data-v1.js?v=1.0.0-phase120-webview130',
    'assets/wardogs-media-v1.js?v=1.0.0-phase121-backup126-webview130',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-portrait133',
    'assets/wardogs-v1.js?v=1.0.0-phase125',
    'assets/wardogs-intro-v1.js?v=1.0.0-phase118'
  ];
  let last=-1;
  for(const token of scriptOrder){
    const pos=index.indexOf(token);
    if(pos<0)issues.push('final WARDOGS runtime asset missing: '+token);
    else if(pos<=last)issues.push('final WARDOGS runtime asset order is invalid at: '+token);
    last=Math.max(last,pos);
  }

  for(const token of [
    "window.__mwsWardogsTouchOrderingV127='pointer-events-touch-pen';",
    "handle?.addEventListener('pointerdown',handleTouchOrderPointerDown);",
    "classList.remove('drop-before','drop-after','dragging','touch-ordering')",
    "addEventListener('input',renderContactResults)",
    "fileInput?.addEventListener('change'",
    "const shared=window.mwsWardogsDataV119?.createId;"
  ])if(!manager.includes(token))issues.push('final mobile manager integration missing: '+token);

  for(const token of [
    'min-height:100dvh;',
    'max-height:96dvh;',
    'grid-template-rows:minmax(150px,30dvh) minmax(0,1fr);',
    '-webkit-overflow-scrolling:touch;'
  ])if(!managerCss.includes(token))issues.push('final mobile manager viewport integration missing: '+token);

  for(const token of [
    "window.__mwsWardogsDetailV125='linked-contact-card-detail';",
    "article.addEventListener('click',()=>void openDetail(card.id,article));",
    "if(event.key==='Escape'&&detailModal&&!detailModal.hidden){event.preventDefault();closeDetail()}",
    "const blob=await mediaApi()?.getBlob?.(imageId);"
  ])if(!wardogs.includes(token))issues.push('final mobile detail integration missing: '+token);

  for(const token of [
    'min-height:100dvh;',
    'max-height:96dvh;',
    'grid-template-rows:minmax(280px,55dvh) minmax(0,1fr);',
    'grid-template-rows:minmax(240px,48dvh) minmax(0,1fr);',
    '-webkit-overflow-scrolling:touch;'
  ])if(!wardogsCss.includes(token))issues.push('final mobile detail viewport integration missing: '+token);

  for(const token of [
    "typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'",
    "typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function'",
    'crypto.getRandomValues(bytes);',
    'createId,'
  ])if(!data.includes(token))issues.push('final WebView-safe metadata integration missing: '+token);

  for(const token of [
    'async function tryGetLocal(id)',
    'async function tryStoreLocal(blob,meta={})',
    'async function tryDeleteLocal(id)',
    'await uploadCloud(id,blob);',
    'const blob=await fetchCloudBlob(id);',
    "window.__mwsWardogsMediaStorageV130='r2-with-indexeddb-cache-fallback';",
    "credentials:'same-origin'"
  ])if(!media.includes(token))issues.push('final WebView media integration missing: '+token);

  for(const token of [
    "try{return sessionStorage.getItem(SESSION_KEY)==='1'}catch(_){return fallbackSeen}",
    "try{sessionStorage.setItem(SESSION_KEY,'1')}catch(_){}"
  ])if(!intro.includes(token))issues.push('final WebView intro fallback missing: '+token);

  for(const token of [
    "window.mwsTextMatches=mwsTextMatches;",
    "window.contactMatches=contactMatches;",
    "async function buildWardogsBackupMedia(payload)",
    "async function restoreWardogsBackupMedia(backup,payload)"
  ])if(!app.includes(token))issues.push('protected app integration missing: '+token);

  if(/\.wardogs-manager-list-pane-v122\{[^}]*touch-action:\s*none/s.test(managerCss)){
    issues.push('final mobile list scrolling is blocked by touch-action:none');
  }
  if(/localStorage|readAsDataURL|data:image/i.test(media)){
    issues.push('final media integration regressed to localStorage/Base64 persistence');
  }

  for(const token of [
    'run-phase127-wardogs-mobile-touch-ordering-audit.mjs',
    'run-phase128-wardogs-mobile-viewport-audit.mjs',
    'run-phase129-wardogs-mobile-interaction-regression-audit.mjs',
    'run-phase130-wardogs-webview2-compatibility-audit.mjs',
    'run-phase131-wardogs-final-mobile-webview-integration-audit.mjs',
    'assets/wardogs-data-v1.js?v=1.0.0-phase120-webview130',
    'assets/wardogs-media-v1.js?v=1.0.0-phase121-backup126-webview130',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-portrait133',
    "window.__mwsWardogsTouchOrderingV127='pointer-events-touch-pen';",
    "window.__mwsWardogsMediaStorageV130='r2-with-indexeddb-cache-fallback';",
    "wardogs_part=\"$(retry_contains \"$BASE/api/parts/wardogs?deploy=$GITHUB_SHA\" '\"schemaVersion\":1')\""
  ])if(!workflow.includes(token))issues.push('final production integration verification missing: '+token);

  warnings.push('Repository contains no native WebView2 host project; this audit covers the web application loaded by the EXE, not native window/session configuration.');
  const summary={phase:131,name:'wardogs-final-mobile-webview-integration',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase131WardogsFinalMobileWebViewIntegrationAudit();
