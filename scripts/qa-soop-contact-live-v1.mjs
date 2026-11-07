/* Optional live diagnostic: never creates or changes contacts. */
import {handleSoopContactRoute} from '../src/soop-contact-autofill-v1.js';

const id='kwakchunshik';
const base='https://mws-smoke.invalid/api/soop/';
const station=await handleSoopContactRoute(new Request(base+'contact-station?id='+id));
const content=await station.json();
console.log('SOOP station HTTP:',station.status);
console.log('SOOP station fields:',{
  ok:content.ok||false,id:content.id||null,
  nicknameAvailable:Boolean(content.name),
  hasProfile:content.hasProfile??null
});
if(!station.ok)throw Error(content.error||'Live station lookup failed');
if(content.hasProfile){
  const avatar=await handleSoopContactRoute(new Request(base+'contact-avatar?id='+id));
  const type=avatar.headers.get('content-type');
  console.log('SOOP avatar HTTP:',avatar.status,'mime:',type);
  if(!avatar.ok||!type?.startsWith('image/'))throw Error('Live station avatar fetch failed');
  const bytes=(await avatar.arrayBuffer()).byteLength;
  console.log('SOOP avatar bytes:',bytes);
  if(bytes===0)throw Error('Empty avatar');
}
console.log('LIVE_SOOP_CONTACT_LOOKUP_OK');
