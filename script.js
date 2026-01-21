import * as THREE from "three";
// Shaders embedded in LiquidMorph class

// --- Cinematic Preloader ---
const runPreloader = () => {
    const tl = gsap.timeline();
    const counter = { val: 0 };
    const counterElement = document.querySelector('.loader-counter');

    // Disable Scroll Initially
    document.body.style.overflow = 'hidden';

    // Prepare Hero Elements (Hide them)
    gsap.set(".hero-title, .stat-box, .cta-button, .scroll-indicator, .nav-logo, .nav-menu-btn", {
        y: 30,
        opacity: 0
    });

    tl.to(counter, {
        val: 100,
        duration: 2.2,
        ease: "power2.inOut",
        onUpdate: () => {
            if (counterElement) counterElement.textContent = Math.floor(counter.val).toString().padStart(2, '0');
        }
    })
        .to('.loader-bar', {
            scaleX: 1,
            duration: 2.5, /* Sync with counter roughly */
            ease: "expo.inOut"
        }, "<")
        .to('.loader-content', {
            y: -50,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in"
        })
        .to('#preloader', {
            yPercent: -100,
            duration: 1.2,
            ease: "expo.inOut",
            onComplete: () => {
                // Re-enable Scroll
                document.body.style.overflow = '';
                // Trigger Hero Entry
                playHeroEntry();
            }
        });
};

const playHeroEntry = () => {
    const tl = gsap.timeline();

    tl.to(".nav-logo, .nav-menu-btn", {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "expo.out",
        stagger: 0.2
    })
        .to(".hero-title", {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.8,
            ease: "expo.out"
        }, "-=0.8")
        .to(".stat-box, .cta-button, .scroll-indicator", {
            y: 0,
            opacity: 1,
            duration: 1.2,
            stagger: 0.1,
            ease: "power2.out"
        }, "-=1.4");
};

