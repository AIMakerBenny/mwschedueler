/* Read-only production smoke for deployed SOOP contact autofill.
 * This checks the actual Cloudflare Worker, not only upstream SOOP.
 */
import assert from 'node:assert/strict';
const BASE='https://mawang-scheduler.majoku.workers.dev';
async function checked(url,timeout=15000){
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),timeout);
  try{return await fetch(url,{headers:{'accept':'*/*','cache-control':'no-cache'},signal:ctl.signal})}
  finally{clearTimeout(timer)}
}
async function run(){
  const htmlResponse=await checked(BASE+'/?soop-contact-deploy-check='+Date.now());
  assert.equal(htmlResponse.status,200,'Production HTML missing');
  const html=await htmlResponse.text();
  assert.match(html,/assets\/soop-contact-autofill-v1\.js\?v=1/,'Production HTML lacks new script');
  const asset=await checked(BASE+'/assets/soop-contact-autofill-v1.js?v=1&smoke='+Date.now());
  assert.equal(asset.status,200,'Autofill asset not deployed');
  const js=await asset.text();
  assert.match(js,/SOOP 정보 가져오기/,'Autofill button code missing');
  const station=await checked(BASE+'/api/soop/contact-station?id=kwakchunshik&smoke='+Date.now(),25000);
  assert.equal(station.status,200,'Cloudflare station endpoint did not return 200');
  const data=await station.json();
  assert.equal(data.ok,true);
  assert.equal(data.id,'kwakchunshik');
  assert(data.name&&data.name.trim(),'Nickname missing');
  assert.equal(data.stationUrl,'https://www.sooplive.com/station/kwakchunshik');
  if(data.hasProfile){
    assert.equal(data.avatarUrl,'/api/soop/contact-avatar?id=kwakchunshik');
    const image=await checked(BASE+data.avatarUrl,25000);
    assert.equal(image.status,200,'Production avatar fetch failed');
    assert.match(image.headers.get('content-type')||'',/^image\//);
    assert((await image.arrayBuffer()).byteLength>0,'Production avatar is empty');
  }
  console.log('SOOP_CONTACT_PRODUCTION_OK '+JSON.stringify({site:BASE,
    station:data.id,nicknameAvailable:true,hasProfile:data.hasProfile}));
}
await run();
