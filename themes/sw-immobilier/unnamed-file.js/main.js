/**
 * SW Immobilier – main.js
 * Scripts frontend : slider hero, slider biens, navigation, animations, FAQ, stats
 */

(function() {
    'use strict';

    /* ============================================================
       HELPER
       ============================================================ */
    function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
    function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

    /* ============================================================
       HEADER – SCROLL & STICKY
       ============================================================ */
    const header = qs('#masthead');
    if (header) {
        function updateHeader() {
            const scrolled = window.scrollY > 60;
            header.classList.toggle('scrolled', scrolled);
            if (header.classList.contains('header-transparent')) {
                header.classList.toggle('scrolled-opaque', scrolled);
                if (scrolled) {
                    header.querySelector('.header-inner').style.background = 'rgba(255,255,255,0.97)';
                    header.querySelectorAll('.site-title a, .main-navigation a').forEach(a => a.style.color = '');
                } else {
                    header.querySelector('.header-inner').style.background = '';
                    header.querySelectorAll('.site-title a, .main-navigation a').forEach(a => a.style.color = '');
                }
            }
        }
        window.addEventListener('scroll', updateHeader, { passive: true });
        updateHeader();
    }

    /* ============================================================
       MENU MOBILE
       ============================================================ */
    const toggle = qs('#menuToggle');
    const nav    = qs('#mainNav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(open));
            document.body.style.overflow = open ? 'hidden' : '';
        });
        // Fermer sur clic lien
        qsa('a', nav).forEach(a => a.addEventListener('click', () => {
            nav.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }));
        // Sous-menus mobile
        qsa('.has-dropdown', nav).forEach(item => {
            item.querySelector('a')?.addEventListener('click', e => {
                if (window.innerWidth < 768) {
                    e.preventDefault();
                    item.classList.toggle('active');
                }
            });
        });
    }

    /* ============================================================
       HERO SLIDER
       ============================================================ */
    const heroSlider = qs('#heroSlider');
    if (heroSlider) {
        const track  = qs('#sliderTrack', heroSlider);
        const slides = qsa('.slide', heroSlider);
        const dots   = qsa('.slider-dot', heroSlider);
        let current  = 0;
        let timer    = null;

        function goTo(idx) {
            slides[current].classList.remove('active');
            dots[current].classList.remove('active');
            dots[current].setAttribute('aria-selected', 'false');
            current = (idx + slides.length) % slides.length;
            slides[current].classList.add('active');
            dots[current].classList.add('active');
            dots[current].setAttribute('aria-selected', 'true');
            track.style.transform = `translateX(-${current * 100}%)`;
        }

        function startAuto() {
            clearInterval(timer);
            timer = setInterval(() => goTo(current + 1), 6000);
        }

        qs('#prevSlide')?.addEventListener('click', () => { goTo(current - 1); startAuto(); });
        qs('#nextSlide')?.addEventListener('click', () => { goTo(current + 1); startAuto(); });
        dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); startAuto(); }));

        // Swipe
        let startX = 0;
        heroSlider.addEventListener('touchstart', e => startX = e.changedTouches[0].clientX, { passive: true });
        heroSlider.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 50) { goTo(dx < 0 ? current + 1 : current - 1); startAuto(); }
        });

        // Keyboard
        heroSlider.addEventListener('keydown', e => {
            if (e.key === 'ArrowRight') { goTo(current + 1); startAuto(); }
            if (e.key === 'ArrowLeft')  { goTo(current - 1); startAuto(); }
        });

        startAuto();
        heroSlider.setAttribute('tabindex', '0');
    }

    /* ============================================================
       PROPERTIES SLIDER
       ============================================================ */
    const propSlider = qs('#propertiesSlider');
    if (propSlider) {
        const cards     = qsa('.property-card', propSlider);
        const prevBtn   = qs('#propPrev');
        const nextBtn   = qs('#propNext');
        let propIndex   = 0;
        let perView     = getPerView();

        function getPerView() {
            if (window.innerWidth < 600) return 1;
            if (window.innerWidth < 960) return 2;
            return 3;
        }

        function updatePropSlider() {
            const maxIndex = Math.max(0, cards.length - perView);
            propIndex = Math.min(propIndex, maxIndex);
            const w = propSlider.parentElement.clientWidth;
            const cardW = (w - (perView - 1) * 24) / perView;
            propSlider.style.transform = `translateX(-${propIndex * (cardW + 24)}px)`;
        }

        prevBtn?.addEventListener('click', () => { propIndex = Math.max(0, propIndex - 1); updatePropSlider(); });
        nextBtn?.addEventListener('click', () => { propIndex = Math.min(cards.length - perView, propIndex + 1); updatePropSlider(); });

        window.addEventListener('resize', () => { perView = getPerView(); updatePropSlider(); }, { passive: true });
    }

    /* ============================================================
       SEARCH TABS (Acheter / Louer)
       ============================================================ */
    const searchTabs = qsa('.search-tab');
    const searchStatut = qs('#searchStatut');
    searchTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            searchTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (searchStatut) searchStatut.value = tab.dataset.status || '';
        });
    });

    /* ============================================================
       COMPTEURS ANIMÉS (stats)
       ============================================================ */
    function animateCounters() {
        qsa('[data-count]').forEach(el => {
            const target = parseInt(el.dataset.count);
            const duration = 2000;
            const start = performance.now();
            function step(now) {
                const progress = Math.min((now - start) / duration, 1);
                const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
                el.textContent = Math.floor(ease * target);
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = target;
            }
            requestAnimationFrame(step);
        });
    }
    // Déclencher quand stats visibles
    const statsBar = qs('.stats-bar');
    if (statsBar) {
        const statsObs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { animateCounters(); statsObs.disconnect(); }
        }, { threshold: 0.3 });
        statsObs.observe(statsBar);
    }

    /* ============================================================
       ANIMATIONS AU SCROLL
       ============================================================ */
    const animElements = qsa('.animate-on-scroll');
    if (animElements.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        animElements.forEach(el => observer.observe(el));
    } else {
        animElements.forEach(el => el.classList.add('visible'));
    }

    /* ============================================================
       FAQ ACCORDION
       ============================================================ */
    qsa('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item    = btn.closest('.faq-item');
            const isOpen  = item.classList.contains('open');
            // Fermer tous
            qsa('.faq-item').forEach(fi => {
                fi.classList.remove('open');
                fi.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
            });
            if (!isOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    /* ============================================================
       BACK TO TOP
       ============================================================ */
    const backToTop = qs('#backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('show', window.scrollY > 500);
        }, { passive: true });
        backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    /* ============================================================
       COOKIE BANNER
       ============================================================ */
    const cookieBanner = qs('#cookieBanner');
    if (cookieBanner && !localStorage.getItem('sw_cookie_consent')) {
        setTimeout(() => cookieBanner.classList.add('show'), 1500);
    }
    qs('#cookieAccept')?.addEventListener('click', () => {
        localStorage.setItem('sw_cookie_consent', 'accepted');
        cookieBanner.classList.remove('show');
    });
    qs('#cookieRefuse')?.addEventListener('click', () => {
        localStorage.setItem('sw_cookie_consent', 'refused');
        cookieBanner.classList.remove('show');
    });

    /* ============================================================
       FAVORIS
       ============================================================ */
    qsa('.property-card__favorite').forEach(btn => {
        const id = btn.dataset.id;
        const favs = JSON.parse(localStorage.getItem('sw_favorites') || '[]');
        if (id && favs.includes(id)) btn.classList.add('active');

        btn.addEventListener('click', e => {
            e.preventDefault();
            const favs = JSON.parse(localStorage.getItem('sw_favorites') || '[]');
            const idx = favs.indexOf(btn.dataset.id);
            if (idx === -1) favs.push(btn.dataset.id);
            else favs.splice(idx, 1);
            localStorage.setItem('sw_favorites', JSON.stringify(favs));
            btn.classList.toggle('active', idx === -1);
        });
    });

    /* ============================================================
       TRACKING VISITE (AJAX)
       ============================================================ */
    if (typeof swImmo !== 'undefined' && swImmo.ajaxUrl) {
        fetch(swImmo.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'sw_track_visit',
                nonce:  swImmo.nonce,
                page:   window.location.pathname,
            }),
        }).catch(() => {}); // silencieux
    }

    /* ============================================================
       SERP PREVIEW ADMIN LIVE
       ============================================================ */
    const titleField = qs('#seo_title_field');
    const descField  = qs('#seo_desc_field');
    if (titleField) {
        titleField.addEventListener('input', () => {
            const val = titleField.value;
            qs('#serp-title-preview').textContent = val;
            const len = val.length;
            const counter = qs('#title-count');
            if (counter) {
                counter.textContent = `(${len}/60)`;
                counter.className = len < 30 ? 'length-warn' : len <= 60 ? 'length-ok' : 'length-bad';
            }
        });
    }
    if (descField) {
        descField.addEventListener('input', () => {
            const val = descField.value;
            qs('#serp-desc-preview').textContent = val;
            const len = val.length;
            const counter = qs('#desc-count');
            if (counter) {
                counter.textContent = `(${len}/160)`;
                counter.className = len < 120 ? 'length-warn' : len <= 160 ? 'length-ok' : 'length-bad';
            }
        });
    }

    /* ============================================================
       FORMULAIRE NEWSLETTER FOOTER
       ============================================================ */
    const newsletterForm = qs('#newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]')?.value;
            if (email) {
                newsletterForm.innerHTML = '<p style="color:var(--color-secondary);font-size:0.875rem">✅ Merci ! Vous recevrez nos nouvelles offres en avant-première.</p>';
            }
        });
    }

    /* ============================================================
       LAZY LOAD IMAGES (fallback)
       ============================================================ */
    if ('IntersectionObserver' in window) {
        const lazyImages = qsa('img[data-src]');
        const imgObserver = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const img = e.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imgObserver.unobserve(img);
                }
            });
        });
        lazyImages.forEach(img => imgObserver.observe(img));
    }

    /* ============================================================
       MODE NUIT / JOUR
       ============================================================ */
    const darkToggle = qs('#darkModeToggle');
    let isDark = localStorage.getItem('sw_dark_mode') === 'on' ||
                 (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('sw_dark_mode') === null);

    function applyDarkMode(dark, showToast) {
        document.body.classList.toggle('dark-mode', dark);
        isDark = dark;
        localStorage.setItem('sw_dark_mode', dark ? 'on' : 'off');

        // Mettre à jour le bouton
        if (darkToggle) {
            darkToggle.setAttribute('aria-pressed', String(dark));
            darkToggle.setAttribute('title', dark ? 'Passer en mode jour' : 'Passer en mode nuit');
        }

        // Meta theme-color
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
        meta.content = dark ? '#0f1923' : '#1a3c5e';

        // Toast notification
        if (showToast) showDarkModeToast(dark ? '🌙 Mode nuit activé' : '☀️ Mode jour activé');
    }

    // Appliquer au chargement (sans toast)
    if (isDark) applyDarkMode(true, false);

    // Écouter OS preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('sw_dark_mode') === null) applyDarkMode(e.matches, true);
    });

    // Toggle au clic
    darkToggle?.addEventListener('click', () => applyDarkMode(!isDark, true));

    // Raccourci clavier Alt+D
    document.addEventListener('keydown', e => {
        if (e.altKey && e.key === 'd') applyDarkMode(!isDark, true);
    });

    function showDarkModeToast(msg) {
        let toast = qs('.sw-mode-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'sw-mode-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
    }

    /* ============================================================
       PLEIN ÉCRAN – MODE MODAL 100%
       ============================================================ */
    const fsToggle = qs('#fullscreenToggle');
    let fsOverlay  = null;
    let isFS       = false;

    function createFSOverlay() {
        if (fsOverlay) return;
        fsOverlay = document.createElement('div');
        fsOverlay.id = 'sw-fullscreen-overlay';
        fsOverlay.innerHTML = `
            <button class="sw-fs-close" id="swFsClose" aria-label="Fermer le plein écran" title="Fermer (Échap)">
                <i class="fas fa-times"></i>
            </button>
            <iframe id="sw-fullscreen-iframe" src="" title="Vue plein écran" loading="eager"></iframe>
        `;
        document.body.appendChild(fsOverlay);

        qs('#swFsClose', fsOverlay).addEventListener('click', exitFS);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && isFS) exitFS(); });
    }

    function enterFS() {
        createFSOverlay();
        // Charger la page courante dans l'iframe
        const iframe = qs('#sw-fullscreen-iframe', fsOverlay);
        iframe.src = window.location.href;

        fsOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('is-fullscreen');
        isFS = true;

        // Essayer aussi l'API Fullscreen native
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
        showDarkModeToast('⛶ Mode plein écran — Échap pour quitter');
    }

    function exitFS() {
        if (fsOverlay) fsOverlay.classList.remove('active');
        document.body.style.overflow = '';
        document.body.classList.remove('is-fullscreen');
        isFS = false;

        // Quitter l'API Fullscreen native si actif
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
        showDarkModeToast('✕ Mode plein écran désactivé');
    }

    fsToggle?.addEventListener('click', () => isFS ? exitFS() : enterFS());

    // Raccourci F11 personnalisé
    document.addEventListener('keydown', e => {
        if (e.key === 'F11') { e.preventDefault(); isFS ? exitFS() : enterFS(); }
    });

    // Sync avec l'API Fullscreen native (si l'utilisateur sort via ESC navigateur)
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && isFS) exitFS();
    });

})();
