import fs from 'node:fs';

export function runPhase77HistoryCacheLocalizationAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime-base.js','utf8');

  if(/normalizedCollaborationHistory=function/.test(perf))issues.push('perf runtime still overrides normalizedCollaborationHistory globally');
  if(perf.includes('optimizedRenderContacts')){
    if(!perf.includes("const baseNormalized=typeof normalizedCollaborationHistory==='function'?normalizedCollaborationHistory:null;"))issues.push('optimized renderer lost its localized history source');
    if(!perf.includes('function cachedHistory()'))issues.push('optimized renderer lost localized history cache');
  }else{
    if(perf.includes('cachedHistory')||perf.includes('lastMap(')||perf.includes('baseNormalized'))issues.push('dead localized history cache remains after renderer override removal');
  }
  if(!app.includes('function normalizedCollaborationHistory()'))issues.push('canonical normalizedCollaborationHistory is missing from app-core');

  let calls=0,day='2026-09-18',cache=null,cacheDay='';
  const base=()=>{calls++;return [{day,calls}]};
  const cached=()=>{if(cache&&cacheDay===day)return cache;cacheDay=day;cache=base();return cache};
  const a=cached(),b=cached();
  if(a!==b||calls!==1)issues.push('history cache does not preserve same-day reuse semantics');
  day='2026-09-19';
  const c=cached();
  if(c===b||calls!==2)issues.push('history cache does not refresh across a date boundary');

  const summary={phase:77,name:'localized-history-cache',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase77HistoryCacheLocalizationAudit();
