import fs from 'node:fs';

export function runPhase125WardogsCardDetailAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const runtime=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const css=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136',
    'assets/wardogs-v1.js?v=1.0.0-phase125-portrait138'
  ])if(!index.includes(token))issues.push('WARDOGS Phase 125 asset revision missing: '+token);

  for(const token of [
    "function cardById(id)",
    "function safeHttpUrl(raw)",
    "if(!/^https?:$/i.test(url.protocol))return '';",
    "function ensureDetailModal()",
    "root.id='wardogsDetailModalV125';",
    "root.setAttribute('aria-modal','true');",
    "root.setAttribute('aria-labelledby','wardogsDetailNameV125');",
    'rel="noopener noreferrer"',
    "async function loadDetailImage(card,token)",
    "const blob=await mediaApi()?.getBlob?.(imageId);",
    "async function openDetail(cardId,opener=null)",
    "if(!card||card.active===false||!link?.linked)return false;",
    "root.querySelector('#wardogsDetailNameV125').textContent=String(contact?.name||'이름 없음');",
    "root.querySelector('[data-wardogs-detail-contact-id]').textContent=",
    "root.querySelector('[data-wardogs-detail-class]').textContent=classMeta(card.classId).name;",
    "root.querySelector('[data-wardogs-detail-order]').textContent=String(Number(card.order)||0).padStart(2,'0');",
    "root.querySelector('[data-wardogs-detail-notes]').textContent=String(contact?.notes||'').trim()||'등록된 메모 없음';",
    "station.href=stationUrl;",
    "function closeDetail()",
    "if(focus?.isConnected)setTimeout(()=>focus.focus(),0);",
    "article.setAttribute('role','button');",
    "article.tabIndex=0;",
    "article.addEventListener('click',()=>void openDetail(card.id,article));",
    "if(event.key!=='Enter'&&event.key!==' ')return;",
    "if(event.key==='Escape'&&detailModal&&!detailModal.hidden){event.preventDefault();closeDetail()}",
    "window.mwsOpenWardogsDetailV125=openDetail;",
    "window.mwsCloseWardogsDetailV125=closeDetail;",
    "window.__mwsWardogsDetailV125='linked-contact-card-detail';"
  ])if(!runtime.includes(token))issues.push('WARDOGS detail runtime missing: '+token);

  if(/contentEditable|data-wardogs-detail-save|WARDOGS 상세 저장/.test(runtime))issues.push('WARDOGS Phase 125 detail must remain read-only');
  if(/innerHTML\s*=\s*[^'"`]*contact\.|innerHTML\s*=\s*[^'"`]*notes/.test(runtime))issues.push('WARDOGS detail must not inject contact text with innerHTML');
  if(/combat|damage|attack|defense|level|rankScore/i.test(runtime))warnings.push('WARDOGS detail appears to contain stats beyond the Phase 125 scope');

  for(const token of [
    '.wardogs-detail-modal-v125[hidden]{display:none!important}',
    '.wardogs-detail-modal-v125{',
    '.wardogs-detail-dialog-v125{',
    '.wardogs-detail-layout-v125{',
    '.wardogs-detail-media-frame-v125 img{',
    'display:block;width:auto;height:auto;',
    'max-width:100%;max-height:calc(94vh - 150px);',
    'object-fit:contain',
    '.wardogs-detail-info-v125{',
    '.wardogs-detail-grid-v125{',
    'body.mws-wardogs-detail-open-v125{overflow:hidden!important}',
    '@media(max-width:900px)',
    '@media(max-width:520px)'
  ])if(!css.includes(token))issues.push('WARDOGS detail CSS missing: '+token);

  if(/\.wardogs-detail-media-frame-v125 img\{[^}]*width:\s*100%;[^}]*height:\s*100%/s.test(css)){
    issues.push('WARDOGS detail image must not stretch to a forced width/height pair');
  }
  if(/backdrop-filter|filter:\s*blur/i.test(css))issues.push('WARDOGS detail must not add GPU-heavy blur filters');

  for(const token of [
    'run-phase125-wardogs-card-detail-audit.mjs',
    'assets/wardogs-v1.js?v=1.0.0-phase125-portrait138',
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136',
    "window.__mwsWardogsDetailV125='linked-contact-card-detail';",
    "root.id='wardogsDetailModalV125';",
    "article.addEventListener('click',()=>void openDetail(card.id,article));",
    "if(!card||card.active===false||!link?.linked)return false;",
    "const blob=await mediaApi()?.getBlob?.(imageId);",
    '.wardogs-detail-media-frame-v125 img{',
    'object-fit:contain'
  ])if(!workflow.includes(token))issues.push('production Phase 125 verification missing: '+token);

  const summary={phase:125,name:'wardogs-card-detail',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase125WardogsCardDetailAudit();
