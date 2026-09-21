import fs from 'node:fs';

export function runPhase155TierPlannerUiAudit(){
  const issues=[];
  const warnings=[];
  const appCore=fs.readFileSync('assets/app-core.js','utf8');
  const tools=fs.readFileSync('assets/tools.js','utf8');
  const host=fs.readFileSync('assets/content-planner-host.js','utf8');
  const diagnostic=fs.readFileSync('scripts/diagnose-phase155-tier-planner-ui.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!appCore.includes("contentPlanner:'컨텐츠 플래너'")){
    issues.push('contentPlanner common page-title mapping missing');
  }
  if(!host.includes("title.textContent='컨텐츠 플래너'")){
    issues.push('content planner host display title guard missing');
  }

  const restored='background:rgba(255,255,255,.72)!important;color:#111!important;';
  const restoredCount=tools.split(restored).length-1;
  if(restoredCount<2)issues.push('tier rank/title premium background override restoration missing');
  for(const selector of ['#toolTier .mws-tier-rank{','#toolTier .mws-tier-title-v106{']){
    const at=tools.indexOf(selector);
    if(at<0||!tools.slice(at,at+900).includes(restored))issues.push('tier input restored visual contract missing: '+selector);
  }

  for(const token of [
    'rankBackgroundLuma<180',
    "value.plannerTitle!=='컨텐츠 플래너'",
    'Phase155 tier inputs remain dark'
  ])if(!diagnostic.includes(token))issues.push('Phase155 live UI regression guard missing: '+token);

  for(const token of [
    'node --check scripts/run-phase155-tier-planner-ui-audit.mjs',
    'node --check scripts/diagnose-phase155-tier-planner-ui.mjs',
    'Phase 155 live tier planner UI',
    '[phase155] tier controls and planner title'
  ])if(!workflow.includes(token))issues.push('production Phase155 verification missing: '+token);

  const summary={phase:155,name:'tier-planner-ui',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase155TierPlannerUiAudit();
