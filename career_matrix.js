
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

    // Animate Figure & Text - CINEMATIC SETTLE (LN Style)
    tl.fromTo('.career-figure',
        { opacity: 0, scale: 1.06, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 1.5 }
    )
        .fromTo('.hero-center',
            { opacity: 0, x: 0, y: 14 }, // LN: No X-shift, subtle Y
            { opacity: 1, y: 0, duration: 1.2, ease: customEase }, "-=1.1"
        );


    // --- 3. CURSOR PROXIMITY & PARALLAX ---
    const figureWrapper = document.querySelector('.figure-wrapper');
    const portrait = document.querySelector('.career-figure');

    // ... (Proximity code unchanged) ... 

    // --- 3b. TEXT STAGGERED REVEAL ---
    gsap.to(".reveal-text", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.08, // LN: 60-90ms
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
                stagger: 0.08, // LN Stagger
                duration: 0.8,
                ease: customEase
            });
        },
        once: true
    });

    // Initial state set in CSS, but ensure GSAP knows
    gsap.set(".build-item", { y: 14 }); // LN Offset


    // --- 5. NEW SECTIONS: TIMELINE REVEAL ---
    ScrollTrigger.batch(".t-item", {
        start: "top 90%",
        onEnter: (batch) => {
            gsap.to(batch, {
                opacity: 1,
                y: 0,
                stagger: 0.08,
                duration: 0.8,
                ease: customEase
            });
        },
        once: true
    });
    gsap.set(".t-item", { y: 14 });

    // ... (Hero Pin Check) ...

    // --- 5b. SYSTEMS & PROCESS REVEAL + SCROLL PAUSE (WOW EFFECT) ---
    // Text Reveal
    gsap.utils.toArray('.text-reveal-line').forEach(line => {
        gsap.fromTo(line,
            { opacity: 0, y: 14 }, // LN Offset
            {
                scrollTrigger: {
                    trigger: line,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: customEase
            }
        );
    });

    // ... (Scroll Pause) ...

    // --- 6. EXISTING SKILLS GRID ---
    gsap.from(".skill-card", {
        scrollTrigger: {
            trigger: "#career-skills",
            start: "top 75%"
        },
        opacity: 0,
        y: 14, // LN Offset
        duration: 0.8,
        stagger: 0.08,
        ease: customEase
    });

});
