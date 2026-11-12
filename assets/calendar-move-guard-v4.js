/* Calendar V4: local 25-entry movement history for safe, date-checked undo.
 * Existing movements before installing V4 cannot be reconstructed.
 * Never overwrites an event when its current date no longer matches the move.
 */
(function(root){
  'use strict';
  const KEY='mwsCalendarMoveHistoryV4';
  const LIMIT=25;
  const $=id=>document.getElementById(id);
  let memory=[];
  function valid(item){
    return item&&typeof item.id==='string'&&item.id.length>0&&
      /^\d{4}-\d{2}-\d{2}$/.test(item.from||'')&&
      /^\d{4}-\d{2}-\d{2}$/.test(item.to||'')&&
      item.from!==item.to&&Number.isFinite(item.at);
  }
  function read(){
    try{
      const value=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(value)?value.filter(valid).slice(-LIMIT):[];
    }catch(_){return memory.slice()}
  }
  function write(rows){
    memory=rows.slice(-LIMIT);
    try{localStorage.setItem(KEY,JSON.stringify(memory))}catch(_){}
  }
  function last(){
    return read().at(-1)||null;
  }
  function currentEvent(move){
    return Array.isArray(data?.events)
      ?data.events.find(item=>String(item?.id||'')===move.id)
      :null;
  }
  function isUndoable(move){
    const event=move&&currentEvent(move);
    return Boolean(event&&event.date===move.to);
  }
  function updateButton(){
    const button=$('calendarUndoLastMoveV4'),notice=$('calendarMoveStatusV4');
    const move=last(),canUndo=isUndoable(move);
    if(button){
      button.disabled=!canUndo;
      button.title=canUndo?
        `"${move.title||'일정'}" ${move.to}에서 ${move.from}로 되돌리기`:
        '이 컴퓨터에서 되돌릴 수 있는 마지막 이동 기록이 없습니다';
    }
    if(notice){
      notice.hidden=!move||!canUndo;
      if(canUndo){
        notice.textContent=`최근 이동: ${move.title||'일정'} · ${move.from} → ${move.to}. 이동 취소 버튼으로 되돌릴 수 있습니다.`;
      }else notice.textContent='';
    }
  }
  function recordMove(id,from,to,title){
    const move={id:String(id||''),from:String(from||''),to:String(to||''),
      title:String(title||'').slice(0,140),at:Date.now()};
    if(!valid(move))return false;
    const history=read();
    history.push(move);
    write(history);
    updateButton();
    return true;
  }
  function undoLast(){
    const move=last();
    if(!move){toast('이동 취소','이동 기록이 없습니다.');updateButton();return false}
    const event=currentEvent(move);
    if(!event||event.date!==move.to){
      toast('이동 취소','이 일정이 다시 변경돼 자동으로 되돌릴 수 없습니다. 현재 날짜를 확인해 주세요.');
      updateButton();
      return false;
    }
    if(!confirm(`"${event.title||move.title||'일정'}" 일정을 ${move.to}에서 ${move.from}로 되돌리시겠습니까?`))return false;
    const previous=event.date;
    event.date=move.from;
    let saved=false;
    try{saved=saveData('일정 이동 취소')!==false}
    catch(error){console.error('Calendar V4 undo failed',error)}
    if(!saved){
      event.date=previous;
      updateButton();
      toast('이동 취소 실패','저장에 실패했습니다. 날짜가 변경되지 않았습니다.');
      return false;
    }
    const history=read();
    const index=history.findLastIndex(item=>item.id===move.id&&item.from===move.from&&
      item.to===move.to&&item.at===move.at);
    if(index>=0)history.splice(index,1);
    write(history);
    updateButton();
    toast('이동 취소',`${event.title||move.title||'일정'}: ${move.from}로 다시 이동했습니다. 클라우드 동기화 상태를 확인해 주세요.`);
    return true;
  }
  function init(){
    $('calendarUndoLastMoveV4')?.addEventListener('click',undoLast);
    root.addEventListener('mawang:datachange',updateButton);
    root.addEventListener('mws:app-ready',updateButton);
    updateButton();
  }
  root.mwsCalendarMoveGuardV4=Object.freeze({
    recordMove,undoLast,updateButton,last,isUndoable
  });
  init();
})(window);
