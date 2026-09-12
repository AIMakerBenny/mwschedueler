/* CF MWS V1.0.11 - Korea Standard Time normalization */
(()=>{
  'use strict';
  if(window.__mwsKstV1011)return;
  window.__mwsKstV1011=true;
  const TZ='Asia/Seoul';
  const p=Date.prototype;
  const nativeString=p.toLocaleString;
  const nativeDate=p.toLocaleDateString;
  const nativeTime=p.toLocaleTimeString;
  const withTz=o=>o&&typeof o==='object'?({...o,timeZone:o.timeZone||TZ}):{timeZone:TZ};
  p.toLocaleString=function(locales,options){return nativeString.call(this,locales,withTz(options))};
  p.toLocaleDateString=function(locales,options){return nativeDate.call(this,locales,withTz(options))};
  p.toLocaleTimeString=function(locales,options){return nativeTime.call(this,locales,withTz(options))};
  const fmt=(value,options)=>{
    const d=value instanceof Date?value:new Date(value);
    if(Number.isNaN(d.getTime()))return '';
    return new Intl.DateTimeFormat('ko-KR',{timeZone:TZ,...options}).format(d);
  };
  window.mwsKstDateTime=value=>fmt(value,{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).replace(/\. /g,'-').replace('.','').replace(/\.$/,'');
  window.mwsKstDate=value=>fmt(value,{year:'numeric',month:'2-digit',day:'2-digit'}).replace(/\. /g,'-').replace('.','').replace(/\.$/,'');
  window.mwsKstTime=value=>fmt(value,{hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  document.documentElement.dataset.mwsTimezone=TZ;
  window.dispatchEvent(new CustomEvent('mws:timezone-ready',{detail:{timeZone:TZ}}));
})();
