/* ============================================================
   NUCLEORA — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── NAV scroll class ─────────────────────────────────── */
  const nav = document.querySelector('.site-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile nav toggle ────────────────────────────────── */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.style.display === 'flex';
      navLinks.style.display = open ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '64px';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.background = 'var(--bg)';
      navLinks.style.padding = '20px 24px';
      navLinks.style.borderBottom = '1px solid var(--border)';
    });
  }

  /* ── Film modal ───────────────────────────────────────── */
  const modal = document.getElementById('film-modal');
  const modalVideo = modal ? modal.querySelector('video') : null;
  const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null;
  const modalClose = modal ? modal.querySelector('.modal-close') : null;

  function openModal() {
    if (!modal) return;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    if (modalVideo) {
      modalVideo.currentTime = 0;
      modalVideo.play().catch(() => {});
    }
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.currentTime = 0;
    }
  }

  document.querySelectorAll('[data-open-modal]').forEach(el => {
    el.addEventListener('click', openModal);
  });
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ── App showcase slider ──────────────────────────────── */
  const track = document.querySelector('.showcase-track');
  const dots = document.querySelectorAll('.showcase-dot');
  const slides = document.querySelectorAll('.showcase-slide');
  let currentSlide = 0;
  let sliderTimer = null;

  function goToSlide(idx) {
    if (!track || slides.length === 0) return;
    slides[currentSlide].classList.remove('active');
    dots[currentSlide] && dots[currentSlide].classList.remove('active');
    currentSlide = (idx + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    slides[currentSlide].classList.add('active');
    dots[currentSlide] && dots[currentSlide].classList.add('active');
  }

  function startAutoSlide() {
    clearInterval(sliderTimer);
    sliderTimer = setInterval(() => goToSlide(currentSlide + 1), 4000);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goToSlide(i);
      startAutoSlide();
    });
  });

  if (slides.length > 0) {
    goToSlide(0);
    startAutoSlide();
  }

  /* ── Audience tabs ────────────────────────────────────── */
  const tabBtns = document.querySelectorAll('.audience-tab');
  const tabPanels = document.querySelectorAll('.audience-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('panel-' + target);
      if (panel) panel.classList.add('active');
    });
  });

  /* ── Scroll reveal ────────────────────────────────────── */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length > 0) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ── DRC terminal tick ────────────────────────────────── */
  // Simulate a running check animation in the DRC section
  const drcPassBadges = document.querySelectorAll('.drc-badge.pass');
  drcPassBadges.forEach((badge, i) => {
    setTimeout(() => {
      badge.style.opacity = '0';
      badge.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        badge.style.opacity = '1';
      }, 300);
    }, i * 200 + 800);
  });

})();
