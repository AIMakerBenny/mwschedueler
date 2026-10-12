/* Test the isolated v1.1 kernel: node scripts/qa-f1-unified-v11.cjs
   This is NOT a complete racing/visual/AI acceptance test. */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/f1-unified-physics-v11.js'),'utf8');
const context={window:{}};
vm.createContext(context);
vm.runInContext(source,context,{filename:'f1-unified-physics-v11.js'});
const physics=context.window.MWSF1UnifiedV11;
if(!physics)throw Error('Unified module did not load');
const report=physics.selfTest();
for(const [key,passed] of Object.entries(report.checks)){
 process.stdout.write((passed?'PASS':'FAIL')+' '+key+'\n');
}
if(!report.allPass)process.exitCode=1;
