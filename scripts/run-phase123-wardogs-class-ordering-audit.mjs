import fs from 'node:fs';

export function runPhase123WardogsClassOrderingAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const css=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const dataRuntime=fs.readFileSync('assets/wardogs-data-v1.js','utf8');
  const auth=fs.readFileSync('src/cf-v111-auth.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/wardogs-manager-v1.css?v=1.0.0-phase123',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase123'
  ])if(!index.includes(token))issues.push('WARDOGS Phase 123 asset revision missing: '+token);

  for(const token of [
    "let orderClass='assault';",
    "function classCards(classId=orderClass)",
    "function renderClassTabs()",
    "function setOrderClass(classId)",
    "function handleOrderDragStart(event)",
    "function handleOrderDragOver(event)",
    "function handleOrderDrop(event)",
    "function handleOrderDragEnd()",
    "async function persistClassOrder(sourceId,targetId,after)",
    "source.classId!==target.classId||source.classId!==orderClass",
    "rootState.cards.forEach(card=>{",
    "card.order=rank.get(card.id);",
    "await callSave('WARDOGS 카드 순서 변경');",
    "await restoreSnapshot(snapshot);",
    "data-wardogs-manager-order-class",
    "data-wardogs-manager-card-class",
    "draggable=\"${canDrag?'true':'false'}\"",
    "const classChanged=target.classId!==classId;",
    "nextOrder=targetOrders.length?Math.max(...targetOrders)+1:0;",
    "orderClass=classId;",
    "window.mwsWardogsPersistClassOrderV123=persistClassOrder;",
    "window.__mwsWardogsOrderingV123='class-scoped-dnd';"
  ])if(!manager.includes(token))issues.push('WARDOGS class ordering runtime missing: '+token);

  if(!manager.includes("if(draftDirty){")||!manager.includes("편집 중인 변경사항을 먼저 저장하거나 취소한 뒤 순서를 변경해 주세요.")){
    issues.push('WARDOGS ordering must block drag while editor draft is dirty');
  }
  if(/classId\s*=\s*target\.classId/.test(manager)&&/source\.classId\s*=/.test(manager)){
    issues.push('WARDOGS ordering must not reassign card classes during drag ordering');
  }

  for(const token of [
    '.wardogs-manager-class-tabs-v123{',
    '.wardogs-manager-order-note-v123{',
    '.wardogs-manager-drag-handle-v123{',
    '.wardogs-manager-item-v122.dragging{',
    '.wardogs-manager-item-v122.drop-before::before',
    '.wardogs-manager-item-v122.drop-after::after'
  ])if(!css.includes(token))issues.push('WARDOGS class ordering CSS missing: '+token);

  for(const [name,source] of [['client schema',dataRuntime],['server schema',auth]]){
    if(!source.includes("group.forEach((card,order)=>normalized.push({...card,order}));")){
      issues.push(name+' does not canonicalize per-class card order');
    }
  }

  for(const token of [
    'run-phase123-wardogs-class-ordering-audit.mjs',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase123',
    'assets/wardogs-manager-v1.css?v=1.0.0-phase123',
    "window.__mwsWardogsOrderingV123='class-scoped-dnd';",
    "await callSave('WARDOGS 카드 순서 변경');",
    "source.classId!==target.classId||source.classId!==orderClass",
    "card.order=rank.get(card.id);"
  ])if(!workflow.includes(token))issues.push('production Phase 123 verification missing: '+token);

  const summary={phase:123,name:'wardogs-class-ordering',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase123WardogsClassOrderingAudit();
