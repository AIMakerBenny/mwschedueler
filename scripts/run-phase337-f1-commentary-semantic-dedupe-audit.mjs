import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase337F1CommentarySemanticDedupeAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION337='phase337-f1-commentary-semantic-dedupe';",
  'const COMMENTARY_SEMANTIC_CONFIG_V337=Object.freeze({',
  'mistakeWallGapMs:8500',
  'function commentarySemanticKeyV337(',
  "if(key==='PIT'){commentarySemanticV337.suppressed+=1;return false}",
  'const now=Date.now()',
  'if(!commentarySemanticAllowsV337(text,type))return false;',
  'function qaCommentarySemanticDedupeV337(){',
  'window.mwsF1QaCommentarySemanticDedupeV337=qaCommentarySemanticDedupeV337;',
  'window.__mwsF1RacingV337=VERSION337;'
 ])if(!core.includes(token))issues.push('Phase 337 core missing: '+token);
 const configMatch=core.match(/COMMENTARY_SEMANTIC_CONFIG_V337=Object\.freeze\(\{defaultWallGapMs:(\d+),mistakeWallGapMs:(\d+),openingWallGapMs:(\d+),exactWallGapMs:(\d+)\}/);
 if(!configMatch||Number(configMatch[2])<8000||Number(configMatch[4])<6000)issues.push('Phase 337 semantic cooldowns are too weak');
 for(const token of ['Phase 337 runtime did not propagate to Recovery H browser','Phase 337 commentary semantic dedupe QA failed'])if(!diag.includes(token))issues.push('Phase 337 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase337-f1-commentary-semantic-dedupe-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:337,name:'f1-commentary-semantic-dedupe',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase337F1CommentarySemanticDedupeAudit();
