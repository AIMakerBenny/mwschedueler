import authWorker from './cf-v111-auth.js';

const SESSION_COOKIE='mws_admin_session';
const SESSION_DAYS=30;
const PBKDF2_ITERATIONS=100000;
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
async function sha256Hex(value){return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value)))))}
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

async function ensureSchema(env){
  if(!schemaPromise){
    schemaPromise=env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS mws_admins(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,username_norm TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS mws_admin_sessions(token_hash TEXT PRIMARY KEY,admin_id TEXT NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL,FOREIGN KEY(admin_id) REFERENCES mws_admins(id) ON DELETE CASCADE)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_mws_admin_sessions_expiry ON mws_admin_sessions(expires_at)`),
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
  return {id:row.id,username:row.username};
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
async function handleAdminCreate(request,env){
  const admin=await currentAdmin(request,env);if(!admin)return json({error:'Admin authorization required'},401);
  const body=await request.json().catch(()=>null);
  try{const created=await createAdmin(env,body?.username,body?.password);return json({ok:true,...created},201)}
  catch(error){const msg=cleanError(error);return json({error:/UNIQUE/i.test(msg)?'이미 존재하는 Admin 아이디입니다.':msg},400)}
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/api/auth/login'&&request.method==='POST')return handleLogin(request,env);
    if(url.pathname==='/api/auth/admins'&&request.method==='POST')return handleAdminCreate(request,env);
    return authWorker.fetch(request,env,ctx);
  }
};
