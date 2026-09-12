/* CF MWS V1.0.12 Content Planner patch
   - Save now creates or updates the proposal archive entry
   - Removes the separate proposal submit button
   - Adds a thin right and bottom canvas margin
*/
(()=>{
  'use strict';
  if(window.__mwsPlannerV1012Patch)return;
  window.__mwsPlannerV1012Patch=true;

  function installStyle(){
    if(document.getElementById('mwsPlannerV1012Style'))return;
    const style=document.createElement('style');
    style.id='mwsPlannerV1012Style';
    style.textContent=`
      .board-wrap{background:#060911!important}
      #board{
        width:calc(100% - 10px)!important;
        height:calc(100% - 10px)!important;
        inset:auto!important;
        left:0!important;
        top:0!important;
        right:auto!important;
        bottom:auto!important;
      }
    `;
    document.head.appendChild(style);
  }

  function removeSubmitButton(){
    document.querySelectorAll('button[onclick*="openSubmitModal"]').forEach(btn=>{
      if((btn.textContent||'').includes('기획안 제출'))btn.remove();
    });
  }

  function findSaveButton(){
    const modal=document.getElementById('canvasInfoModal');
    if(!modal)return null;
    const button=[...modal.querySelectorAll('button')].find(btn=>{
      const onclick=String(btn.getAttribute('onclick')||'');
      return onclick.includes('saveCanvasInfo')||(btn.textContent||'').trim()==='저장';
    })||null;
    if(button&&!button.id)button.id='canvasInfoSaveBtn';
    return button;
  }

  async function saveCanvasInfoV1012(){
    const btn=findSaveButton();
    const oldLabel=btn?.textContent||'저장';
    const ids=[...canvasInfoParticipantSelectionV110];
    const title=String(document.getElementById('canvasInfoTitle')?.value||'').trim()||'새 메모';
    const author=String(document.getElementById('canvasInfoAuthor')?.value||'').trim();
    const summary=String(document.getElementById('canvasInfoSummary')?.value||'').trim();

    state.meta={...state.meta,title,author,summary,participantIds:ids};
    syncCurrentDocumentV110();
    touch();

    if(btn){btn.disabled=true;btn.textContent='저장 중...'}
    try{
      const canvas=await renderBoardToCanvas();
      const preview=canvas.toDataURL('image/png',.88);
      const existingId=state.activeProposalId||'';
      const id=existingId||uid();
      const now=new Date().toISOString();
      const old=existingId?await dbGet(id):null;
      const payload={
        id,
        title,
        author,
        summary,
        createdAt:old?.createdAt||now,
        updatedAt:now,
        participants:proposalParticipantsV110(),
        preview,
        canvas:deep(state)
      };
      payload.canvas.activeProposalId=id;
      await submitProposalToBackend(payload);
      state.activeProposalId=id;
      syncCurrentDocumentV110();
      touch();
      closeModal('canvasInfoModal');
      await renderArchive();
      toast(old?'저장 및 기획안 업데이트 완료':'저장 및 기획안 등록 완료');
    }catch(err){
      console.error('Content Planner V1.0.12 save failed',err);
      alert('저장 실패: '+String(err?.message||err));
    }finally{
      if(btn){btn.disabled=false;btn.textContent=oldLabel}
    }
  }

  function install(){
    document.title='MAWANG Content Planner V1.0.12';
    installStyle();
    removeSubmitButton();
    findSaveButton();
    try{saveCanvasInfo=saveCanvasInfoV1012}catch(_){window.saveCanvasInfo=saveCanvasInfoV1012}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  window.addEventListener('load',install,{once:true});
})();
