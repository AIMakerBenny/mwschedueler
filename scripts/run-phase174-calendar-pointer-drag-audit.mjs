import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase174CalendarPointerDragAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const css=fs.readFileSync('assets/app-core.css','utf8');

  for(const token of [
    'function beginCalendarPointerEventDragV174(event,node){',
    'function moveCalendarPointerEventDragV174(event){',
    'function endCalendarPointerEventDragV174(event){',
    "saveData('일정 이동');",
    'addEventToCalendarClipboard(id);',
    'calendarSuppressEventClickV174'
  ])if(!core.includes(token))issues.push('Phase 174 runtime missing: '+token);

  // The modern design starts pointer drag only from the explicit drag handle.
  // Binding the entire event card would break ordinary edit/selection clicks.
  if(!core.includes('moveHandle.onpointerdown=e=>{')||
     !core.includes('beginCalendarPointerEventDragV174(e,el);')||
     !core.includes('el.onpointerdown=null;'))
    issues.push('calendar pointer drag is not isolated to the event move handle');
  if(!core.includes("state.source.setAttribute('draggable','false');")||
     !core.includes('if(handle)handle.draggable=calendarPcDragEnabledV174();'))
    issues.push('pointer drag cleanup does not preserve handle-only native drag');
  if(!core.includes("document.body.dataset.deviceMode!=='mobile'"))issues.push('PC pointer drag is not gated away from mobile mode');
  if(!core.includes("document.body.dataset.resolution!=='mobile'"))issues.push('PC pointer drag is not gated away from mobile resolution');
  if(!core.includes('Math.hypot(event.clientX-state.startX,event.clientY-state.startY)'))issues.push('pointer drag has no movement threshold');
  if(!core.includes("if(distance<7)return;"))issues.push('pointer drag threshold changed unexpectedly');
  if(!css.includes('.calendar-event-pointer-ghost-v174{'))issues.push('pointer drag ghost styling is missing');
  if(!css.includes('.mws-calendar-event-pointer-active-v174'))issues.push('pointer drag active-state styling is missing');

  const syntax=spawnSync(process.execPath,['--check','--input-type=commonjs'],{input:core,encoding:'utf8'});
  if(syntax.status!==0)issues.push('assets/app-core.js syntax check failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:174,name:'calendar-pc-pointer-drag-restore',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase174CalendarPointerDragAudit();
