import fs from 'node:fs';

export function runPhase95AchievementManagerEditorAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const gallery=fs.readFileSync('assets/achievement-gallery-v1621.js','utf8');
  const css=fs.readFileSync('assets/achievement-gallery-v1621.css','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const token of [
    'function mwsAchievementCreateCardV1621(fields={})',
    'function mwsAchievementUpdateCardV1621(id,patch={})',
    'function mwsAchievementDeleteCardV1621(id)',
    'window.mwsAchievementCardsV1621=Object.freeze({',
    'create:mwsAchievementCreateCardV1621',
    'update:mwsAchievementUpdateCardV1621',
    'remove:mwsAchievementDeleteCardV1621',
    "saveData('업적 카드 추가')",
    "lastSyncReason=reason",
    "saveData('업적 카드 삭제')",
    'data.achievementCards.forEach((card,order)=>{card.order=order})'
  ]){
    if(!core.includes(token))issues.push('achievement mutation API missing: '+token);
  }
  for(const field of ['gameName','contentName','description','frontImageId','backImageId']){
    if(!core.includes(`Object.prototype.hasOwnProperty.call(patch,'${field}')`))issues.push('achievement update API cannot safely patch '+field);
  }

  for(const token of [
    'achievement-manager-workspace',
    'data-achievement-manager-list',
    'data-achievement-manager-add',
    'data-achievement-manager-editor',
    'data-achievement-manager-game',
    'data-achievement-manager-content',
    'data-achievement-manager-description',
    'data-achievement-manager-delete',
    'data-achievement-manager-save',
    'function renderManagerList()',
    'function renderManagerEditor()',
    'function createManagerCard()',
    'function saveManagerCard(event)',
    'function deleteManagerCard()',
    'api.create({gameName:',
    'api.update(card.id,patch)',
    'api.remove(card.id)',
    'window.confirm('
  ]){
    if(!gallery.includes(token))issues.push('achievement manager editor runtime missing: '+token);
  }
  if(/data\.achievementCards\s*(?:=|\.push\(|\.splice\()/.test(gallery))issues.push('achievement manager runtime mutates achievementCards directly instead of using app-core API');
  if(!gallery.includes("if(managerModal&&!managerModal.hidden&&String(event?.detail?.reason||'').startsWith('업적 카드'))renderManager();"))issues.push('open achievement manager does not refresh after achievement mutations');
  if(!gallery.includes("setManagerStatus(result.saved?'업적 카드 정보를 저장했습니다.'"))issues.push('manager save status feedback is missing');
  if(!gallery.includes("setManagerStatus(result.saved?'업적 카드를 삭제했습니다.'"))issues.push('manager delete status feedback is missing');

  for(const token of [
    '.achievement-manager-workspace{',
    'grid-template-columns:minmax(260px,32%) minmax(0,1fr);',
    '.achievement-manager-list-item.active{',
    '.achievement-manager-editor-panel{',
    '.achievement-manager-field input,',
    '.achievement-manager-field textarea{',
    '.achievement-manager-status[data-tone="error"]',
    '.achievement-manager-workspace{grid-template-columns:1fr}'
  ]){
    if(!css.includes(token))issues.push('achievement manager editor CSS missing: '+token);
  }

  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:9[5-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search95');
  if(!/achievement-gallery-v1621\.css\?v=1\.6\.21-phase(?:9[5-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement manager CSS cache is older than Phase 95');
  if(!/achievement-gallery-v1621\.js\?v=1\.6\.21-phase(?:9[5-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement manager runtime cache is older than Phase 95');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:9[5-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than Phase 95');

  const summary={phase:95,name:'achievement-manager-editor',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase95AchievementManagerEditorAudit();
