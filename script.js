// 3D Liquid Removed for Stability
// Only lightweight interactions remain


// =============================================================================
// GLOBAL STATE & FAILSAFES
// =============================================================================
// =============================================================================
// GLOBAL STATE & FAILSAFES
// =============================================================================
// =============================================================================
// GLOBAL STATE & FAILSAFES
// =============================================================================
const APP_STATE = {
    isMenuOpen: false,
    isLiquidActive: false,
    isScrollActive: false,
    isAudioEnabled: false,
    isRaceMode: false
};

// =============================================================================
// 2c. CINEMATIC EFFECTS
// =============================================================================
class TiltEffect {
    constructor(selector) {
        this.cards = document.querySelectorAll(selector);
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.tilt(e, card));
            card.addEventListener('mouseleave', () => this.reset(card));
        });
    }

    tilt(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Center offsets
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Rotate values (Max 15deg)
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        gsap.to(card, {
            rotationX: rotateX,
            rotationY: rotateY,
            scale: 1.05,
            duration: 0.5,
            ease: "power2.out",
            transformPerspective: 1000
        });
    }

    reset(card) {
        gsap.to(card, {
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            duration: 0.8,
            ease: "elastic.out(1, 0.5)"
        });
    }
}

class ShutterTransition {
    constructor() {
        this.el = document.querySelector('.shutter-wipe');
    }

    wipeOpen(onComplete) {
        // Wipe UP (Cover screen)
        if (!this.el) { if (onComplete) onComplete(); return; }

        // Ensure reset
        gsap.set(this.el, { transformOrigin: 'bottom', scaleY: 0 });

        const tl = gsap.timeline();
        tl.to(this.el, {
            scaleY: 1,
            duration: 0.5,
            ease: "expo.inOut",
            onComplete: onComplete
        })
            .set(this.el, { transformOrigin: 'top' })
            .to(this.el, {
                scaleY: 0,
                duration: 0.5,
                delay: 0.1,
                ease: "expo.inOut"
            });
    }
}
const shutter = new ShutterTransition();

// =============================================================================
// 1. AUDIO MANAGER (Synthesized)
// =============================================================================
class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.1; // Low volume preset
    }

    playHover() {
        if (!APP_STATE.isAudioEnabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playClick() {
        if (!APP_STATE.isAudioEnabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playStatic() {
        if (!APP_STATE.isAudioEnabled || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 sec
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.05; // Quiet static

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    toggleMute() {
        if (!this.ctx) this.init();

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        APP_STATE.isAudioEnabled = !APP_STATE.isAudioEnabled;
        return APP_STATE.isAudioEnabled;
    }
}

const audioManager = new AudioManager();

// =============================================================================
// 1b. RADIO SYSTEM
// =============================================================================
class RadioManager {
    constructor() {
        this.el = document.querySelector('#team-radio');
        this.msgEl = document.querySelector('.message-text');
        this.senderEl = document.querySelector('.sender');

        this.messages = [
            { s: "ENGR", m: "Gap to car behind is 2.5." },
            { s: "ENGR", m: "Box this lap, box this lap." },
            { s: "LN4", m: "Tires are good, let's push." },
            { s: "ENGR", m: "Mode Push. Mode Push." },
            { s: "LN4", m: "Track evolution is high." },
            { s: "ENGR", m: "Stay focused. Head down." },
            { s: "ENGR", m: "Checks complete. All green." }
        ];

        // Start random loop
        this.scheduleNext();
    }

    scheduleNext() {
        const delay = Math.random() * 10000 + 5000; // 5-15s (Faster for testing)
        setTimeout(() => this.trigger(), delay);
    }

    trigger() {
        if (Math.random() > 0.8) { this.scheduleNext(); return; } // Occasional skip

        const msg = this.messages[Math.floor(Math.random() * this.messages.length)];

        // Update DOM
        if (this.msgEl) this.msgEl.textContent = msg.m;
        if (this.senderEl) this.senderEl.textContent = msg.s + ":";

        // Show
        if (this.el) this.el.classList.add('active');

        // Sound
        if (typeof audioManager !== 'undefined') {
            audioManager.playStatic();
        }

        // Hide after 4s
        setTimeout(() => {
            if (this.el) this.el.classList.remove('active');
            this.scheduleNext();
        }, 4000);
    }
}

// =============================================================================
// 2. MENU ANIMATION
// =============================================================================
const setupMenu = () => {
    console.log("setupMenu: Initializing...");
    const menuBtn = document.querySelector('.nav-menu-btn');
    const menuText = menuBtn ? menuBtn.querySelector('span') : null;
    const overlay = document.querySelector('#nav-overlay');
    const links = document.querySelectorAll('.nav-link');

    if (!menuBtn || !overlay) {
        console.error("setupMenu: CRITICAL ELEMENTS MISSING", { menuBtn, overlay });
        return;
    }

    console.log("setupMenu: Elements found. Attaching listeners.");

    // GSAP Timeline
    const tl = gsap.timeline({ paused: true });
    tl.to(overlay, {
        y: '0%',
        autoAlpha: 1,
        pointerEvents: 'all',
        duration: 1.0,
        ease: "cubic-bezier(0.22, 1, 0.36, 1)"
    })
        .fromTo('.nav-link',
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power2.out" },
            "-=0.6"
        );

    const toggleMenu = (isOpen) => {
        console.log("toggleMenu: Called with", isOpen);
        APP_STATE.isMenuOpen = isOpen;

        if (isOpen) {
            console.log("toggleMenu: Opening...");
            document.body.style.overflow = 'hidden';

            // Failsafe: Ensure it's visible immediately if GSAP fails
            overlay.style.visibility = 'visible';

            tl.timeScale(1).play();
            menuBtn.classList.add('active');
            if (menuText) menuText.textContent = "CLOSE";
        } else {
            console.log("toggleMenu: Closing...");
            document.body.style.overflow = '';
            tl.timeScale(1.5).reverse();
            menuBtn.classList.remove('active');
            if (menuText) menuText.textContent = "MENU";
        }
    };

    // 3. GLOBAL DELEGATION (The "Nuclear Option" for reliability)
    document.addEventListener('click', (e) => {
        const clickedBtn = e.target.closest('.nav-menu-btn');

        if (clickedBtn) {
            console.log("Global Click Caught on .nav-menu-btn");
            e.preventDefault();
            toggleMenu(!APP_STATE.isMenuOpen);
        }
    });

    // Ensure cursor is correct
    menuBtn.style.cursor = 'pointer';

    // Link Listeners
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('data-target');
            toggleMenu(false);

            if (targetId) {
                const panel = document.querySelector(`#panel-${targetId}`);
                if (panel) {
                    e.preventDefault();
                    if (typeof shutter !== 'undefined') {
                        shutter.wipeOpen(() => {
                            document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));
                            panel.classList.add('active');
                        });
                    }
                }
            }
        });
    });

    // ESC Key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && APP_STATE.isMenuOpen) {
            toggleMenu(false);
        }
    });

    // Panel Close
    document.querySelectorAll('.panel-close').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof shutter !== 'undefined') {
                shutter.wipeOpen(() => {
                    document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));
                });
            }
        });
    });
};

