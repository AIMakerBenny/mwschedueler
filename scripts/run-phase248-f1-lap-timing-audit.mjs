import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase248F1LapTimingAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<248)issues.push('Phase 248 asset cache missing');
  for(const token of [
    "const VERSION248='phase248-live-lap-sector-timing';",
    'lastLapMs:0,bestLapMs:0,lapTimesMs:[]',
    'function updateLapTimingV248(',
    'function formatLapTimeV248(',
    'function formatSectorTimeV248(',
    'updateLapTimingV248(vehicle,previousRaceProgressV248,stepMs,activeRaceSnapshotV187?.track);',
    "const last=row.querySelector('.last');if(last)last.textContent=formatLapTimeV248(vehicle.lastLapMs);",
    "const best=row.querySelector('.best');if(best)best.textContent=formatLapTimeV248(vehicle.bestLapMs);",
    'function qaLapTimingV248(',
    'window.mwsF1QaLapTimingV248=qaLapTimingV248;',
    'window.__mwsF1RacingV248=VERSION248;'
  ])if(!racing.includes(token))issues.push('Phase 248 runtime missing: '+token);
  if(!racing.includes("if(previous<0&&current>=0)"))issues.push('Phase 248 first start-line arming guard missing');
  if(!racing.includes("resetLapSectorTimingV248(vehicle,crossingMs);"))issues.push('Phase 248 sector reset on lap completion missing');
  if(!racing.includes("lapTimesMs:Object.freeze([...(vehicle.lapTimesMs||[])])"))issues.push('Phase 248 result rows do not retain lap history');
  for(const token of ['mwsF1QaLapTimingV248','Phase 248 multi-lap engine timing failed','Phase 248 timing board still shows lap placeholders'])if(!live.includes(token))issues.push('Phase 248 Recovery H multi-lap QA missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:248,name:'f1-live-lap-sector-timing',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase248F1LapTimingAudit();
