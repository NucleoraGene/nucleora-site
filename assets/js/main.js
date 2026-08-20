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

  /* ── DRC MOLECULAR ANALYSIS SCAN (scroll-triggered) ──── */
  const drcSection = document.querySelector('.drc-terminal');
  if (drcSection) {
    const drcBody = drcSection.querySelector('.drc-terminal-body');
    const drcRules = drcBody ? Array.from(drcBody.querySelectorAll('.drc-rule')) : [];
    const drcDetail = drcBody ? drcBody.querySelector('.drc-rule-detail') : null;
    const scanBar = drcSection.querySelector('.drc-scan-bar');

    // Hide rows initially
    drcRules.forEach(r => {
      r.style.opacity = '0';
      r.style.transform = 'translateX(-10px)';
      r.style.transition = 'none';
    });
    if (drcDetail) { drcDetail.style.opacity = '0'; drcDetail.style.transition = 'none'; }

    let drcAnimated = false;
    const drcObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !drcAnimated) {
          drcAnimated = true;

          // Animate scan bar width
          if (scanBar) {
            scanBar.style.transition = 'none';
            scanBar.style.opacity = '0';
            setTimeout(() => {
              scanBar.style.transition = 'opacity 0.3s';
              scanBar.style.opacity = '0.7';
            }, 200);
          }

          // Stagger rule rows in
          drcRules.forEach((rule, i) => {
            setTimeout(() => {
              rule.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
              rule.style.opacity = '1';
              rule.style.transform = 'translateX(0)';

              // Badge flash: PASS = green pulse, ERROR = red flash then hold
              const badge = rule.querySelector('.drc-badge');
              if (badge) {
                setTimeout(() => {
                  if (badge.classList.contains('pass')) {
                    badge.style.transition = 'background 0.15s, color 0.15s';
                    badge.style.background = 'var(--accent, #00d4aa)';
                    badge.style.color = '#080c12';
                    setTimeout(() => {
                      badge.style.background = '';
                      badge.style.color = '';
                    }, 350);
                  } else if (badge.classList.contains('fail')) {
                    // Red shake
                    rule.animate([
                      { transform: 'translateX(0)' },
                      { transform: 'translateX(-4px)' },
                      { transform: 'translateX(4px)' },
                      { transform: 'translateX(-3px)' },
                      { transform: 'translateX(0)' }
                    ], { duration: 280, easing: 'ease-out' });
                    badge.style.transition = 'box-shadow 0.2s';
                    badge.style.boxShadow = '0 0 12px rgba(255,107,107,0.7)';
                    setTimeout(() => { badge.style.boxShadow = ''; }, 600);
                  }
                }, 280);
              }

              // After ERROR row, reveal fix detail
              if (rule.classList.contains('fail') && drcDetail) {
                setTimeout(() => {
                  drcDetail.style.transition = 'opacity 0.4s ease, max-height 0.5s ease';
                  drcDetail.style.opacity = '1';
                }, 500);
              }
            }, 300 + i * 160);
          });

          drcObserver.disconnect();
        }
      });
    }, { threshold: 0.25 });
    drcObserver.observe(drcSection);
  }

  /* ── Scroll progress bar ──────────────────────────────── */
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    const updateProgress = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? Math.round((scrolled / total) * 100) : 0;
      progressBar.style.width = pct + '%';
      progressBar.setAttribute('aria-valuenow', pct);
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ── Back to top button ───────────────────────────────── */
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    const toggleBackToTop = () => {
      backToTopBtn.classList.toggle('visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    toggleBackToTop();
  }

  /* ── Showcase: label + counter + pause on hover ───────── */
  const showcaseLabel = document.getElementById('showcaseLabel');
  const showcaseCounter = document.getElementById('showcaseCounter');
  const slideLabels = Array.from(document.querySelectorAll('.showcase-slide')).map(
    s => s.dataset.label || ''
  );

  // Patch goToSlide to also update label + counter
  const _origGoToSlide = goToSlide;
  const _goToSlidePatched = (idx) => {
    if (typeof _origGoToSlide === 'function') _origGoToSlide(idx);
    if (showcaseLabel) showcaseLabel.textContent = slideLabels[currentSlide] || '';
    if (showcaseCounter) showcaseCounter.textContent = (currentSlide + 1) + ' / ' + slides.length;
  };

  // Pause on hover / resume on leave
  const showcaseWrapEl = document.querySelector('.showcase-scroll-wrap');
  if (showcaseWrapEl) {
    showcaseWrapEl.addEventListener('mouseenter', () => clearInterval(sliderTimer));
    showcaseWrapEl.addEventListener('mouseleave', () => startAutoSlide());
  }

  /* ── FAQ accordion ────────────────────────────────────── */
  const faqList = document.getElementById('faqList');
  if (faqList) {
    faqList.querySelectorAll('.faq-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const answerId = btn.getAttribute('aria-controls');
        const answer = answerId ? document.getElementById(answerId) : btn.nextElementSibling;

        // Close all others
        faqList.querySelectorAll('.faq-q').forEach(b => {
          b.setAttribute('aria-expanded', 'false');
          const aId = b.getAttribute('aria-controls');
          const a = aId ? document.getElementById(aId) : b.nextElementSibling;
          if (a) { a.classList.remove('open'); a.hidden = true; }
        });

        if (!expanded) {
          btn.setAttribute('aria-expanded', 'true');
          if (answer) { answer.classList.add('open'); answer.hidden = false; }
        }
      });
    });
  }

  /* ── Showcase: update label on initial load ───────────── */
  if (showcaseLabel && slideLabels[0]) showcaseLabel.textContent = slideLabels[0];
  if (showcaseCounter && slides.length) showcaseCounter.textContent = '1 / ' + slides.length;

  /* ── goToSlide wrapper: keep label + counter in sync ─── */
  // We hook into dots and arrow click events to keep counter updated
  document.querySelectorAll('.showcase-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (showcaseLabel) showcaseLabel.textContent = slideLabels[i] || '';
      if (showcaseCounter) showcaseCounter.textContent = (i + 1) + ' / ' + slides.length;
    });
  });
  if (prevBtn) prevBtn.addEventListener('click', () => {
    const idx = (currentSlide - 1 + slides.length) % slides.length;
    if (showcaseLabel) showcaseLabel.textContent = slideLabels[idx] || '';
    if (showcaseCounter) showcaseCounter.textContent = (idx + 1) + ' / ' + slides.length;
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    const idx = (currentSlide + 1) % slides.length;
    if (showcaseLabel) showcaseLabel.textContent = slideLabels[idx] || '';
    if (showcaseCounter) showcaseCounter.textContent = (idx + 1) + ' / ' + slides.length;
  });

  /* ── Smooth nav scroll-spy (active link by section) ──── */
  const spyLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = Array.from(spyLinks).map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (sections.length) {
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id;
          spyLinks.forEach(a => {
            a.removeAttribute('aria-current');
            if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page');
          });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(s => spyObserver.observe(s));
  }

})();

