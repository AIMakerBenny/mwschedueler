import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase223F1TrackProfileUiAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<223)issues.push('Phase 223 asset cache missing');
  for(const token of [
    "const VERSION223='phase223-track-profile-ui';",
    'function trackProfileV223(track){',
    "const overtakeDifficulty=overtakeScore>=5.3?'쉬움':overtakeScore>=4.1?'보통':'어려움';",
    "'예상 추월 난이도 <b>'+track.profile.overtakeDifficulty",
    "'내부 트랙 데이터 기준'",
    'function qaTrackProfileUiV223(){',
    'window.mwsF1QaTrackProfileUiV223=qaTrackProfileUiV223;',
    'window.__mwsF1RacingV223=VERSION223;'
  ])if(!racing.includes(token))issues.push('Phase 223 runtime/profile missing: '+token);
  for(const token of ['/* Phase 223: track profile cards */','.f1-racing-track-card-type-v223{','.f1-racing-track-card-profile-v223{'])
    if(!css.includes(token))issues.push('Phase 223 CSS missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:223,name:'f1-track-profile-ui',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase223F1TrackProfileUiAudit();
