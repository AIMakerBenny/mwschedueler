import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase181F1ContactParticipantsAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const js=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of ['id="f1RacingContactSearchV181"','id="f1RacingContactListV181"','id="f1RacingSelectedListV181"','id="f1RacingSelectedCountV181"','id="f1RacingClearDriversV181"','드라이버 참가자'])if(!index.includes(token))issues.push('Phase 181 participant UI missing: '+token);
  for(const token of ['window.mwsGetF1ContactsV181=()=>Object.freeze((data.contacts||[])','.filter(c=>!c.pendingSetup)',"window.mwsF1ContactMatchesV181=(contactRow,q=''", "window.__mwsF1ContactBridgeV181='readonly-contact-snapshot';"])if(!core.includes(token))issues.push('Phase 181 read-only contact bridge missing: '+token);
  for(const token of ["const VERSION181='phase181-participants';",'const selectedIds=[];','function renderContacts(){','function renderSelected(){','function toggleDriver(id){','function getSelectedContactIds(){return selectedIds.slice()}','window.mwsF1GetSelectedContactIdsV181=getSelectedContactIds;','window.mwsRenderF1RacingV181=render;','window.__mwsF1RacingV181=VERSION181;'])if(!js.includes(token))issues.push('Phase 181 participant runtime missing: '+token);
  for(const token of ['.f1-racing-setup-v181{','.f1-racing-contact-list-v181{','.f1-racing-selected-list-v181{','.f1-racing-selected-row-v181{'])if(!css.includes(token))issues.push('Phase 181 participant CSS missing: '+token);
  if(js.includes('localStorage.setItem')||js.includes('saveData(')||js.includes('persist('))issues.push('F1 participant selector must not persist or mutate MWS data in Phase 181');
  for(const token of ['node --check scripts/run-phase181-f1-contact-participants-audit.mjs',"echo '[phase181] F1 Racing contact-backed participant selector'", "window.__mwsF1ContactBridgeV181='readonly-contact-snapshot';",'window.__mwsF1RacingV181=VERSION181;'])if(!workflow.includes(token))issues.push('Phase 181 production verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 participant runtime syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:181,name:'f1-contact-participants',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase181F1ContactParticipantsAudit();
