// R5-b95: deterministic, read-only evidence comparison with required-field checks.
// Never infer that identical outcomes demonstrate a safe lane transition.
import {isDeepStrictEqual} from 'node:util';
export function findMajokuPhysicalFieldDifferences(before,after,keys){
 if(!before||!after||!Array.isArray(keys))throw TypeError('Missing comparison inputs');
 const differences=[];
 for(const key of keys){
  if(typeof key!=='string'||!key)throw TypeError('Invalid comparison field');
  const baselinePresent=Object.hasOwn(before,key);
  const probedPresent=Object.hasOwn(after,key);
  if(!baselinePresent||!probedPresent){
   differences.push({field:key,reason:'REQUIRED_FIELD_MISSING',
    baselinePresent,probedPresent});
  }else if(!isDeepStrictEqual(before[key],after[key])){
   differences.push({field:key,reason:'PHYSICAL_OUTCOME_MISMATCH',
    baselinePresent:true,probedPresent:true});
  }
 }
 return differences;
}
