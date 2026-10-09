import {readFileSync} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
export function runPhase401F1SkillAudit(){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),js=readFileSync(path.join(root,'assets/f1-racing-v1.js'),'utf8');
 const css=readFileSync(path.join(root,'assets/f1-racing-r401.css'),'utf8'),html=readFileSync(path.join(root,'index.html'),'utf8');const issues=[];
 const test=(condition,description)=>{if(!condition)issues.push(description)};
 test(js.includes("window.__mwsF1RacingV401='phase401-ultimate-rank-boost'"),'runtime missing');
 test(js.includes('function specialChanceV401(')&&js.includes('Math.pow(rear,1.5)'),'rank-weighted probability missing');
 test(js.includes('function playSpecialV401(token)')&&js.includes('SPECIAL_V401.chainLimit'),'chain sequence missing');
 test(js.includes('simClockV192.paused=true')&&js.includes('simClockV192.paused=false'),'cinematic freeze missing');
 test(js.includes('maxTarget+=specialEffectV401.bonus')&&js.includes('accelMps2*=specialEffectV401.accel'),'real physical boost absent');
 test(js.includes('tickSpecialV401(stepMs)')&&js.includes('resetSpecialV401();'),'lifecycle integration missing');
 test(js.includes('if(physicalClosureV386.active)maxTarget=Math.min(maxTarget,physicalClosureV386.capKph);'),'collision protection removed');
 test(css.includes('#f1SkillStageV401')&&css.includes('.f1-grid-gacha-dock-item-v313'),'UI styling absent');
 test(js.includes('maxCardHeight:455')&&html.includes('assets/f1-racing-r401.css?phase=401')&&html.includes('&skill401=1'),'Gacha expansion or cache update absent');
 const section=js.split('// Phase 401: sequential ultimate-skill animations')[1]?.split('function simulateRaceStepV192(stepMs){')[0]||'';
 test(!/\b(?:raceProgress|progress|travel)\s*=/.test(section),'forced progress movement forbidden');
 return {phase:401,issues,warnings:[],pass:issues.length===0};
}
if(import.meta.url==='file://'+process.argv[1]){const r=runPhase401F1SkillAudit();console.log(JSON.stringify(r));if(!r.pass)process.exitCode=1}
