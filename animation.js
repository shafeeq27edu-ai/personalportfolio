
console.log("🎬 ANIMATION MODULE LOADED - FINAL POLISH V5");

(function () {
    // 0. CONFIG - STRICT VALUES (Global Polish)
    const CONFIG = {
        phaseOne: {
            scaleTarget: 0.96,
            opacityTarget: 0.98,
            scrollDistance: 300,
            ease: "power1.out"
        },
        heroMotion: {
            xRange: 10,
            yRange: 12,
            rotRange: 0.8,
            lerp: 0.1
        },
        entrance: {
            duration: 1.4,
            ease: "cubic-bezier(0.22, 1, 0.36, 1)"
        },
        reveal: {
            delayStep: 100, // ms between items
            duration: 1.0   // Slower, more cinematic reveal
        }
    };

    // 1. INJECT STYLES (Styles only, no layout change)
    const style = document.createElement('style');
    style.innerHTML = `
        /* --- PHASE TWO: SECONDARY REVEALS --- */
        .reveal-on-scroll {
            opacity: 0;
            transform: translateY(14px); /* LN Spec: 14px */
            transition: opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
            will-change: opacity, transform;
        }
        
        .reveal-on-scroll.in-view {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Stagger Classes (Dynamic Rhythm) */
        .reveal-delay-1 { transition-delay: 100ms; }
        .reveal-delay-2 { transition-delay: 200ms; }
        .reveal-delay-3 { transition-delay: 300ms; }
        .reveal-delay-4 { transition-delay: 400ms; }
        
        /* --- PHASE ONE: HERO WRAPPER --- */
        .hero-container {
            will-change: transform, opacity;
            transform-origin: center 40%; 
        }
    `;
    document.head.appendChild(style);


    // 2. HERO ENTRY ANIMATION (Phase 0)
    window.addEventListener('load', () => {
        if (typeof gsap === 'undefined') return;

        gsap.set('.hero-figure-wrapper', { opacity: 0, y: 40, scale: 1.04 });
        gsap.set('.hero-title', { opacity: 0, y: 30 });
        gsap.set('.hero-footer-ui', { opacity: 0, y: 15 });
        gsap.set('.bg-grid', { opacity: 0.98 });

        const tl = gsap.timeline({ defaults: { ease: CONFIG.entrance.ease } });
        tl.to('.hero-figure-wrapper', { opacity: 1, y: 0, scale: 1, duration: CONFIG.entrance.duration })
            .to('.hero-title', { opacity: 1, y: 0, duration: 1.2 }, "-=1.0")
            .to('.hero-footer-ui', { opacity: 1, y: 0, duration: 1.0 }, "-=0.8");

        gsap.to('.bg-grid, .bg-graphics', {
            opacity: 1,
            duration: 7,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    });


    // 3. PHASE ONE: HERO SHRINK (DISABLED FOR VISUAL ROLLBACK)
    /*
    const heroWrapper = document.querySelector('.hero-container');
    if (heroWrapper && typeof ScrollTrigger !== 'undefined') {
        const scrollTl = gsap.timeline({
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: `+=300`,
                scrub: 0.1,
            }
        });

        scrollTl.to(heroWrapper, {
            scale: CONFIG.phaseOne.scaleTarget,
            opacity: CONFIG.phaseOne.opacityTarget,
            ease: "none"
        });
    }
    */


    // 4. PHASE TWO: SECONDARY ANIMATIONS (Calm Rhythm)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    setTimeout(() => {
        // Broad selector for all revealable content
        const targets = document.querySelectorAll(
            '#journey h2, #journey p, .journey-card, .tech-marquee span, footer span, footer a, .content-panel h2, .editorial-heading, .editorial-text, .list-item, .timeline-item, .presence-text-container h2'
        );

        targets.forEach((el, index) => {
            el.classList.add('reveal-on-scroll');
            // Natural Rhythm: Modulo 3 stagger
            const delayMod = index % 3;
            if (delayMod === 1) el.classList.add('reveal-delay-1');
            if (delayMod === 2) el.classList.add('reveal-delay-2');
            observer.observe(el);
        });

        const lineTargets = document.querySelectorAll('hr, .rev-bar, .grid-line.horizontal, .divider, .section-separator');
        lineTargets.forEach(el => {
            el.classList.add('line-reveal');
            observer.observe(el);
        });
    }, 200);


    // 5. HERO INTERACTION (Mouse Follow)
    const heroWrapperNode = document.querySelector('.hero-figure-wrapper');
    if (heroWrapperNode && window.innerWidth > 768) {
        let mouseX = 0, mouseY = 0;
        let currentX = 0, currentY = 0;
        let currentRot = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = (e.clientY / window.innerHeight) * 2 - 1;
        });

        gsap.ticker.add(() => {
            const targetX = mouseX * CONFIG.heroMotion.xRange;
            const targetY = mouseY * CONFIG.heroMotion.yRange;
            const targetRot = mouseX * CONFIG.heroMotion.rotRange;

            currentX += (targetX - currentX) * CONFIG.heroMotion.lerp;
            currentY += (targetY - currentY) * CONFIG.heroMotion.lerp;
            currentRot += (targetRot - currentRot) * CONFIG.heroMotion.lerp;

            gsap.set(heroWrapperNode, { x: currentX, y: currentY, rotation: currentRot });
        });

        document.addEventListener('mouseleave', () => { mouseX = 0; mouseY = 0; });
    }


    // 6. SECOND PRESENCE (Calm Scale Settle - "Option B")
    const secondPresence = document.querySelector('#second-presence');
    if (secondPresence && typeof gsap !== 'undefined') {
        const figureWrapper = secondPresence.querySelector('.presence-figure-wrapper');
        const figure = secondPresence.querySelector('.presence-figure');
        // Titles handled by Observer above

        // REVEAL ANIMATION - The "Wow" Moment
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: secondPresence,
                start: "top 60%", // Earlier trigger for smooth settle
                once: true
            }
        });

        // Figure: Calm Scale Settle (1.05 -> 1)
        // Starts slightly larger and settles down, feeling like a heavy camera move.
        gsap.set(figureWrapper, { opacity: 0, scale: 1.05, y: 40 });

        tl.to(figureWrapper, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.8, // Long, luxurious settle
            ease: "cubic-bezier(0.22, 1, 0.36, 1)"
        });

        // INTERACTION (Mouse Parallax)
        if (window.innerWidth > 768) {
            secondPresence.addEventListener('mousemove', (e) => {
                const rect = secondPresence.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

                gsap.to(figure, {
                    x: x * 6,
                    y: y * 8,
                    duration: 1.5,
                    ease: "power2.out"
                });
            });
            secondPresence.addEventListener('mouseleave', () => {
                gsap.to(figure, { x: 0, y: 0, duration: 1.5, ease: "power2.out" });
            });
        }
    }

})();
