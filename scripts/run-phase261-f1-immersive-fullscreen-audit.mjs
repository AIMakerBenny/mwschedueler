import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase261F1ImmersiveFullscreenAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<261)issues.push('Phase 261 asset cache missing');

  for(const token of [
    "const VERSION261='phase261-immersive-fullscreen-spectator';",
    'let immersiveStateV261=',
    'function showImmersiveNoticeV261(){',
    'function applyImmersiveStateV261(',
    'async function enterF1ImmersiveV261(){',
    'requestFullscreen',
    'async function exitF1ImmersiveV261(',
    'document.exitFullscreen',
    "event.key==='Escape'",
    "restoreWorkspaceUserDefaultV259('immersive-exit')",
    'function qaImmersiveV261(){',
    'window.mwsF1EnterImmersiveV261=enterF1ImmersiveV261;',
    'window.mwsF1QaImmersiveV261=qaImmersiveV261;',
    'window.__mwsF1RacingV261=VERSION261;'
  ])if(!racing.includes(token))issues.push('Phase 261 runtime missing: '+token);

  const immersiveBlock=racing.slice(racing.indexOf('function showImmersiveNoticeV261(){'),racing.indexOf('function clampLapCountV260('));
  if(immersiveBlock.includes('persistWorkspaceLayoutRecoveryE('))issues.push('Phase 261 immersive mode must not persist fullscreen workspace geometry');

  for(const token of [
    'id="f1RacingImmersiveV261"',
    '전체화면으로 보기',
    'id="f1RacingImmersiveNoticeV261"',
    '전체화면을 취소하시려면 ESC를 누르세요'
  ])if(!index.includes(token))issues.push('Phase 261 UI missing: '+token);

  for(const token of [
    'body.f1-racing-immersive .sidebar',
    'body.f1-racing-immersive .main>.topbar',
    'body.f1-racing-immersive #gameF1Racing',
    '.f1-racing-immersive-notice-v261.is-visible'
  ])if(!css.includes(token))issues.push('Phase 261 immersive CSS missing: '+token);

  for(const token of [
    'Phase 261 immersive QA failed',
    'Phase 261 sidebar remained visible',
    'Phase 261 immersive layout signature changed'
  ])if(!live.includes(token))issues.push('Phase 261 Recovery H QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:261,name:'f1-immersive-fullscreen-spectator',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase261F1ImmersiveFullscreenAudit();
