import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase311F1LongRunPerformanceAudit(){
 const issues=[],warnings=[];
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phase267=fs.readFileSync('scripts/run-phase267-f1-integrated-spectator-desktop-audit.mjs','utf8');
 const phase282=fs.readFileSync('scripts/run-phase282-f1-dialogue-long-run-desktop-audit.mjs','utf8');

 for(const token of [
  'const frameDeltas311=[];',
  'framePacing311.samples>=60',
  'framePacing311.p95Ms<=90&&framePacing311.maxMs<=350',
  'framePacing311.liveCards<=1&&framePacing311.dialogueCards<=1',
  'Phase 311 frame pacing regression',
  'Phase 311 overlay DOM bound regression',
  'phase311FramePacing:framePacing311'
 ])if(!diag.includes(token))issues.push('Phase 311 Recovery H performance contract missing: '+token);

 for(const token of ["Object.freeze({id:'3x5'","Object.freeze({id:'6x10'","Object.freeze({id:'12x20'",'Phase 267 10+-driver 20-lap case failed']){
  if(!phase267.includes(token)&&!diag.includes(token))issues.push('Phase 311 long-run stress coverage missing: '+token);
 }
 for(const token of ['Phase 282 seven-track benchmark failed','Phase 282 dialogue memory bounds failed']){
  if(!phase282.includes(token)&&!diag.includes(token))issues.push('Phase 311 long-run dialogue coverage missing: '+token);
 }

 const syntax=spawnSync(process.execPath,['--check','scripts/diagnose-recovery-h-f1-live.mjs'],{encoding:'utf8'});
 if(syntax.status!==0)issues.push('Recovery H syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

 const result={phase:311,name:'f1-long-run-performance-closure',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase311F1LongRunPerformanceAudit();
