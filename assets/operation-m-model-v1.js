// Operation M: local-only simulated team balancing. No persistence or network dependencies.
export const ROSTER=Object.freeze(['마왕0216','햇비','뽀린걸','유키라','베베리','다키','최또','김웰로','양지팡','스위데','물초코','리냐_LIN…','거대별','박재박','난워니','카푸','고여름_','카노미☆','깡담비','카린야']);
export const ROLE_NAMES=Object.freeze(['우왁굳','고세구!','천양','머독','대월향']);
export const TIERS=Object.freeze(['S','A','B','C','D']);
export const SCORE=Object.freeze({S:5,A:4,B:3,C:2,D:1});
const normalize=s=>String(s??'').normalize('NFKC').trim().toLowerCase();
const plain=s=>normalize(s).replace(/[\s_!☆…\.\-]/g,'');
export function matchContact(name,contacts){
  const list=(Array.isArray(contacts)?contacts:[]).filter(c=>c&&c.id!=null&&c.name);
  const target=normalize(name);
  const exact=list.filter(c=>normalize(c.name)===target);
  if(exact.length)return exact.length===1?exact[0]:null;
  const partial=/…$/.test(name),key=plain(name);
  const matches=list.filter(c=>partial?plain(c.name).startsWith(key):plain(c.name)===key);
  return matches.length===1?matches[0]:null;
}
export function defaultState(){return{links:{},tiers:{},roles:Array(5).fill(''),teams:[]}}
export function normalizeState(raw){
  const s=defaultState();if(!raw||typeof raw!=='object')return s;
  const used=new Set();
  for(const name of ROSTER){
    const id=String(raw.links?.[name]||'');
    if(id&&!used.has(id)){s.links[name]=id;used.add(id)}
    if(TIERS.includes(raw.tiers?.[name]))s.tiers[name]=raw.tiers[name];
  }
  for(let i=0;i<5;i++){const id=String(raw.roles?.[i]||'');if(id&&!used.has(id)){s.roles[i]=id;used.add(id)}}
  if(Array.isArray(raw.teams)&&raw.teams.length===4&&raw.teams.every(t=>Array.isArray(t)&&t.length===5)){
    const flat=raw.teams.flat();
    if(new Set(flat).size===20&&flat.every(n=>ROSTER.includes(n)&&TIERS.includes(s.tiers[n])))s.teams=raw.teams.map(t=>[...t]);
  }
  return s;
}
export function syncContacts(state,contacts){
  const list=(Array.isArray(contacts)?contacts:[]).filter(c=>c&&c.id!=null&&c.name);
  const byId=new Map(list.map(c=>[String(c.id),c]));
  const used=new Set([...Object.values(state.links),...state.roles].filter(Boolean));
  // Existing IDs are authoritative even when the name changes; never replace a missing linked contact silently.
  for(const name of ROSTER)if(!state.links[name]){
    const c=matchContact(name,list),id=c&&String(c.id);
    if(id&&!used.has(id)){state.links[name]=id;used.add(id)}
  }
  return{byId,missing:ROSTER.filter(n=>!byId.has(state.links[n]))};
}
function shuffle(list,rng){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function subsets(k){return Array.from({length:16},(_,m)=>[0,1,2,3].filter(i=>m&(1<<i))).filter(a=>a.length===k)}
// Each tier gives every team floor(count/4) players; enumerate its remainder placements.
// Among feasible teams of five, minimize max-min weighted score, then squared score deviations.
// Randomize equivalent optimal placements and member order, not the balance objective.
export function balancedDraft(ratings,rng=Math.random){
  if(!ROSTER.every(n=>TIERS.includes(ratings?.[n])))throw new Error('모든 참가자의 티어를 지정하세요.');
  const pools=TIERS.map(t=>shuffle(ROSTER.filter(n=>ratings[n]===t),rng));
  const base=pools.map(p=>Math.floor(p.length/4)),rem=pools.map(p=>p.length%4);
  const baseSize=base.reduce((a,b)=>a+b,0);
  const baseScore=base.reduce((a,b,i)=>a+b*SCORE[TIERS[i]],0);
  const sizes=Array(4).fill(baseSize),scores=Array(4).fill(baseScore);
  let best=null,bestSpread=Infinity,bestSquare=Infinity,ties=0;
  const chosen=[];
  function visit(k){
    if(k===TIERS.length){
      if(sizes.some(n=>n!==5))return;
      const spread=Math.max(...scores)-Math.min(...scores),square=scores.reduce((a,b)=>a+b*b,0);
      if(spread<bestSpread||(spread===bestSpread&&square<bestSquare)){bestSpread=spread;bestSquare=square;ties=0;best=null}
      if(spread===bestSpread&&square===bestSquare&&(!best||rng()<1/(++ties))){best=chosen.map(a=>[...a]);if(ties===0)ties=1}
      return;
    }
    const weight=SCORE[TIERS[k]];
    for(const extra of subsets(rem[k])){
      if(extra.some(i=>sizes[i]>=5))continue;
      for(const i of extra){sizes[i]++;scores[i]+=weight}
      chosen.push(extra);visit(k+1);chosen.pop();
      for(const i of extra){sizes[i]--;scores[i]-=weight}
    }
  }
  visit(0);if(!best)throw new Error('팀 배정 불가');
  const teams=Array.from({length:4},()=>[]);
  pools.forEach((pool,k)=>{let n=0;for(let i=0;i<4;i++)for(let j=0;j<base[k];j++)teams[i].push(pool[n++]);for(const i of best[k])teams[i].push(pool[n++])});
  return teams;
}
export function teamStats(team,ratings){const counts=Object.fromEntries(TIERS.map(t=>[t,0]));let score=0;for(const n of team){const t=ratings[n];if(TIERS.includes(t)){counts[t]++;score+=SCORE[t]}}return{counts,score}}