const setupAnimations = () => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis (Smooth Scroll)
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // --- Navigation Logic ---
    // --- Navigation Logic (Updated: Aesthetic Pop-Up) ---
    const menuBtn = document.querySelector('.nav-menu-btn');
    const navOverlay = document.querySelector('#nav-overlay');
    const navLinks = document.querySelectorAll('.nav-link span');
    let isMenuOpen = false;

    if (menuBtn && navOverlay) {
        menuBtn.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;

            if (isMenuOpen) {
                // Open: Scale + Fade In (Pop-up)
                gsap.set(navOverlay, { display: 'flex', pointerEvents: 'auto' });
                gsap.to(navOverlay, {
                    scale: 1,
                    opacity: 1,
                    duration: 0.6,
                    ease: "expo.out"
                });

                // Stagger Links
                gsap.fromTo(navLinks,
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out", delay: 0.1 }
                );

                menuBtn.querySelector('span').textContent = "CLOSE";
            } else {
                // Close
                gsap.to(navOverlay, {
                    scale: 0.9,
                    opacity: 0,
                    duration: 0.4,
                    ease: "power2.in",
                    onComplete: () => {
                        gsap.set(navOverlay, { pointerEvents: 'none' });
                    }
                });
                menuBtn.querySelector('span').textContent = "MENU";
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (isMenuOpen && !navOverlay.contains(e.target) && !menuBtn.contains(e.target)) {
                menuBtn.click();
            }
        });
    }

    // --- Navigation Logic (Gen-Z Panels) ---
    const menuBtn = document.querySelector('.nav-menu-btn');
    const navOverlay = document.querySelector('#nav-overlay');
    const navLinks = document.querySelectorAll('.nav-link'); // Note: Removed 'span' selector to target link
    const panelContainer = document.querySelector('#panel-container');
    const panels = document.querySelectorAll('.content-panel');
    const closeBtns = document.querySelectorAll('.panel-close');
    let isMenuOpen = false;

    // Open/Close Main Menu
    if (menuBtn && navOverlay) {
        menuBtn.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                // Open Menu
                gsap.to(navOverlay, { y: "0%", duration: 1.2, ease: "expo.inOut" });
                gsap.fromTo(navLinks,
                    { y: 100, opacity: 0, rotateX: -20 },
                    { y: 0, opacity: 1, rotateX: 0, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.4 }
                );
                menuBtn.querySelector('span').textContent = "CLOSE";
            } else {
                // Close Menu
                gsap.to(navOverlay, { y: "-100%", duration: 0.8, ease: "expo.inOut" });
                menuBtn.querySelector('span').textContent = "MENU";
            }
        });
    }

    // Handle Menu Link Clicks (Open Panels)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            openPanel(target);
        });
    });

    // Handle Panel Closing
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllPanels();
        });
    });

    // Career CTA (Journey Button) Integration
    const careerCta = document.querySelector('.cta-button');
    if (careerCta) {
        careerCta.addEventListener('click', (e) => {
            e.preventDefault();
            // User requirement: "Career in right corner... opens SAME Career section"
            // If the CTA says "Journey" but maps to "Career", we open the career panel.
            // Or does "Journey" map to the horizontal scroll?
            // "Career in menu ... Career in right corner -> BOTH SAME Career section".
            // Implementation: Open 'career' panel.
            openPanel('career');
        });
    }

    function openPanel(targetId) {
        const panel = document.querySelector(`#panel-${targetId}`);
        if (!panel) return;

        // Close Main Menu first (optional, but cleaner)
        if (isMenuOpen) {
            gsap.to(navOverlay, { y: "-100%", duration: 0.8, ease: "expo.inOut" });
            if (menuBtn) menuBtn.querySelector('span').textContent = "MENU";
            isMenuOpen = false;
        }

        // Hide other panels
        panels.forEach(p => p.style.display = 'none');

        // Show Target Panel
        panel.style.display = 'flex';

        // General Panel Entry
        gsap.fromTo(panel,
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
        );

        // Specific Section Animations
        if (targetId === 'who') {
            // Figure Pop
            gsap.fromTo(panel.querySelector('.figure-wrapper'),
                { scale: 0, opacity: 0, y: 50 },
                { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "elastic.out(1, 0.5)", delay: 0.2 }
            );
            // Text Stagger
            gsap.fromTo(panel.querySelectorAll('.panel-text *'),
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.4 }
            );
        } else if (targetId === 'achievements') {
            gsap.fromTo(panel.querySelector('.panel-body'),
                { x: 50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
            );
            gsap.fromTo(panel.querySelectorAll('li, p, h2'),
                { x: 20, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.2 }
            );
        } else if (targetId === 'career') {
            // Center Pop
            gsap.fromTo(panel.querySelector('.figure-wrapper'),
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)", delay: 0.2 }
            );
            gsap.fromTo(panel.querySelectorAll('.tech-stack-list p'),
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, stagger: 0.1, delay: 0.5 }
            );
        } else if (targetId === 'social') {
            gsap.fromTo(panel.querySelectorAll('.social-card'),
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: "back.out(1.2)", delay: 0.2 }
            );
        }
    }

    function closeAllPanels() {
        gsap.to(panels, {
            opacity: 0,
            scale: 0.95,
            duration: 0.3,
            onComplete: () => {
                panels.forEach(p => p.style.display = 'none');
            }
        });
    }

    // --- Page Transitions (Legacy/Horizontal) ---
    const transitionOverlay = document.querySelector('.transition-overlay');

    // Hero Entry Animation timeline
    const tl = gsap.timeline();

    if (document.querySelector(".hero-title")) {
        /*
                tl.to(".hero-title", {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 2.4, // Cinematic Slow-Motion
                    ease: "expo.out",
                    delay: 0.2
                })
        */
    }

    if (document.querySelector(".stat-box, .cta-button, .scroll-indicator")) {
        /*
                tl.to(".stat-box, .cta-button, .scroll-indicator", {
                    opacity: 1,
                    y: 0,
                    duration: 1.5,
                    stagger: 0.1,
                    ease: "power2.out"
                }, "-=1.5");
        */
    }

    // Parallax Effect - Stabilized & Subtle
    gsap.to(".parallax-layer", {
        yPercent: 15, // Subtle
        rotation: 0,
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    gsap.to(".hero-title", {
        yPercent: 30, // Gentle drift
        opacity: 0,
        scale: 1.1,
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // Hero Scale Down & Lift (LandonNorris Style)
    // The portrait should shrink and move UP as you scroll down
    gsap.to(".canvas-wrapper", {
        scale: 0.6,          // Significant shrink
        yPercent: -20,       // Move UP (negative Y)
        opacity: 0,          // Fade out eventually
        ease: "power1.inOut",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom 30%", // Finish before section ends
            scrub: true
        }
    });

    // Name Reveal Logic (optional tweak if needed)
    gsap.to(".hero-title", {
        yPercent: -50,       // Move up faster
        opacity: 0,
        scale: 0.9,
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom center",
            scrub: true
        }
    });

    // --- Next Race Morph Logic (Map -> ? Icon) ---
    const trackIcon = document.querySelector('.track-icon');
    if (trackIcon) {
        // Create the '?' element dynamically
        const questionMark = document.createElement('div');
        questionMark.textContent = "?";
        questionMark.style.position = "absolute";
        questionMark.style.top = "50%";
        questionMark.style.left = "50%";
        questionMark.style.transform = "translate(-50%, -50%)";
        questionMark.style.fontSize = "2rem";
        questionMark.style.fontWeight = "bold";
        questionMark.style.color = "#000";
        questionMark.style.opacity = "0"; // Initially hidden
        trackIcon.appendChild(questionMark);

        const svg = trackIcon.querySelector('svg');
        if (svg) {
            const morphTl = gsap.timeline({ repeat: -1, repeatDelay: 3, yoyo: true });
            morphTl.to(svg, {
                scale: 0,
                opacity: 0,
                duration: 0.6,
                ease: "back.in(1.7)"
            })
                .to(questionMark, {
                    scale: 1,
                    opacity: 1,
                    duration: 0.6,
                    ease: "back.out(1.7)"
                }, "-=0.3");
        }
    }

    // --- Journey Section Horizontal Scroll ---
    const journeySection = document.querySelector("#journey");
    const journeyContainer = document.querySelector(".journey-container");

    if (journeySection && journeyContainer) {
        // Calculate scroll amount: container width - viewport width
        // We add some padding for safety
        const totalScroll = journeyContainer.scrollWidth - window.innerWidth + window.innerWidth * 0.2;

        gsap.to(journeyContainer, {
            x: () => -totalScroll,
            ease: "none",
            scrollTrigger: {
                trigger: journeySection,
                pin: true,           // Pin the section
                scrub: 1,            // Smooth scrub
                start: "top top",
                end: () => `+=${totalScroll}`, // Scroll distance matches horizontal width
                invalidateOnRefresh: true,
                anticipatePin: 1
            }
        });

        // Parallax for cards
        gsap.utils.toArray(".journey-card").forEach((card, i) => {
            gsap.from(card.querySelector(".card-image"), {
                scale: 1.1,
                scrollTrigger: {
                    trigger: card,
                    containerAnimation: gsap.getTweensOf(journeyContainer)[0], // Link to horizontal scroll
                    start: "left right",
                    end: "right left",
                    scrub: true
                }
            });
        });
    }




    // --- Magnetic Hover for Menu Btn ---
    if (menuBtn) {
        menuBtn.addEventListener('mousemove', (e) => {
            const rect = menuBtn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(menuBtn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.5,
                ease: "power2.out"
            });
        });

        menuBtn.addEventListener('mouseleave', () => {
            gsap.to(menuBtn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
        });
    }

};

// --- FBO Fluid Simulation Class ---
// --- Authentic FBO Liquid Morph (Standard) ---
class LiquidMorph {
    constructor() {
        this.container = document.querySelector('.canvas-wrapper');
        this.canvas = document.querySelector("#fluid-canvas");
        if (!this.container || !this.canvas) return;

        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.pixelRatio = Math.min(window.devicePixelRatio, 2);

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: false,
            powerPreference: "high-performance"
        });

        this.mouse = new THREE.Vector2(0, 0);
        this.prevMouse = new THREE.Vector2(0, 0);
        this.isMoving = false;

        this.init();
    }

    async init() {
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(this.pixelRatio);

        const loader = new THREE.TextureLoader();
        try {
            const [tex1, tex2] = await Promise.all([
                this.loadTexture(loader, 'casual.png'),
                this.loadTexture(loader, 'racing.png')
            ]);
            this.tex1 = tex1;
            this.tex2 = tex2;

            // Aspect Ratio logic
            this.imageAspect = tex1.image.width / tex1.image.height;

        } catch (e) {
            console.error("Texture Load Fail", e);
            return;
        }

        this.setupFBO();
        this.setupPipeline();
        this.addEvents();
        this.animate();

        // Unhide canvas
        this.canvas.style.display = 'block';
    }

    loadTexture(loader, url) {
        return new Promise(resolve => loader.load(url, resolve));
    }

    setupFBO() {
        // Ping-Pong for Fluid Trail Persistence
        const size = 128; // Sim resolution (lower = more "liquid" feel)
        const options = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType, // Requires OES_texture_float extension usually, but standard in WebGL2
            depthBuffer: false,
            stencilBuffer: false
        };

        this.simTargets = [
            new THREE.WebGLRenderTarget(size, size, options),
            new THREE.WebGLRenderTarget(size, size, options)
        ];
        this.currentSimIndex = 0;

        // Simulation Material (The Physics)
        this.simMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: null },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uPrevMouse: { value: new THREE.Vector2(0, 0) },
                uResolution: { value: new THREE.Vector4(size, size, 1, 1) },
                uDt: { value: 0.016 },
                uIsMoving: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                uniform vec2 uMouse;
                uniform vec2 uPrevMouse;
                uniform vec4 uResolution;
                uniform float uIsMoving;
                varying vec2 vUv;

                float circle(vec2 uv, vec2 center, float radius) {
                    return 1.0 - smoothstep(radius * 0.9, radius, length(uv - center));
                }

                void main() {
                    vec2 uv = vUv;
                    vec4 color = texture2D(uTexture, uv);

                    // Fluid Decay
                    color.r *= 0.98; // Dissipation
                    color.g *= 0.97;
                    color.b *= 0.96;

                    // Mouse Interaction
                    if (uIsMoving > 0.5) {
                        float radius = 0.08;
                        float brightness = 1.0;
                        
                        // Draw line between mouse points for continuity
                        vec2 dir = uMouse - uPrevMouse;
                        float len = length(dir);
                        int steps = int(len * 50.0) + 1;
                        
                        for(int i=0; i < 5; i++) {
                            if(i >= steps) break;
                            float t = float(i) / float(steps);
                            vec2 pos = mix(uPrevMouse, uMouse, t);
                            float brush = circle(uv, pos, radius);
                            color.r += brush * brightness;
                        }
                    }

                    gl_FragColor = color;
                }
            `
        });

        this.simScene = new THREE.Scene();
        this.simMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.simMaterial);
        this.simScene.add(this.simMesh);
    }

    setupPipeline() {
        // Final Display Material (The Distortion)
        this.displayMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uFluid: { value: null }, // From FBO
                uTex1: { value: this.tex1 },
                uTex2: { value: this.tex2 },
                uResolution: { value: new THREE.Vector2(this.width, this.height) },
                uImageAspect: { value: this.imageAspect }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uFluid;
                uniform sampler2D uTex1;
                uniform sampler2D uTex2;
                uniform vec2 uResolution;
                uniform float uImageAspect;
                varying vec2 vUv;

                void main() {
                    // Aspect Correction (cover mode)
                    vec2 ratio = vec2(
                        min((uResolution.x / uResolution.y) / uImageAspect, 1.0),
                        min((uImageAspect / (uResolution.x / uResolution.y)), 1.0)
                    );
                    vec2 uv = vec2(
                        vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
                        vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
                    );

                    // Read Fluid
                    vec4 fluid = texture2D(uFluid, vUv); // Use uncorrected UV for fluid typically, or corrected? 
                    // Let's use vUv for fluid to map to screen space naturally
                    
                    float intensity = fluid.r; // Red channel holds the height/intensity

                    // Distort UVs based on fluid
                    vec2 distort = vec2(intensity * 0.02, intensity * 0.02);
                    vec2 distortedUV = uv - distort;

                    vec4 c1 = texture2D(uTex1, distortedUV);
                    vec4 c2 = texture2D(uTex2, distortedUV);

                    // Mix based on fluid intensity
                    float mixVal = smoothstep(0.0, 0.5, intensity);
                    
                    gl_FragColor = mix(c1, c2, mixVal);
                }
            `,
            transparent: true
        });

        this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.displayMaterial);
        this.scene.add(this.quad);
    }

    addEvents() {
        window.addEventListener('mousemove', (e) => {
            this.isMoving = true;
            this.prevMouse.copy(this.mouse);

            const rect = this.canvas.getBoundingClientRect();
            // Map to 0-1 UV space
            this.mouse.x = (e.clientX - rect.left) / rect.width;
            this.mouse.y = 1.0 - (e.clientY - rect.top) / rect.height;

            clearTimeout(this.moveTimer);
            this.moveTimer = setTimeout(() => this.isMoving = false, 100);
        });

        window.addEventListener('resize', () => {
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            this.renderer.setSize(this.width, this.height);
            this.displayMaterial.uniforms.uResolution.value.set(this.width, this.height);
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // 1. Physics Step
        this.simMesh.visible = true;
        this.quad.visible = false;

        const currentTarget = this.simTargets[this.currentSimIndex];
        const nextTarget = this.simTargets[this.currentSimIndex === 0 ? 1 : 0];

        this.simMaterial.uniforms.uTexture.value = currentTarget.texture;
        this.simMaterial.uniforms.uPrevMouse.value = this.prevMouse;
        this.simMaterial.uniforms.uMouse.value = this.mouse;
        this.simMaterial.uniforms.uIsMoving.value = this.isMoving ? 1.0 : 0.0;

        this.renderer.setRenderTarget(nextTarget);
        this.renderer.render(this.simScene, this.camera);

        // Swap
        this.currentSimIndex = this.currentSimIndex === 0 ? 1 : 0;

        // 2. Display Step
        this.renderer.setRenderTarget(null);
        this.simMesh.visible = false;
        this.quad.visible = true;

        this.displayMaterial.uniforms.uFluid.value = nextTarget.texture;
        this.renderer.render(this.scene, this.camera);

        // Damping for next frame if no movement
        if (!this.isMoving) {
            // Optional: slowly decay mouse influence if needed, but shader handles decay
        }
    }
}


// Init Safely
document.addEventListener("DOMContentLoaded", () => {
    // Run Preloader
    runPreloader();

    // Enable Interactions
    setupAnimations();

    // Enable Liquid Morph
    try {
        new LiquidMorph();
    } catch (e) { console.warn("Morph Init Error", e); }
});
