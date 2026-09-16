/* Mawang Scheduler v1.2.4 - same-origin SOOP fetch bridge */
(()=>{
'use strict';
if(window.__mwsSoopFetchProxyV124)return;
window.__mwsSoopFetchProxyV124=true;

const baseFetch=window.fetch.bind(window);
const allowedSuffixes=['sooplive.com','sooplive.co.kr','afreecatv.com'];
const legacyProxyHost='nysxcqlewzucbpoaymbg.supabase.co';
const legacyProxyPath='/functions/v1/soop-proxy';

const allowedHost=host=>{
  const value=String(host||'').toLowerCase().replace(/\.$/,'');
  return allowedSuffixes.some(suffix=>value===suffix||value.endsWith(`.${suffix}`));
};

function directSoopTarget(url){
  if(url?.protocol==='https:'&&allowedHost(url.hostname))return url;
  return null;
}

function legacySoopTarget(url){
  if(!url||url.protocol!=='https:'||url.hostname.toLowerCase()!==legacyProxyHost||url.pathname!==legacyProxyPath)return null;
  const raw=url.searchParams.get('url');
  if(!raw)return null;
  try{
    const target=new URL(raw);
    return directSoopTarget(target);
  }catch(_){return null}
}

function resolveSoopTarget(url){
  return directSoopTarget(url)||legacySoopTarget(url);
}

window.fetch=async function(input,init){
  let requestUrl;
  try{
    const raw=typeof input==='string'||input instanceof URL?String(input):String(input?.url||'');
    requestUrl=new URL(raw,location.href);
  }catch(_){return baseFetch(input,init)}

  const target=resolveSoopTarget(requestUrl);
  if(!target)return baseFetch(input,init);

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
