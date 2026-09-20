import fs from 'node:fs';

export function runPhase127WardogsMobileTouchOrderingAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const css=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/wardogs-manager-v1.css?v=1.0.0-phase127',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127'
  ])if(!index.includes(token))issues.push('Phase 127 manager asset revision missing: '+token);

  for(const token of [
    "let pointerOrderId=0;",
    "let pointerSourceId='';",
    "let pointerTargetId='';",
    "let suppressCardClickUntil=0;",
    "data-wardogs-manager-touch-handle",
    "function touchPointerSupported(event)",
    "event?.pointerType==='touch'||event?.pointerType==='pen'",
    "function autoScrollTouchOrder(clientY)",
    "pane.scrollBy({top:delta,left:0,behavior:'auto'});",
    "function updateTouchOrderTarget(clientX,clientY)",
    "document.elementFromPoint(clientX,clientY)?.closest?.('[data-wardogs-manager-card]')",
    "function handleTouchOrderPointerDown(event)",
    "function handleTouchOrderPointerMove(event)",
    "function handleTouchOrderPointerUp(event)",
    "function handleTouchOrderPointerCancel(event)",
    "handle.setPointerCapture?.(event.pointerId)",
    "suppressCardClickUntil=Date.now()+450;",
    "if(moved)void persistClassOrder(sourceId,targetId,after);",
    "handle?.addEventListener('pointerdown',handleTouchOrderPointerDown);",
    "handle?.addEventListener('pointermove',handleTouchOrderPointerMove);",
    "handle?.addEventListener('pointerup',handleTouchOrderPointerUp);",
    "handle?.addEventListener('pointercancel',handleTouchOrderPointerCancel);",
    "window.__mwsWardogsTouchOrderingV127='pointer-events-touch-pen';"
  ])if(!manager.includes(token))issues.push('mobile touch ordering runtime missing: '+token);

  if(!manager.includes("source.classId!==target.classId||source.classId!==orderClass")){
    issues.push('touch ordering must reuse same-class persistence guard');
  }
  if(!manager.includes("if(draftDirty){"))issues.push('touch ordering must preserve dirty-draft guard');
  if(/touchstart|touchmove|touchend/.test(manager))warnings.push('Pointer Events are preferred over duplicate legacy touch handlers');

  for(const token of [
    '.wardogs-manager-drag-handle-v123[data-wardogs-manager-touch-handle]{',
    'touch-action:none;',
    'body.mws-wardogs-touch-ordering-v127{',
    'overscroll-behavior:none;',
    '@media(pointer:coarse)'
  ])if(!css.includes(token))issues.push('mobile touch ordering CSS missing: '+token);

  for(const token of [
    'run-phase127-wardogs-mobile-touch-ordering-audit.mjs',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127',
    'assets/wardogs-manager-v1.css?v=1.0.0-phase127',
    "window.__mwsWardogsTouchOrderingV127='pointer-events-touch-pen';",
    "handle?.addEventListener('pointerdown',handleTouchOrderPointerDown);",
    "pane.scrollBy({top:delta,left:0,behavior:'auto'});"
  ])if(!workflow.includes(token))issues.push('production Phase 127 verification missing: '+token);

  const summary={phase:127,name:'wardogs-mobile-touch-ordering',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase127WardogsMobileTouchOrderingAudit();
