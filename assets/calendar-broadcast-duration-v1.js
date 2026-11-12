/* MWS calendar broadcast duration V1. Pure local wall-clock difference in minutes.
 * Event schema stores one date plus HH:mm start/end, without end date.
 * An earlier end clock is treated as next day; equal clocks are ambiguous.
 */
(function(root){
  'use strict';
  const clockPattern=/^([01][0-9]|2[0-3]):([0-5][0-9])$/;
  function clockMinutes(value){
    if(typeof value!=='string')return null;
    const match=clockPattern.exec(value.trim());
    if(!match)return null;
    return Number(match[1])*60+Number(match[2]);
  }
  function minutes(start,end){
    const a=clockMinutes(start),b=clockMinutes(end);
    if(a===null||b===null||a===b)return null;
    return b>a?b-a:(24*60-a+b);
  }
  function label(start,end){
    const value=minutes(start,end);
    if(value===null)return '';
    return '총 '+Math.floor(value/60)+'시간 '+value%60+'분';
  }
  const duration=Object.freeze({minutes,label});
  root.mwsCalendarBroadcastDurationV1=duration;
})(typeof window!=='undefined'?window:globalThis);
