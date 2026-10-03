import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase176WorkspaceOrganizationAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const cloud=fs.readFileSync('assets/cloud-v1.1.js','utf8');
  const cloudNext=fs.readFileSync('assets/cloud-runtime-v130.js','utf8');
  const auth=fs.readFileSync('src/cf-v111-auth.js','utf8');
  const ui=fs.readFileSync('assets/workspace-ui-v176.js','utf8');
  const css=fs.readFileSync('assets/workspace-ui-v176.css','utf8');
  const postLogin=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');
  const planner=fs.readFileSync('assets/content-planner-host.js','utf8');
  const wardogs=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const wardogsCss=fs.readFileSync('assets/wardogs-v1.css','utf8');

  if(/<button[^>]+data-tab="worldtime"/.test(index))issues.push('world time still has a standalone sidebar button');
  if(/<button[^>]+data-tab="targets"/.test(index))issues.push('target list still has a standalone sidebar button');
  if(!index.includes('data-dashboard-mode="worldtime"'))issues.push('dashboard world-time tab is missing');
  if(!index.includes('id="dashboardGoCalendarBtnV176"'))issues.push('dashboard calendar navigation button is missing');
  if(index.includes('id="toggleUpcomingDashboardBtn"'))issues.push('obsolete dashboard upcoming hide button remains');

  for(const token of [
    "patchNotes:[]","suggestions:[]",
    "if(!Array.isArray(data.patchNotes))data.patchNotes=[];",
    "if(!Array.isArray(data.suggestions))data.suggestions=[];",
    "contentPlanner:'그림판'"
  ])if(!core.includes(token))issues.push('app-core Phase 176 data/name integration missing: '+token);

  for(const [name,src] of [['cloud-v1.1',cloud],['cloud-runtime-v130',cloudNext]]){
    if(!src.includes('patchNotes:clone(Array.isArray(d.patchNotes)?d.patchNotes:[])'))issues.push(name+' does not persist patch notes in notebook part');
    if(!src.includes('suggestions:clone(Array.isArray(d.suggestions)?d.suggestions:[])'))issues.push(name+' does not persist suggestions in notebook part');
    if(!src.includes('patchNotes:[],suggestions:[]'))issues.push(name+' fresh skeleton omits new notebook collections');
  }
  if(!auth.includes('patchNotes:Array.isArray(src.patchNotes)?src.patchNotes:[]'))issues.push('server notebook normalization drops patch notes');
  if(!auth.includes('suggestions:Array.isArray(src.suggestions)?src.suggestions:[]'))issues.push('server notebook normalization drops suggestions');

  for(const token of [
    "world.classList.remove('section')",
    "activateDashboardModeV176('worldtime')",
    'data-friend-view-v176="targets"',
    "window.setTab?.('friendFinder')",
    "id='memoPatchTabV176'",
    "id='memoSuggestionTabV176'",
    "d.patchNotes.push(row)",
    "d.suggestions.push(row)",
    "createdAt:new Date().toISOString()",
    "save(composerTypeV176==='patch'?'패치노트 추가':'건의함 추가')",
    "button.title='그림판'"
  ])if(!ui.includes(token))issues.push('workspace runtime missing: '+token);
  if(!css.includes('.mws-note-card-v176{'))issues.push('patch/suggestion card styling is missing');
  if(!css.includes('.mws-friend-tabs-v176{'))issues.push('friend/target tab styling is missing');

  if(!postLogin.includes("loadStyle('workspace-ui-v176'"))issues.push('workspace stylesheet is not post-login loaded');
  if(!postLogin.includes("load('workspace-ui-v176'"))issues.push('workspace runtime is not post-login loaded');
  if(!entry.includes('post-login-runtime-v130.js?v=1.4.0-phase176-workspace-ui'))issues.push('Phase 176 post-login cache revision is not active');

  if(!planner.includes("title.textContent='그림판'"))issues.push('content planner page title was not renamed to 그림판');
  if(!planner.includes("button.title='그림판'"))issues.push('content planner nav title was not renamed to 그림판');
  if(!planner.includes('<span class="nav-label">그림판</span>'))issues.push('content planner nav label was not renamed to 그림판');

  if(!index.includes('data-wardogs-class="all"'))issues.push('WARDOGS all tab is missing from index');
  if(!wardogs.includes("const VIEW_CLASSES=Object.freeze([\n  {id:'all',name:'전체',code:'ALL',label:'전체'}"))issues.push('WARDOGS all view model is missing');
  if(!wardogs.includes("let activeClass='all';"))issues.push('WARDOGS does not open on all view');
  if(!wardogs.includes("const source=classId==='all'"))issues.push('WARDOGS all view does not aggregate cards');
  if(!wardogs.includes("views:VIEW_CLASSES"))issues.push('WARDOGS view metadata does not expose all tab');
  if(!wardogsCss.includes('grid-template-columns:repeat(8,minmax(0,1fr))'))issues.push('WARDOGS desktop tab grid is not expanded to eight views');

  const syntaxFiles=[
    'assets/workspace-ui-v176.js','assets/post-login-runtime-v130.js',
    'assets/cloud-runtime-v130.js',
    'assets/content-planner-host.js','assets/wardogs-v1.js',
    'src/cf-v111-auth.js','src/cf-v111-entry.js'
  ];
  for(const file of syntaxFiles){
    const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(check.status!==0)issues.push(file+' syntax check failed: '+String(check.stderr||check.stdout||'').trim());
  }

  const result={phase:176,name:'workspace-navigation-notebook-wardogs-organization',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase176WorkspaceOrganizationAudit();