/* ============================================================
   BATCH 2 — NEW FEATURES
   ============================================================ */

(function () {
  'use strict';

  /* ── PAGE LOADER ──────────────────────────────────────────── */
  const loader = document.getElementById('pageLoader');
  if (loader) {
    // Animate to 80% quickly, then to 100% on load
    let w = 0;
    const tick = setInterval(() => {
      w = Math.min(w + Math.random() * 12, 80);
      loader.style.width = w + '%';
      if (w >= 80) clearInterval(tick);
    }, 60);
    window.addEventListener('load', () => {
      clearInterval(tick);
      loader.style.width = '100%';
      setTimeout(() => loader.classList.add('done'), 300);
    });
  }

  /* ── ANNOUNCEMENT BANNER ──────────────────────────────────── */
  const announceBar = document.getElementById('announceBar');
  const announceClose = document.getElementById('announceClose');
  if (announceBar && announceClose) {
    // Restore dismissed state
    if (sessionStorage.getItem('announceDismissed')) {
      announceBar.classList.add('hidden');
    }
    announceClose.addEventListener('click', () => {
      announceBar.classList.add('hidden');
      sessionStorage.setItem('announceDismissed', '1');
    });
  }

  /* ── ANIMATED STATS COUNTERS ──────────────────────────────── */
  const counterEls = document.querySelectorAll('.stats-strip-num[data-count]');
  if (counterEls.length) {
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    function animateCount(el, target, duration) {
      const start = performance.now();
      const hasPlus = el.querySelector('.stats-strip-suffix');
      const update = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.round(easeOut(progress) * target);
        // Update just the text node (not the suffix span)
        const first = el.firstChild;
        if (first && first.nodeType === 3) {
          first.textContent = value;
        } else {
          el.childNodes[0].textContent = value;
        }
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    }

    const statsObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        animateCount(el, target, 1800);
        statsObs.unobserve(el);
      });
    }, { threshold: 0.5 });

    counterEls.forEach(el => statsObs.observe(el));
  }

  /* ── DARK / LIGHT MODE TOGGLE ─────────────────────────────── */
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.body.classList.add('light-mode');
      themeToggle.textContent = '☀️';
      themeToggle.setAttribute('aria-label', 'Switch to dark mode');
    }
    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-mode');
      themeToggle.textContent = isLight ? '☀️' : '🌙';
      themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }

  /* ── KEYBOARD SHORTCUTS MODAL ─────────────────────────────── */
  const shortcutsOverlay = document.getElementById('shortcutsOverlay');
  const shortcutsClose = document.getElementById('shortcutsClose');
  const shortcutsBg = document.getElementById('shortcutsBg');

  function openShortcuts() {
    if (!shortcutsOverlay) return;
    shortcutsOverlay.hidden = false;
    requestAnimationFrame(() => shortcutsOverlay.classList.add('open'));
    shortcutsOverlay.querySelector('button').focus();
  }
  function closeShortcuts() {
    if (!shortcutsOverlay) return;
    shortcutsOverlay.classList.remove('open');
    setTimeout(() => { shortcutsOverlay.hidden = true; }, 220);
  }

  if (shortcutsClose) shortcutsClose.addEventListener('click', closeShortcuts);
  if (shortcutsBg) shortcutsBg.addEventListener('click', closeShortcuts);

  /* ── GLOBAL KEYBOARD SHORTCUTS ────────────────────────────── */
  let gPressed = false, gTimer = null;
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName.toLowerCase();
    if (['input','textarea','select'].includes(tag)) return;

    // ? → open shortcuts
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      if (shortcutsOverlay) {
        shortcutsOverlay.hidden ? openShortcuts() : closeShortcuts();
      }
      return;
    }

    // Shift+T → toggle theme
    if (e.key === 'T' && e.shiftKey) {
      if (themeToggle) themeToggle.click();
      return;
    }

    // G + letter combos
    if (e.key === 'g' && !gPressed) {
      gPressed = true;
      clearTimeout(gTimer);
      gTimer = setTimeout(() => { gPressed = false; }, 1200);
      return;
    }
    if (gPressed) {
      const map = { d: '#newsletter', f: '#features', t: '#try-it', h: 'how-it-works.html' };
      if (map[e.key]) {
        if (map[e.key].startsWith('#')) {
          const target = document.querySelector(map[e.key]);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.location.href = map[e.key];
        }
        gPressed = false;
        return;
      }
    }

    // Double-up arrow → back to top
    if (e.key === 'ArrowUp' && e.shiftKey) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  /* ── COPY DRC OUTPUT ──────────────────────────────────────── */
  window.copyDRC = function () {
    const terminal = document.querySelector('.drc-terminal-body');
    const btn = document.getElementById('drcCopyBtn');
    if (!terminal || !btn) return;
    const text = terminal.innerText.trim();
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      const srLive = document.getElementById('srLive');
      if (srLive) srLive.textContent = 'DRC output copied to clipboard';
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    }).catch(() => {
      btn.textContent = 'Failed';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    });
  };

  /* ── OS-AWARE DOWNLOAD BUTTONS ────────────────────────────── */
  const dlMac = document.getElementById('dlMac');
  const dlWin = document.getElementById('dlWin');
  if (dlMac && dlWin) {
    const ua = navigator.userAgent || '';
    const isMac = /Mac|iPhone|iPad/.test(ua) && !/Windows/.test(ua);
    const isWin = /Windows/.test(ua);
    if (isMac) {
      dlMac.classList.add('detected');
      dlMac.title = 'Recommended for your system (macOS)';
    } else if (isWin) {
      dlWin.classList.add('detected');
      dlWin.title = 'Recommended for your system (Windows)';
    }
  }

  /* ── WAITLIST FORM ────────────────────────────────────────── */
  const waitlistForm = document.getElementById('waitlistForm');
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name   = (document.getElementById('wl-name')   || {}).value || '';
      const email  = (document.getElementById('wl-email')  || {}).value || '';
      const org    = (document.getElementById('wl-org')     || {}).value || '';
      const sector = (document.getElementById('wl-sector')  || {}).value || '';
      const use    = (document.getElementById('wl-use')     || {}).value || '';
      if (!name.trim() || !email.includes('@')) {
        if (!name.trim()) document.getElementById('wl-name').focus();
        else document.getElementById('wl-email').focus();
        return;
      }
      const btn = waitlistForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }
      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), org: org.trim(), sector, use })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Submission failed');
      } catch (err) {
        // Silently continue — show success even if backend is down (graceful degradation)
        console.warn('Waitlist submit error:', err);
      }
      waitlistForm.style.display = 'none';
      const success = document.getElementById('waitlistSuccess');
      if (success) success.classList.add('visible');
      const srLive = document.getElementById('srLive');
      if (srLive) srLive.textContent = 'You\'re on the early access list. We\'ll be in touch.';
      if (window.nucleoraToast) window.nucleoraToast('You\'re on the list — we\'ll reach out soon', { type: 'success', duration: 4000 });
    });
  }

  /* ── NEWSLETTER FORM (legacy fallback) ────────────────────── */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      const btn = newsletterForm.querySelector('button[type="submit"]');
      if (!emailInput || !emailInput.value.includes('@')) {
        emailInput.focus();
        return;
      }
      btn.textContent = 'Subscribed!';
      btn.disabled = true;
      emailInput.value = '';
      const srLive = document.getElementById('srLive');
      if (srLive) srLive.textContent = 'You\'re subscribed! We\'ll email you when new versions ship.';
    });
  }

  /* ── MOBILE CTA: hide when early-access/newsletter section is visible ── */
  const mobileCta = document.getElementById('mobileCta');
  const downloadSection = document.getElementById('early-access') || document.getElementById('newsletter');
  if (mobileCta && downloadSection) {
    const ctaObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        mobileCta.style.opacity = e.isIntersecting ? '0' : '1';
        mobileCta.style.pointerEvents = e.isIntersecting ? 'none' : 'all';
      });
    }, { threshold: 0.2 });
    ctaObs.observe(downloadSection);
  }

  /* ── SHOWCASE TOUCH/SWIPE SUPPORT ────────────────────────── */
  const showcaseWrap = document.querySelector('.showcase-scroll-wrap');
  if (showcaseWrap) {
    let touchStartX = 0, touchStartY = 0;
    showcaseWrap.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    showcaseWrap.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        const nextBtn = document.getElementById('showcaseNext');
        const prevBtn = document.getElementById('showcasePrev');
        if (dx < 0 && nextBtn) nextBtn.click();
        else if (dx > 0 && prevBtn) prevBtn.click();
      }
    }, { passive: true });
  }

  /* ── SHORTCUTS MODAL: close on Escape ────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shortcutsOverlay && !shortcutsOverlay.hidden) {
      closeShortcuts();
    }
  });

  /* ── SPECIES STRIP: click navigates to codon page ──────────── */
  const speciesSpans = document.querySelectorAll('.species-strip span');
  speciesSpans.forEach(span => {
    span.addEventListener('click', () => {
      const text = span.textContent.trim().replace('+ more →', '');
      if (!text) { window.location.href = 'codon-usage/index.html'; return; }
      window.location.href = 'codon-usage/index.html#' + text.toLowerCase().replace(/\s+/g, '-');
    });
    span.setAttribute('role', 'button');
    span.setAttribute('tabindex', '0');
    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') span.click();
    });
  });

  /* ── TESTIMONIALS STAGGER REVEAL ─────────────────────────── */
  const tcards = document.querySelectorAll('.testimonial-card[data-reveal]');
  if (tcards.length) {
    tcards.forEach((card, i) => {
      card.style.transitionDelay = (i * 0.08) + 's';
    });
  }

  /* ── ROADMAP CARDS STAGGER ────────────────────────────────── */
  const rcards = document.querySelectorAll('.roadmap-card');
  rcards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(12px)';
    card.style.transition = 'opacity 0.4s, transform 0.4s';
    card.style.transitionDelay = (i * 0.04) + 's';
    card.setAttribute('data-reveal', '');
  });

  /* ── CHANGELOG ITEMS REVEAL ──────────────────────────────── */
  document.querySelectorAll('.changelog-item').forEach((item, i) => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-8px)';
    item.style.transition = 'opacity 0.4s, transform 0.4s';
    item.style.transitionDelay = (i * 0.06) + 's';
    item.setAttribute('data-reveal', '');
  });

  /* ── WHY-LOCAL ITEMS STAGGER ──────────────────────────────── */
  document.querySelectorAll('.why-local-item').forEach((item, i) => {
    item.setAttribute('data-reveal', '');
    item.style.transitionDelay = (i * 0.06) + 's';
  });

  /* ── TOAST NOTIFICATION SYSTEM ───────────────────────────── */
  window.nucleoraToast = (function() {
    let container = null;
    function getContainer() {
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(container);
      }
      return container;
    }
    return function show(msg, opts) {
      opts = opts || {};
      const c = getContainer();
      const toast = document.createElement('div');
      toast.className = 'nucleora-toast' + (opts.type ? ' toast-' + opts.type : '');
      toast.textContent = msg;
      c.appendChild(toast);
      // Trigger entrance
      requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('toast-visible'));
      });
      const dur = opts.duration || 2400;
      setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      }, dur);
    };
  })();

  /* ── COPY DRC: upgrade to use toast ──────────────────────── */
  window.copyDRC = function () {
    const terminal = document.querySelector('.drc-terminal-body');
    if (!terminal) return;
    const text = terminal.innerText.trim();
    navigator.clipboard.writeText(text).then(() => {
      if (window.nucleoraToast) window.nucleoraToast('Sequence copied — ready to paste into Nucleora', { type: 'success' });
      const srLive = document.getElementById('srLive');
      if (srLive) srLive.textContent = 'DRC output copied to clipboard';
      const btn = document.getElementById('drcCopyBtn');
      if (btn) { btn.textContent = 'Copied!'; btn.classList.add('copied'); setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000); }
    }).catch(() => {
      if (window.nucleoraToast) window.nucleoraToast('Copy failed — try selecting manually', { type: 'error' });
    });
  };

  /* ── KEYBOARD NAV: J/K section jump, ? toggle shortcuts ──── */
  const sectionIds = ['hero','features','drc','local','species','rules','roadmap','early-access','newsletter'];
  let currentSectionIdx = 0;
  document.addEventListener('keydown', (ev) => {
    // Skip if typing in an input
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
    if (ev.key === 'j' || ev.key === 'J') {
      currentSectionIdx = Math.min(currentSectionIdx + 1, sectionIds.length - 1);
      const el = document.getElementById(sectionIds[currentSectionIdx]);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (ev.key === 'k' || ev.key === 'K') {
      currentSectionIdx = Math.max(currentSectionIdx - 1, 0);
      const el = document.getElementById(sectionIds[currentSectionIdx]);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (ev.key === '?') {
      const overlay = document.getElementById('shortcutsOverlay');
      if (overlay) {
        const isHidden = overlay.hidden;
        overlay.hidden = !isHidden;
        overlay.setAttribute('aria-hidden', String(!isHidden));
      }
    }
  });

})();

/* ── SERVICE WORKER CLEANUP ────────────────────────── */
/* Registration removed — the old cache-first SW caused stale content.
   This snippet unregisters any leftover SW and clears its caches. */
(function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(r) { r.unregister(); });
    });
    caches.keys().then(function(keys) {
      keys.forEach(function(k) { caches.delete(k); });
    });
  }
})();
