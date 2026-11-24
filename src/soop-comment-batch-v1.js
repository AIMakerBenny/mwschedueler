// Bounded public SOOP comment reads. No internal HTTP request to our own Worker.
const json=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra}});
export function parseCommentBatch(station,post,rawPages){
 if(!/^[a-zA-Z0-9_]{1,40}$/.test(station||'')||!/^\d{1,18}$/.test(post||'')||!/^\d{1,3}(,\d{1,3}){0,8}$/.test(rawPages||''))return null;
 const pages=rawPages.split(',').map(Number);
 if(new Set(pages).size!==pages.length||pages.some(p=>p<1||p>100))return null;
 return {station,post,pages};
}
export async function handleSoopCommentBatch(request,proxy){
 if(request.method!=='GET')return json({error:'Method not allowed'},405,{allow:'GET'});
 const url=new URL(request.url),args=parseCommentBatch(url.searchParams.get('station'),url.searchParams.get('post'),url.searchParams.get('pages'));
 if(!args)return json({error:'Invalid comment batch'},400);
 const results=[];
 const legacy=url.searchParams.get('legacy')==='1',board=legacy&&url.searchParams.get('kind')==='board',withTitle=legacy&&!board&&url.searchParams.get('title')==='1'&&args.pages.length===1&&args.pages[0]===1;
 const readPage=async page=>{
  try{
   const target=new URL((legacy?'https://bjapi.afreecatv.com':'https://chapi.sooplive.co.kr')+'/api/'+args.station+(board?'/board':'/title/'+args.post+'/comment'));
   target.searchParams.set('page',String(page));if(!legacy)target.searchParams.set('orderby','reg_date');
   const internal=new URL('/api/soop/proxy',url);internal.searchParams.set('url',target.href);
   const response=await proxy(new Request(internal.href,{method:'GET',headers:{accept:'application/json'}}));
   if(!response.ok)return {page,status:response.status};
   return {page,status:response.status,data:await response.json()};
  }catch(_){return {page,status:502}}
 };
 // At most 9 pages x 4 upstream attempts (3 redirects); 3 concurrent connections.
 for(let i=0;i<args.pages.length;i+=3)results.push(...await Promise.all(args.pages.slice(i,i+3).map(readPage)));
 let title=null;
 if(withTitle){try{const target=new URL('https://chapi.sooplive.co.kr/api/'+args.station+'/title/'+args.post),internal=new URL('/api/soop/proxy',url);internal.searchParams.set('url',target.href);const response=await proxy(new Request(internal.href,{headers:{accept:'application/json'}}));if(response.ok){const value=await response.json(),row=value?.data??value;if(String(row?.title_no)===args.post)title=String(row.title_name||row.title||'').slice(0,500)}}catch(_){}}
 return json(withTitle?{results,title}:{results});
}
