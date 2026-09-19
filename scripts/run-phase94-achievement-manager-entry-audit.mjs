import fs from 'node:fs';

export function runPhase94AchievementManagerEntryAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const gallery=fs.readFileSync('assets/achievement-gallery-v1621.js','utf8');
  const css=fs.readFileSync('assets/achievement-gallery-v1621.css','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');

  for(const token of [
    'class="card achievement-manager-entry-card"',
    'id="achievementManageBtn"',
    'id="achievementManageCount"',
    '>관리</button>',
    '업적 카드 이미지와 게임 이름, 컨텐츠 이름, 설명, 표시 순서를 관리'
  ]){
    if(!index.includes(token))issues.push('achievement manager entry missing: '+token);
  }

  for(const token of [
    "root.id='achievementManagerModal'",
    "root.className='achievement-manager-modal'",
    "root.setAttribute('role','dialog')",
    "root.setAttribute('aria-modal','true')",
    "root.setAttribute('aria-labelledby','achievementManagerTitle')",
    "id=\"achievementManagerTitle\"",
    "class=\"achievement-manager-close\"",
    "function openManager()",
    "function closeManager()",
    "function bindManagerEntry()",
    "button.addEventListener('click',openManager)",
    "window.mwsOpenAchievementManagerV1621=openManager",
    "window.mwsCloseAchievementManagerV1621=closeManager",
    "syncManagerShellCount();",
    "document.getElementById('achievementManageCount')"
  ]){
    if(!gallery.includes(token))issues.push('achievement manager runtime missing: '+token);
  }
  if(!gallery.includes("if(managerModal&&!managerModal.hidden){event.preventDefault();closeManager();return}"))issues.push('Escape does not close achievement manager first');
  if(!gallery.includes("root.addEventListener('click',event=>{if(event.target===root)closeManager()})"))issues.push('backdrop click does not close achievement manager');
  if(!gallery.includes("if(detailModal&&!detailModal.hidden)closeDetail();"))issues.push('opening manager does not isolate it from the detail modal');

  for(const token of [
    '.achievement-manager-modal{',
    '.achievement-manager-dialog{',
    '.achievement-manager-head{',
    '.achievement-manager-shell{',
    '.achievement-manager-close{',
    'body.mws-achievement-manager-open{overflow:hidden!important}',
    '.achievement-manager-entry-card .row{'
  ]){
    if(!css.includes(token))issues.push('achievement manager CSS missing: '+token);
  }
  if(!css.includes('.achievement-manager-modal[hidden]{display:none!important}'))issues.push('hidden manager modal is not removed from layout');
  if(!css.includes('z-index:12020;'))issues.push('achievement manager modal does not sit above the detail layer');

  if(!/achievement-gallery-v1621\.css\?v=1\.6\.21-phase(?:9[4-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement manager CSS cache is older than Phase 94');
  if(!/achievement-gallery-v1621\.js\?v=1\.6\.21-phase(?:9[4-9]|[1-9][0-9]{2,})/.test(post))issues.push('achievement manager runtime cache is older than Phase 94');
  if(!/post-login-runtime-v130\.js\?v=1\.4\.0-phase(?:9[4-9]|[1-9][0-9]{2,})/.test(entry))issues.push('Worker post-login cache-bust is older than Phase 94');

  const summary={phase:94,name:'achievement-manager-entry',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase94AchievementManagerEntryAudit();
