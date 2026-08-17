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
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  let navOpen = false;

  function setNavOpen(open) {
    navOpen = open;
    if (!navLinks || !toggle) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      navLinks.style.display = 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '64px';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.background = 'rgba(8,12,18,0.97)';
      navLinks.style.padding = '20px 24px';
      navLinks.style.borderBottom = '1px solid var(--border)';
      navLinks.style.zIndex = '999';
      navLinks.style.backdropFilter = 'blur(16px)';
    } else {
      navLinks.removeAttribute('style');
    }
  }

  if (toggle) {
    toggle.addEventListener('click', () => setNavOpen(!navOpen));
  }

  // Close nav when any link is clicked
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setNavOpen(false));
    });
  }

  // Close nav on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navOpen) setNavOpen(false);
  });

  /* ── Film modal ───────────────────────────────────────── */
  const modal = document.getElementById('film-modal');
  const modalVideo = modal ? modal.querySelector('video') : null;
  const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null;
  const modalClose = modal ? modal.querySelector('.modal-close') : null;
  const playBtn = document.getElementById('playFilmBtn');

  // Focus trap elements for modal
  function getFocusable(el) {
    return el ? Array.from(el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(e => !e.disabled) : [];
  }

  function openModal() {
    if (!modal) return;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    if (modalVideo) {
      modalVideo.currentTime = 0;
      modalVideo.play().catch(() => {});
    }
    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.currentTime = 0;
    }
    if (playBtn) playBtn.focus();
  }

  // Focus trap inside modal
  if (modal) {
    modal.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key !== 'Tab') return;
      const focusable = getFocusable(modal);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  document.querySelectorAll('[data-open-modal]').forEach(el => {
    el.addEventListener('click', openModal);
  });
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);

  /* ── App showcase slider ──────────────────────────────── */
  const track = document.querySelector('.showcase-track');
  const dots = document.querySelectorAll('.showcase-dot');
  const slides = document.querySelectorAll('.showcase-slide');
  const prevBtn = document.getElementById('showcasePrev');
  const nextBtn = document.getElementById('showcaseNext');
  let currentSlide = 0;
  let sliderTimer = null;

  function goToSlide(idx) {
    if (!track || slides.length === 0) return;
    slides[currentSlide].classList.remove('active');
    if (dots[currentSlide]) {
      dots[currentSlide].classList.remove('active');
      dots[currentSlide].setAttribute('aria-selected', 'false');
    }
    currentSlide = (idx + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) {
      dots[currentSlide].classList.add('active');
      dots[currentSlide].setAttribute('aria-selected', 'true');
    }
  }

  function startAutoSlide() {
    clearInterval(sliderTimer);
    sliderTimer = setInterval(() => goToSlide(currentSlide + 1), 4000);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goToSlide(i); startAutoSlide(); });
  });

  if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide(currentSlide - 1); startAutoSlide(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide(currentSlide + 1); startAutoSlide(); });

  // Keyboard navigation for showcase
  const showcaseWrap = document.querySelector('.showcase-scroll-wrap');
  if (showcaseWrap) {
    showcaseWrap.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { goToSlide(currentSlide - 1); startAutoSlide(); }
      if (e.key === 'ArrowRight') { goToSlide(currentSlide + 1); startAutoSlide(); }
    });
  }

  // Touch/swipe support for showcase
  if (track) {
    let touchStartX = 0;
    let touchStartY = 0;
    track.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) goToSlide(currentSlide + 1);
        else goToSlide(currentSlide - 1);
        startAutoSlide();
      }
    }, { passive: true });
  }

  if (slides.length > 0) {
    goToSlide(0);
    startAutoSlide();
  }

  /* ── Audience tabs (with ARIA) ────────────────────────── */
  const tabBtns = document.querySelectorAll('.audience-tab');
  const tabPanels = document.querySelectorAll('.audience-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('hidden', '');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const panel = document.getElementById('panel-' + target);
      if (panel) {
        panel.classList.add('active');
        panel.removeAttribute('hidden');
      }
    });

    // Arrow key nav for tabs
    btn.addEventListener('keydown', e => {
      const tabs = Array.from(tabBtns);
      const i = tabs.indexOf(btn);
      if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(i + 1) % tabs.length].focus().click; tabs[(i + 1) % tabs.length].click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); tabs[(i - 1 + tabs.length) % tabs.length].click(); }
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

  /* ── DRC terminal tick (scroll-triggered) ─────────────── */
  const drcSection = document.querySelector('.drc-terminal');
  if (drcSection) {
    let drcAnimated = false;
    const drcObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !drcAnimated) {
          drcAnimated = true;
          const drcPassBadges = document.querySelectorAll('.drc-badge.pass');
          drcPassBadges.forEach((badge, i) => {
            setTimeout(() => {
              badge.style.opacity = '0';
              badge.style.transition = 'opacity 0.3s';
              setTimeout(() => { badge.style.opacity = '1'; }, 300);
            }, i * 180 + 400);
          });
          drcObserver.disconnect();
        }
      });
    }, { threshold: 0.3 });
    drcObserver.observe(drcSection);
  }

})();
