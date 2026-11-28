import test from 'node:test';
import assert from 'node:assert/strict';
import {ROSTER,TIERS,SCORE,ROLE_NAMES,rosterContactName,matchContact,normalizeState,syncContacts,balancedDraft,teamStats} from '../assets/operation-m-model-v1.js';
test('roster is exactly 20; roles are not included',()=>{assert.equal(ROSTER.length,20);assert.equal(new Set(ROSTER).size,20);assert.equal(ROLE_NAMES.length,5);assert(ROLE_NAMES.every(n=>!ROSTER.includes(n)))});
test('contact sync preserves ids, rejects ambiguous truncated names and duplicates',()=>{
 const contacts=ROSTER.map((n,i)=>({id:String(i),name:n==='리냐_LIN…'?'리냐_LINA':n==='카노미☆'?'카노':rosterContactName(n),image:'/media/contact/'+i}));
 const s=normalizeState(null);assert.equal(syncContacts(s,contacts).missing.length,0);
 contacts[0].name='변경된 이름';assert.equal(syncContacts(s,contacts).byId.get(s.links[ROSTER[0]]).name,'변경된 이름');
 assert.equal(matchContact('리냐_LIN…',[{id:'a',name:'리냐_LINA'},{id:'b',name:'리냐_LINB'}]),null);
 assert.equal(syncContacts(s,contacts.slice(1)).missing.length,1);
 assert.equal(s.links[ROSTER[0]],'0');
 const duplicate=normalizeState({links:{[ROSTER[0]]:'x',[ROSTER[1]]:'x'}});assert.equal(Object.keys(duplicate.links).length,1);
});
function check(ratings){const teams=balancedDraft(ratings);assert(teams.every(t=>t.length===5));assert.deepEqual([...teams.flat()].sort(),[...ROSTER].sort());const stats=teams.map(t=>teamStats(t,ratings));for(const tier of TIERS){const counts=stats.map(s=>s.counts[tier]);assert(Math.max(...counts)-Math.min(...counts)<=1)}assert.equal(stats.reduce((a,b)=>a+b.score,0),Object.values(ratings).reduce((a,b)=>a+SCORE[b],0));return stats}
test('uniform, skewed, and balanced tier distributions',()=>{for(const t of TIERS)check(Object.fromEntries(ROSTER.map(n=>[n,t])));const stats=check(Object.fromEntries(ROSTER.map((n,i)=>[n,TIERS[i%5]])));assert(stats.every(s=>s.score===15));check(Object.fromEntries(ROSTER.map((n,i)=>[n,i===0?'S':'D'])))});
test('all 10626 distributions of twenty players across five tiers remain feasible',()=>{for(let a=0;a<=20;a++)for(let b=0;b<=20-a;b++)for(let c=0;c<=20-a-b;c++)for(let d=0;d<=20-a-b-c;d++){const counts=[a,b,c,d,20-a-b-c-d];const ts=counts.flatMap((count,i)=>Array(count).fill(TIERS[i]));check(Object.fromEntries(ROSTER.map((n,i)=>[n,ts[i]])))}});
test('rejects partial ratings and invalid stored teams',()=>{assert.throws(()=>balancedDraft({}));assert.deepEqual(normalizeState({teams:[[],[],[],[]]}).teams,[])});

test('corrected participant names resolve from actual contact spelling while preserving legacy saved IDs',()=>{
 const s=normalizeState(null),contacts=[{id:'correct-y',name:'양지랖'},{id:'wrong-y',name:'양지팡'},{id:'k',name:'카노'}];syncContacts(s,contacts);assert.equal(s.links['양지팡'],'correct-y');assert.equal(s.links['카노미☆'],'k');assert.equal(rosterContactName('양지팡'),'양지랖');
 const saved=normalizeState({links:{'양지팡':'correct-y'},tiers:{'양지팡':'S'}});syncContacts(saved,contacts);assert.equal(saved.tiers['양지팡'],'S');assert.equal(saved.links['양지팡'],'correct-y');
 const modern=normalizeState({links:{'양지랖':'correct-y'},tiers:{'양지랖':'A'}});assert.equal(modern.links['양지팡'],'correct-y');assert.equal(modern.tiers['양지팡'],'A');
 const ambiguous=normalizeState(null);syncContacts(ambiguous,[{id:'a',name:'양지랖'},{id:'b',name:'양지랖'}]);assert.equal(ambiguous.links['양지팡'],undefined);
});
