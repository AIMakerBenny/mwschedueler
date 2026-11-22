(() => {
  const key = 'mws-cursor-v1';
  const root = document.documentElement;
  const sizes = [32, 48, 64];
  const variants = {
    system: { label: '시스템 기본' },
    finger: { label: '마왕 손가락', points: [[1,14],[1,21],[1,28]] },
    red: { label: '레드 애로우', points: [[1,1],[1,1],[1,1]] },
    mini: { label: '미니 애로우', points: [[6,1],[9,1],[12,1]] },
    big: { label: '빅 애로우', points: [[9,1],[13,1],[17,1]] }
  };
  const assetBase = new URL('cursors/', document.currentScript.src);
  const mouse = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const imageUrl = (variant, size) => new URL(`${variant}-${size}.png`, assetBase).href;
  function normalize(raw) {
    return { variant: Object.hasOwn(variants, raw?.variant) ? raw.variant : 'system',
      size: sizes.includes(raw?.size) ? raw.size : 48 };
  }
  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(key))); }
    catch (_) { return normalize(null); }
  }
  let prefs = load();
  function apply() {
    const {variant, size} = prefs;
    if (variant === 'system' || !mouse.matches) {
      root.removeAttribute('data-mws-cursor');
      root.style.removeProperty('--mws-cursor-default');
      root.style.removeProperty('--mws-cursor-pointer');
    } else {
      const [x,y] = variants[variant].points[sizes.indexOf(size)];
      const image = `url("${imageUrl(variant, size)}") ${x} ${y}`;
      root.style.setProperty('--mws-cursor-default', `${image}, auto`);
      root.style.setProperty('--mws-cursor-pointer', `${image}, pointer`);
      root.dataset.mwsCursor = variant;
    }
    const panel = document.getElementById('mwsCursorSettings');
    if (!panel) return;
    panel.querySelectorAll('[name="mwsCursorVariant"]').forEach(input => { input.checked = input.value === variant; });
    panel.querySelectorAll('[name="mwsCursorSize"]').forEach(input => { input.checked = Number(input.value) === size; input.disabled = variant === 'system'; });
    const status = panel.querySelector('[data-cursor-status]');
    status.textContent = !mouse.matches ? '마우스 연결 시 적용' : variant === 'system' ? '시스템 기본' : `${size}px`;
    panel.querySelector('[data-cursor-test]').textContent = !mouse.matches ? '터치 환경에서는 시스템 포인터를 사용합니다.' : '이곳에 마우스를 올려 포인터를 확인하세요.';
  }
  function save(next) {
    prefs = normalize(next);
    try { localStorage.setItem(key, JSON.stringify(prefs)); } catch (_) {}
    apply();
  }
  function init() {
    const panel = document.getElementById('mwsCursorSettings');
    if (!panel) return;
    const choices = panel.querySelector('[data-cursor-choices]');
    for (const [id, variant] of Object.entries(variants)) {
      const label = document.createElement('label');
      label.className = 'mws-cursor-choice';
      const input = Object.assign(document.createElement('input'), {type:'radio', name:'mwsCursorVariant', value:id});
      const preview = document.createElement('span');
      preview.className = 'mws-cursor-preview';
      if (id === 'system') {
        preview.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 3v24l6-6 5 9 4-2-5-10h9z" fill="currentColor" stroke="var(--panel)" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      } else {
        const img = Object.assign(document.createElement('img'), {src:imageUrl(id, 64), alt:'', width:64, height:64, decoding:'async', loading:'lazy'});
        preview.append(img);
      }
      const title = document.createElement('span');
      title.textContent = variant.label;
      label.append(input, preview, title);
      choices.append(label);
    }
    panel.addEventListener('change', event => {
      const input = event.target;
      if (input.name === 'mwsCursorVariant') save({...prefs, variant:input.value});
      if (input.name === 'mwsCursorSize') save({...prefs, size:Number(input.value)});
    });
    panel.querySelector('[data-cursor-reset]').addEventListener('click', () => save({variant:'system',size:48}));
    apply();
  }
  mouse.addEventListener('change', apply);
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { prefs = load(); apply(); }
  });
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
