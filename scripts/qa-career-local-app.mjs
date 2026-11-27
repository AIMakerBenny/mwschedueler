import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Always use the checked-out application and isolated synthetic data for CI.
export async function startCareerLocalApp(){
 const child=fork(fileURLToPath(new URL('./qa-request-budget-full-app-v2-browser.mjs',import.meta.url)),[],{env:{...process.env,MWS_QA_SERVE_ONLY:'1',MWS_QA_OFFLINE:'1'},stdio:['ignore','inherit','inherit','ipc']});
 let base;
 try{base=await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('Local QA server did not start')),20000);
  child.once('error',e=>{clearTimeout(timeout);reject(e)});
  child.once('exit',code=>{clearTimeout(timeout);reject(Error('Local QA server exited '+code))});
  child.on('message',msg=>{if(msg?.type==='mws-qa-ready'){clearTimeout(timeout);resolve(msg.base)}});
 })}catch(e){child.kill();throw e}
 return {base,close:async()=>{if(child.exitCode!==null||child.signalCode!==null)return;await new Promise(resolve=>{const timeout=setTimeout(()=>child.kill(),5000);child.once('exit',()=>{clearTimeout(timeout);resolve()});if(child.connected)child.disconnect();else child.kill()})}};
}
