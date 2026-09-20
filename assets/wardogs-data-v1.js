/* WARDOGS Phase 120 - metadata + contact linkage/search foundation */
(()=>{
'use strict';
if(window.__mwsWardogsDataV119)return;
window.__mwsWardogsDataV119=true;

const SCHEMA_VERSION=1;
const CLASS_IDS=Object.freeze(['assault','medic','recon','support','driver','pilot']);
const CLASS_SET=new Set(CLASS_IDS);

function empty(){
  return {schemaVersion:SCHEMA_VERSION,cards:[]};
}
function normalize(raw){
  const src=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const now=new Date().toISOString();
  const seen=new Set();
  const cards=[];
  const input=Array.isArray(src.cards)?src.cards:[];
  for(let index=0;index<input.length;index++){
    const item=input[index];
    if(!item||typeof item!=='object'||Array.isArray(item))continue;
    const contactId=String(item.contactId||'').trim();
    const classId=String(item.classId||'').trim().toLowerCase();
    if(!contactId||!CLASS_SET.has(classId))continue;
    let id=String(item.id||'').trim();
    if(!id||seen.has(id))id=crypto.randomUUID();
    seen.add(id);
    cards.push({
      id,
      contactId,
      classId,
      imageId:String(item.imageId||'').trim(),
      order:Math.max(0,Math.floor(Number(item.order??index)||0)),
      active:item.active!==false,
      createdAt:String(item.createdAt||now),
      updatedAt:String(item.updatedAt||item.createdAt||now)
    });
  }
  const normalized=[];
  for(const classId of CLASS_IDS){
    const group=cards
      .filter(card=>card.classId===classId)
      .sort((a,b)=>a.order-b.order||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
    group.forEach((card,order)=>normalized.push({...card,order}));
  }
  return {schemaVersion:SCHEMA_VERSION,cards:normalized};
}
function appData(){
  try{return typeof data==='object'&&data?data:null}catch(_){return null}
}
function contacts(){
  const root=appData();
  return Array.isArray(root?.contacts)?root.contacts:[];
}
function get(){
  const root=appData();
  if(!root)return empty();
  const normalized=normalize(root.wardogs);
  root.wardogs=normalized;
  return normalized;
}
function getCards(classId,{activeOnly=false}={}){
  const id=String(classId||'').trim().toLowerCase();
  return get().cards.filter(card=>(!id||card.classId===id)&&(!activeOnly||card.active!==false));
}
function findContact(contactId){
  const id=String(contactId||'').trim();
  if(!id)return null;
  return contacts().find(contact=>String(contact?.id||'')===id)||null;
}
function resolveContactLink(cardOrContactId){
  const contactId=typeof cardOrContactId==='string'
    ?String(cardOrContactId||'').trim()
    :String(cardOrContactId?.contactId||'').trim();
  const contact=findContact(contactId);
  return Object.freeze({
    contactId,
    linked:Boolean(contact),
    orphaned:Boolean(contactId&&!contact),
    contact:contact||null
  });
}
function contactMatcher(){
  if(typeof window.contactMatches==='function')return window.contactMatches;
  if(typeof window.mwsTextMatches==='function'){
    return (contact,q='')=>{
      const text=String(contact?.name||'')+' '+(contact?.labels||[]).join(' ')+' '+String(contact?.notes||'');
      return window.mwsTextMatches(text,q);
    };
  }
  return null;
}
function searchContacts(query='',options={}){
  const q=String(query||'');
  const includePending=options?.includePending===true;
  const rawLimit=Math.floor(Number(options?.limit)||50);
  const limit=Math.max(1,Math.min(200,rawLimit));
  const matcher=contactMatcher();
  if(q.trim()&&!matcher)return [];
  return contacts()
    .filter(contact=>contact&&String(contact.id||'').trim())
    .filter(contact=>includePending||contact.pendingSetup!==true)
    .filter(contact=>!q.trim()||matcher(contact,q))
    .slice()
    .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ko-KR',{sensitivity:'base'}))
    .slice(0,limit);
}

window.mwsWardogsDataV119=Object.freeze({
  schemaVersion:SCHEMA_VERSION,
  classIds:CLASS_IDS,
  empty,
  normalize,
  get,
  getCards,
  findContact,
  resolveContactLink,
  searchContacts
});
window.__mwsWardogsContactSearchV120='app-core-search71-consumer';
})();
