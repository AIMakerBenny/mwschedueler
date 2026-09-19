import appWorker from './cf-v110-steam.js';

const PARTS=['core','contacts','contactMeta','events','posts','miniGames','activity','clipboard','notebook'];
const CORE_KEYS=['version','categories','dashboardNoticeUrl','selfContactId','timezones','achievementCards'];
const SESSION_COOKIE='mws_admin_session';
const SESSION_DAYS=30;
const PBKDF2_ITERATIONS=180000;
const FIRST_ADMIN_USERNAME='majoku0216';
let schemaPromise;

function json(value,status=200,extra={}){
  return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra}});
}
function cleanError(error){return error instanceof Error?error.message:String(error||'Unknown error')}
function nowIso(){return new Date().toISOString()}
function futureIso(days){return new Date(Date.now()+days*86400000).toISOString()}
function normalizeUsername(value){return String(value||'').trim().toLowerCase()}
function validUsername(value){return /^[A-Za-z0-9._-]{3,64}$/.test(String(value||''))}
function validPassword(value){return typeof value==='string'&&value.length>=4&&value.length<=200}
function bytesToHex(bytes){return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('')}
function randomHex(size=32){const bytes=new Uint8Array(size);crypto.getRandomValues(bytes);return bytesToHex(bytes)}
async function sha256Hex(value){return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value))))) }
async function passwordHash(password,saltHex){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const salt=new Uint8Array((saltHex.match(/../g)||[]).map(x=>parseInt(x,16)));
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:PBKDF2_ITERATIONS},key,256);
  return bytesToHex(new Uint8Array(bits));
}
function parseCookies(request){
  const out={};
  for(const part of String(request.headers.get('cookie')||'').split(';')){
    const i=part.indexOf('=');if(i<0)continue;const k=part.slice(0,i).trim(),v=part.slice(i+1).trim();if(k)out[k]=v;
  }
  return out;
}
function sessionCookie(token,maxAge=SESSION_DAYS*86400){return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
function clearSessionCookie(){return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`}

async function ensureSchema(env){
  if(!schemaPromise){
    schemaPromise=env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS workspace_parts(scope TEXT NOT NULL,part TEXT NOT NULL,data TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(scope,part))`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS image_sources(kind TEXT NOT NULL,item_key TEXT NOT NULL,source_url TEXT,version INTEGER NOT NULL DEFAULT 1,content_type TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(kind,item_key))`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS app_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS mws_admins(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,username_norm TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS mws_admin_sessions(token_hash TEXT PRIMARY KEY,admin_id TEXT NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL,FOREIGN KEY(admin_id) REFERENCES mws_admins(id) ON DELETE CASCADE)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_mws_admin_sessions_expiry ON mws_admin_sessions(expires_at)`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS save_conflict_guard(id INTEGER PRIMARY KEY)`),
      env.DB.prepare(`INSERT OR IGNORE INTO save_conflict_guard(id) VALUES(1)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_workspace_parts_scope ON workspace_parts(scope)`),
    ]).catch(error=>{schemaPromise=undefined;throw error});
  }
  await schemaPromise;
}

async function currentAdmin(request,env){
  await ensureSchema(env);
  const token=parseCookies(request)[SESSION_COOKIE];
  if(!token)return null;
  const tokenHash=await sha256Hex(token);
  const row=await env.DB.prepare(`SELECT a.id,a.username,s.expires_at FROM mws_admin_sessions s JOIN mws_admins a ON a.id=s.admin_id WHERE s.token_hash=? LIMIT 1`).bind(tokenHash).first();
  if(!row)return null;
  if(String(row.expires_at)<=nowIso()){
    await env.DB.prepare('DELETE FROM mws_admin_sessions WHERE token_hash=?').bind(tokenHash).run();
    return null;
  }
  return {id:row.id,username:row.username,tokenHash};
}
async function createSession(env,adminId){
  const token=randomHex(32),tokenHash=await sha256Hex(token),created=nowIso(),expires=futureIso(SESSION_DAYS);
  await env.DB.prepare('DELETE FROM mws_admin_sessions WHERE expires_at<=?').bind(created).run();
  await env.DB.prepare('INSERT INTO mws_admin_sessions(token_hash,admin_id,created_at,expires_at) VALUES(?,?,?,?)').bind(tokenHash,adminId,created,expires).run();
  return {token,expires};
}
async function createAdmin(env,username,password){
  const clean=String(username||'').trim(),norm=normalizeUsername(clean);
  if(!validUsername(clean))throw new Error('Admin 아이디는 영문, 숫자, 점, 밑줄, 하이픈으로 3~64자여야 합니다.');
  if(!validPassword(password))throw new Error('비밀번호는 4~200자로 입력해 주세요.');
  const salt=randomHex(16),hash=await passwordHash(password,salt),id=crypto.randomUUID(),now=nowIso();
  await env.DB.prepare('INSERT INTO mws_admins(id,username,username_norm,password_hash,password_salt,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,clean,norm,hash,salt,now,now).run();
  return {id,username:clean};
}
async function handleLogin(request,env){
  await ensureSchema(env);
  const body=await request.json().catch(()=>null),username=String(body?.username||'').trim(),password=body?.password;
  if(!validUsername(username)||!validPassword(password))return json({error:'Admin 아이디 또는 비밀번호 형식이 올바르지 않습니다.'},400);
  const norm=normalizeUsername(username);
  let admin=await env.DB.prepare('SELECT id,username,password_hash,password_salt FROM mws_admins WHERE username_norm=? LIMIT 1').bind(norm).first();
  const countRow=await env.DB.prepare('SELECT COUNT(*) AS n FROM mws_admins').first();
  const count=Number(countRow?.n||0);
  let bootstrapped=false;
  if(!admin&&count===0){
    if(norm!==FIRST_ADMIN_USERNAME)return json({error:'최초 Admin 아이디는 Majoku0216으로 로그인해 주세요.'},403);
    try{admin=await createAdmin(env,username,password);bootstrapped=true}catch(error){return json({error:cleanError(error)},400)}
  }
  if(!admin)return json({error:'Admin 아이디 또는 비밀번호가 올바르지 않습니다.'},401);
  if(!bootstrapped){
    const actual=await passwordHash(password,admin.password_salt);
    if(actual!==admin.password_hash)return json({error:'Admin 아이디 또는 비밀번호가 올바르지 않습니다.'},401);
  }
  const session=await createSession(env,admin.id);
  return json({ok:true,authenticated:true,bootstrapped,user:{id:admin.id,username:admin.username}},200,{'set-cookie':sessionCookie(session.token)});
}
async function handleLogout(request,env){
  const token=parseCookies(request)[SESSION_COOKIE];
  if(token){const hash=await sha256Hex(token);await env.DB.prepare('DELETE FROM mws_admin_sessions WHERE token_hash=?').bind(hash).run().catch(()=>{})}
  return json({ok:true},200,{'set-cookie':clearSessionCookie()});
}
async function handleSession(request,env){
  const admin=await currentAdmin(request,env);
  return json(admin?{authenticated:true,user:{id:admin.id,username:admin.username}}:{authenticated:false});
}
async function handleAdminList(request,env){
  const admin=await currentAdmin(request,env);if(!admin)return json({error:'Admin authorization required'},401);
  const {results=[]}=await env.DB.prepare('SELECT id,username,created_at FROM mws_admins ORDER BY created_at ASC').all();
  return json({admins:results});
}
async function handleAdminCreate(request,env){
  const admin=await currentAdmin(request,env);if(!admin)return json({error:'Admin authorization required'},401);
  const body=await request.json().catch(()=>null);
  try{const created=await createAdmin(env,body?.username,body?.password);return json({ok:true,...created},201)}
  catch(error){const msg=cleanError(error);return json({error:/UNIQUE/i.test(msg)?'이미 존재하는 Admin 아이디입니다.':msg},400)}
}

function parseDataImage(value){
  if(typeof value!=='string')return null;const match=/^data:([^;,]+);base64,(.+)$/s.exec(value);if(!match)return null;
  const binary=atob(match[2]),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return {contentType:match[1]||'application/octet-stream',bytes};
}
async function shortHash(value){const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value))));return [...hash].slice(0,16).map(x=>x.toString(16).padStart(2,'0')).join('')}
function cleanMediaToken(value){const token=String(value||'').toLowerCase();return /^[a-f0-9]{32}$/.test(token)?token:''}
function tokenFromImageSource(value){const match=/^mws-r2:([a-f0-9]{32})$/i.exec(String(value||''));return match?cleanMediaToken(match[1]):''}
function mediaUrl(kind,key,version=1,token=''){const safe=cleanMediaToken(token);return `/media/${kind}/${encodeURIComponent(key)}?v=${Math.max(1,Number(version)||1)}${safe?`&h=${safe}`:''}`}
function r2Key(kind,key){return kind==='contact'?`contacts/${key}`:`workspace/${key}`}
function r2VersionedKey(kind,key,version,token=''){const safe=cleanMediaToken(token);return `${r2Key(kind,key)}/v${Math.max(1,Number(version)||1)}${safe?`-${safe}`:''}`}
async function currentImageRecord(env,kind,key){return await env.DB.prepare('SELECT version,source_url FROM image_sources WHERE kind=? AND item_key=?').bind(kind,key).first()}
async function currentImageVersion(env,kind,key){const row=await currentImageRecord(env,kind,key);return Number(row?.version)||0}
async function storeDataImage(env,kind,key,dataUrl,authoritative=true,saveContext=null){
  const parsed=parseDataImage(dataUrl);if(!parsed)return dataUrl;const current=await currentImageRecord(env,kind,key),existing=Number(current?.version)||0,existingToken=tokenFromImageSource(current?.source_url);if(!authoritative&&existing>0)return mediaUrl(kind,key,existing,existingToken);
  const version=existing>0?existing+1:1,token=cleanMediaToken(crypto.randomUUID().replace(/-/g,''));
  await env.IMAGES.put(r2VersionedKey(kind,key,version,token),parsed.bytes,{httpMetadata:{contentType:parsed.contentType},customMetadata:{mwsVersion:String(version),source:'mws-upload'}});
  const statement=env.DB.prepare(`INSERT INTO image_sources(kind,item_key,source_url,version,content_type,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(kind,item_key) DO UPDATE SET source_url=excluded.source_url,version=excluded.version,content_type=excluded.content_type,updated_at=CURRENT_TIMESTAMP`).bind(kind,key,`mws-r2:${token}`,version,parsed.contentType);
  if(saveContext?.statements)saveContext.statements.push(statement);else await statement.run();
  return mediaUrl(kind,key,version,token);
}
async function externalizePart(env,part,raw,saveContext=null){
  if(part==='core'){
    const src=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},out={};for(const key of CORE_KEYS)if(Object.prototype.hasOwnProperty.call(src,key))out[key]=src[key];return out;
  }
  if(part==='contacts'){
    const out=[];for(const original of Array.isArray(raw)?raw:[]){const item=original&&typeof original==='object'?structuredClone(original):original;if(!item||typeof item!=='object'){out.push(item);continue}const id=String(item.id||'').trim();if(id&&parseDataImage(item.image))item.image=await storeDataImage(env,'contact',id,item.image,true,saveContext);out.push(item)}return out;
  }
  if(part==='contactMeta'){
    const out=raw&&typeof raw==='object'&&!Array.isArray(raw)?structuredClone(raw):{},banners=out.contactTagBanners&&typeof out.contactTagBanners==='object'&&!Array.isArray(out.contactTagBanners)?out.contactTagBanners:{};
    for(const [bannerKey,value] of Object.entries(banners))if(parseDataImage(value))banners[bannerKey]=await storeDataImage(env,'workspace',`tag-${await shortHash(bannerKey)}`,value,true,saveContext);
    out.contactTagBanners=banners;const emoticons=Array.isArray(out.emoticons)?out.emoticons:[];
    for(let i=0;i<emoticons.length;i++){const item=emoticons[i];if(!item||typeof item!=='object')continue;if(parseDataImage(item.src)){const seed=String(item.id||item.name||`item-${i+1}`);item.src=await storeDataImage(env,'workspace',`emoticon-${await shortHash(seed)}`,item.src,true,saveContext)}}out.emoticons=emoticons;return out;
  }
  if(part==='miniGames'){
    const games=raw&&typeof raw==='object'&&!Array.isArray(raw)?structuredClone(raw):{};
    for(const [gameKey,game] of Object.entries(games)){if(!game||typeof game!=='object'||!Array.isArray(game.players))continue;for(let i=0;i<game.players.length;i++){const player=game.players[i];if(!player||typeof player!=='object'||!parseDataImage(player.image))continue;const contactId=String(player.contactId||'').trim();if(contactId)player.image=await storeDataImage(env,'contact',contactId,player.image,false,saveContext);else player.image=await storeDataImage(env,'workspace',`mini-${await shortHash(`${gameKey}:${player.id||player.name||i+1}`)}`,player.image,true,saveContext)}}return games;
  }
  if(part==='posts')return (Array.isArray(raw)?raw:[]).map(post=>{const out=post&&typeof post==='object'?structuredClone(post):post;if(out&&typeof out==='object')for(const key of ['sourceContent','sourcePhotos','sourceAuthor','sourceAuthorId','sourceRegDate','sourceViewCount','sourceUrl'])delete out[key];return out});
  if(part==='events')return Array.isArray(raw)?raw:[];
  if(part==='activity'){const src=raw&&typeof raw==='object'?raw:{};return {collaborations:Array.isArray(src.collaborations)?src.collaborations:[],todayPeopleByDate:src.todayPeopleByDate&&typeof src.todayPeopleByDate==='object'?src.todayPeopleByDate:{},todayPeopleManualByDate:src.todayPeopleManualByDate&&typeof src.todayPeopleManualByDate==='object'?src.todayPeopleManualByDate:{},targetList:Array.isArray(src.targetList)?src.targetList:[]}}
  if(part==='notebook'){const src=raw&&typeof raw==='object'?raw:{};return {memos:Array.isArray(src.memos)?src.memos:[],favoriteFolders:Array.isArray(src.favoriteFolders)?src.favoriteFolders:[]}}
  if(part==='clipboard'){const src=raw&&typeof raw==='object'?raw:{};return {scheduleClipboard:Array.isArray(src.scheduleClipboard)?src.scheduleClipboard:[]}}
  return raw??null;
}
async function handleSave(request,env){
  const admin=await currentAdmin(request,env);if(!admin)return json({error:'Admin authorization required'},401);await ensureSchema(env);
  const body=await request.json().catch(()=>null);if(!body?.parts||typeof body.parts!=='object'||Array.isArray(body.parts))return json({error:'parts must be an object'},400);
  const expectedVersions=body?.versions;if(!expectedVersions||typeof expectedVersions!=='object'||Array.isArray(expectedVersions))return json({error:'저장 기준 버전이 없습니다. 새로고침 후 다시 시도해 주세요.'},409);
  const entries=Object.entries(body.parts);
  for(const [part] of entries){if(!PARTS.includes(part))return json({error:`Invalid part: ${part}`},400);const expected=Number(expectedVersions[part]);if(!Number.isInteger(expected)||expected<0)return json({error:`${part} 저장 기준 버전이 올바르지 않습니다. 새로고침 후 다시 시도해 주세요.`},409)}
  const versions={},normalized={},staged=[],mediaContext={statements:[]};
  for(const [part,raw] of entries){
    let source=raw;
    if(part==='core'&&raw&&typeof raw==='object'&&!Array.isArray(raw)&&!Object.prototype.hasOwnProperty.call(raw,'achievementCards')){
      const previousRow=await env.DB.prepare("SELECT data FROM workspace_parts WHERE scope='public' AND part='core'").first();
      let previousCore={};try{previousCore=JSON.parse(previousRow?.data||'{}')}catch(_){}
      source={...raw,achievementCards:Array.isArray(previousCore?.achievementCards)?previousCore.achievementCards:[]};
    }
    const value=await externalizePart(env,part,source,mediaContext);
    const current=await env.DB.prepare('SELECT version FROM workspace_parts WHERE scope=? AND part=?').bind('public',part).first();
    const version=Math.max(1,Number(current?.version)||0)+1,text=JSON.stringify(value??null);
    staged.push({part,value,version,text});versions[part]=version;normalized[part]=value;
  }
  const statements=[];
  for(const {part} of staged){
    const expected=Number(expectedVersions[part]);
    statements.push(env.DB.prepare(`INSERT INTO save_conflict_guard(id) SELECT 1 WHERE COALESCE((SELECT version FROM workspace_parts WHERE scope='public' AND part=?),0)<>?`).bind(part,expected));
  }
  statements.push(...mediaContext.statements);
  for(const {part,version,text} of staged){
    statements.push(
      env.DB.prepare(`INSERT INTO workspace_parts(scope,part,data,version,updated_at) VALUES('public',?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(scope,part) DO UPDATE SET data=excluded.data,version=excluded.version,updated_at=CURRENT_TIMESTAMP`).bind(part,text,version),
      env.DB.prepare(`INSERT INTO workspace_parts(scope,part,data,version,updated_at) VALUES('admin',?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(scope,part) DO UPDATE SET data=excluded.data,version=excluded.version,updated_at=CURRENT_TIMESTAMP`).bind(part,text,version),
    );
  }
  if(statements.length){
    try{await env.DB.batch(statements)}
    catch(error){
      const conflicts=[];
      for(const {part} of staged){
        const row=await env.DB.prepare('SELECT version FROM workspace_parts WHERE scope=? AND part=?').bind('public',part).first();
        const current=Number(row?.version)||0,expected=Number(expectedVersions[part]);
        if(current!==expected)conflicts.push({part,expected,current});
      }
      if(conflicts.length)return json({error:'다른 Admin 또는 다른 화면에서 데이터가 먼저 변경되었습니다. 새로고침 후 다시 시도해 주세요.',conflicts},409);
      throw error;
    }
  }
  return json({versions,normalized,savedBy:admin.id});
}
async function handleManifest(env){await ensureSchema(env);const {results=[]}=await env.DB.prepare("SELECT part,version FROM workspace_parts WHERE scope='public' ORDER BY part").all();const parts={};for(const row of results)parts[row.part]=Number(row.version)||1;return json({parts,scope:'public',cacheSchemaVersion:3,backend:'cloudflare-d1'})}
async function handlePart(env,part){if(!PARTS.includes(part))return json({error:'Invalid part'},400);await ensureSchema(env);const row=await env.DB.prepare("SELECT part,version,data FROM workspace_parts WHERE scope='public' AND part=?").bind(part).first();if(!row)return json({error:'Part not found'},404);let data;try{data=JSON.parse(row.data)}catch(_){return json({error:'Stored data is invalid'},500)}return json({part:row.part,version:Number(row.version)||1,data})}
async function handleBootstrap(env){await ensureSchema(env);const {results=[]}=await env.DB.prepare("SELECT part,version,data FROM workspace_parts WHERE scope='public' ORDER BY part").all();const parts={},versions={};for(const row of results){let data=null;try{data=JSON.parse(row.data)}catch(_){}const version=Number(row.version)||1;versions[row.part]=version;parts[row.part]={part:row.part,version,data}}return json({backend:'cloudflare-d1-r2',mode:'mawang-scheduler-v1.1',build:'Mawang Scheduler v.1.1.0',cacheSchemaVersion:3,manifest:{parts:versions,scope:'public',cacheSchemaVersion:3,backend:'cloudflare-d1'},parts})}
async function handleMedia(request,env,kind,key){if(!['contact','workspace'].includes(kind)||!/^[A-Za-z0-9_-]{1,160}$/.test(key))return new Response('Invalid media key',{status:400});const url=new URL(request.url),requested=Math.max(0,Number(url.searchParams.get('v'))||0),explicitToken=cleanMediaToken(url.searchParams.get('h'));let object=explicitToken&&requested?await env.IMAGES.get(r2VersionedKey(kind,key,requested,explicitToken)):null;if(!object&&!explicitToken){const current=await currentImageRecord(env,kind,key),currentVersion=Number(current?.version)||0,currentToken=tokenFromImageSource(current?.source_url);if(currentToken&&(!requested||requested===currentVersion))object=await env.IMAGES.get(r2VersionedKey(kind,key,currentVersion,currentToken))}if(!object&&requested)object=await env.IMAGES.get(r2VersionedKey(kind,key,requested));if(!object)object=await env.IMAGES.get(r2Key(kind,key));if(!object)return new Response('Not found',{status:404});const headers=new Headers();object.writeHttpMetadata(headers);headers.set('etag',object.httpEtag);headers.set('x-content-type-options','nosniff');headers.set('cache-control','public, max-age=300, stale-while-revalidate=86400');return new Response(object.body,{headers})}

export default{
  async fetch(request,env,ctx){
    try{
      const url=new URL(request.url),path=url.pathname;
      if(path==='/api/auth/login'&&request.method==='POST')return handleLogin(request,env);
      if(path==='/api/auth/logout'&&request.method==='POST')return handleLogout(request,env);
      if(path==='/api/auth/session'&&request.method==='GET')return handleSession(request,env);
      if(path==='/api/auth/admins'&&request.method==='GET')return handleAdminList(request,env);
      if(path==='/api/auth/admins'&&request.method==='POST')return handleAdminCreate(request,env);
      if(path==='/api/health'&&request.method==='GET'){await ensureSchema(env);const admin=await currentAdmin(request,env);return json({ok:true,env:env.MWS_ENV||'cloudflare-production',backend:'D1 + R2 + D1 Auth',authenticated:Boolean(admin),supabase:false,build:'Mawang Scheduler v.1.1.0'})}
      if(path==='/api/manifest'&&request.method==='GET')return handleManifest(env);
      if(path.startsWith('/api/parts/')&&request.method==='GET')return handlePart(env,decodeURIComponent(path.slice('/api/parts/'.length)));
      if(path==='/api/bootstrap'&&request.method==='GET')return handleBootstrap(env);
      if(path==='/api/save'&&request.method==='POST')return handleSave(request,env);
      if(path==='/api/rebootstrap')return json({error:'Supabase rebootstrap has been removed.'},410);
      const media=path.match(/^\/media\/(contact|workspace)\/([^/]+)$/);if(media&&request.method==='GET')return handleMedia(request,env,media[1],decodeURIComponent(media[2]));
      return appWorker.fetch(request,env,ctx);
    }catch(error){console.error('Mawang Scheduler D1 auth wrapper error',error);return json({error:cleanError(error)},500)}
  }
};
