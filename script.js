(() => {
  const toggle = document.querySelector('.menu-toggle');
  const panel = document.querySelector('.menu-panel');
  if (toggle && panel) {
    const closeButton = panel.querySelector('.menu-close');
    const links = panel.querySelectorAll('a');
    function setMenu(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      panel.classList.toggle('open', open);
      panel.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('menu-open', open);
      if (open && closeButton) closeButton.focus();
      else if (!open) toggle.focus();
    }
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    if (closeButton) closeButton.addEventListener('click', () => setMenu(false));
    links.forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
  }

  function splitChars(root) {
    const chars = [];
    const label = [...root.childNodes].map(n => (n.nodeName === 'BR' ? ' ' : n.textContent)).join('');
    root.setAttribute('aria-label', label.replace(/\s+/g, ' ').trim());
    const walk = node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        [...node.textContent].forEach(ch => {
          if (/\s/.test(ch)) { frag.append(ch); return; }
          const span = document.createElement('span');
          span.className = 'ch';
          span.setAttribute('aria-hidden', 'true');
          span.textContent = ch;
          span.style.setProperty('--i', chars.length);
          chars.push(span);
          frag.append(span);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        [...node.childNodes].forEach(walk);
      }
    };
    [...root.childNodes].forEach(walk);
    return chars;
  }

  function initHero(hero) {
    const VARIANTS = ['1', '2', '3'];
    const NAMES = { 1: 'RED', 2: 'PURPLE', 3: 'GREEN' };
    const TITLES = {
      1: 'Designing<br>what’s <em>next.</em>',
      2: 'Bold ideas,<br>clear <em>paths.</em>',
      3: 'Systems with<br>a <em>soul.</em>'
    };
    const LENS_TITLES = { 2: 'Big thinking,<br>simple <em>steps.</em>' };
    const LENS_VARIANTS = ['2'];
    let lensLayer = null;
    let lensEdge = null;
    let lensR = 155;
    const lens = { x: 0, y: 0, s: 1, ready: false };
    const title = hero.querySelector('.hero-title');
    const stamp = hero.querySelector('.hero-stamp');
    const stampMode = hero.querySelector('.stamp-mode');
    const stampName = hero.querySelector('.stamp-name');
    const fx = hero.querySelector('.hero-fx');
    const orb = hero.querySelector('.hero-orb');
    const ring = hero.querySelector('.hero-ring');
    const buttons = hero.querySelectorAll('[data-hero-variant]');
    const cue = stamp;
    const nextOf = v => VARIANTS[(VARIANTS.indexOf(v) + 1) % VARIANTS.length];
    let chars = [];
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const auto = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const AUTO_MS = 5200;
    let autoElapsed = 0;
    let box = null;

    function measure() {
      if (title) {
        const hr = hero.getBoundingClientRect(), tr = title.getBoundingClientRect();
        box = { x: tr.left - hr.left, y: tr.top - hr.top, w: tr.width, h: tr.height };
      }
      chars.forEach(c => {
        let x = c.offsetWidth / 2, y = c.offsetHeight / 2, el = c;
        while (el && el !== hero) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
        c.cx = x;
        c.cy = y;
      });
      if (title) lensR = Math.max(90, parseFloat(getComputedStyle(title).fontSize) * 1.3);
      if (lensLayer) {
        lensLayer.style.padding = getComputedStyle(hero).padding;
        lens.ready = false;
        paintLens(null, true);
      }
    }

    function buildLens(v) {
      if (lensLayer) lensLayer.remove();
      if (lensEdge) lensEdge.remove();
      lensLayer = lensEdge = null;
      lens.ready = false;
      if (!LENS_VARIANTS.includes(v)) return;
      lensLayer = document.createElement('div');
      lensLayer.className = 'hero-lens';
      lensLayer.setAttribute('aria-hidden', 'true');
      lensLayer.inert = true;
      hero.querySelectorAll(':scope > .hero-title-wrap, :scope > .hero-bottom').forEach(el => lensLayer.append(el.cloneNode(true)));
      lensLayer.querySelectorAll('[id], [tabindex], [aria-describedby]').forEach(el => {
        el.removeAttribute('id');
        el.removeAttribute('tabindex');
        el.removeAttribute('aria-describedby');
      });
      const lensTitle = lensLayer.querySelector('.hero-title');
      if (lensTitle && LENS_TITLES[v]) lensTitle.innerHTML = LENS_TITLES[v];
      lensEdge = document.createElement('span');
      lensEdge.className = 'hero-lens-edge';
      lensEdge.setAttribute('aria-hidden', 'true');
      hero.append(lensLayer, lensEdge);
      const copy = lensLayer.querySelector('.hero-stamp');
      if (cue && copy && cue.getAnimations) {
        const named = el => el.getAnimations({ subtree: true }).filter(a => a.animationName);
        const src = named(cue);
        named(copy).forEach((a, i) => { if (src[i] && src[i].startTime !== null) a.startTime = src[i].startTime; });
      }
    }

    function paintLens(pointer, snap) {
      const w = hero.clientWidth, h = hero.clientHeight;
      const hr = hero.getBoundingClientRect(), tr = title.getBoundingClientRect();
      const cx = tr.left - hr.left + tr.width / 2, cy = tr.top - hr.top + tr.height / 2;
      let gx = tr.left - hr.left + tr.width * .68, gy = tr.top - hr.top + tr.height * .55, gs = 1;
      if (pointer) {
        gx = Math.max(0, Math.min(w, pointer.x));
        gy = Math.max(0, Math.min(h, pointer.y));
        if (pointer.ui) gs = 0;
      }
      if (!lens.ready || snap) { lens.x = gx; lens.y = gy; lens.s = gs; lens.ready = true; }
      const ox = lens.x, oy = lens.y;
      lens.x += (gx - lens.x) * .13;
      lens.y += (gy - lens.y) * .13;
      lens.s += (gs - lens.s) * .18;
      const vx = lens.x - ox, vy = lens.y - oy;
      const speed = Math.min(55, Math.hypot(vx, vy) * 3);
      const clamp = n => Math.max(-320, Math.min(320, n));
      const s = hero.style;
      s.setProperty('--lx', `${lens.x.toFixed(1)}px`);
      s.setProperty('--ly', `${lens.y.toFixed(1)}px`);
      s.setProperty('--dx', `${clamp(lens.x - cx).toFixed(1)}px`);
      s.setProperty('--dy', `${clamp(lens.y - cy).toFixed(1)}px`);
      s.setProperty('--lw', `${Math.max(0, (lensR + speed) * lens.s).toFixed(1)}px`);
      s.setProperty('--lh', `${Math.max(0, (lensR - speed * .4) * lens.s).toFixed(1)}px`);
      s.setProperty('--skew', `${Math.max(-5, Math.min(5, vx * .28)).toFixed(2)}deg`);
    }

    function setVariant(v) {
      hero.dataset.variant = v;
      document.documentElement.dataset.hero = v;
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.heroVariant === v)));
      if (title && title.dataset.variant !== v) {
        title.innerHTML = TITLES[v];
        title.dataset.variant = v;
        chars = splitChars(title);
        ['--lx', '--ly', '--dx', '--dy', '--lw', '--lh', '--skew'].forEach(p => hero.style.removeProperty(p));
      }
      chars.forEach(c => { c.style.transform = ''; c.classList.remove('is-near'); });
      hero.classList.remove('is-locked');
      autoElapsed = 0;
      const n = nextOf(v);
      if (cue) cue.setAttribute('aria-label', `Click to change the hero mode. Next: 0${n} ${NAMES[n][0]}${NAMES[n].slice(1).toLowerCase()}`);
      if (stampMode) stampMode.textContent = `0${v}`;
      if (stampName) stampName.textContent = NAMES[v];
      if (stamp) {
        stamp.classList.remove('is-bumped');
        void stamp.offsetWidth;
        stamp.classList.add('is-bumped');
      }
      buildLens(v);
      try { localStorage.setItem('hero-variant', v); } catch (e) {}
      requestAnimationFrame(measure);
    }

    function ripple(e) {
      if (!fx) return;
      const r = hero.getBoundingClientRect();
      const dot = document.createElement('span');
      dot.className = 'hero-ripple';
      dot.style.left = `${e.clientX - r.left}px`;
      dot.style.top = `${e.clientY - r.top}px`;
      fx.append(dot);
      dot.addEventListener('animationend', () => dot.remove());
    }

    hero.addEventListener('click', e => {
      if (e.target.closest('a, button, .hero-id')) return;
      if (String(window.getSelection()).trim()) return;
      setVariant(nextOf(hero.dataset.variant));
      ripple(e);
    });
    if (cue) cue.addEventListener('click', () => {
      const r = cue.getBoundingClientRect();
      setVariant(nextOf(hero.dataset.variant));
      ripple({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
    });

    let saved = null;
    try { saved = localStorage.getItem('hero-variant'); } catch (e) {}
    const fromUrl = new URLSearchParams(location.search).get('hero');
    setVariant(VARIANTS.includes(fromUrl) ? fromUrl : VARIANTS.includes(saved) ? saved : '1');
    buttons.forEach(b => b.addEventListener('click', () => setVariant(b.dataset.heroVariant)));
    window.addEventListener('resize', measure);
    if (document.fonts) document.fonts.ready.then(measure);

    if (still || !orb) return;
    orb.style.left = '0';
    orb.style.top = '0';
    const target = { x: hero.clientWidth * .65, y: hero.clientHeight * .45 };
    const slow = { ...target };
    const fast = { ...target };
    let tracking = false;
    let visible = true;
    let t = 0;

    hero.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      target.ui = !!e.target.closest('a, button, .hero-id');
      tracking = true;
      hero.classList.add('is-tracking');
    });
    hero.addEventListener('pointerleave', () => {
      tracking = false;
      hero.classList.remove('is-tracking', 'is-locked');
      chars.forEach(c => { c.style.transform = ''; c.classList.remove('is-near'); });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(hero);
    }

    function magnet(p) {
      let locked = false;
      const reach = auto ? Math.min(230, hero.clientWidth * .3) : 230;
      chars.forEach(c => {
        const dx = c.cx - p.x;
        const dy = c.cy - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / reach);
        c.style.transform = f ? `translate(${dx / d * f * 34}px, ${dy / d * f * 34}px) rotate(${dx / d * f * 12}deg)` : '';
        c.classList.toggle('is-near', f > .3);
        if (f > .3) locked = true;
      });
      hero.classList.toggle('is-locked', locked);
    }

    let last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      const dt = last ? Math.min(50, now - last) : 0;
      last = now;
      if (!visible || document.hidden) return;
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      if (auto) {
        autoElapsed += dt;
        if (autoElapsed > AUTO_MS) {
          setVariant(nextOf(hero.dataset.variant));
          const r = cue ? cue.getBoundingClientRect() : null;
          if (r) ripple({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
        }
      }
      if (!tracking) {
        t += .008;
        if (auto && box) {
          t += .01;
          target.x = box.x + box.w * (.5 + Math.sin(t) * .45);
          target.y = box.y + box.h * (.5 + Math.sin(t * 2) * .4);
        } else {
          target.x = w * (.64 + Math.cos(t) * .2);
          target.y = h * (.45 + Math.sin(t * 1.4) * .22);
        }
      }
      slow.x += (target.x - slow.x) * .06;
      slow.y += (target.y - slow.y) * .06;
      fast.x += (target.x - fast.x) * .25;
      fast.y += (target.y - fast.y) * .25;
      hero.style.setProperty('--mx', (slow.x / w).toFixed(3));
      hero.style.setProperty('--my', (slow.y / h).toFixed(3));
      hero.style.setProperty('--px', `${fast.x.toFixed(1)}px`);
      hero.style.setProperty('--py', `${fast.y.toFixed(1)}px`);
      orb.style.transform = `translate3d(${slow.x}px, ${slow.y}px, 0) translate(-50%, -50%)`;
      if (ring) ring.style.transform = `translate3d(${fast.x}px, ${fast.y}px, 0)`;
      const sweeping = tracking || auto;
      if (hero.dataset.variant === '3' && sweeping) magnet(fast);
      if (lensLayer) paintLens(sweeping ? target : null);
      if (cue) glowCue(w);
    }

    let cueNear = 0;
    function glowCue(w) {
      let goal = 0;
      if (tracking) {
        const hr = hero.getBoundingClientRect(), cr = cue.getBoundingClientRect();
        const lensMode = !!lensLayer;
        const p = lensMode ? lens : fast;
        const reach = lensMode ? lensR * lens.s : 30;
        const d = Math.hypot(cr.left - hr.left + cr.width / 2 - p.x, cr.top - hr.top + cr.height / 2 - p.y) - cr.width / 2 - reach;
        goal = Math.max(0, Math.min(1, 1 - d / Math.max(140, w * .12)));
      } else if (auto) {
        goal = Math.max(0, Math.min(1, (autoElapsed - AUTO_MS + 1400) / 1400));
      }
      cueNear += (goal - cueNear) * .15;
      const v = cueNear < .005 ? '0' : cueNear.toFixed(3);
      cue.style.setProperty('--near', v);
      const copy = lensLayer && lensLayer.querySelector('.hero-stamp');
      if (copy) copy.style.setProperty('--near', v);
    }
    requestAnimationFrame(frame);
  }

  const hero = document.querySelector('.hero[data-variant]');
  if (hero) initHero(hero);

  function initManifesto(section) {
    const stage = section.querySelector('.manifesto-stage');
    const slides = stage ? [...stage.querySelectorAll('h2')] : [...section.querySelectorAll(':scope > h2')];
    if (!slides.length) return;
    const principleEl = section.querySelector('.manifesto-index');
    const ROTATE_MS = 6200;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let activeIndex = 0;
    let title = slides[0];
    let chars = [];

    function slideLabel(el) {
      return [...el.childNodes].map(n => (n.nodeName === 'BR' ? ' ' : n.textContent)).join('').replace(/\s+/g, ' ').trim();
    }

    function prepSlide(slide) {
      const label = slideLabel(slide);
      const inner = document.createElement('span');
      inner.className = 'mf-title';
      inner.append(...slide.childNodes);
      slide.append(inner);
      const slideChars = splitChars(inner);
      inner.removeAttribute('aria-label');
      slide.setAttribute('aria-label', label);
      slide._chars = slideChars;
      return slideChars;
    }

    slides.forEach((slide, i) => {
      const slideChars = prepSlide(slide);
      slide.classList.toggle('is-active', i === 0);
      slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      if (i === 0) chars = slideChars;
    });

    function setActiveSlide(next) {
      if (next === activeIndex || !slides[next]) return;
      const prev = slides[activeIndex];
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      prev.setAttribute('aria-hidden', 'true');
      setTimeout(() => prev.classList.remove('is-leaving'), 750);
      activeIndex = next;
      title = slides[activeIndex];
      chars = title._chars;
      title.classList.add('is-active');
      title.setAttribute('aria-hidden', 'false');
      chars.forEach(c => { c.style.transform = ''; c.classList.remove('is-near'); });
      section.classList.remove('is-locked');
      if (principleEl) principleEl.textContent = `PRINCIPLE / ${String(activeIndex + 1).padStart(3, '0')}`;
      if (section.dataset.fx === '2') buildLens('2');
      requestAnimationFrame(measure);
    }

    let rotateTimer = null;
    function startRotate() {
      if (still || slides.length < 2) return;
      clearInterval(rotateTimer);
      rotateTimer = setInterval(() => setActiveSlide((activeIndex + 1) % slides.length), ROTATE_MS);
    }
    function stopRotate() {
      clearInterval(rotateTimer);
      rotateTimer = null;
    }

    const fx = document.createElement('div');
    fx.className = 'mf-fx';
    fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = '<div class="mf-dots"></div><div class="mf-ring"><i>✳</i><span>READ</span></div>';
    section.prepend(fx);
    const ring = fx.querySelector('.mf-ring');

    let lensLayer = null, lensEdge = null, lensR = 155;
    const lens = { x: 0, y: 0, s: 1, ready: false };

    function measure() {
      chars.forEach(c => {
        let x = c.offsetWidth / 2, y = c.offsetHeight / 2, el = c;
        while (el && el !== section) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
        c.cx = x;
        c.cy = y;
      });
      lensR = Math.max(90, parseFloat(getComputedStyle(title).fontSize) * 1.3);
      if (lensLayer) {
        lensLayer.style.padding = getComputedStyle(section).padding;
        lens.ready = false;
        paintLens(null, true);
      }
    }

    function buildLens(v) {
      if (lensLayer) lensLayer.remove();
      if (lensEdge) lensEdge.remove();
      lensLayer = lensEdge = null;
      lens.ready = false;
      if (v !== '2') return;
      lensLayer = document.createElement('div');
      lensLayer.className = 'mf-lens';
      lensLayer.setAttribute('aria-hidden', 'true');
      lensLayer.inert = true;
      [...section.children].forEach(el => {
        if (el === fx) return;
        const copy = el.cloneNode(true);
        copy.classList.remove('reveal');
        copy.querySelectorAll('[aria-label]').forEach(n => n.removeAttribute('aria-label'));
        copy.removeAttribute('aria-label');
        if (stage && el === stage) {
          const lensSlide = slides[1] || slides[0];
          const lensCopy = lensSlide.cloneNode(true);
          lensCopy.classList.add('is-active');
          copy.replaceChildren(lensCopy);
        }
        lensLayer.append(copy);
      });
      lensEdge = document.createElement('span');
      lensEdge.className = 'mf-lens-edge';
      lensEdge.setAttribute('aria-hidden', 'true');
      section.append(lensLayer, lensEdge);
    }

    function paintLens(pointer, snap) {
      const w = section.clientWidth, h = section.clientHeight;
      const sr = section.getBoundingClientRect(), tr = title.getBoundingClientRect();
      const cx = tr.left - sr.left + tr.width / 2, cy = tr.top - sr.top + tr.height / 2;
      let gx = tr.left - sr.left + tr.width * .68, gy = tr.top - sr.top + tr.height * .55;
      if (pointer) {
        gx = Math.max(0, Math.min(w, pointer.x));
        gy = Math.max(0, Math.min(h, pointer.y));
      }
      if (!lens.ready || snap) { lens.x = gx; lens.y = gy; lens.ready = true; }
      const ox = lens.x;
      lens.x += (gx - lens.x) * .13;
      lens.y += (gy - lens.y) * .13;
      const vx = lens.x - ox;
      const speed = Math.min(55, Math.abs(vx) * 3);
      const clamp = n => Math.max(-320, Math.min(320, n));
      const s = section.style;
      s.setProperty('--lx', `${lens.x.toFixed(1)}px`);
      s.setProperty('--ly', `${lens.y.toFixed(1)}px`);
      s.setProperty('--dx', `${clamp(lens.x - cx).toFixed(1)}px`);
      s.setProperty('--dy', `${clamp(lens.y - cy).toFixed(1)}px`);
      s.setProperty('--lw', `${(lensR + speed).toFixed(1)}px`);
      s.setProperty('--lh', `${(lensR - speed * .4).toFixed(1)}px`);
      s.setProperty('--skew', `${Math.max(-5, Math.min(5, vx * .28)).toFixed(2)}deg`);
    }

    function setMode(v) {
      if (section.dataset.fx === v) return;
      section.dataset.fx = v;
      chars.forEach(c => { c.style.transform = ''; c.classList.remove('is-near'); });
      section.classList.remove('is-locked');
      ['--lx', '--ly', '--dx', '--dy', '--lw', '--lh', '--skew'].forEach(p => section.style.removeProperty(p));
      buildLens(v);
      requestAnimationFrame(measure);
    }

    const root = document.documentElement;
    const sync = () => setMode(['1', '2', '3'].includes(root.dataset.hero) ? root.dataset.hero : '1');
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-hero'] });
    sync();
    window.addEventListener('resize', measure);
    if (document.fonts) document.fonts.ready.then(measure);

    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) startRotate();
      else stopRotate();
    }).observe(section);
    if (still) return;

    const target = { x: section.clientWidth * .6, y: section.clientHeight * .45 };
    const slow = { ...target };
    const fast = { ...target };
    let tracking = false, visible = false, running = false, t = 0;

    section.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = section.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      tracking = true;
      section.classList.add('is-tracking');
    });
    section.addEventListener('pointerleave', () => {
      tracking = false;
      section.classList.remove('is-tracking', 'is-locked');
      chars.forEach(c => { c.style.transform = ''; c.classList.remove('is-near'); });
    });

    function magnet(p) {
      let locked = false;
      chars.forEach(c => {
        const dx = c.cx - p.x;
        const dy = c.cy - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / 230);
        c.style.transform = f ? `translate(${dx / d * f * 34}px, ${dy / d * f * 34}px) rotate(${dx / d * f * 12}deg)` : '';
        c.classList.toggle('is-near', f > .3);
        if (f > .3) locked = true;
      });
      section.classList.toggle('is-locked', locked);
    }

    function frame() {
      if (!visible) { running = false; return; }
      requestAnimationFrame(frame);
      const w = section.clientWidth;
      const h = section.clientHeight;
      if (!tracking) {
        t += .008;
        target.x = w * (.6 + Math.cos(t) * .2);
        target.y = h * (.45 + Math.sin(t * 1.4) * .22);
      }
      slow.x += (target.x - slow.x) * .06;
      slow.y += (target.y - slow.y) * .06;
      fast.x += (target.x - fast.x) * .25;
      fast.y += (target.y - fast.y) * .25;
      section.style.setProperty('--mx', (slow.x / w).toFixed(3));
      section.style.setProperty('--my', (slow.y / h).toFixed(3));
      section.style.setProperty('--px', `${fast.x.toFixed(1)}px`);
      section.style.setProperty('--py', `${fast.y.toFixed(1)}px`);
      ring.style.transform = `translate3d(${fast.x}px, ${fast.y}px, 0)`;
      if (section.dataset.fx === '3' && tracking) magnet(fast);
      if (lensLayer) paintLens(tracking ? target : null);
    }

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !running) { running = true; requestAnimationFrame(frame); }
    }).observe(section);
  }

  const manifesto = document.querySelector('.manifesto');
  if (manifesto) initManifesto(manifesto);

  function initHeaderId(hero) {
    const src = hero.querySelector('.hero-id');
    const header = document.querySelector('.site-header');
    const mark = header && header.querySelector('.wordmark');
    const avatar = src && src.querySelector('.hero-avatar');
    if (!avatar || !mark) return;
    const root = document.documentElement;
    const dock = document.createElement('a');
    dock.className = 'header-id';
    dock.href = '#top';
    dock.setAttribute('aria-label', 'Kayhan, back to top');
    dock.innerHTML = `<img src="${avatar.getAttribute('src')}" alt="" width="44" height="44" decoding="async"><span>IT’S KAYHAN<br><small>UX DESIGNER / RASHT</small></span>`;
    const card = src.querySelector('.hero-id-card');
    if (card) {
      const copy = card.cloneNode(true);
      copy.removeAttribute('id');
      copy.setAttribute('aria-hidden', 'true');
      dock.append(copy);
    }
    mark.after(dock);
    dock.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let docked = false;
    let queued = false;
    const update = () => {
      queued = false;
      const h = header.offsetHeight;
      const a = avatar.getBoundingClientRect();
      const next = a.top < h;
      if (next !== docked) {
        docked = next;
        root.classList.toggle('id-docked', next);
      }
      dock.style.transform = `translateY(${Math.max((h - a.height) / 2, a.top).toFixed(1)}px)`;
    };
    const place = () => {
      header.style.setProperty('--id-x', `${mark.getBoundingClientRect().right - header.getBoundingClientRect().left + 18}px`);
      update();
    };
    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', place);
    if (document.fonts) document.fonts.ready.then(place);
    place();
  }
  if (hero) initHeaderId(hero);
  else {
    let saved = null;
    try { saved = localStorage.getItem('hero-variant'); } catch (e) {}
    document.documentElement.dataset.hero = ['1', '2', '3'].includes(saved) ? saved : '1';
  }

  function initHeaderSection(el) {
    const header = document.querySelector('.site-header');
    const [num, name] = [el.querySelector('i'), el.querySelector('b')];
    const custom = [...document.querySelectorAll('[data-mark]')];
    const marks = (custom.length
      ? custom.map(s => [s, ...s.dataset.mark.split('|')])
      : [
        ['#intro', '01', 'IN SHORT'],
        ['#gallery', '02', 'GALLERY'],
        ['#approach', '03', 'POINT OF VIEW'],
        ['#experience', '04', 'HOW I WORK'],
        ['#process', '05', 'BRIEF TO BUILD'],
        ['#contact', '06', 'CONTACT']
      ].map(([sel, n, t]) => [document.querySelector(sel), n, t])
    ).filter(m => m[0]);
    if (!marks.length) return;
    const moodText = () => el.dataset.idle || (window.matchMedia('(max-width:520px)').matches
      ? 'THREE MOODS'
      : 'EVERY MODE CHANGES THE WHOLE EXPERIENCE');
    let currentKey = null;
    let queued = false;
    const update = () => {
      queued = false;
      const line = header.offsetHeight + 1;
      let hit = null;
      for (const m of marks) if (m[0].getBoundingClientRect().top <= line) hit = m;
      const mood = !hit;
      el.classList.toggle('is-mood', mood);
      el.classList.add('is-on');
      const nextNum = mood ? '✳' : hit[1];
      const nextName = mood ? moodText() : hit[2];
      const key = mood ? `mood:${nextName}` : `${nextNum}:${nextName}`;
      if (key === currentKey) return;
      currentKey = key;
      num.textContent = nextNum;
      name.textContent = nextName;
      el.classList.remove('is-swap');
      void el.offsetWidth;
      el.classList.add('is-swap');
    };
    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  const headerSection = document.querySelector('.header-section');
  if (headerSection) initHeaderSection(headerSection);

  function initSectionRail() {
    const hero = document.querySelector('.hero');
    if (!hero || !document.querySelector('#gallery')) return;
    const sections = [
      ['#intro', '01', 'In short'],
      ['#gallery', '02', 'Gallery'],
      ['#approach', '03', 'Point of view'],
      ['#experience', '04', 'How I work'],
      ['#process', '05', 'Brief to build'],
      ['#contact', '06', 'Contact']
    ].map(([sel, num, label]) => [document.querySelector(sel), num, label]).filter(row => row[0]);
    if (!sections.length) return;

    const nav = document.createElement('nav');
    nav.className = 'section-rail';
    nav.setAttribute('aria-label', 'Jump to section');
    const list = document.createElement('ol');
    list.className = 'section-rail-list';
    const links = [];

    sections.forEach(([el, num, label]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${el.id}`;
      a.setAttribute('aria-label', `${num} / ${label}`);
      a.innerHTML = `<span class="section-rail-label">${label}</span><span class="section-rail-num">${num}</span><span class="section-rail-tick"></span>`;
      a.addEventListener('click', e => {
        e.preventDefault();
        const y = el.getBoundingClientRect().top + window.scrollY - (document.querySelector('.site-header')?.offsetHeight || 64) - 6;
        window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
      li.append(a);
      list.append(li);
      links.push({ a, el });
    });

    const top = document.createElement('a');
    top.className = 'section-rail-top';
    top.href = '#top';
    top.setAttribute('aria-label', 'Back to hero');
    top.innerHTML = '<span>BACK TO TOP</span><b aria-hidden="true">↑</b>';
    top.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });

    nav.append(list, top);
    document.body.append(nav);

    const header = document.querySelector('.site-header');
    const desktop = () => window.matchMedia('(min-width: 961px)').matches;
    const darkSections = [...document.querySelectorAll('.manifesto, .contact')];
    let queued = false;
    const update = () => {
      queued = false;
      const line = (header && header.offsetHeight) || 64;
      const pastHero = hero.getBoundingClientRect().bottom <= line + 4;
      const show = pastHero && desktop();
      nav.classList.toggle('is-visible', show);
      nav.setAttribute('aria-hidden', show ? 'false' : 'true');

      let hit = null;
      for (const { el } of links) if (el.getBoundingClientRect().top <= Math.max(line + 48, window.innerHeight * .4)) hit = el;
      links.forEach(({ a, el }) => {
        const on = hit === el;
        a.classList.toggle('is-active', on);
        if (on) {
          const r = el.getBoundingClientRect();
          const p = Math.min(1, Math.max(0, (window.innerHeight * .5 - r.top) / Math.max(1, r.height)));
          a.style.setProperty('--p', p.toFixed(3));
        } else a.style.removeProperty('--p');
      });

      const mid = window.innerHeight / 2;
      nav.classList.toggle('is-dark', darkSections.some(el => {
        const r = el.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      }));
    };
    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
  initSectionRail();

  const PREVIEW_DOCUMENT_WIDTH = 1280;

  function layoutPreviewEmbeds() {
    document.querySelectorAll('.preview-embed').forEach(wrap => {
      const iframe = wrap.querySelector('iframe');
      if (!iframe) return;
      const width = wrap.clientWidth;
      const height = wrap.clientHeight;
      if (!width || !height) return;
      const scale = width / PREVIEW_DOCUMENT_WIDTH;
      iframe.style.width = `${PREVIEW_DOCUMENT_WIDTH}px`;
      iframe.style.height = `${Math.ceil(height / scale)}px`;
      iframe.style.transform = `scale(${scale})`;
    });
  }

  function initPreviewEmbeds() {
    document.querySelectorAll('.browser-frame > iframe').forEach(iframe => {
      const wrap = document.createElement('div');
      wrap.className = 'preview-embed';
      iframe.replaceWith(wrap);
      wrap.appendChild(iframe);
      iframe.addEventListener('load', layoutPreviewEmbeds);
    });
    layoutPreviewEmbeds();
    window.addEventListener('resize', layoutPreviewEmbeds);
    if ('ResizeObserver' in window) {
      new ResizeObserver(layoutPreviewEmbeds).observe(document.documentElement);
    }
  }

  initPreviewEmbeds();

  function initCapabilityVisuals(section) {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover)').matches;
    const TINTS = { 1: [154, 56, 31], 2: [61, 75, 101], 3: [76, 102, 75] };
    const tintFor = () => TINTS[document.documentElement.dataset.hero] || TINTS[3];
    const rgb = tintFor().slice();
    let GREEN = '';
    const PAPER = '#f0e9dd';
    const TAU = Math.PI * 2;
    const green = a => `rgba(${rgb.map(Math.round).join(',')},${a})`;
    const tint = dt => {
      const goal = tintFor();
      const k = still || !dt ? 1 : Math.min(1, dt * 5);
      for (let i = 0; i < 3; i++) rgb[i] += (goal[i] - rgb[i]) * k;
      GREEN = green(1);
    };
    tint(0);
    const gauss = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));
    const clamp = x => Math.min(1, Math.max(0, x));
    const smooth = x => x * x * (3 - 2 * x);

    function clarity(v, time, dt) {
      const { ctx, w, h } = v;
      const N = 9, S = 72, pad = 4;
      if (!v.order || v.order.length !== S + 1) v.order = new Array(S + 1).fill(still ? 1 : 0);
      const comb = v.hover ? v.px : canHover ? -1 : ((time * .2) % 1.6) * w;
      for (let s = 0; s <= S; s++) {
        const goal = still || (comb >= 0 && s / S * w < comb) ? 1 : 0;
        v.order[s] += (goal - v.order[s]) * Math.min(1, dt * (goal ? 7 : 1.2));
      }
      const near = v.hover ? Math.round(clamp((v.py / h - .16) / .68) * (N - 1)) : -1;
      for (let j = 0; j < N; j++) {
        const yo = h * (.16 + .68 * j / (N - 1));
        ctx.beginPath();
        let last = 0;
        for (let s = 0; s <= S; s++) {
          const u = s / S;
          const yt = h * (.5 + .34 * (Math.sin(u * Math.PI * (2 + j * .45) + time * .6 + j * 2.1) * .75 + Math.sin(u * 17 - time * .9 + j) * .25));
          last = yt + (yo - yt) * smooth(v.order[s]);
          const x = pad + u * (w - pad * 2);
          s ? ctx.lineTo(x, last) : ctx.moveTo(x, last);
        }
        ctx.lineWidth = j === near ? 2.6 : 1.4;
        ctx.strokeStyle = j === near ? GREEN : green(.72);
        ctx.stroke();
        const o = v.order[S];
        if (o > .5) {
          ctx.beginPath();
          ctx.arc(w - pad, last, 3.2 * o, 0, TAU);
          ctx.fillStyle = GREEN;
          ctx.fill();
        }
      }
      if (comb > 0 && comb < w) {
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = green(.55);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(comb, 4); ctx.lineTo(comb, h - 4); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    function ecg(q) {
      return gauss(q, .1, .012) - .28 * gauss(q, .125, .01) - .14 * gauss(q, .08, .01) + .22 * gauss(q, .3, .04) + .08 * gauss(q, .9, .03);
    }

    function pulse(v, time, dt) {
      const { ctx, w, h } = v;
      v.k += ((v.hover ? 1 : 0) - v.k) * Math.min(1, dt * 3);
      const bpm = 58 + 56 * v.k;
      v.phase = (v.phase || 0) + (still ? 0 : dt * bpm / 60);
      const p = v.phase % 1;
      const beat = gauss(p, .1, .03) + .55 * gauss(p, .27, .035);
      if (!still && Math.floor(v.phase) !== v.lastBeat) { v.lastBeat = Math.floor(v.phase); v.rings.push(time); }
      const goalX = w / 2 + (v.hover ? (v.px - w / 2) * .14 : 0);
      v.cx = v.cx == null ? goalX : v.cx + (goalX - v.cx) * Math.min(1, dt * 4);
      const cx = v.cx, cy = h / 2;
      const R = Math.min(h * .2, w * .13) * (1 + beat * (.22 + .12 * v.k));
      const reach = Math.max(w, h) * .5;

      v.rings = v.rings.filter(t0 => time - t0 < 1.8);
      v.rings.forEach(t0 => {
        const age = (time - t0) / 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, R + age * reach, 0, TAU);
        ctx.strokeStyle = green(.4 * (1 - age));
        ctx.lineWidth = 1.4;
        ctx.stroke();
      });

      const amp = h * .34 * (.8 + .4 * v.k), L = w * .55;
      const trace = () => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const q = (((p - (cx - x) / L) % 1) + 1) % 1;
          const y = cy - ecg(q) * amp;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
      };
      const fade = ctx.createLinearGradient(0, 0, w, 0);
      fade.addColorStop(0, green(0));
      fade.addColorStop(.25, green(.9));
      fade.addColorStop(.75, green(.9));
      fade.addColorStop(1, green(0));
      trace();
      ctx.strokeStyle = fade;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const a = i / 64 * TAU;
        const r = R * (1 + .045 * Math.sin(3 * a + time * 1.2) + .035 * Math.sin(5 * a - time * .8));
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = GREEN;
      ctx.fill();
      ctx.save();
      ctx.clip();
      trace();
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    function align(v, time, dt) {
      const { ctx, w, h } = v;
      const cols = Math.max(7, Math.round(w / 30)), rows = Math.max(4, Math.round(h / 34)), pad = 10;
      if (!v.dots || v.cols !== cols || v.rows !== rows) {
        v.cols = cols; v.rows = rows; v.dots = [];
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          v.dots.push({
            hx: pad + c * (w - pad * 2) / (cols - 1), hy: pad + r * (h - pad * 2) / (rows - 1),
            sx: Math.random() * w, sy: Math.random() * h, ph: Math.random() * TAU, delay: Math.random() * .5
          });
        }
      }
      const goal = still || v.hover || (!canHover && Math.sin(time * .8) > 0) ? 1 : 0;
      v.k = still ? 1 : clamp(v.k + (goal ? 1 : -1) * dt * 1.3);
      if (v.k > .999 && !v.snapped) { v.snapped = true; v.flash = 1; }
      if (v.k < .9) v.snapped = false;

      const grid = clamp((v.k - .85) / .15);
      if (grid > 0) {
        ctx.strokeStyle = green(.28 * grid);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let r = 0; r < rows; r++) { const y = pad + r * (h - pad * 2) / (rows - 1); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); }
        for (let c = 0; c < cols; c++) { const x = pad + c * (w - pad * 2) / (cols - 1); ctx.moveTo(x, pad); ctx.lineTo(x, h - pad); }
        ctx.stroke();
      }
      if (v.flash > 0) {
        const grow = (1 - v.flash) * 12;
        ctx.strokeStyle = green(v.flash);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pad - 6 - grow, pad - 6 - grow, w - pad * 2 + 12 + grow * 2, h - pad * 2 + 12 + grow * 2);
        v.flash -= dt * 1.6;
      }

      v.dots.forEach(d => {
        const t = smooth(clamp(v.k * 1.5 - d.delay));
        const sx = d.sx + Math.sin(time * .7 + d.ph) * 12, sy = d.sy + Math.cos(time * .6 + d.ph) * 9;
        const x = sx + (d.hx - sx) * t, y = sy + (d.hy - sy) * t;
        const f = v.hover ? Math.max(0, 1 - Math.hypot(x - v.px, y - v.py) / 80) : 0;
        ctx.beginPath();
        ctx.arc(x, y, 2.6 + f * 4.5, 0, TAU);
        ctx.fillStyle = f > .05 ? GREEN : green(.35 + .5 * t);
        ctx.fill();
      });
    }

    const DRAW = [clarity, pulse, align];
    const views = [...section.querySelectorAll('.capability')].map((card, i) => {
      const canvas = card.querySelector('.cap-viz canvas');
      if (!canvas || !canvas.getContext || !DRAW[i]) return null;
      return { card, canvas, ctx: canvas.getContext('2d'), draw: DRAW[i], w: 0, h: 0, hover: false, px: 0, py: 0, k: 0, rings: [] };
    }).filter(Boolean);
    if (!views.length) return;

    let visible = false, last = 0;

    function render(v, time, dt) {
      v.ctx.clearRect(0, 0, v.w, v.h);
      v.draw(v, time, dt);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      views.forEach(v => {
        const r = v.canvas.getBoundingClientRect();
        v.w = r.width; v.h = r.height;
        v.canvas.width = Math.round(v.w * dpr);
        v.canvas.height = Math.round(v.h * dpr);
        v.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (still) render(v, 0, 1);
      });
    }

    views.forEach(v => {
      v.card.addEventListener('pointermove', e => {
        const r = v.canvas.getBoundingClientRect();
        v.px = e.clientX - r.left;
        v.py = e.clientY - r.top;
        if (e.pointerType === 'mouse') v.hover = true;
        v.card.classList.add('is-active');
      });
      v.card.addEventListener('pointerleave', () => {
        v.hover = false;
        v.card.classList.remove('is-active');
      });
    });

    function frame(now) {
      const dt = last ? Math.min(.05, (now - last) / 1000) : 0;
      last = now;
      tint(dt);
      views.forEach(v => render(v, now / 1000, dt));
      if (visible) requestAnimationFrame(frame);
      else last = 0;
    }

    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(section);
    else window.addEventListener('resize', resize);
    if (still) {
      new MutationObserver(() => { tint(0); views.forEach(v => render(v, 0, 1)); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-hero'] });
      return;
    }
    new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was) requestAnimationFrame(frame);
    }, { threshold: .1 }).observe(section.querySelector('.capability-grid') || section);
  }


  const capabilities = document.querySelector('.capabilities');
  if (capabilities) initCapabilityVisuals(capabilities);

  function initIntro(section) {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const statement = section.querySelector('.intro-statement');
    const counters = [...section.querySelectorAll('[data-count]')];
    if (still) return;

    if (statement) {
      const words = [];
      const walk = node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.textContent = part;
            words.push(w);
            frag.append(w);
          });
          node.replaceWith(frag);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          [...node.childNodes].forEach(walk);
        }
      };
      [...statement.childNodes].forEach(walk);

      let queued = false;
      const paint = () => {
        queued = false;
        const r = statement.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.max(0, Math.min(1, (vh * .88 - r.top) / (vh * .5 + r.height * .6)));
        const head = p * (words.length + 2);
        words.forEach((w, i) => {
          const o = Math.max(0, Math.min(1, head - i));
          w.style.setProperty('--o', (.16 + o * .84).toFixed(3));
          w.style.setProperty('--f', o.toFixed(3));
        });
        section.style.setProperty('--glow', (1 - p * .55).toFixed(3));
        section.style.setProperty('--gy', `${(p * 140).toFixed(1)}px`);
      };
      const request = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request);
      paint();
    }

    if (window.matchMedia('(hover: hover)').matches) {
      section.addEventListener('pointermove', e => {
        const r = section.getBoundingClientRect();
        section.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`);
        section.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
        section.classList.add('is-lit');
      });
      section.addEventListener('pointerleave', () => section.classList.remove('is-lit'));
    }

    if (counters.length && 'IntersectionObserver' in window) {
      counters.forEach(c => { c.textContent = '0'; });
      const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        counters.forEach((c, k) => {
          const end = Number(c.dataset.count);
          const start = performance.now() + k * 140;
          const tick = now => {
            const t = Math.max(0, Math.min(1, (now - start) / 900));
            c.textContent = String(Math.round(end * (1 - Math.pow(1 - t, 3))));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }, { threshold: .5 });
      io.observe(section.querySelector('.intro-facts'));
    }
  }

  const intro = document.querySelector('.intro');
  if (intro) initIntro(intro);

  function initBridge(section) {
    const tapes = [...section.querySelectorAll('.tape')].map((tape, k) => {
      const track = tape.querySelector('.tape-track');
      for (let n = 0; n < 2; n++) tape.append(track.cloneNode(true));
      return { tracks: [...tape.querySelectorAll('.tape-track')], dir: k ? 1 : -1, w: 0 };
    });
    const measure = () => tapes.forEach(t => { t.w = t.tracks[0].offsetWidth; });
    const paint = now => {
      const drift = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : now * .03;
      tapes.forEach(t => {
        if (!t.w) return;
        const off = ((drift + window.scrollY * .35) % t.w + t.w) % t.w;
        const x = t.dir < 0 ? -off : off - t.w;
        t.tracks.forEach(tr => tr.style.setProperty('--x', `${x.toFixed(1)}px`));
      });
    };
    let raf = 0, on = false;
    const loop = now => { paint(now); raf = on ? requestAnimationFrame(loop) : 0; };
    measure();
    window.addEventListener('resize', measure);
    section.querySelectorAll('img').forEach(img => img.addEventListener('load', measure));
    new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on && !raf) raf = requestAnimationFrame(loop);
    }).observe(section);
  }

  document.querySelectorAll('.bridge').forEach(initBridge);

  function initWork(section) {
    const sw = section.querySelector('.work-switch');
    if (!sw) return;
    const tabs = [...sw.querySelectorAll('[role="tab"]')];
    const wrap = section.querySelector('.work-switch-wrap');
    let view = '';

    const place = () => {
      const btn = tabs.find(t => t.dataset.view === view);
      sw.style.setProperty('--l', `${btn.offsetLeft}px`);
      sw.style.setProperty('--r', `${sw.clientWidth - btn.offsetLeft - btn.offsetWidth}px`);
    };

    function setView(next, fromUser) {
      if (next === view) return;
      const prev = view;
      view = next;
      tabs.forEach(t => {
        const on = t.dataset.view === next;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on && prev) {
          panel.classList.remove('is-entering');
          void panel.offsetWidth;
          panel.classList.add('is-entering');
        }
      });
      if (prev) {
        const right = tabs.findIndex(t => t.dataset.view === next) > tabs.findIndex(t => t.dataset.view === prev);
        sw.classList.toggle('to-right', right);
        sw.classList.toggle('to-left', !right);
        sw.classList.remove('is-morphing');
        void sw.offsetWidth;
        sw.classList.add('is-morphing');
      }
      place();
      const panel = document.getElementById(`panel-${next}`);
      const gap = parseFloat(getComputedStyle(wrap).top) + wrap.offsetHeight + 24;
      if (fromUser && panel.getBoundingClientRect().top < gap) {
        window.scrollTo({ top: window.scrollY + panel.getBoundingClientRect().top - gap, behavior: 'smooth' });
      }
    }

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => setView(t.dataset.view, true));
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        n.focus();
        setView(n.dataset.view, true);
      });
    });
    sw.addEventListener('pointermove', e => {
      const r = sw.getBoundingClientRect();
      sw.style.setProperty('--mx', `${e.clientX - r.left}px`);
      sw.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    sw.querySelector('.ws-blob').addEventListener('animationend', () => sw.classList.remove('is-morphing'));
    window.addEventListener('resize', place);
    document.addEventListener('click', e => {
      if (e.target.closest('a[href^="#case-"]')) setView('ui');
    });

    setView('ui');
    if (document.fonts) document.fonts.ready.then(place);

    const dialog = section.querySelector('.poster-view');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.querySelectorAll('.poster').forEach(p => {
      const box = p.querySelector('.poster-img');
      if (!still) {
        p.addEventListener('pointermove', e => {
          const r = box.getBoundingClientRect();
          box.style.setProperty('--tx', `${((e.clientX - r.left) / r.width - .5) * 10}deg`);
          box.style.setProperty('--ty', `${(.5 - (e.clientY - r.top) / r.height) * 10}deg`);
        });
        p.addEventListener('pointerleave', () => {
          box.style.removeProperty('--tx');
          box.style.removeProperty('--ty');
        });
      }
      if (dialog && dialog.showModal) {
        p.addEventListener('click', () => {
          const img = dialog.querySelector('img');
          img.src = p.dataset.full;
          img.alt = p.querySelector('img').alt;
          dialog.showModal();
        });
      }
    });
    if (dialog) {
      dialog.querySelector('.poster-close').addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    }
  }

  const work = document.querySelector('.work');
  if (work) initWork(work);

  function initProcess(section) {
    const track = section.querySelector('.process-track');
    const rail = section.querySelector('.process-rail');
    const steps = [...section.querySelectorAll('.step')];
    if (!track || !steps.length) return;
    track.addEventListener('pointermove', e => {
      const r = track.getBoundingClientRect();
      track.style.setProperty('--x', `${(e.clientX - r.left).toFixed(0)}px`);
      track.style.setProperty('--y', `${(e.clientY - r.top).toFixed(0)}px`);
    });
    const DUR = 5200;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let active = -1, timer = 0, paused = false, visible = false;
    section.style.setProperty('--dur', `${DUR}ms`);

    function schedule() {
      clearTimeout(timer);
      const play = !still && !paused && visible;
      section.classList.toggle('is-playing', play);
      if (!play) return;
      const bar = steps[active].querySelector('.step-timer');
      if (bar) { bar.style.display = 'none'; void bar.offsetWidth; bar.style.display = ''; }
      timer = setTimeout(() => set((active + 1) % steps.length), DUR);
    }

    function set(i) {
      if (i !== active) {
        active = i;
        steps.forEach((s, k) => {
          s.classList.toggle('is-active', k === i);
          s.setAttribute('aria-expanded', String(k === i));
        });
        track.style.setProperty('--cols', steps.map((_, k) => (k === i ? '2.6fr' : '1fr')).join(' '));
        if (rail) rail.style.setProperty('--p', ((i + 1) / steps.length).toFixed(3));
      }
      schedule();
    }

    steps.forEach((s, k) => {
      s.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { paused = true; set(k); } });
      s.addEventListener('click', () => { paused = true; set(k); });
      s.addEventListener('focus', () => { paused = true; set(k); });
      s.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        steps[(k + d + steps.length) % steps.length].focus();
      });
    });
    track.addEventListener('pointerleave', () => { if (!track.contains(document.activeElement)) { paused = false; schedule(); } });
    track.addEventListener('focusout', e => { if (!track.contains(e.relatedTarget)) { paused = false; schedule(); } });

    set(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }, { threshold: .35 }).observe(track);
    }
  }

  const process = document.querySelector('.process');
  if (process) initProcess(process);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll('.intro-facts, .intro-help, .bridge-title, .showcase-row, .poster, .cooking, .manifesto-stage, .capability, .timeline-row, .process h2, .process-track, .process-now, .contact h2, .analysis-list article, .live-screen-card, .shot-slot, .comparison-block, .ds-block');
  if ('IntersectionObserver' in window && !reduceMotion) {
    targets.forEach(el => el.classList.add('reveal'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    targets.forEach(el => observer.observe(el));
  }
})();
