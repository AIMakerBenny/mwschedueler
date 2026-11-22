(() => {
  const key = 'mws-cursor-v1';
  const root = document.documentElement;
  const sizes = [32, 48, 64];
  const variants = {
    finger: { label: '마왕 손가락', points: [[1,14],[1,21],[1,28]] },
    red: { label: '레드 애로우', points: [[1,1],[1,1],[1,1]] },
    big: { label: '빅 애로우', points: [[9,1],[13,1],[17,1]] },
    codeng: { label: '고속 코덩이', points: [[1,1],[1,1],[1,1]], animated:true },
    'devil-dance': { label: '악마춤', points: [[1,1],[1,1],[1,1]], animated:true },
    system: { label: '시스템 기본' }
  };
  const assetBase = new URL('cursors/', document.currentScript.src);
  const mouse = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const imageUrl = (variant, size) => new URL(`${variant}-${size}.png`, assetBase).href;
  function normalize(raw) {
    return { variant: Object.hasOwn(variants, raw?.variant) ? raw.variant : 'finger',
      size: sizes.includes(raw?.size) ? raw.size : 48 };
  }
  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(key))); }
    catch (_) { return normalize(null); }
  }
  let prefs = load();
  let animation = null;
  function reducedMotion() {
    if (reduce.matches || root.dataset.mwsMotion === 'reduced') return true;
    try { return localStorage.getItem('mws-screen-motion-v1') === 'reduced'; }
    catch (_) { return false; }
  }
  function setNative(variant,size,arrow=false) {
    const [x,y] = variants[variant].points[sizes.indexOf(size)];
    const image = `url("${imageUrl(arrow?'animation-arrow':variant, size)}") ${x} ${y}`;
    root.style.setProperty('--mws-cursor-default', `${image}, auto`);
    root.style.setProperty('--mws-cursor-pointer', `${image}, pointer`);
    root.dataset.mwsCursor = variant;
  }
  function stopAnimation() {
    if (!animation) return;
    animation.dispose();
    animation = null;
  }
  // Keep the arrow as a real native cursor. Only the tiny animated character
  // follows it, with no hit testing changes and at most one transform per frame.
  function startAnimation(variant,size) {
    const id = `${variant}-${size}`;
    if (animation?.id === id) { setNative(variant,size,animation.ready); return; }
    stopAnimation();
    setNative(variant,size);
    if (!document.body) return;
    const offset = [6,8,10][sizes.indexOf(size)];
    const controller = new AbortController();
    const signal = controller.signal;
    const sprite = document.createElement('img');
    sprite.className = 'mws-cursor-animation';
    sprite.alt = '';
    sprite.draggable = false;
    sprite.setAttribute('aria-hidden','true');
    sprite.hidden = true;
    sprite.width = sprite.height = size-offset;
    document.body.append(sprite);
    const arrowUrl = imageUrl('animation-arrow',size);
    let frame = 0, target = null, eligible = false, x = 0, y = 0;
    const hide = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0; target = null; eligible = false; sprite.hidden = true;
    };
    const current = {id,ready:false,dispose(){controller.abort();hide();sprite.remove();}};
    animation = current;
    const update = event => {
      if (!current.ready || event.pointerType !== 'mouse' || event.buttons || document.hidden) { hide(); return; }
      const next = event.target;
      if (target !== next) {
        target = next;
        eligible = next instanceof Element && !next.matches('iframe,object,embed') && getComputedStyle(next).cursor.includes(arrowUrl);
      }
      if (!eligible) { hide(); return; }
      x = event.clientX+offset-1; y = event.clientY+offset-1;
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        sprite.style.transform = `translate3d(${x}px,${y}px,0)`;
        sprite.hidden = false;
      });
    };
    const opts = {capture:true,passive:true,signal};
    window.addEventListener('pointermove',update,opts);
    window.addEventListener('pointerover',update,opts);
    window.addEventListener('pointerdown',hide,opts);
    window.addEventListener('pointerup',update,opts);
    window.addEventListener('pointercancel',hide,opts);
    window.addEventListener('pointerout',event=>{if (!event.relatedTarget) hide();},opts);
    window.addEventListener('dragstart',hide,opts);
    window.addEventListener('blur',hide,{signal});
    window.addEventListener('scroll',()=>{target=null;},opts);
    document.addEventListener('visibilitychange',hide,{signal});
    sprite.addEventListener('load',()=>{
      if (animation !== current || !sprite.naturalWidth) return;
      current.ready = true; target = null;
      setNative(variant,size,true);
    },{once:true,signal});
    sprite.addEventListener('error',()=>{if(animation===current){stopAnimation();setNative(variant,size);}}, {once:true,signal});
    sprite.src = imageUrl(`${variant}-motion`,size);
  }
  function apply() {
    const {variant, size} = prefs;
    if (variant === 'system' || !mouse.matches) {
      stopAnimation();
      root.removeAttribute('data-mws-cursor');
      root.style.removeProperty('--mws-cursor-default');
      root.style.removeProperty('--mws-cursor-pointer');
    } else if (variants[variant].animated && !reducedMotion()) startAnimation(variant,size);
    else { stopAnimation(); setNative(variant,size); }
    const panel = document.getElementById('mwsCursorSettings');
    if (!panel) return;
    panel.querySelectorAll('[name="mwsCursorVariant"]').forEach(input => { input.checked = input.value === variant; });
    panel.querySelectorAll('[name="mwsCursorSize"]').forEach(input => { input.checked = Number(input.value) === size; input.disabled = variant === 'system'; });
    const status = panel.querySelector('[data-cursor-status]');
    status.textContent = !mouse.matches ? '마우스 연결 시 적용' : variant === 'system' ? '시스템 기본' : `${size}px`;
    panel.querySelector('[data-cursor-test]').textContent = !mouse.matches ? '터치 환경에서는 시스템 포인터를 사용합니다.' : variants[variant].animated && reducedMotion() ? '모션 감소 설정으로 정지 이미지가 표시됩니다.' : '이곳에 마우스를 올려 포인터를 확인하세요.';
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
      if (variant.animated) label.classList.add('mws-cursor-animated-choice');
      label.append(input, preview, title);
      choices.append(label);
    }
    panel.addEventListener('change', event => {
      const input = event.target;
      if (input.name === 'mwsCursorVariant') save({...prefs, variant:input.value});
      if (input.name === 'mwsCursorSize') save({...prefs, size:Number(input.value)});
    });
    panel.querySelector('[data-cursor-reset]').addEventListener('click', () => save({variant:'finger',size:48}));
    apply();
  }
  mouse.addEventListener('change', apply);
  reduce.addEventListener('change', apply);
  window.addEventListener('mws-motion-change', apply);
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { prefs = load(); apply(); }
    else if (event.key === 'mws-screen-motion-v1') apply();
  });
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
