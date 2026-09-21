import fs from 'node:fs';

export function runPhase122WardogsManagerAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const css=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!/assets\/wardogs-manager-v1\.css\?v=1\.0\.0-phase(?:122|1[2-9][3-9]|[2-9][0-9]{2,})/.test(index))issues.push('WARDOGS manager stylesheet is not loaded by index');
  if(!/assets\/wardogs-manager-v1\.js\?v=1\.0\.0-phase(?:122|1[2-9][3-9]|[2-9][0-9]{2,})/.test(index))issues.push('WARDOGS manager runtime is not loaded by index');
  for(const token of [
    'class="card wardogs-manager-entry-card-v122"',
    'id="wardogsManageBtn"',
    'id="wardogsManageCount"',
    '기존 연락처와 ID로 연결되는 WARDOGS 참가 카드를 관리합니다.'
  ])if(!index.includes(token))issues.push('WARDOGS manager entry missing: '+token);

  for(const token of [
    "const CLASS_META=Object.freeze([",
    "{id:'assault',label:'어썰트'}",
    "{id:'medic',label:'메딕'}",
    "{id:'recon',label:'리콘'}",
    "{id:'support',label:'서포트'}",
    "{id:'driver',label:'드라이버'}",
    "{id:'pilot',label:'파일럿'}",
    "function isAdmin(){return document.body?.dataset?.mwsMode==='admin'}",
    "function waitForWardogsPart()",
    "loadedParts?.includes('wardogs')",
    "window.mwsWardogsDataV119?.searchContacts?.(query,{limit:40})",
    "window.mwsWardogsDataV119?.resolveContactLink?.(value)",
    "const duplicate=cards().find(card=>card.id!==selectedId&&card.contactId===selectedContactId&&card.classId===classId);",
    "const result=await media().put(pendingFile,dimensions);",
    "await callSave(existing?'WARDOGS 카드 수정':'WARDOGS 카드 추가');",
    "await callSave('WARDOGS 카드 삭제');",
    "const cloudOk=await window.mwsV55SaveNow();",
    "await restoreSnapshot(snapshot);",
    "if(previousPortraitImageId&&uploadedPortraitId&&previousPortraitImageId!==uploadedPortraitId){",
    "drop?.addEventListener('drop'",
    "data-wardogs-manager-active",
    "data-wardogs-manager-delete",
    "window.mwsOpenWardogsManagerV122=openManager;"
  ])if(!manager.includes(token))issues.push('WARDOGS manager runtime missing: '+token);

  if(/function\s+mwsTextMatches\s*\(|function\s+contactMatches\s*\(/.test(manager))issues.push('WARDOGS manager must not create another contact search owner');
  if(/localStorage|readAsDataURL|data:image/i.test(manager))issues.push('WARDOGS manager must not use localStorage/Base64 for card media');
  if(index.includes('phase122')&&/dragstart|draggable\s*=\s*true|data-wardogs-manager-order/.test(manager))warnings.push('Phase 122 unexpectedly contains card ordering behavior reserved for Phase 123');

  for(const token of [
    '.wardogs-manager-modal-v122{',
    '.wardogs-manager-layout-v122{',
    '.wardogs-manager-drop-v122{',
    '.wardogs-manager-drop-v122 img{',
    'object-fit:contain',
    '@media(max-width:860px)'
  ])if(!css.includes(token))issues.push('WARDOGS manager CSS missing: '+token);

  for(const token of [
    'run-phase122-wardogs-manager-audit.mjs',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127',
    'assets/wardogs-manager-v1.css?v=1.0.0-phase127',
    'window.mwsOpenWardogsManagerV122=openManager;',
    "window.mwsWardogsDataV119?.searchContacts?.(query,{limit:40})",
    "const cloudOk=await window.mwsV55SaveNow();",
    'id="wardogsManageBtn"'
  ])if(!workflow.includes(token))issues.push('production Phase 122 verification missing: '+token);

  const summary={phase:122,name:'wardogs-card-manager',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase122WardogsManagerAudit();
