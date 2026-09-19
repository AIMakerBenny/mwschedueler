import fs from 'node:fs';

export function runPhase97AchievementOrderingAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const gallery=fs.readFileSync('assets/achievement-gallery-v1621.js','utf8');
  const css=fs.readFileSync('assets/achievement-gallery-v1621.css','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const token of [
    'function mwsAchievementMoveCardV1621(id,targetIndex)',
    'const previous=data.achievementCards.map(mwsAchievementCardClone);',
    'data.achievementCards.splice(finalIndex,0,moved);',
    'data.achievementCards.forEach((card,order)=>{card.order=order});',
    "const reason='업적 카드 순서 변경';",
    "renderAll('업적 카드 순서 변경 실패');",
    'data.achievementCards=previous;',
    'move:mwsAchievementMoveCardV1621'
  ]){
    if(!core.includes(token))issues.push('achievement ordering mutation missing: '+token);
  }

  for(const token of [
    "let managerDragId='';",
    'function moveManagerCard(id,targetIndex)',
    'function moveManagerCardBy(id,delta)',
    "handle.draggable=true;",
    "handle.addEventListener('dragstart'",
    "item.addEventListener('dragover'",
    "item.addEventListener('drop'",
    "className='achievement-manager-move-controls'",
    "up.textContent='위';",
    "down.textContent='아래';",
    'api.move(id,nextIndex)',
    'if(fromIndex<insertIndex)insertIndex--;',
    "managerDirty&&!window.confirm('저장하지 않은 변경사항을 버리고 카드 순서를 변경할까요?')"
  ]){
    if(!gallery.includes(token))issues.push('achievement ordering runtime missing: '+token);
  }
  if(/data\.achievementCards\s*(?:=|\.push\(|\.splice\()/.test(gallery)){
    issues.push('achievement ordering runtime mutates achievementCards directly instead of app-core API');
  }

  for(const token of [
    '.achievement-manager-drag-handle{',
    'cursor:grab;',
    '.achievement-manager-list-item.drop-before::before,',
    '.achievement-manager-list-item.drop-after::after{',
    '.achievement-manager-move-controls{',
    '.achievement-manager-move-button{',
    '.achievement-manager-drag-handle{display:none}',
    '.achievement-manager-list-item{grid-template-columns:minmax(0,1fr) auto;padding:7px}'
  ]){
    if(!css.includes(token))issues.push('achievement ordering CSS missing: '+token);
  }

  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:9[7-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than Phase 97');
  if(!/achievement-gallery-v1621\.css\?v=1\.6\.21-phase(?:9[7-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement ordering CSS cache is older than Phase 97');
  if(!/achievement-gallery-v1621\.js\?v=1\.6\.21-phase(?:9[7-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement ordering runtime cache is older than Phase 97');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:9[7-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than Phase 97');

  const summary={phase:97,name:'achievement-ordering',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase97AchievementOrderingAudit();