class MagneticInteraction {
    constructor(selector) {
        this.items = document.querySelectorAll(selector);
        this.init();
    }
    init() {
        if (window.innerWidth < 768) return;
        this.items.forEach(el => {
            el.addEventListener('mousemove', e => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
            });
        });
    }
}

class DataScrambler {
    constructor(selector) {
        this.elements = document.querySelectorAll(selector);
        this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        this.init();
    }
    init() {
        this.elements.forEach(el => {
            el.addEventListener('mouseenter', () => this.scramble(el));
        });
    }
    scramble(el) {
        if (el.dataset.animating === "true") return;
        el.dataset.animating = "true";
        const original = el.textContent;
        let iter = 0;
        const interval = setInterval(() => {
            el.textContent = original.split('').map((c, i) => {
                if (i < iter) return original[i];
                return this.chars[Math.floor(Math.random() * this.chars.length)];
            }).join('');
            if (iter >= original.length) {
                clearInterval(interval);
                el.dataset.animating = "false";
                el.textContent = original; // Ensure match
            }
            iter += 1 / 3;
        }, 30);
    }
}

// =============================================================================
// 3. SCROLL ANIMATION (Isolated & Non-Blocking)
// =============================================================================
// =============================================================================
// 4. HERO 3D TILT & IDLE MOTION (Cinematic)
// =============================================================================
class HeroLiquidRipple {
    constructor() {
        this.wrapper = document.querySelector('.hero-figure-wrapper');
        this.figure = document.querySelector('.hero-figure');
        // SVG Filter Elements
        this.turbulence = document.querySelector('#liquid-distortion feTurbulence');
        this.displacement = document.querySelector('#liquid-distortion feDisplacementMap');

        this.init();
    }

    init() {
        if (!this.wrapper || !this.figure || !this.turbulence) return;

        // 1. Apply Filter to Image (Programmatically for safety)
        this.figure.style.filter = "url(#liquid-distortion)";

        // 2. Start Liquid Loop (Unicorn Style: Slow & Viscous)
        const liquidTl = gsap.timeline({ repeat: -1, yoyo: true });

        liquidTl.fromTo(this.turbulence,
            { attr: { baseFrequency: "0.008 0.01" } }, // Start: Large soft waves
            {
                attr: { baseFrequency: "0.012 0.015" }, // End: Slightly tighter
                duration: 10,                           // Slower "breathing" flow
                ease: "sine.inOut"
            }
        );

        // Continuous Flow (Seed/Phase)
        gsap.to(this.turbulence, {
            attr: { seed: 100 },
            duration: 80,
            ease: "none",
            repeat: -1
        });

        // 3. Cursor Interaction (Heavy Reactivity)
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5);
            const y = (e.clientY / window.innerHeight - 0.5);

