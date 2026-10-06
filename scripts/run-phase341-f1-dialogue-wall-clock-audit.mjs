import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase341F1DialogueWallClockAudit(){
 const issues=[],warnings=[],hud=fs.readFileSync('assets/f1-racing-r308.js','utf8'),index=fs.readFileSync('index.html','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION341HUD='phase341-dialogue-wall-clock-lifetime';",
  'lastGlobalWallMs:-Infinity',
  'const now=Date.now()',
  'stateV308.lastGlobalWallMs=now',
  'function clearExpiredHudV308(){',
  'window.mwsF1QaDialogueWallClockV341=function(){',
  'window.__mwsF1RacingHudV341=VERSION341HUD;'
 ])if(!hud.includes(token))issues.push('Phase 341 HUD missing: '+token);
 const functionSlice=(name,next)=>{const start=hud.indexOf('function '+name+'('),end=hud.indexOf('\nfunction '+next+'(',start+10);return start>=0&&end>start?hud.slice(start,end):''};
 for(const [name,next] of [['hudCanShowV308','showHudV308'],['showHudV308','clearExpiredHudV308'],['clearExpiredHudV308','syncConversationV308']]){
  const source=functionSlice(name,next);
  if(!source)issues.push('Phase 341 function missing: '+name);
  else if(source.includes('simTimeMs'))issues.push('Phase 341 '+name+' still uses simulation time');
  if(source&&!source.includes('Date.now()'))issues.push('Phase 341 '+name+' is not wall-clock based');
 }
 if(!index.includes('assets/f1-racing-r308.js?phase=308&wall=341'))issues.push('Phase 341 cache link missing');
 for(const token of ['Phase 341 runtime did not propagate to Recovery H browser','Phase 341 dialogue HUD is still tied to race playback speed'])if(!diag.includes(token))issues.push('Phase 341 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-r308.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase341-f1-dialogue-wall-clock-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:341,name:'f1-dialogue-wall-clock',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase341F1DialogueWallClockAudit();
