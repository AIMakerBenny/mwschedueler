/* WARDOGS portrait schema foundation - contact/custom source + crop transforms */
(()=>{
'use strict';
if(window.__mwsWardogsDataV119)return;
window.__mwsWardogsDataV119=true;

const SCHEMA_VERSION=1;
const CLASS_IDS=Object.freeze(['assault','medic','recon','support','driver','pilot','unassigned']);
const CLASS_SET=new Set(CLASS_IDS);
const PORTRAIT_SOURCES=Object.freeze(['contact','custom']);
const PORTRAIT_SOURCE_SET=new Set(PORTRAIT_SOURCES);

function clampNumber(value,min,max,fallback){
  const number=Number(value);
  if(!Number.isFinite(number))return fallback;
  return Math.min(max,Math.max(min,number));
}

function createId(){
  try{
    if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID();
    if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function'){
      const bytes=new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6]=(bytes[6]&15)|64;
      bytes[8]=(bytes[8]&63)|128;
      const hex=Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    }
  }catch(_){}
  return 'wd-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
}

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
    if(!id||seen.has(id))id=createId();
    seen.add(id);
    const portraitImageId=String(item.portraitImageId||'').trim();
    const requestedPortraitSource=String(item.portraitSource||'contact').trim().toLowerCase();
    const portraitSource=PORTRAIT_SOURCE_SET.has(requestedPortraitSource)&&requestedPortraitSource==='custom'&&portraitImageId?'custom':'contact';
    cards.push({
      id,
      contactId,
      classId,
      imageId:String(item.imageId||'').trim(),
      portraitSource,
      portraitImageId,
      portraitPositionX:clampNumber(item.portraitPositionX,0,100,50),
      portraitPositionY:clampNumber(item.portraitPositionY,0,100,50),
      portraitScale:clampNumber(item.portraitScale,0.25,3,1),
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
  portraitSources:PORTRAIT_SOURCES,
  empty,
  createId,
  normalize,
  get,
  getCards,
  findContact,
  resolveContactLink,
  searchContacts
});
window.__mwsWardogsContactSearchV120='app-core-search71-consumer';
window.__mwsWardogsPortraitSchemaV133='contact-custom-position-scale';
})();

window.__mwsWardogsClassSetV168='unassigned-last';
