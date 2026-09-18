import fs from 'node:fs';

export function runPhase52NotebookPlannerOrderAudit(){
  const issues=[];
  const warnings=[];
  const planner=fs.readFileSync('assets/content-planner-host.js','utf8');
  const css=fs.readFileSync('assets/app-core.css','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');

  if(!planner.includes("const memos=document.querySelector('.nav button[data-tab=\"memos\"]')"))issues.push('content planner is not anchored to the notebook menu');
  if(!planner.includes("memos.insertAdjacentElement('afterend',button)"))issues.push('content planner is not inserted directly after the notebook menu');
  if(planner.includes("posts.insertAdjacentElement('afterend',button)"))issues.push('content planner is still forced directly after posts');
  if(!css.includes('#memoLibraryTab{order:0!important}'))issues.push('notebook tab order is not pinned first');
  if(!css.includes('#memoFavoritesTab{order:1!important}'))issues.push('favorites tab order is not pinned second');
  if(!core.includes("if(tab==='memos')safeRenderView('메모',()=>setMemoView('library'))"))issues.push('entering notebook does not reset to the library view');

  const libraryPos=index.indexOf('id="memoLibraryTab"');
  const favoritePos=index.indexOf('id="memoFavoritesTab"');
  if(libraryPos<0||favoritePos<0||libraryPos>favoritePos)issues.push('memo tab DOM order is not notebook then favorites');
  if(!index.includes('assets/app-core.css?v=1.3.0-order52'))issues.push('app-core stylesheet cache-bust was not advanced');
  if(!perf.includes('content-planner-host.js?v=1.3.0-order53'))issues.push('content planner host cache-bust was not advanced');

  const summary={phase:52,name:'notebook-content-planner-order',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase52NotebookPlannerOrderAudit();
