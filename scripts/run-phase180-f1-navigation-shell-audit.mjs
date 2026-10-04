import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase180F1NavigationShellAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  const f1Nav=index.indexOf('data-tab="gameF1Racing"');
  const horseNav=index.indexOf('data-tab="gamePachinko"');
  const f1Section=index.indexOf('<section id="gameF1Racing"');
  const horseSection=index.indexOf('<section id="gamePachinko"');
  if(f1Nav<0||horseNav<0||f1Nav>=horseNav)issues.push('F1 Racing navigation is not immediately before the horse-racing region');
  if(f1Section<0||horseSection<0||f1Section>=horseSection)issues.push('F1 Racing section is not before horse racing');

  for(const token of [
    '<span class="nav-label">F1 레이싱</span>',
    '미니게임 03',
    '<h2>F1 레이싱</h2>',
    'assets/f1-racing-v1.css?v=1.0.0-phase180-shell',
    'assets/f1-racing-v1.js?v=1.0.0-phase180-shell'
  ])if(!index.includes(token))issues.push('F1 shell markup/assets missing: '+token);

  for(const token of [
    "gameF1Racing:'F1 레이싱'",
    "if(tab==='gameF1Racing')safeRenderView('F1 레이싱',()=>window.mwsRenderF1RacingV180?.());",
    "gamePachinko:'경마'",
    "if(tab==='gamePachinko')safeRenderView('경마',renderPachinko);"
  ])if(!core.includes(token))issues.push('F1 tab integration or protected horse hook missing: '+token);

  for(const token of ['.f1-racing-shell-v180{','.f1-racing-console-v180{','.f1-racing-placeholder-v180{'])if(!css.includes(token))issues.push('F1 shell CSS missing: '+token);
  for(const token of ["const VERSION='phase180-shell';",'window.mwsRenderF1RacingV180=render;',"window.__mwsF1RacingV180=VERSION;"])if(!js.includes(token))issues.push('F1 shell runtime missing: '+token);

  if(!index.includes('<div class="mini-kicker">MINI GAME 04</div><h2>경마</h2>'))issues.push('Horse-racing visible mini-game number was not shifted to 04');
  if(!index.includes('<div class="mini-kicker">MINI GAME 05</div>\n      <h2>Gacha 뽑기</h2>'))issues.push('Gacha visible mini-game number was not shifted to 05');

  for(const token of [
    'node --check assets/f1-racing-v1.js',
    'node --check scripts/run-phase180-f1-navigation-shell-audit.mjs'
  ])if(!workflow.includes(token))issues.push('Production syntax verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 Racing JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:180,name:'f1-navigation-shell',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase180F1NavigationShellAudit();
