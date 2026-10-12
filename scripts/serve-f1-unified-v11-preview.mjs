// Local Public preview only. No Production requests, credentials or cloud writes.
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import worker from '../src/cf-v111-entry.js';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const contacts=Array.from({length:12},(_,i)=>({id:'preview-driver-'+i,name:'시험 드라이버 '+(i+1),image:'',labels:['F1 수동 시험']}));
const parts={core:{version:52,categories:[],timezones:[],achievementCards:[]},contacts,events:[],posts:[],activity:{},miniGames:{},contactMeta:{},notebook:{},clipboard:{},wardogs:{schemaVersion:1,cards:[]}};
const env={ASSETS:{async fetch(request){
  const url=new URL(typeof request==='string'?request:request.url),name=url.pathname==='/'?'index.html':url.pathname.slice(1);
  const filename=path.resolve(root,name);
  if(!filename.startsWith(root+path.sep))return new Response('Forbidden',{status:403});
  try{const bytes=await fs.readFile(filename),ext=path.extname(filename);
    return new Response(bytes,{headers:{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'})[ext]||'application/octet-stream'}});
  }catch{return new Response('Not found',{status:404});}
}}};
export function createF1PreviewServer(){
  return createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://localhost');
      if(url.pathname.startsWith('/api/')){
        let body,status=200;
        if(url.pathname==='/api/manifest')body={backend:'LOCAL_PUBLIC_PREVIEW',parts:Object.fromEntries(Object.keys(parts).map(k=>[k,1]))};
        else if(url.pathname.startsWith('/api/parts/'))body={version:1,data:parts[url.pathname.split('/').pop()]||{}};
        else if(['/api/health','/api/auth/logout','/api/auth/session'].includes(url.pathname))body={ok:true,authenticated:false};
        else{status=403;body={error:'Local Public preview: cloud writes and Admin APIs are unavailable.'};}
        res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(body));return;
      }
      // Run the real Worker transforms, including deferred UI and auth loader repairs.
      const result=await worker.fetch(new Request(url.href),env,{waitUntil(){}});
      res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
    }catch(error){res.writeHead(500);res.end(String(error));}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.MWS_QA_PORT)||8766,server=createF1PreviewServer();
  server.listen(port,'127.0.0.1',()=>console.log(`Local Public F1 preview: http://127.0.0.1:${port}\nSelect Public, enter, then open F1 racing. 12 fixture contacts are available.\nProduction is unchanged. Stop with Ctrl+C.`));
}
