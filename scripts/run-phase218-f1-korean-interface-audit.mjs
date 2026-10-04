import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase218F1KoreanInterfaceAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<218)issues.push('Phase 218 asset cache missing');
  for(const token of [
    'F1 레이스 관제센터','실시간 순위','트랙 맵','경기 해설',
    '<span>상태 <b id="f1RacingRaceStatusV188">경기 전</b></span>',
    '<span>랩 <b id="f1RacingRaceLapV188">0 / --</b></span>',
    '<span>드라이버 <b id="f1RacingRaceDriverCountV188">0</b></span>',
    '>일시정지</button>','>1배</button>','출발 / 결승선'
  ])if(!index.includes(token))issues.push('Phase 218 visible Korean UI missing: '+token);
  for(const token of [
    "const VERSION218='phase218-korean-interface';",
    "if(isLeader)return '선두';",
    "pause.textContent=simClockV192.paused?'재개':'일시정지';",
    "status.textContent=simClockV192.paused?'일시정지':'진행 중';",
    "timing:Object.freeze({label:'실시간 순위'",
    "track:Object.freeze({label:'트랙 맵'",
    "commentary:Object.freeze({label:'경기 해설'",
    'window.__mwsF1RacingV218=VERSION218;'
  ])if(!racing.includes(token))issues.push('Phase 218 runtime localization missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:218,name:'f1-korean-interface',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase218F1KoreanInterfaceAudit();
