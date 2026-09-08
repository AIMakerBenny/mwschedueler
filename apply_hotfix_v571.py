from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

old_title=re.compile(r"async function fetchSoopPostTitle\(post,firstJson\)\{.*?\n\}\n\nfunction postById",re.S)
new_title="""async function fetchSoopPostTitle(post,firstJson){
  const fromJson=titleFromSoopJson(firstJson);if(fromJson)return fromJson;
  try{
    const rec=await fetchSoopBoardRecord(post);
    const fromBoard=rec?metaFromSoopRecord(rec).title:'';
    if(fromBoard)return fromBoard;
  }catch(err){console.warn('SOOP 제목 보조 조회 실패',err)}
  return String(post?.sourceTitle||'').trim();
}

function postById"""
s,n=old_title.subn(new_title,s,count=1)
if n!=1: raise SystemExit(f'fetchSoopPostTitle replacement count={n}')

old_write=re.compile(r"  async function writeCloudNow\(\)\{.*?\n  \}\n  function queueCloudSave",re.S)
new_write="""  async function writeCloudNow(){
    if(mode!=='admin'||!sb)return;
    if(cloudSaving){pendingSave=true;return}
    cloudSaving=true;
    try{
      const {data:{user}}=await sb.auth.getUser();if(!user)throw new Error('Admin 세션이 만료되었습니다.');
      const payload=typeof mwsStripDevicePrefs==='function'?mwsStripDevicePrefs(data):clone(data);
      if(Array.isArray(payload.posts))for(const post of payload.posts){delete post.sourceContent;delete post.sourcePhotos;delete post.sourceAuthor;delete post.sourceAuthorId;delete post.sourceRegDate;delete post.sourceViewCount;delete post.sourceUrl}
      const saved=await sb.rpc('save_shared_state',{p_data:payload});if(saved.error)throw saved.error;
      const st=$('syncStatusText');if(st)st.textContent='Supabase 저장 완료';
    }catch(e){console.error('Supabase 저장 실패',e);try{toast('온라인 저장 실패',e.message||String(e))}catch(_){}}
    finally{cloudSaving=false;if(pendingSave){pendingSave=false;queueCloudSave()}}
  }
  function queueCloudSave"""
s,n=old_write.subn(new_write,s,count=1)
if n!=1: raise SystemExit(f'writeCloudNow replacement count={n}')

old_initial=re.compile(r"  async function writeInitialState\(\)\{.*?\n  \}\n\n  async function isCurrentUserAdmin",re.S)
new_initial="""  async function writeInitialState(){
    const {data:{user}}=await sb.auth.getUser();if(!user)return;
    const payload=typeof mwsStripDevicePrefs==='function'?mwsStripDevicePrefs(data):clone(data);
    if(Array.isArray(payload.posts))for(const post of payload.posts){delete post.sourceContent;delete post.sourcePhotos;delete post.sourceAuthor;delete post.sourceAuthorId;delete post.sourceRegDate;delete post.sourceViewCount;delete post.sourceUrl}
    const saved=await sb.rpc('save_shared_state',{p_data:payload});if(saved.error)throw saved.error;
  }

  async function isCurrentUserAdmin"""
s,n=old_initial.subn(new_initial,s,count=1)
if n!=1: raise SystemExit(f'writeInitialState replacement count={n}')

# Add a marker only; no global render or category logic is touched.
marker='<!-- mws-v5.7.1-storage-title-hotfix -->\n'
if marker.strip() not in s:
    s=s.replace('</body>',marker+'</body>')

p.write_text(s,encoding='utf-8')
print('v5.7.1 narrow hotfix applied')
