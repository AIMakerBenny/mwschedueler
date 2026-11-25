import fs from 'node:fs';
import assert from 'node:assert/strict';
const [baseline,candidate]=process.argv.slice(2).map(p=>JSON.parse(fs.readFileSync(p,'utf8')));
assert.deepEqual(candidate.viewport,baseline.viewport);
const differences=[];
for(let i=0;i<baseline.snapshots.length;i++){
 const b=baseline.snapshots[i],c=candidate.snapshots[i];assert.equal(c.label,b.label);
 for(const [key,expected] of Object.entries(b.data)){
  const actual=c.data[key];if(!actual){differences.push({state:b.label,selector:key,reason:'missing'});continue}
  for(const [p,v] of Object.entries(expected.css))if(actual.css[p]!==v)differences.push({state:b.label,selector:key,property:p,expected:v,actual:actual.css[p]});
  for(let j=0;j<4;j++)if(Math.abs(actual.rect[j]-expected.rect[j])>1.5)differences.push({state:b.label,selector:key,rectIndex:j,expected:expected.rect[j],actual:actual.rect[j]});
 }
}
const sum=o=>Object.values(o).reduce((n,x)=>n+x,0);
assert(sum(candidate.api)<=sum(baseline.api),'API count increased');
console.log('CSS_COMPARISON '+JSON.stringify({viewport:candidate.viewport,states:candidate.snapshots.length,baselineCSS:baseline.styles.length,candidateCSS:candidate.styles.length,baselineAPI:baseline.api,candidateAPI:candidate.api,differenceCount:differences.length,differences:differences.slice(0,25)}));
assert.equal(differences.length,0,'Computed styles or layout differed');
