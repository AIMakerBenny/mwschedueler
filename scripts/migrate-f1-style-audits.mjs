// One-time migration of legacy static phase checks to verified bundle input.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const paths=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(p=>/^scripts\/run-phase.*f1.*audit\.mjs$/.test(p));
const changed=[],unresolved=[];
for(const file of paths){let s=fs.readFileSync(file,'utf8');if(!/f1-racing[^'"\s]+\.css\?/.test(s))continue;
 if(s.includes('readF1AuditIndex'))continue;
 const re=/(?:fs\.)?readFileSync\(\s*['"]index\.html['"]\s*,\s*['"]utf8['"]\s*\)/g;
 const out=s.replace(re,'readF1AuditIndex()');
 if(out===s){unresolved.push(file);continue}
 fs.writeFileSync(file,"import {readF1AuditIndex} from './f1-style-audit-input.mjs';\n"+out);changed.push(file);
}
console.log('F1_AUDIT_MIGRATION '+JSON.stringify({changed,unresolved}));
if(unresolved.length)process.exitCode=1;
