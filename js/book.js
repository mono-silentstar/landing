(function() {
    'use strict';

    /* ===========================
       CONFIGURATION
       =========================== */

    var BASE = (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.basePath) || '';

    var CONFIG = {
        spreads: ['cover', 'about', 'cv', 'diss'],
        detailSpreads: { 1: 'about', 2: 'cv', 3: 'diss' },
        detailToSpread: { 'about': 1, 'cv': 2, 'diss': 3 },
        turnDuration: 500,
        zoomDuration: 550,
        dragThreshold: 60,
        dragFeedbackMax: 20,
        parallaxX: 4,
        parallaxY: 3,
        parallaxAngle: 1.5,
    };

    /* ===========================
       STATE
       =========================== */

    var state = {
        currentSpread: 0,
        totalSpreads: CONFIG.spreads.length,
        isAnimating: false,
        isDetailView: false,
        isDragging: false,
        dragStartX: 0,
        dragCurrentX: 0,
        reducedMotion: false,
        isTouchDevice: false,
        isMobile: false,
        mobilePageIndex: 0,
        suppressClick: false,
    };

    /* ===========================
       DOM REFS
       =========================== */

    var els = {};

    function cacheElements() {
        els.html = document.documentElement;
        els.book = document.getElementById('book');
        els.cover = els.book ? els.book.querySelector('.book__cover') : null;
        els.spread = document.getElementById('spread-content');
        els.scene = document.getElementById('scene');
        els.detail = document.getElementById('detail-view');
        els.detailContent = document.getElementById('detail-content');
        els.detailBack = document.getElementById('detail-back');
        els.toggle = document.getElementById('theme-toggle');
        els.dots = document.getElementById('spread-dots');
    }

    /* ===========================
       INITIALIZATION
       =========================== */

    function init() {
        cacheElements();

        state.reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        state.isTouchDevice = 'ontouchstart' in window
            || navigator.maxTouchPoints > 0;

        state.isMobile = window.innerWidth <= 480;

        // Read initial state from PHP
        var initial = window.__INITIAL_STATE__ || {};
        if (initial.view === 'detail' && initial.section) {
            state.isDetailView = true;
            state.currentSpread = initial.spreadIndex || 0;
            els.scene.classList.add('scene--detail-active');
        }

        initTheme();
        buildDots();
        updateDots();
        updateTurnZones();
        initClickHandlers();
        initKeyboard();
        initDrag();
        initParallax();

        if (state.isMobile) {
            initMobile();
        }

        // Popstate handler for browser back/forward
        window.addEventListener('popstate', onPopState);

        // Page load animation
        requestAnimationFrame(function() {
            els.book.classList.add('book--loaded');
        });

        // Mark JS as active for no-JS fallback
        els.html.classList.add('light-applied');

        // Respond to resize for mobile detection
        window.addEventListener('resize', onResize);
    }

    /* ===========================
       THEME TOGGLE
       =========================== */

    function initTheme() {
        var saved = localStorage.getItem('theme');
        if (saved) {
            applyTheme(saved === 'dark');
        } else {
            applyTheme(
                window.matchMedia('(prefers-color-scheme: dark)').matches
            );
        }

        els.toggle.addEventListener('click', toggleTheme);
    }

    function toggleTheme() {
        var isDark = els.html.classList.contains('dark');
        applyTheme(!isDark);
    }

    function applyTheme(dark) {
        els.html.classList.toggle('dark', dark);
        els.toggle.setAttribute('aria-checked', String(dark));
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    }

    /* ===========================
       POSITION DOTS
       =========================== */

    function buildDots() {
        els.dots.innerHTML = '';
        for (var i = 0; i < state.totalSpreads; i++) {
            var dot = document.createElement('button');
            dot.className = 'spread-dot';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', 'Page ' + (i + 1));
            dot.setAttribute('data-spread-index', i);
            dot.addEventListener('click', onDotClick);
            els.dots.appendChild(dot);
        }
    }

    function onDotClick(e) {
        var index = parseInt(e.currentTarget.getAttribute('data-spread-index'), 10);
        if (index !== state.currentSpread && !state.isAnimating) {
            turnTo(index);
        }
    }

    function updateDots() {
        var dots = els.dots.querySelectorAll('.spread-dot');
        for (var i = 0; i < dots.length; i++) {
            dots[i].classList.toggle('spread-dot--active', i === state.currentSpread);
            dots[i].setAttribute('aria-selected', String(i === state.currentSpread));
        }
    }

    /* ===========================
       TURN ZONES
       =========================== */

    function updateTurnZones() {
        var prevZones = els.spread.querySelectorAll('.turn-zone--prev');
        var nextZones = els.spread.querySelectorAll('.turn-zone--next');

        for (var i = 0; i < prevZones.length; i++) {
            prevZones[i].classList.toggle('turn-zone--hidden', state.currentSpread === 0);
        }
        for (var j = 0; j < nextZones.length; j++) {
            nextZones[j].classList.toggle('turn-zone--hidden',
                state.currentSpread === state.totalSpreads - 1);
        }
    }

    /* ===========================
       CLICK HANDLERS
       =========================== */

    function initClickHandlers() {
        // Event delegation on the book cover
        els.cover.addEventListener('click', function(e) {
            if (state.suppressClick) {
                state.suppressClick = false;
                return;
            }
            if (state.isAnimating || state.isDetailView) return;

            // Turn zone clicks
            var turnZone = e.target.closest('.turn-zone');
            if (turnZone) {
                if (turnZone.classList.contains('turn-zone--prev')) {
                    turnBackward();
                } else if (turnZone.classList.contains('turn-zone--next')) {
                    turnForward();
                }
                return;
            }

            // TOC entry clicks
            var tocLink = e.target.closest('.toc__link');
            if (tocLink) {
                e.preventDefault();
                var spreadIndex = parseInt(tocLink.getAttribute('data-goto-spread'), 10);
                if (!isNaN(spreadIndex)) {
                    turnTo(spreadIndex);
                }
                return;
            }

            // Zoomable content clicks
            var content = e.target.closest('.page-content[data-detail]');
            if (content) {
                var detailUrl = content.getAttribute('data-detail');
                if (detailUrl) {
                    zoomIn(detailUrl);
                }
                return;
            }
        });

        // Detail back button
        els.detailBack.addEventListener('click', function(e) {
            e.preventDefault();
            if (state.isAnimating) return;

            // If this was a direct URL load, navigate to / instead of animating
            if (!history.state || !history.state.view) {
                window.location.href = BASE + '/';
                return;
            }
            zoomOut();
        });
    }

    /* ===========================
       PAGE TURNS
       =========================== */

    function turnForward() {
        if (state.isAnimating || state.currentSpread >= state.totalSpreads - 1) return;
        var nextIndex = state.currentSpread + 1;
        var nextSpread = CONFIG.spreads[nextIndex];

        animatePageTurn('forward', nextSpread, function() {
            state.currentSpread = nextIndex;
            updateDots();
            updateTurnZones();
        });
    }

    function turnBackward() {
        if (state.isAnimating || state.currentSpread <= 0) return;
        var prevIndex = state.currentSpread - 1;
        var prevSpread = CONFIG.spreads[prevIndex];

        animatePageTurn('backward', prevSpread, function() {
            state.currentSpread = prevIndex;
            updateDots();
            updateTurnZones();
        });
    }

    function turnTo(targetIndex) {
        if (state.isAnimating || targetIndex === state.currentSpread) return;
        if (targetIndex < 0 || targetIndex >= state.totalSpreads) return;

        var direction = targetIndex > state.currentSpread ? 'forward' : 'backward';
        var targetSpread = CONFIG.spreads[targetIndex];

        animatePageTurn(direction, targetSpread, function() {
            state.currentSpread = targetIndex;
            updateDots();
            updateTurnZones();
        });
    }

    function animatePageTurn(direction, spreadName, callback) {
        if (state.isAnimating) return;
        state.isAnimating = true;

        // Fix from plan: start fetch immediately, fade content to opacity 0,
        // swap while invisible, fade back to 1 at animation end.

        var fetchDone = false;

        // Start fetch immediately
        loadSpread(spreadName, function() {
            fetchDone = true;
        });

        // Fade spread content to 0
        els.spread.classList.add('book__spread--fading');

        if (state.reducedMotion) {
            // Instant swap — no animation
            // Wait a tick for the fetch
            var check = setInterval(function() {
                if (fetchDone) {
                    clearInterval(check);
                    els.spread.classList.remove('book__spread--fading');
                    state.isAnimating = false;
                    if (callback) callback();
                }
            }, 10);
            return;
        }

        // Create phantom page
        var sourcePage = direction === 'forward'
            ? els.spread.querySelector('.book__page--right')
            : els.spread.querySelector('.book__page--left');

        if (sourcePage) {
            var phantom = sourcePage.cloneNode(true);
            phantom.className = 'phantom-page';
            phantom.classList.add(
                direction === 'forward' ? 'phantom-page--forward' : 'phantom-page--backward'
            );

            els.cover.appendChild(phantom);

            requestAnimationFrame(function() {
                phantom.classList.add('phantom-page--animating');
            });

            // Remove phantom when animation completes
            setTimeout(function() {
                if (phantom.parentNode) {
                    phantom.remove();
                }
            }, CONFIG.turnDuration);
        }

        // At animation end, show new content
        setTimeout(function() {
            els.spread.classList.remove('book__spread--fading');
            state.isAnimating = false;
            if (callback) callback();
        }, CONFIG.turnDuration);
    }

    function loadSpread(name, callback) {
        htmx.ajax('GET', BASE + '/spread/' + name, {
            target: '#spread-content',
            swap: 'innerHTML',
        }).then(function() {
            if (callback) callback();
        });
    }

    /* ===========================
       ZOOM (BOOK <-> DETAIL)
       =========================== */

    function zoomIn(detailUrl) {
        if (state.isAnimating || state.isDetailView) return;
        state.isAnimating = true;

        // Determine section name from URL
        var sectionName = detailUrl.replace('/detail/', '');

        // Fetch detail content immediately (in parallel with animation)
        htmx.ajax('GET', BASE + detailUrl, {
            target: '#detail-content',
            swap: 'innerHTML',
        });

        if (state.reducedMotion) {
            // Instant transition
            els.scene.classList.add('scene--detail-active');
            els.detail.classList.add('detail--active');
            els.detail.setAttribute('aria-hidden', 'false');
            state.isDetailView = true;
            state.isAnimating = false;

            history.pushState(
                { view: 'detail', spread: state.currentSpread, section: sectionName },
                '',
                BASE + '/' + (sectionName === 'diss' ? 'dissertation' : sectionName)
            );
            return;
        }

        // Start zoom animation
        els.scene.classList.add('scene--zooming-in');

        setTimeout(function() {
            els.scene.classList.remove('scene--zooming-in');
            els.scene.classList.add('scene--detail-active');
            els.detail.classList.add('detail--active');
            els.detail.setAttribute('aria-hidden', 'false');
            state.isDetailView = true;
            state.isAnimating = false;

            // Update URL
            var urlPath = sectionName === 'diss' ? 'dissertation' : sectionName;
            history.pushState(
                { view: 'detail', spread: state.currentSpread, section: sectionName },
                '',
                BASE + '/' + urlPath
            );
        }, CONFIG.zoomDuration);
    }

    function zoomOut() {
        if (state.isAnimating || !state.isDetailView) return;
        state.isAnimating = true;

        els.detail.classList.remove('detail--active');

        if (state.reducedMotion) {
            els.scene.classList.remove('scene--detail-active');
            els.detail.setAttribute('aria-hidden', 'true');
            state.isDetailView = false;
            state.isAnimating = false;
            history.pushState({ view: 'book', spread: state.currentSpread }, '', BASE + '/');
            return;
        }

        els.scene.classList.remove('scene--detail-active');
        els.scene.classList.add('scene--zooming-out');

        // Re-show the book with reverse animation
        els.book.classList.add('book--loaded');

        setTimeout(function() {
            els.scene.classList.remove('scene--zooming-out');
            els.detail.setAttribute('aria-hidden', 'true');
            state.isDetailView = false;
            state.isAnimating = false;

            history.pushState({ view: 'book', spread: state.currentSpread }, '', BASE + '/');
        }, 450); // matches zoom-out duration
    }

    /* ===========================
       POPSTATE (Browser Back/Forward)
       =========================== */

    function onPopState(e) {
        var popState = e.state;

        if (!popState) {
            // No state — likely navigating to initial URL
            if (state.isDetailView) {
                // Close detail without animation (browser handles it)
                els.scene.classList.remove('scene--detail-active', 'scene--zooming-in', 'scene--zooming-out');
                els.detail.classList.remove('detail--active');
                els.detail.setAttribute('aria-hidden', 'true');
                state.isDetailView = false;
                state.isAnimating = false;
            }
            return;
        }

        if (popState.view === 'book' && state.isDetailView) {
            // Going back from detail to book
            els.scene.classList.remove('scene--detail-active', 'scene--zooming-in');
            els.detail.classList.remove('detail--active');
            els.detail.setAttribute('aria-hidden', 'true');
            state.isDetailView = false;
            state.isAnimating = false;

            if (popState.spread !== undefined) {
                state.currentSpread = popState.spread;
                updateDots();
            }
        } else if (popState.view === 'detail' && !state.isDetailView) {
            // Going forward to detail
            if (popState.section) {
                zoomIn('/detail/' + popState.section); // zoomIn prepends BASE internally
            }
        }
    }

    /* ===========================
       DRAG HANDLING
       =========================== */

    function initDrag() {
        if (!els.book) return;

        els.book.addEventListener('mousedown', function(e) {
            if (state.isAnimating || state.isDetailView) return;
            if (e.target.closest('.turn-zone') || e.target.closest('.toc__link')) return;
            state.isDragging = true;
            state.dragStartX = e.clientX;
            state.dragCurrentX = e.clientX;
            state.suppressClick = false;
        });

        window.addEventListener('mousemove', function(e) {
            if (!state.isDragging) return;
            state.dragCurrentX = e.clientX;
            var dx = state.dragCurrentX - state.dragStartX;
            var clamped = Math.max(-CONFIG.dragFeedbackMax,
                Math.min(CONFIG.dragFeedbackMax, dx));
            els.spread.style.transform = 'translateX(' + clamped + 'px)';
            if (Math.abs(dx) > 5) {
                state.suppressClick = true;
            }
        });

        window.addEventListener('mouseup', function() {
            if (!state.isDragging) return;
            state.isDragging = false;
            var dx = state.dragCurrentX - state.dragStartX;

            // Reset visual feedback
            els.spread.style.transition = 'transform 0.25s ease-out';
            els.spread.style.transform = '';
            setTimeout(function() {
                els.spread.style.transition = '';
            }, 250);

            if (dx < -CONFIG.dragThreshold) {
                turnForward();
            } else if (dx > CONFIG.dragThreshold) {
                turnBackward();
            }
        });

        // Touch drag
        var touchStartX = 0;
        els.book.addEventListener('touchstart', function(e) {
            if (state.isAnimating || state.isDetailView) return;
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        els.book.addEventListener('touchend', function(e) {
            if (state.isAnimating || state.isDetailView) return;
            var dx = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(dx) > CONFIG.dragThreshold) {
                if (dx > 0) turnForward();
                else turnBackward();
            }
        }, { passive: true });
    }

    /* ===========================
       PARALLAX
       =========================== */

    function initParallax() {
        if (state.isTouchDevice || state.reducedMotion) return;

        window.addEventListener('mousemove', function(e) {
            if (state.isDetailView || state.isDragging) return;
            var cx = window.innerWidth / 2;
            var cy = window.innerHeight / 2;
            var dx = (e.clientX - cx) / cx;
            var dy = (e.clientY - cy) / cy;

            var tx = -dx * CONFIG.parallaxX;
            var ty = -dy * CONFIG.parallaxY;
            var rx = 45 + (dy * CONFIG.parallaxAngle);
            var ry = -dx * CONFIG.parallaxAngle;

            els.book.style.transform =
                'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translate(' + tx + 'px, ' + ty + 'px)';
        });
    }

    /* ===========================
       KEYBOARD
       =========================== */

    function initKeyboard() {
        document.addEventListener('keydown', function(e) {
            if (state.isAnimating) return;

            switch (e.key) {
                case 'ArrowLeft':
                    if (!state.isDetailView) {
                        e.preventDefault();
                        turnBackward();
                    }
                    break;

                case 'ArrowRight':
                    if (!state.isDetailView) {
                        e.preventDefault();
                        turnForward();
                    }
                    break;

                case 'Escape':
                    if (state.isDetailView) {
                        e.preventDefault();
                        // If loaded directly, go home; otherwise zoom out
                        if (!history.state || !history.state.view) {
                            window.location.href = BASE + '/';
                        } else {
                            zoomOut();
                        }
                    }
                    break;

                case 'Enter':
                case ' ':
                    // Let default behavior work for focused elements
                    break;
            }
        });
    }

    /* ===========================
       MOBILE / FLIPBOOK
       =========================== */

    var MOBILE_PAGES = [
        { spread: 'cover', side: 'left' },
        { spread: 'cover', side: 'right' },
        { spread: 'about', side: 'both' },
        { spread: 'cv',    side: 'both' },
        { spread: 'diss',  side: 'both' },
    ];

    function initMobile() {
        state.isMobile = true;
        state.mobilePageIndex = 0;

        // Set initial mobile page visibility
        updateMobileView();

        // Add touch swipe (up/down for mobile)
        var touchStartY = 0;

        document.addEventListener('touchstart', function(e) {
            if (state.isDetailView) return;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', function(e) {
            if (state.isAnimating || state.isDetailView) return;
            var dy = touchStartY - e.changedTouches[0].clientY;
            if (Math.abs(dy) > CONFIG.dragThreshold) {
                if (dy > 0) mobileTurnForward();
                else mobileTurnBackward();
            }
        }, { passive: true });
    }

    function mobileTurnForward() {
        if (state.mobilePageIndex >= MOBILE_PAGES.length - 1) return;
        state.mobilePageIndex++;
        loadMobilePage();
    }

    function mobileTurnBackward() {
        if (state.mobilePageIndex <= 0) return;
        state.mobilePageIndex--;
        loadMobilePage();
    }

    function loadMobilePage() {
        var page = MOBILE_PAGES[state.mobilePageIndex];
        var spreadIndex = CONFIG.spreads.indexOf(page.spread);

        if (spreadIndex !== state.currentSpread) {
            state.currentSpread = spreadIndex;
            loadSpread(page.spread, function() {
                updateMobileView();
                updateDots();
                updateTurnZones();
            });
        } else {
            updateMobileView();
        }
    }

    function updateMobileView() {
        if (!state.isMobile) return;

        var pages = els.spread.querySelectorAll('.book__page');
        var page = MOBILE_PAGES[state.mobilePageIndex];

        for (var i = 0; i < pages.length; i++) {
            pages[i].classList.remove('mobile-active', 'mobile-stacked');
        }

        if (page.side === 'left') {
            var leftPage = els.spread.querySelector('.book__page--left');
            if (leftPage) leftPage.classList.add('mobile-active');
        } else if (page.side === 'right') {
            var rightPage = els.spread.querySelector('.book__page--right');
            if (rightPage) rightPage.classList.add('mobile-active');
        } else {
            // 'both' — show both stacked
            for (var j = 0; j < pages.length; j++) {
                pages[j].classList.add('mobile-active', 'mobile-stacked');
            }
        }
    }

    function onResize() {
        var wasMobile = state.isMobile;
        state.isMobile = window.innerWidth <= 480;

        if (state.isMobile && !wasMobile) {
            initMobile();
        } else if (!state.isMobile && wasMobile) {
            // Cleanup mobile classes
            var pages = els.spread.querySelectorAll('.book__page');
            for (var i = 0; i < pages.length; i++) {
                pages[i].classList.remove('mobile-active', 'mobile-stacked');
            }
        }
    }

    /* ===========================
       BOOT
       =========================== */

    document.addEventListener('DOMContentLoaded', init);

})();
