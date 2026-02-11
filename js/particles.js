(function() {
    'use strict';

    /* ===========================
       CONFIGURATION
       =========================== */

    var POOL_SIZE = 30;
    var FADE_OUT_RATE = 0.016;   // ~1s to fade out
    var FADE_IN_RATE = 0.01;     // ~1.6s to fade in
    var STAGGER_MAX = 15;        // max random delay frames for fade-out stagger
    var RESIZE_DEBOUNCE = 200;

    /* --- Light mode: petals + leaves --- */
    var PETAL_COUNT = 15;
    var LEAF_COUNT = 10;

    var PETAL_COLORS = [
        'rgba(255,183,197,',
        'rgba(255,209,220,',
        'rgba(255,240,245,',
        'rgba(255,218,185,',
    ];

    var LEAF_COLORS = [
        'rgba(144,169,85,',
        'rgba(120,150,70,',
    ];

    /* --- Dark mode: fireflies --- */
    var FIREFLY_COUNT = 25;
    var FIREFLY_INNER = '#ffd25a';
    var FIREFLY_OUTER = '#ffc33c';

    /* ===========================
       STATE
       =========================== */

    var canvas, ctx;
    var particles = [];
    var animId = null;
    var isDark = false;
    var dpr = 1;
    var W = 0, H = 0;
    var resizeTimer = null;
    var reducedMotion = false;

    /* ===========================
       PARTICLE FACTORY
       =========================== */

    function createPetal() {
        return {
            type: 'petal',
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.3,
            vy: 0.2 + Math.random() * 0.4,
            size: 4 + Math.random() * 6,
            baseOpacity: 0.3 + Math.random() * 0.4,
            opacity: 0,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
            petalCount: 4 + Math.floor(Math.random() * 2),
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0,
            fadeIn: 0,
            fadeOut: 0,
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: 0.01 + Math.random() * 0.015,
            swayAmp: 0.3 + Math.random() * 0.5,
            // firefly-specific (unused for petals)
            wanderTimer: 0,
            wanderInterval: 0,
            targetVx: 0,
            targetVy: 0,
        };
    }

    function createLeaf() {
        var p = createPetal();
        p.type = 'leaf';
        p.size = 6 + Math.random() * 5;
        p.color = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
        p.petalCount = 0;
        p.vy = 0.15 + Math.random() * 0.35;
        return p;
    }

    function createFirefly() {
        return {
            type: 'firefly',
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: 2 + Math.random() * 3,
            baseOpacity: 0.3 + Math.random() * 0.5,
            opacity: 0,
            rotation: 0,
            rotationSpeed: 0,
            color: '',
            petalCount: 0,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.015 + Math.random() * 0.025,
            fadeIn: 0,
            fadeOut: 0,
            swayPhase: 0,
            swaySpeed: 0,
            swayAmp: 0,
            wanderTimer: Math.floor(Math.random() * 180),
            wanderInterval: 120 + Math.floor(Math.random() * 180),
            targetVx: (Math.random() - 0.5) * 0.4,
            targetVy: (Math.random() - 0.5) * 0.4,
        };
    }

    /* ===========================
       SPAWN HELPERS
       =========================== */

    function spawnLightParticles() {
        for (var i = 0; i < PETAL_COUNT && particles.length < POOL_SIZE; i++) {
            var p = createPetal();
            p.fadeIn = 0;
            particles.push(p);
        }
        for (var j = 0; j < LEAF_COUNT && particles.length < POOL_SIZE; j++) {
            var l = createLeaf();
            l.fadeIn = 0;
            particles.push(l);
        }
    }

    function spawnDarkParticles() {
        for (var i = 0; i < FIREFLY_COUNT && particles.length < POOL_SIZE; i++) {
            var f = createFirefly();
            f.fadeIn = 0;
            particles.push(f);
        }
    }

    /* ===========================
       UPDATE
       =========================== */

    function updateParticle(p) {
        // Fade-in
        if (p.fadeIn < 1 && p.fadeOut === 0) {
            p.fadeIn = Math.min(1, p.fadeIn + FADE_IN_RATE);
        }

        // Fade-out (staggered)
        if (p.fadeOut > 0) {
            p.fadeOut -= FADE_OUT_RATE;
            if (p.fadeOut <= 0) {
                p.opacity = 0;
                return false; // mark for removal
            }
        }

        if (p.type === 'firefly') {
            updateFirefly(p);
        } else {
            updateDrifter(p);
        }

        // Compute final opacity
        var fadeMult = p.fadeOut > 0 ? p.fadeOut : p.fadeIn;
        if (p.type === 'firefly') {
            var pulse = 0.4 + 0.6 * ((Math.sin(p.pulsePhase) + 1) * 0.5);
            p.opacity = p.baseOpacity * pulse * fadeMult;
        } else {
            p.opacity = p.baseOpacity * fadeMult;
        }

        return true; // keep
    }

    function updateDrifter(p) {
        // Sine-wave sway on X
        p.swayPhase += p.swaySpeed;
        p.x += p.vx + Math.sin(p.swayPhase) * p.swayAmp;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Wrap bottom→top
        if (p.y > H + p.size * 2) {
            p.y = -p.size * 2;
            p.x = Math.random() * W;
        }
        // Wrap horizontal
        if (p.x < -p.size * 2) p.x = W + p.size;
        if (p.x > W + p.size * 2) p.x = -p.size;
    }

    function updateFirefly(p) {
        p.pulsePhase += p.pulseSpeed;

        // Wander: change direction periodically
        p.wanderTimer++;
        if (p.wanderTimer >= p.wanderInterval) {
            p.wanderTimer = 0;
            p.wanderInterval = 120 + Math.floor(Math.random() * 180);
            p.targetVx = (Math.random() - 0.5) * 0.5;
            p.targetVy = (Math.random() - 0.5) * 0.5;
        }

        // Lerp toward target velocity
        p.vx += (p.targetVx - p.vx) * 0.02;
        p.vy += (p.targetVy - p.vy) * 0.02;

        p.x += p.vx;
        p.y += p.vy;

        // Soft-bounce off edges
        var margin = p.size * 3;
        if (p.x < margin) { p.vx = Math.abs(p.vx) * 0.5; p.targetVx = Math.abs(p.targetVx); }
        if (p.x > W - margin) { p.vx = -Math.abs(p.vx) * 0.5; p.targetVx = -Math.abs(p.targetVx); }
        if (p.y < margin) { p.vy = Math.abs(p.vy) * 0.5; p.targetVy = Math.abs(p.targetVy); }
        if (p.y > H - margin) { p.vy = -Math.abs(p.vy) * 0.5; p.targetVy = -Math.abs(p.targetVy); }
    }

    /* ===========================
       DRAW
       =========================== */

    function drawParticle(p) {
        if (p.opacity <= 0.01) return;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);

        if (p.type === 'petal') {
            drawPetal(p);
        } else if (p.type === 'leaf') {
            drawLeaf(p);
        } else if (p.type === 'firefly') {
            drawFirefly(p);
        }

        ctx.restore();
    }

    function drawPetal(p) {
        ctx.rotate(p.rotation);
        var s = p.size;
        var count = p.petalCount;
        ctx.fillStyle = p.color + '1)';

        for (var i = 0; i < count; i++) {
            ctx.save();
            ctx.rotate((Math.PI * 2 / count) * i);
            ctx.beginPath();
            ctx.ellipse(0, -s * 0.4, s * 0.35, s * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function drawLeaf(p) {
        ctx.rotate(p.rotation);
        var s = p.size;
        ctx.fillStyle = p.color + '1)';

        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s * 0.5, -s * 0.3, 0, s);
        ctx.quadraticCurveTo(-s * 0.5, -s * 0.3, 0, -s);
        ctx.fill();

        // Center vein
        ctx.strokeStyle = p.color + '0.4)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.8);
        ctx.lineTo(0, s * 0.8);
        ctx.stroke();
    }

    function drawFirefly(p) {
        var s = p.size;
        var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
        grad.addColorStop(0, FIREFLY_INNER);
        grad.addColorStop(1, 'rgba(255,210,90,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();

        // Outer glow
        var grad2 = ctx.createRadialGradient(0, 0, s * 0.5, 0, 0, s * 3);
        grad2.addColorStop(0, 'rgba(255,195,60,0.15)');
        grad2.addColorStop(1, 'rgba(255,195,60,0)');
        ctx.fillStyle = grad2;
        ctx.beginPath();
        ctx.arc(0, 0, s * 3, 0, Math.PI * 2);
        ctx.fill();
    }

    /* ===========================
       RENDER LOOP
       =========================== */

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var i = particles.length;
        while (i--) {
            var keep = updateParticle(particles[i]);
            if (!keep) {
                particles.splice(i, 1);
            } else {
                drawParticle(particles[i]);
            }
        }

        animId = requestAnimationFrame(render);
    }

    /* ===========================
       RESIZE
       =========================== */

    function sizeCanvas() {
        dpr = window.devicePixelRatio || 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(sizeCanvas, RESIZE_DEBOUNCE);
    }

    /* ===========================
       THEME CROSSFADE
       =========================== */

    function setTheme(dark) {
        isDark = dark;

        // Stagger fade-out of existing particles
        for (var i = 0; i < particles.length; i++) {
            if (particles[i].fadeOut === 0) {
                particles[i].fadeOut = 1;
                // Stagger start by randomizing fadeOut slightly above 1
                // so they don't all disappear at once
                particles[i].fadeOut = 1 + (Math.random() * STAGGER_MAX * FADE_OUT_RATE);
            }
        }

        // Spawn new particles for the new theme
        if (dark) {
            spawnDarkParticles();
        } else {
            spawnLightParticles();
        }
    }

    /* ===========================
       INIT
       =========================== */

    function init() {
        canvas = document.getElementById('ambient-canvas');
        if (!canvas) return;

        ctx = canvas.getContext('2d');

        // Check reduced motion
        var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        reducedMotion = mq.matches;

        mq.addEventListener('change', function(e) {
            reducedMotion = e.matches;
            if (reducedMotion) {
                if (animId) {
                    cancelAnimationFrame(animId);
                    animId = null;
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.length = 0;
            } else {
                sizeCanvas();
                isDark = document.documentElement.classList.contains('dark');
                if (isDark) { spawnDarkParticles(); } else { spawnLightParticles(); }
                render();
            }
        });

        if (reducedMotion) return;

        sizeCanvas();
        window.addEventListener('resize', onResize);

        isDark = document.documentElement.classList.contains('dark');
        if (isDark) { spawnDarkParticles(); } else { spawnLightParticles(); }

        render();
    }

    /* ===========================
       PUBLIC API
       =========================== */

    window.ambientParticles = {
        setTheme: setTheme,
    };

    /* ===========================
       BOOT
       =========================== */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
