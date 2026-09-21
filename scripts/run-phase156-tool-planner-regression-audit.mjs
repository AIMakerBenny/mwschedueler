import fs from 'node:fs';

export function runPhase156ToolPlannerRegressionAudit(){
  const issues=[];
  const warnings=[];
  const appCore=fs.readFileSync('assets/app-core.js','utf8');
  const tools=fs.readFileSync('assets/tools.js','utf8');
  const host=fs.readFileSync('assets/content-planner-host.js','utf8');
  const diagnostic=fs.readFileSync('scripts/diagnose-phase156-tool-planner-regression.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!appCore.includes("contentPlanner:'컨텐츠 플래너'"))issues.push('common content planner title mapping regressed');
  for(const token of [
    "button.title='컨텐츠 플래너'",
    '<span class="nav-label">컨텐츠 플래너</span>',
    "title.textContent='컨텐츠 플래너'"
  ])if(!host.includes(token))issues.push('content planner display label contract missing: '+token);

  const restored='background:rgba(255,255,255,.72)!important;color:#111!important;';
  if(tools.split(restored).length-1<2)issues.push('tier input visibility restoration regressed');

  for(const token of [
    "const frames=['classic','workshop','agenda','messenger','material','linear','notion','glass','studio','brutal'];",
    "if(info.contrast<3)",
    "if(title==='contentPlanner'||navLabel==='contentPlanner'||navTitle==='contentPlanner')",
    'Phase156 regression failures'
  ])if(!diagnostic.includes(token))issues.push('Phase156 live regression guard missing: '+token);

  for(const token of [
    'node --check scripts/diagnose-phase156-tool-planner-regression.mjs',
    'node --check scripts/run-phase156-tool-planner-regression-audit.mjs',
    'Phase 156 live tool planner regression'
  ])if(!workflow.includes(token))issues.push('production Phase156 verification missing: '+token);

  const summary={phase:156,name:'tool-planner-regression',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase156ToolPlannerRegressionAudit();
