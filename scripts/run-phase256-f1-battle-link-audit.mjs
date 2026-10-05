import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase256F1BattleLinkAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<256)issues.push('Phase 256 asset cache missing');

  for(const token of [
    "const VERSION256='phase256-live-battle-link';",
    'const BATTLE_LINK_MAX_LENGTH_V256=88;',
    'function battleLinkSegmentV256(',
    'function ensureBattleLinkLayerV256(){',
    'function syncBattleLinksV256(){',
    "class:'f1-racing-battle-links-v256'",
    "class:'battle-link-line-v256'",
    "class:'battle-link-arrow-v256'",
    'syncBattleLinksV256();',
    'function qaBattleLinksV256(){',
    'window.mwsF1QaBattleLinksV256=qaBattleLinksV256;',
    'window.__mwsF1RacingV256=VERSION256;'
  ])if(!racing.includes(token))issues.push('Phase 256 runtime missing: '+token);

  for(const token of [
    '/* Phase 256: active battle target link on the live track */',
    '@keyframes f1BattleLinkFlowV256',
    '.f1-racing-battle-links-v256',
    '.battle-link-line-v256',
    '.battle-link-arrow-v256',
    'vector-effect:non-scaling-stroke'
  ])if(!css.includes(token))issues.push('Phase 256 CSS missing: '+token);

  for(const token of [
    'mwsF1QaBattleLinksV256',
    'Phase 256 battle link QA failed',
    'Phase 256 battle link rendering invalid'
  ])if(!live.includes(token))issues.push('Phase 256 Recovery H browser QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:256,name:'f1-live-battle-link',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase256F1BattleLinkAudit();
