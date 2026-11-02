// R5-b102: normalize ONLY diagnostic localhost ports in stack/caller text.
// Keep physics, transitions and all other event fields exact.
import assert from 'node:assert/strict';
export function normalizeMajokuScreenTransitions(transitions){
 assert(Array.isArray(transitions));
 return transitions.map(t=>{
  assert(t&&typeof t==='object'&&!Array.isArray(t));
  assert(typeof t.from==='string'&&typeof t.to==='string');
  assert(Number.isFinite(t.ms));
  return {...t,...(typeof t.caller==='string'?{
   caller:t.caller.replace(/https?:\/\/127\.0\.0\.1:[0-9]+(?=\/)/g,
    origin=>origin.replace(/:[0-9]+$/,':<PORT>'))
  }:{})};
 });
}
