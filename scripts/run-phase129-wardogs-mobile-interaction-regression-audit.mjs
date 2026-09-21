import fs from 'node:fs';

export function runPhase129WardogsMobileInteractionRegressionAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const managerCss=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const wardogs=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const wardogsCss=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/wardogs-manager-v1.css?v=1.0.0-phase127-mobile129-portrait133',
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129'
  ])if(!index.includes(token))issues.push('mobile regression cache-bust missing: '+token);

  for(const token of [
    '<input type="file" accept="image/*" hidden data-wardogs-manager-file data-wardogs-manager-write>',
    "root.querySelector('[data-wardogs-manager-pick]')?.addEventListener('click'",
    "fileInput?.addEventListener('change'",
    "String(item.type||'').startsWith('image/')",
    "if(file.size>limit)return 'WARDOGS 카드 이미지는 32MB 이하만 등록할 수 있습니다.';",
    "const result=await media().put(pendingFile,dimensions);",
    "root.querySelector('[data-wardogs-manager-search]')?.addEventListener('input',renderContactResults);",
    "window.mwsWardogsDataV119?.searchContacts?.(query,{limit:40})",
    "data-wardogs-manager-contact",
    "selectedContactId=String(btn.dataset.wardogsManagerContact||'');",
    "handle?.addEventListener('pointerdown',handleTouchOrderPointerDown);",
    "if(Date.now()<suppressCardClickUntil)return;"
  ])if(!manager.includes(token))issues.push('mobile manager interaction regression: '+token);

  if(/data-wardogs-manager-search[^\n]{0,300}addEventListener\(['"]keyup['"]/.test(manager)){
    issues.push('WARDOGS contact search must update on input, not wait for keyup/space');
  }
  if(/\.wardogs-manager-list-pane-v122\{[^}]*touch-action:\s*none/s.test(managerCss)){
    issues.push('touch-action:none must not block scrolling on the whole WARDOGS manager list');
  }
  if(!managerCss.includes('.wardogs-manager-drag-handle-v123[data-wardogs-manager-touch-handle]{')||!managerCss.includes('touch-action:none;')){
    issues.push('touch ordering gesture isolation is missing from the drag handle');
  }

  for(const token of [
    "article.setAttribute('role','button');",
    "article.tabIndex=0;",
    "article.addEventListener('click',()=>void openDetail(card.id,article));",
    "if(event.key!=='Enter'&&event.key!==' ')return;",
    "root.addEventListener('click',event=>{if(event.target===root)closeDetail()})",
    "if(event.key==='Escape'&&detailModal&&!detailModal.hidden){event.preventDefault();closeDetail()}",
    "if(focus?.isConnected)setTimeout(()=>focus.focus(),0);"
  ])if(!wardogs.includes(token))issues.push('mobile/detail interaction regression: '+token);

  for(const token of [
    'max-height:96dvh;',
    'grid-template-rows:minmax(150px,30dvh) minmax(0,1fr);',
    '-webkit-overflow-scrolling:touch;'
  ])if(!managerCss.includes(token))issues.push('mobile manager viewport regression: '+token);

  for(const token of [
    'max-height:96dvh;',
    'grid-template-rows:minmax(280px,55dvh) minmax(0,1fr);',
    'grid-template-rows:minmax(240px,48dvh) minmax(0,1fr);',
    '-webkit-overflow-scrolling:touch;'
  ])if(!wardogsCss.includes(token))issues.push('mobile detail viewport regression: '+token);

  for(const token of [
    'run-phase129-wardogs-mobile-interaction-regression-audit.mjs',
    'assets/wardogs-manager-v1.css?v=1.0.0-phase127-mobile129-portrait133',
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129',
    "fileInput?.addEventListener('change'",
    "addEventListener('input',renderContactResults)",
    "handle?.addEventListener('pointerdown',handleTouchOrderPointerDown);",
    "article.addEventListener('click',()=>void openDetail(card.id,article));",
    'max-height:96dvh;'
  ])if(!workflow.includes(token))issues.push('production Phase 129 verification missing: '+token);

  const summary={phase:129,name:'wardogs-mobile-interaction-regression',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase129WardogsMobileInteractionRegressionAudit();
