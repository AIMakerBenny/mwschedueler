(() => {
  const key = 'mws-cursor-v1';
  const root = document.documentElement;
  const sizes = [32, 48, 64];
  const variants = {
    finger: { label: '마왕 손가락', points: [[1,14],[1,21],[1,28]] },
    red: { label: '레드 애로우', points: [[1,1],[1,1],[1,1]] },
    big: { label: '빅 애로우', points: [[9,1],[13,1],[17,1]] },
    mw: { label: 'MW', points: [[1,1],[1,1],[1,1]], color:true },
    '0216': { label: '0216', points: [[1,1],[1,1],[1,1]], color:true },
    codeng: { label: '고속 코덩이', points: [[1,1],[1,1],[1,1]], animated:true, frames:5, duration:250 },
    'devil-dance': { label: '악마춤', points: [[1,1],[1,1],[1,1]], animated:true, frames:20, duration:800 },
    system: { label: '시스템 기본' }
  };
  const assetBase = new URL('cursors/', document.currentScript.src);
  const mouse = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const imageUrl = (variant, size) => new URL(`${variant}-${size}.png?v=3`, assetBase).href;
  const withinWindow = event => event.clientX>=0 && event.clientY>=0 &&
    event.clientX<(window.innerWidth||root.clientWidth) && event.clientY<(window.innerHeight||root.clientHeight);
  const original = '#f8dce9';
  const validColor = color => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : original;
  function normalize(raw) {
    return { variant: Object.hasOwn(variants, raw?.variant) ? raw.variant : 'finger',
      size: sizes.includes(raw?.size) ? raw.size : 48,
      colors: {mw:validColor(raw?.colors?.mw), '0216':validColor(raw?.colors?.['0216'])},
      play:raw?.play !== false };
  }
  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(key))); }
    catch (_) { return normalize(null); }
  }
  let prefs = load();
  let animation = null;
  let staticEdge = null;
  const logoCache = new Map();
  const previewImages = new Map();
  let applyVersion = 0;
  function logoUrl(variant,size,color) {
    const source = imageUrl(variant,size);
    if (color === original) return Promise.resolve(source);
    const id = `${variant}-${size}-${color}`;
    if (logoCache.has(id)) return logoCache.get(id);
    const result = new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img,0,0);
          const pixels = ctx.getImageData(0,0,canvas.width,canvas.height);
          const rgb = [1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
          const d = pixels.data;
          for (let i=0;i<d.length;i+=4) {
            // Only the pink highlight. White arrow, neutral outline and alpha stay intact.
            const strength = Math.max(0,Math.min(1,(Math.min(d[i],d[i+2])-d[i+1]-2)/15));
            if (!strength || d[i]<125 || !d[i+3]) continue;
            const light = Math.max(d[i],d[i+1],d[i+2])/255;
            for(let c=0;c<3;c++) d[i+c] = Math.round(d[i+c]*(1-strength)+rgb[c]*light*strength);
          }
          ctx.putImageData(pixels,0,0);
          resolve(canvas.toDataURL('image/png'));
        } catch (_) { resolve(source); }
      };
      img.onerror = () => resolve(source);
      img.src = source;
    });
    logoCache.set(id,result);
    if (logoCache.size>24) logoCache.delete(logoCache.keys().next().value);
    return result;
  }
  function setNative(variant,size,arrow=false,customUrl=null) {
    const [x,y] = arrow ? [1,1] : variants[variant].points[sizes.indexOf(size)];
    let image = `url("${customUrl || imageUrl(arrow?'animation-arrow':variant, size)}") ${x} ${y}`;
    // Never shrink the selected art. The small native arrow is only a real
    // click marker while the original image is rendered inside the page.
    if (!arrow) image += `, url("${imageUrl('animation-arrow',32)}") 1 1`;
    root.style.setProperty('--mws-cursor-default', `${image}, auto`);
    root.style.setProperty('--mws-cursor-pointer', `${image}, pointer`);
    root.dataset.mwsCursor = variant;
  }
  function stopAnimation() {
    if (!animation) return;
    animation.dispose();
    animation = null;
  }
  function stopStaticEdge() {
    if (!staticEdge) return;
    staticEdge.dispose();
    staticEdge = null;
  }
  // A native cursor remains fastest and exact in the middle of the page.
  // On approaching any viewport boundary, move the full-size artwork onto
  // a non-interactive fixed layer. The white native arrow marks the actual
  // click coordinate; artwork can be clamped without moving that coordinate.
  function startStaticEdge(variant,size,customUrl=null) {
    const source = customUrl || imageUrl(variant,size);
    const id = `${variant}-${size}-${source}`;
    if (staticEdge?.id === id) return;
    stopStaticEdge();
    setNative(variant,size,false,source);
    if (!document.body) return;
    const [hotX,hotY] = variants[variant].points[sizes.indexOf(size)];
    const controller = new AbortController(), signal = controller.signal;
    const sprite = document.createElement('div');
    sprite.className = 'mws-cursor-animation mws-cursor-static-edge';
    sprite.setAttribute('aria-hidden','true');
    sprite.hidden = true;
    document.body.append(sprite);
    const arrowUrl = imageUrl('animation-arrow',size);
    let w=0,h=0,frame=0,target=null,eligible=false,active=false,lastEvent=null;
    let vw=root.clientWidth,vh=root.clientHeight,left=0,top=0;
    const hide = () => {
      if(frame) cancelAnimationFrame(frame);
      frame=0; sprite.hidden=true;
      if(active) { active=false; setNative(variant,size,false,source); }
    };
    const clear = () => {lastEvent=null;target=null;eligible=false;hide();};
    const current = {id,dispose(){controller.abort();clear();sprite.remove();}};
    staticEdge=current;
    const update = event => {
      if(event.pointerType!=='mouse'||document.hidden){clear();return;}
      lastEvent=event;
      if(!w||!h)return;
      const next=event.target;
      if(target!==next){
        target=next;
        const cursor=next instanceof Element&&!next.matches('iframe,object,embed')?getComputedStyle(next).cursor:'';
        eligible=cursor.includes(source)||cursor.includes(arrowUrl);
      }
      if(!eligible){hide();return;}
      // Keep a small gutter from native scrollbars and browser edges.
      const x=event.clientX-hotX,y=event.clientY-hotY;
      // Scrollbar appearance can change clientWidth without a window resize.
      // Refresh only near a boundary to avoid layout reads during ordinary motion.
      if(x<2||y<2||x>vw-w-32||y>vh-h-32){vw=root.clientWidth;vh=root.clientHeight;}
      const maxX=Math.max(0,vw-w-16),maxY=Math.max(0,vh-h-4);
      const edge=x<2||y<2||x>maxX||y>maxY;
      if(!edge){hide();return;}
      left=Math.min(maxX,Math.max(0,x));top=Math.min(maxY,Math.max(0,y));
      if(!frame)frame=requestAnimationFrame(()=>{
        frame=0;
        sprite.style.transform=`translate3d(${left}px,${top}px,0)`;
        sprite.hidden=false;
        if(!active){active=true;setNative(variant,size,true);}
      });
    };
    const opts={capture:true,passive:true,signal};
    window.addEventListener('pointermove',update,opts);
    window.addEventListener('pointerover',update,opts);
    window.addEventListener('pointerup',update,opts);
    window.addEventListener('pointercancel',clear,opts);
    window.addEventListener('pointerout',event=>{
      if(event.relatedTarget)return;
      // A native scrollbar may report no related DOM element while the
      // pointer is still inside the viewport. Keep the artwork there.
      if(active&&withinWindow(event))return;
      clear();
    },opts);
    window.addEventListener('dragstart',clear,opts);
    window.addEventListener('blur',clear,{signal});
    window.addEventListener('scroll',()=>{target=null;},opts);
    window.addEventListener('resize',()=>{vw=root.clientWidth;vh=root.clientHeight;target=null;if(lastEvent)update(lastEvent);},opts);
    document.addEventListener('visibilitychange',clear,{signal});
    const img=new Image();
    img.addEventListener('load',()=>{
      if(staticEdge!==current||!img.naturalWidth||!img.naturalHeight)return;
      w=img.naturalWidth;h=img.naturalHeight;
      sprite.style.width=`${w}px`;sprite.style.height=`${h}px`;
      sprite.style.backgroundImage=`url("${source}")`;
      sprite.style.backgroundSize=`${w}px ${h}px`;
      if(lastEvent)update(lastEvent);
    },{once:true,signal});
    img.src=source;
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
    const sprite = document.createElement('div');
    sprite.className = 'mws-cursor-animation';
    sprite.setAttribute('aria-hidden','true');
    sprite.hidden = true;
    const width = size-offset;
    sprite.style.width = sprite.style.height = `${width}px`;
    document.body.append(sprite);
    const arrowUrl = imageUrl('animation-arrow',size);
    let frame = 0, target = null, eligible = false, x = 0, y = 0, playback = null, lastEvent = null;
    const hide = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0; target = null; eligible = false; sprite.hidden = true; playback?.pause();
    };
    const current = {id,ready:false,dispose(){controller.abort();hide();playback?.cancel();sprite.remove();}};
    animation = current;
    const update = event => {
      if (event.pointerType !== 'mouse' || event.buttons || document.hidden) { lastEvent=null; hide(); return; }
      lastEvent = event;
      if (!current.ready) return;
      const next = event.target;
      if (target !== next) {
        target = next;
        eligible = next instanceof Element && !next.matches('iframe,object,embed') && getComputedStyle(next).cursor.includes(arrowUrl);
      }
      if (!eligible) { hide(); return; }
      x = event.clientX+offset-1; y = event.clientY+offset-1;
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        // Constrain only the decoration to the visible page. The small native
        // arrow stays at the actual click coordinate, including at corners.
        const maxX = Math.max(0,root.clientWidth-width-16);
        const maxY = Math.max(0,root.clientHeight-width-4);
        const left = Math.min(maxX,Math.max(0,x));
        const top = Math.min(maxY,Math.max(0,y));
        sprite.style.transform = `translate3d(${left}px,${top}px,0)`;
        if (sprite.hidden) { sprite.hidden = false; playback?.play(); }
      });
    };
    const opts = {capture:true,passive:true,signal};
    window.addEventListener('pointermove',update,opts);
    window.addEventListener('pointerover',update,opts);
    const clear = () => {lastEvent=null;hide();};
    window.addEventListener('pointerdown',clear,opts);
    window.addEventListener('pointerup',update,opts);
    window.addEventListener('pointercancel',clear,opts);
    window.addEventListener('pointerout',event=>{if (!event.relatedTarget && (sprite.hidden || !withinWindow(event))) clear();},opts);
    window.addEventListener('dragstart',clear,opts);
    window.addEventListener('blur',clear,{signal});
    window.addEventListener('scroll',()=>{target=null;},opts);
    window.addEventListener('resize',()=>{target=null;if(lastEvent)update(lastEvent);},opts);
    document.addEventListener('visibilitychange',clear,{signal});
    const sheet = new Image();
    const stripUrl = imageUrl(`${variant}-strip`,size);
    sheet.addEventListener('load',()=>{
      if (animation !== current || !sheet.naturalWidth) return;
      const {frames,duration}=variants[variant];
      if (typeof sprite.animate !== 'function') {
        sprite.style.backgroundImage = `url("${imageUrl(`${variant}-motion`,size)}")`;
        sprite.style.backgroundSize = `${width}px ${width}px`;
      } else {
        sprite.style.backgroundImage = `url("${stripUrl}")`;
        sprite.style.backgroundSize = `${width*frames}px ${width}px`;
        playback = sprite.animate([{backgroundPosition:'0px 0px'},{backgroundPosition:`-${width*frames}px 0px`}],{duration,iterations:Infinity,easing:`steps(${frames}, end)`});
        playback.pause();
      }
      current.ready = true; target = null;
      setNative(variant,size,true);
      if (lastEvent) update(lastEvent);
    },{once:true,signal});
    sheet.addEventListener('error',()=>{if(animation===current){stopAnimation();setNative(variant,size);}}, {once:true,signal});
    sheet.src = stripUrl;
  }
  function apply() {
    const {variant, size, colors, play} = prefs;
    const version = ++applyVersion;
    if (variant === 'system' || !mouse.matches) {
      stopAnimation(); stopStaticEdge();
      root.removeAttribute('data-mws-cursor');
      root.style.removeProperty('--mws-cursor-default');
      root.style.removeProperty('--mws-cursor-pointer');
    } else if (variants[variant].animated && play) {stopStaticEdge();startAnimation(variant,size);}
    else {
      stopAnimation(); startStaticEdge(variant,size);
      if (variants[variant].color && colors[variant] !== original) {
        logoUrl(variant,size,colors[variant]).then(url=>{if(version===applyVersion)startStaticEdge(variant,size,url);});
      }
    }
    const panel = document.getElementById('mwsCursorSettings');
    if (!panel) return;
    panel.querySelectorAll('[name="mwsCursorVariant"]').forEach(input => { input.checked = input.value === variant; });
    panel.querySelectorAll('[name="mwsCursorSize"]').forEach(input => { input.checked = Number(input.value) === size; input.disabled = variant === 'system'; });
    const status = panel.querySelector('[data-cursor-status]');
    status.textContent = !mouse.matches ? '마우스 연결 시 적용' : variant === 'system' ? '시스템 기본' : `${size}px`;
    panel.querySelector('[data-cursor-test]').textContent = !mouse.matches ? '터치 환경에서는 시스템 포인터를 사용합니다.' : variants[variant].animated && !play ? '움짤 재생이 꺼져 있습니다.' : '이곳에 마우스를 올려 포인터를 확인하세요.';
    const colorPanel = panel.querySelector('[data-cursor-colors]');
    colorPanel.hidden = !variants[variant].color;
    if (variants[variant].color) {
      const color = colors[variant];
      colorPanel.querySelector('[name="mwsCursorColor"]').value = color;
      colorPanel.querySelectorAll('[data-cursor-color]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.cursorColor===color)));
    }
    panel.querySelector('[data-cursor-play]').hidden = !variants[variant].animated;
    panel.querySelector('[name="mwsCursorPlay"]').checked = play;
    for (const [id,img] of previewImages) {
      logoUrl(id,64,colors[id]).then(url=>{if(version===applyVersion)img.src=url;});
    }
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
    for (const id of ['finger','red','big','mw','0216','codeng','devil-dance','system']) {
      const variant = variants[id];
      const label = document.createElement('label');
      label.className = 'mws-cursor-choice';
      const input = Object.assign(document.createElement('input'), {type:'radio', name:'mwsCursorVariant', value:id});
      const preview = document.createElement('span');
      preview.className = 'mws-cursor-preview';
      if (id === 'system') {
        preview.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 3v24l6-6 5 9 4-2-5-10h9z" fill="currentColor" stroke="var(--panel)" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      } else {
        const img = Object.assign(document.createElement('img'), {src:imageUrl(id, 64), alt:'', width:64, height:64, decoding:'async', loading:'lazy'});
        if (variant.color) previewImages.set(id,img);
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
      if (input.name === 'mwsCursorColor' && variants[prefs.variant].color) save({...prefs,colors:{...prefs.colors,[prefs.variant]:input.value}});
      if (input.name === 'mwsCursorPlay') save({...prefs,play:input.checked});
    });
    panel.querySelectorAll('[data-cursor-color]').forEach(button=>button.addEventListener('click',()=>{
      if(variants[prefs.variant].color)save({...prefs,colors:{...prefs.colors,[prefs.variant]:button.dataset.cursorColor}});
    }));
    panel.querySelector('[data-cursor-reset]').addEventListener('click', () => save({variant:'finger',size:48}));
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
