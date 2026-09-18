import fs from 'node:fs';

export function runPhase53SidebarToolWorkspaceAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const tools=fs.readFileSync('assets/tools.js','utf8');

  if(!core.includes("toolRelations:'인물 관계도'"))issues.push('toolRelations still falls back to its internal id in the visible page title');
  if(!tools.includes("relations:'toolRelations'"))issues.push('relationship tool internal id changed and may break saved links or compatibility');
  if(!tools.includes("relationTitle==='toolRelations'?LABEL.relations:relationTitle"))issues.push('legacy toolRelations title is not migrated to the visible Korean label');
  if(!tools.includes("#toolRelations .mws-relation-board{width:100%!important;max-width:none!important"))issues.push('relationship grid workspace is not full-width on PC');
  if(!tools.includes("#toolRelations .mws-contact-drawer{width:100%!important;max-width:none!important"))issues.push('relationship contact drawer is not full-width with the workspace');
  if(!tools.includes("const NAV_GROUP_TABS={tools:['toolTier','toolMatrix','toolRelations'],games:['gameMajoku','gameLadder','gameRps','gamePachinko','gameMultiDraw']}"))issues.push('sidebar tool and minigame groups are not explicitly defined');
  if(!tools.includes("const out={tools:true,games:true}"))issues.push('sidebar groups do not default to the existing expanded behavior');
  if(!tools.includes("bindNavGroup(n,d,'tools','도구');bindNavGroup(n,mini,'games','미니게임')"))issues.push('tool and minigame dividers are not wired as collapsible controls');
  if(!tools.includes("localStorage.setItem(NAV_GROUP_PREFS_KEY"))issues.push('sidebar group state is not saved as a device-local preference');

  const summary={phase:53,name:'sidebar-tool-workspace',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase53SidebarToolWorkspaceAudit();
