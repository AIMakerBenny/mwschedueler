import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const window={};vm.runInNewContext(read('assets/mawang-archive-data-v1.js'),{window});
const {entries,videos}=window.mwsMawangArchiveDataV1;
test('23 individually named records with dates distinguished from unknown dates and sources',()=>{
  assert.equal(entries.length,23);
  assert.equal(new Set(entries.map(c=>c.id)).size,23);
  assert.equal(entries.filter(c=>c.group==='jeong').length,9);
  assert.equal(entries.filter(c=>c.group==='classic').length,14);
  assert.equal(entries.filter(c=>c.imageSource.startsWith('PIKU')).length,20);
  assert.equal(entries.find(c=>c.id==='yoo').name,'유정');
  for(const c of entries){
    assert(c.description&&c.tagline&&c.english&&c.tags.length&&c.sources.length);
    assert(c.date===null||/^\d{4}-\d{2}-\d{2}$/.test(c.date));
    assert(c.date!==null||c.dateLabel.includes('미확인'));
    assert(/^https:\/\/(img2\.piku\.co\.kr|file\.namu\.moe)\//.test(c.imageOriginal));
    if(c.imageSource.startsWith('PIKU')){
      assert.equal(c.image,`/assets/mawang-archive-portraits/${c.id}.jpg`);
      const jpg=readFileSync(new URL('..'+c.image,import.meta.url));
      assert(jpg.length>1024&&jpg[0]===0xff&&jpg[1]===0xd8);
    }
    assert(c.sources.every(s=>s.url.startsWith('https://')&&!s.url.includes('cafe.naver')));
    assert(c.media.every(k=>videos[k]&&/^[\w-]{11}$/.test(videos[k].id)));
  }
});
test('archive registered between timeline and achievements, all data stays read-only',()=>{
  const html=read('index.html'),core=read('assets/app-core.js'),ui=read('assets/workspace-ui-v176.js'),runtime=read('assets/mawang-archive-v1.js'),css=read('assets/mawang-archive-v1.css');
  assert(/data-tab="careerTimeline"[\s\S]*?data-tab="mawangArchive"[\s\S]*?data-tab="achievements"/.test(html));
  assert(html.includes('id="mawangArchive"')&&html.includes('assets/mawang-archive-v1.js?v=2')&&html.includes('assets/mawang-archive-data-v1.js?v=2'));
  assert(core.includes("names.mawangArchive='마왕 자료실'")&&core.includes('window.mwsMawangArchiveV1?.render()'));
  assert(ui.includes('timeline.after(archive)')&&ui.includes('beforeAchievement=archive||timeline||afterPosts'));
  assert(!/\b(?:fetch|localStorage|setInterval|saveData)\s*\(/.test(runtime));
  assert(css.includes('prefers-reduced-motion:reduce')&&css.includes('data-mws-motion=reduced'));
});
