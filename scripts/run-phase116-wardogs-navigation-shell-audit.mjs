import fs from 'node:fs';

export function runPhase116WardogsNavigationShellAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'data-tab="wardogs"',
    '<span class="nav-label">워독스 전쟁견들</span>',
    '<div class="nav-game-divider wardogs-content-divider-v116"><span></span><em>컨텐츠</em><span></span></div>',
    '<section id="wardogs" class="section" data-wardogs-shell-v116="1">',
    'WARDOGS 모듈의 기본 페이지입니다.',
    'assets/app-core.js?v=1.3.0-search115-wardogs116'
  ])if(!index.includes(token))issues.push('WARDOGS navigation shell missing: '+token);

  if(!app.includes("achievements:'업적',wardogs:'워독스 전쟁견들'")){
    issues.push('WARDOGS page title mapping missing');
  }

  const achievement=index.indexOf('data-tab="achievements"');
  const content=index.indexOf('wardogs-content-divider-v116');
  const wardogs=index.indexOf('data-tab="wardogs"');
  const mini=index.indexOf('<div class="nav-game-divider"><span></span><em>미니게임</em><span></span></div>');
  if(!(achievement>=0&&content>achievement&&wardogs>content&&mini>wardogs)){
    issues.push('sidebar order must be achievements -> content divider -> wardogs -> minigames');
  }

  const achievementSection=index.indexOf('<section id="achievements" class="section">');
  const wardogsSection=index.indexOf('<section id="wardogs" class="section" data-wardogs-shell-v116="1">');
  const miniSection=index.indexOf('<section id="gameMajoku" class="section mini-game-section">');
  if(!(achievementSection>=0&&wardogsSection>achievementSection&&miniSection>wardogsSection)){
    issues.push('WARDOGS section must be between achievements and mini games');
  }

  for(const token of [
    'run-phase116-wardogs-navigation-shell-audit.mjs',
    'data-tab="wardogs"',
    'wardogs-content-divider-v116',
    'search115-wardogs116'
  ])if(!workflow.includes(token))issues.push('production Phase 116 verification missing: '+token);

  const summary={phase:116,name:'wardogs-navigation-shell',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase116WardogsNavigationShellAudit();