            // Parallax (Heavier Inertia)
            gsap.to(this.figure, {
                x: x * 25,
                y: y * 25,
                rotationX: y * -5,
                rotationY: x * 5,
                duration: 2.0, // Thicker feel
                ease: "power2.out"
            });

            // Viscous Liquid Reaction
            // Base 30 (Visible) -> Max 90 (Strong Distortion on move)
            const intensity = 30 + (Math.abs(x) + Math.abs(y)) * 60;

            gsap.to(this.displacement, {
                attr: { scale: intensity },
                duration: 1.0,
                ease: "power2.out"
            });
        });
    }
}

// =============================================================================
// 3. SCROLL ANIMATION (DEPTH & REVEAL)
// =============================================================================
const setupScroll = () => {
    gsap.registerPlugin(ScrollTrigger);

    // Lenis Setup (Smooth Scroll)
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 1. SCROLL-DOWN EFFECT (Visual Recede)
    // Scales #home-visual-wrapper from 1 -> 0.96
    const visualWrapper = document.querySelector('#home-visual-wrapper');
    if (visualWrapper) {
        gsap.to(visualWrapper, {
            scale: 0.96,
            ease: "none", // Linear sync with scroll
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: true
            }
        });
    }

    // 2. SCROLL-REVEAL ANIMATIONS (Editorial)
    // Target: Headings, cards, subtitles
    const revealSelector = ".journey-header h2, .journey-header .subtitle, .journey-card, .tech-marquee";
    const elements = document.querySelectorAll(revealSelector);

    elements.forEach(el => {
        gsap.fromTo(el,
            { opacity: 0, y: 20 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "cubic-bezier(0.22, 1, 0.36, 1)",
                scrollTrigger: {
                    trigger: el,
                    start: "top 90%", // Reveal when entering viewport
                    toggleActions: "play none none none" // Play once covers "No retrigger"
                }
            }
        );
    });
};

const playEntry = () => {
    // Safety check for GSAP
    if (typeof gsap === 'undefined') return;

    // Reset Elements (Opacity only, minimal transform for stability)
    gsap.set(".nav-logo, .nav-menu-btn, .stat-box, .cta-button, .scroll-indicator, .hero-footer-ui", { opacity: 0 });
    gsap.set(".hero-title", { opacity: 0, y: 15 });
    gsap.set(".hero-figure-wrapper", { opacity: 0, scale: 0.98 });

    const tl = gsap.timeline();

    // 1. Soft Hero Entrance
    tl.to(".hero-figure-wrapper", {
        opacity: 1,
        scale: 1,
        duration: 1.8,
        ease: "power2.out"
    })
        .to(".hero-title", {
            opacity: 1,
            y: 0,
            duration: 1.5,
            ease: "power2.out"
        }, "-=1.5")

        // 2. UI Fade In (Subtle)
        .to(".nav-logo, .nav-menu-btn, .stat-box, .cta-button, .hero-footer-ui", {
            opacity: 1,
            duration: 1.0,
            stagger: 0.1,
            ease: "power1.out"
        }, "-=1.0");
};


// =============================================================================
// 7. INITIALIZATION
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("System Initializing...");

    setupCursor(); // Init Cursor
    // setupMenu(); // Disabled for menu-fix.js

    // Global Scroll (Lenis) - Singleton check
    if (!window.lenis) {
        window.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true
        });
        function raf(time) { window.lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
    }

    // Page-Specific Logic
    const isHomePage = document.querySelector('#hero') !== null;

    if (isHomePage) {
        setupScroll(); // Hero Parallax + Recede
        playEntry();   // Entrance Animation
        // new HeroLiquidRipple(); // DISABLED FOR STABILITY
    }

    // SAFE BOOT: Force remove preloader if present in DOM
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';

    // Audio Toggles
    const toggle = document.querySelector('#audio-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const enabled = audioManager.toggleMute();
            toggle.querySelector('.state').textContent = enabled ? "ON" : "OFF";
            if (enabled) audioManager.playClick();
        });
    }

    // Attach Sounds
    document.querySelectorAll('a, button, .nav-menu-btn, .journey-card, .menu-icon').forEach(el => {
        el.addEventListener('mouseenter', () => audioManager.playHover());
        el.addEventListener('click', () => audioManager.playClick());
    });

    // Init Physics
    new MagneticInteraction('.cta-button, .nav-menu-btn, .audio-toggle, .panel-close');
    new DataScrambler('.stat-box .value');
    new TiltEffect('.journey-card');

    // EASTER EGG
    if (toggle) {
        toggle.addEventListener('dblclick', () => {
            document.body.classList.toggle('race-mode');
            if (audioManager) audioManager.playClick();
        });
    }

    // Live Clock
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        setInterval(() => {
            const now = new Date();
            clockEl.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
        }, 1000);
    }

    // Init Radio
    new RadioManager();

    // Init Hero Tilt (Polished)
    // new HeroLiquidRipple(); // DISABLED FOR STABILITY

    console.log("System Initialized");
});

