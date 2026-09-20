import fs from 'node:fs';

export function runPhase89AchievementNavigationShellAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const tools=fs.readFileSync('assets/tools.js','utf8');

  const world=index.indexOf('data-tab="worldtime"');
  const achievement=index.indexOf('data-tab="achievements"');
  const mini=index.indexOf('<div class="nav-game-divider"');
  if(world<0)issues.push('world time navigation entry is missing');
  if(achievement<0)issues.push('achievement navigation entry is missing');
  if(mini<0)issues.push('mini-game divider is missing');
  if(world>=0&&achievement>=0&&world>achievement)issues.push('achievement navigation is not below world time');
  if(achievement>=0&&mini>=0&&achievement>mini)issues.push('achievement navigation is not above the tool/game groups');
  if(!index.includes('<span class="nav-label">업적</span>'))issues.push('achievement navigation label is missing');
  if(!index.includes('<section id="achievements" class="section">'))issues.push('achievement section shell is missing');
  if(!index.includes('id="achievementEmptyState"'))issues.push('achievement empty state is missing');
  if(!index.includes('아직 등록된 업적 카드가 없습니다.'))issues.push('achievement empty-state copy is missing');

  if(!core.includes("achievements:'업적'"))issues.push('setTab title registry does not include achievements');
  if(!core.includes("if(!Array.isArray(data.achievementCards))data.achievementCards=[];"))issues.push('Phase 88 achievement card data normalization was lost');
  if(!/assets\/app-core\.js\?v=1\.3\.0-search(?:8[9]|9[0-9]|[1-9][0-9]{2,})/.test(index))issues.push('app-core cache-bust is older than search89');

  if(!tools.includes("let mini=[...n.querySelectorAll('.nav-game-divider')].find(x=>/미니게임/.test(x.textContent||''));"))issues.push('tool group still cannot anchor itself to the mini-game divider');
  if(!tools.includes("mini.before(d)"))issues.push('tool divider insertion anchor changed unexpectedly');

  const summary={phase:89,name:'achievement-navigation-shell',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase89AchievementNavigationShellAudit();
