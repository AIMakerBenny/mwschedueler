/* Mawang Scheduler v1.2.3 - same-origin SOOP fetch bridge */
(()=>{
'use strict';
if(window.__mwsSoopFetchProxyV123)return;
window.__mwsSoopFetchProxyV123=true;

const baseFetch=window.fetch.bind(window);
const allowedSuffixes=['sooplive.com','sooplive.co.kr','afreecatv.com'];
const allowedHost=host=>{
  const value=String(host||'').toLowerCase().replace(/\.$/,'');
  return allowedSuffixes.some(suffix=>value===suffix||value.endsWith(`.${suffix}`));
};
const shouldProxy=url=>url.protocol==='https:'&&url.origin!==location.origin&&allowedHost(url.hostname);

window.fetch=async function(input,init){
  let target;
  try{
    const raw=typeof input==='string'||input instanceof URL?String(input):String(input?.url||'');
    target=new URL(raw,location.href);
  }catch(_){return baseFetch(input,init)}
  if(!shouldProxy(target))return baseFetch(input,init);

  let source;
  try{source=new Request(input,init)}catch(_){return baseFetch(input,init)}
  const method=String(source.method||'GET').toUpperCase();
  if(!['GET','HEAD','POST'].includes(method))return baseFetch(input,init);

  const proxy=new URL('/api/soop/proxy',location.origin);
  proxy.searchParams.set('url',target.href);
  const headers=new Headers();
  for(const name of ['accept','accept-language','content-type']){
    const value=source.headers.get(name);if(value)headers.set(name,value);
  }
  const options={method,headers,credentials:'same-origin',cache:'no-store',signal:source.signal};
  if(method==='POST'){
    try{options.body=await source.clone().arrayBuffer()}catch(_){return baseFetch(input,init)}
  }
  return baseFetch(proxy.toString(),options);
};
})();
