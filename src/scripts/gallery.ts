export function initGallery(root: HTMLElement) {
  const items = JSON.parse(
    root.querySelector('[data-gallery-items]')?.textContent ?? '[]',
  ) as Array<{ type: 'image' | 'video'; src: string; alt: string; streamId?: string }>;
  const count = items.length;
  const track = root.querySelector<HTMLElement>('[data-track]')!;
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'));
  const thumbs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-thumb]'));
  const dots = Array.from(root.querySelectorAll<HTMLElement>('[data-dot]'));
  const counter = root.querySelector<HTMLElement>('[data-counter]');
  const desktop = () => matchMedia('(min-width: 1024px)').matches;
  let current = 0;

  function show(i: number, scroll = true) {
    current = ((i % count) + count) % count;
    slides.forEach((s, k) =>
      k === current ? s.setAttribute('data-active', '') : s.removeAttribute('data-active'),
    );
    thumbs.forEach((t, k) => t.setAttribute('aria-current', String(k === current)));
    dots.forEach(
      (d, k) =>
        d.classList.toggle('bg-indigo', k === current) ||
        d.classList.toggle('bg-line', k !== current),
    );
    if (counter) counter.textContent = `${current + 1} / ${count}`;
    if (!desktop() && scroll)
      slides[current]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    thumbs[current]?.scrollIntoView({ block: 'nearest' });
  }
  thumbs.forEach((t) => t.addEventListener('click', () => show(Number(t.dataset.thumb))));
  root.querySelector('[data-prev]')?.addEventListener('click', () => show(current - 1));
  root.querySelector('[data-next]')?.addEventListener('click', () => show(current + 1));
  root
    .querySelectorAll<HTMLElement>('[data-goto]')
    .forEach((b) => b.addEventListener('click', () => show(Number(b.dataset.goto))));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'ArrowLeft') show(current - 1);
  });
  // Mobile: sync current with scroll position
  let raf = 0;
  track.addEventListener(
    'scroll',
    () => {
      if (desktop()) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== current) show(i, false);
      });
    },
    { passive: true },
  );

  // Lightbox
  const lb = root.querySelector<HTMLDialogElement>('[data-lightbox]')!;
  const img = lb.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const video = lb.querySelector<HTMLIFrameElement>('[data-lb-video]')!;
  const cap = lb.querySelector<HTMLElement>('[data-lb-caption]')!;
  const lbCounter = lb.querySelector<HTMLElement>('[data-lb-counter]')!;
  const stage = lb.querySelector<HTMLElement>('[data-lb-stage]')!;
  let lbIndex = 0;
  let scale = 1,
    tx = 0,
    ty = 0;
  let opener: HTMLElement | null = null;
  const apply = () =>
    (img.style.transform = `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${scale})`);
  const reset = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  };

  function render(i: number) {
    lbIndex = ((i % count) + count) % count;
    const it = items[lbIndex]!;
    reset();
    lbCounter.textContent = `${lbIndex + 1} / ${count}`;
    cap.textContent = it.alt;
    if (it.type === 'video') {
      img.hidden = true;
      video.hidden = false;
      video.src = `https://iframe.videodelivery.net/${it.streamId}?autoplay=true&preload=metadata`;
      video.classList.remove('hidden');
    } else {
      video.src = '';
      video.classList.add('hidden');
      video.hidden = true;
      img.hidden = false;
      img.src = it.src;
      img.alt = it.alt;
    }
  }
  function openLb(i: number, trigger?: HTMLElement) {
    opener = trigger ?? (document.activeElement as HTMLElement);
    render(i);
    lb.showModal();
    document.documentElement.style.overflow = 'hidden';
    lb.querySelector<HTMLElement>('[data-lb-close]')?.focus();
  }
  function closeLb() {
    lb.close();
  }
  lb.addEventListener('close', () => {
    video.src = '';
    document.documentElement.style.overflow = '';
    opener?.focus();
  });
  root
    .querySelectorAll<HTMLElement>('[data-open-lightbox]')
    .forEach((b) =>
      b.addEventListener('click', () =>
        openLb(
          b.dataset.openLightbox === '0' && b.closest('[data-slide]') === null
            ? current
            : Number(b.dataset.openLightbox),
          b,
        ),
      ),
    );
  lb.querySelector('[data-lb-close]')?.addEventListener('click', closeLb);
  lb.querySelector('[data-lb-prev]')?.addEventListener('click', () => render(lbIndex - 1));
  lb.querySelector('[data-lb-next]')?.addEventListener('click', () => render(lbIndex + 1));
  lb.querySelector('[data-lb-zoom]')?.addEventListener('click', () => {
    scale = scale >= 3 ? 1 : scale + 1;
    if (scale === 1) {
      tx = ty = 0;
    }
    apply();
  });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') render(lbIndex + 1);
    else if (e.key === 'ArrowLeft') render(lbIndex - 1);
    else if (e.key === '+' || e.key === '=') {
      scale = Math.min(4, scale + 0.5);
      apply();
    } else if (e.key === '-') {
      scale = Math.max(1, scale - 0.5);
      apply();
    }
  });
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLb();
  });

  // Pointer gestures: pinch-zoom, pan, swipe
  const pointers = new Map<number, { x: number; y: number }>();
  let startDist = 0,
    startScale = 1,
    swipeStartX = 0,
    panStart = { x: 0, y: 0, tx: 0, ty: 0 };
  stage.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stage.setPointerCapture(e.pointerId);
    if (pointers.size === 1) {
      swipeStartX = e.clientX;
      panStart = { x: e.clientX, y: e.clientY, tx, ty };
    }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      startDist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      startScale = scale;
    }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      scale = Math.min(
        4,
        Math.max(1, (startScale * Math.hypot(a!.x - b!.x, a!.y - b!.y)) / startDist),
      );
      apply();
    } else if (pointers.size === 1 && scale > 1) {
      tx = panStart.tx + (e.clientX - panStart.x);
      ty = panStart.ty + (e.clientY - panStart.y);
      apply();
    }
  });
  stage.addEventListener('pointerup', (e) => {
    if (pointers.size === 1 && scale === 1) {
      const dx = e.clientX - swipeStartX;
      if (Math.abs(dx) > 60) render(lbIndex + (dx < 0 ? 1 : -1));
    }
    pointers.delete(e.pointerId);
  });
  stage.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
  stage.addEventListener('dblclick', () => {
    scale = scale > 1 ? 1 : 2;
    if (scale === 1) tx = ty = 0;
    apply();
  });
  stage.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        scale = Math.min(4, Math.max(1, scale - e.deltaY * 0.01));
        apply();
      }
    },
    { passive: false },
  );
}
