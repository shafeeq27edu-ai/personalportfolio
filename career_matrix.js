
// Career Page Specific Logic (Matrix & Animations)
document.addEventListener("DOMContentLoaded", () => {

    gsap.registerPlugin(ScrollTrigger);

    // --- 1. MATRIX RAIN EFFECT (Canvas) ---
    const canvas = document.getElementById('matrix-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        // Resize
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Config
        const cols = Math.floor(canvas.width / 20) + 1;
        const ypos = Array(cols).fill(0);

        // Draw
        function matrix() {
            // Trail effect: clear with slight opacity
            ctx.fillStyle = '#09090910'; // Darker fade for sharper contrast
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // NEON GREEN TEXT (Classic Matrix / Hacker Vibe)
            ctx.fillStyle = '#39ff14';
            ctx.font = '14pt monospace';

            ypos.forEach((y, ind) => {
                const text = String.fromCharCode(Math.random() * 128);
                const x = ind * 20;
                ctx.fillText(text, x, y);

                // Random reset
                if (y > 100 + Math.random() * 10000) ypos[ind] = 0;
                else ypos[ind] = y + 20;
            });
        }

        // Loop at safe FPS (30ish)
        setInterval(matrix, 50);
    }

    // --- 2. HERO ANIMATIONS (GSAP) ---
    const customEase = "cubic-bezier(0.22, 1, 0.36, 1)";
    const tl = gsap.timeline({ defaults: { ease: customEase } });

    // Animate Figure & Text - CINEMATIC SETTLE
    tl.fromTo('.career-figure',
        { opacity: 0, scale: 1.06, y: 50 },  // Updated per spec
        { opacity: 1, scale: 1, y: 0, duration: 1.5 }
    )
        .fromTo('.hero-center',
            { opacity: 0, x: -30 },
            { opacity: 1, x: 0, duration: 1.2 }, "-=1.1"
        );


    // --- 3. CURSOR PROXIMITY & PARALLAX ---
    const figureWrapper = document.querySelector('.figure-wrapper');
    const portrait = document.querySelector('.career-figure');

    if (figureWrapper && portrait) {
        // Parallax Movement
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 8; // +/- 8px (FIXED)
            const y = (e.clientY / window.innerHeight - 0.5) * 10; // +/- 10px (FIXED)

            gsap.to(portrait, {
                x: x,
                y: y,
                scale: 1.015, // Slight breathe on move
                duration: 1,  // Heavy smooth feel
                ease: "power2.out"
            });
        });

        // Hover Glitch (Controlled - NO LOOP)
        figureWrapper.addEventListener('mouseenter', () => {
            // Pulse Once
            gsap.to(portrait, {
                filter: "invert(1) hue-rotate(180deg)",
                duration: 0.1,
                yoyo: true,
                repeat: 1, // FIXED: Single pulse
                onComplete: () => {
                    gsap.set(portrait, { filter: "none" });
                }
            });
        });
    }

    // --- 3b. TEXT STAGGERED REVEAL ---
    gsap.to(".reveal-text", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: customEase,
        delay: 0.2
    });


    // --- 4. NEW SECTIONS: BUILD MODE REVEAL ---
    ScrollTrigger.batch(".build-item", {
        start: "top 85%",
        onEnter: (batch) => {
            gsap.to(batch, {
                opacity: 1,
                y: 0,
                stagger: 0.15,
                duration: 1,
                ease: customEase
            });
        },
        once: true
    });

    // Initial state set in CSS, but ensure GSAP knows
    gsap.set(".build-item", { y: 18 });


    // --- 5. NEW SECTIONS: TIMELINE REVEAL ---
    ScrollTrigger.batch(".t-item", {
        start: "top 90%",
        onEnter: (batch) => {
            gsap.to(batch, {
                opacity: 1,
                y: 0,
                stagger: 0.1,
                duration: 0.8,
                ease: "power2.out"
            });
        },
        once: true
    });
    gsap.set(".t-item", { y: 10 });

    // --- 7. FOCUSED HERO OVERLAY ANIMATION (Organic Liquid Refinement) ---
    if (document.querySelector(".hero-overlay-card")) {
        const heroTl = gsap.timeline({
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "+=600",
                scrub: 1.5 // Slower, heavier scrub for "liquid" weight
            }
        });

        // Combined Action: Organic Shrink + Blob Morph + Drift
        heroTl
            // Card Movement & Shape
            .to(".hero-overlay-card", {
                scaleX: 0.92,      // Breathing Scale (Squash)
                scaleY: 0.88,      // Breathing Scale (Stretch)
                y: -60,            // Gentle drift
                x: 15,             // Natural subtle movement
                // Liquid Border Morph: Top-heavy to Bottom-heavy feel
                borderRadius: "30% 30% 40% 40% / 40% 40% 30% 30%",
                ease: "power2.inOut" // Organic easing (Start slow, move, settle slow)
            })
            // Quote Reveal (Synced with the "breathing" moment)
            .to(".hero-quote", {
                opacity: 1,
                y: 0,
                color: "#EAEAEA",
                duration: 0.8,
                ease: "power2.out"
            }, "<0.3"); // Start slightly later for narrative pacing
    }

    // --- 5b. SYSTEMS & PROCESS REVEAL + SCROLL PAUSE (WOW EFFECT) ---
    // Text Reveal
    gsap.utils.toArray('.text-reveal-line').forEach(line => {
        gsap.fromTo(line,
            { opacity: 0, y: 18 },
            {
                scrollTrigger: {
                    trigger: line,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out"
            }
        );
    });

    // "Wow" Effect: Editorial Scroll Pause
    // Pins the section for 300px of scroll to create a "read pause"
    ScrollTrigger.create({
        trigger: "#systems-process",
        start: "center center",
        end: "+=300",
        pin: true,
        scrub: true,
        // No animation, just pin/hold
    });

    // --- 6. EXISTING SKILLS GRID ---
    gsap.from(".skill-card", {
        scrollTrigger: {
            trigger: "#career-skills",
            start: "top 75%"
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out"
    });

});
