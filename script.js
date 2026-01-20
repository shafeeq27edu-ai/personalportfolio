import * as THREE from "three";
import {
    vertexShader,
    FluidFragmentShader,
    displayFragmentShader
} from "./shaders.js";

// --- GSAP & Lenis Setup ---
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

    // Hero Entry Animation timeline
    const tl = gsap.timeline();

    tl.to(".hero-title", {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.5,
        ease: "power3.out", // Smooth, premium ease (no elastic wobble)
        delay: 0.2
    })
        .to(".canvas-wrapper", {
            opacity: 1,
            scale: 1,
            duration: 1.5,
            ease: "power3.out"
        }, "-=1.3")
        .to(".stat-box, .cta-button, .scroll-indicator", {
            opacity: 1,
            y: 0,
            duration: 1.0,
            stagger: 0.1,
            ease: "power2.out"
        }, "-=1.0");

    // Idle Floating Animation for UI
    gsap.to(".stat-box.right", {
        y: -10,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    gsap.to(".stat-box:not(.right)", {
        y: 10,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1
    });

    // Parallax Effect - Stabilized
    gsap.to(".parallax-layer", {
        yPercent: 15, // Subtle, ambient movement
        rotation: 0, // No rotation on scroll
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: true // Instant response (no lag)
        }
    });

    gsap.to(".hero-title", {
        yPercent: 30,
        opacity: 0,
        // Removed heavy filters for performance
        ease: "none",
        scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });
};

// --- Fluid Simulation Class ---
class FluidSimulation {
    constructor() {
        this.size = 512; // Texture size
        this.isMoving = false;
        this.lastMoveTime = 0;
        this.currentTarget = 0;

        this.mouse = new THREE.Vector2(0.5, 0.5);
        this.prevMouse = new THREE.Vector2(0.5, 0.5);

        // Default aspect ratio 3:4 for vertical portrait
        this.topTextureSize = new THREE.Vector2(300, 400);
        this.bottomTextureSize = new THREE.Vector2(300, 400);

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            this.canvas = document.querySelector("#fluid-canvas");
            if (!this.canvas) throw new Error("Canvas element not found");

            this.setupRenderer();
            this.setupScene();
            this.setupMaterials();
            this.setupMeshes();
            this.setupInputListeners();

            // Load textures
            await Promise.all([
                this.loadImage("pot_top.png", this.topTexture, this.topTextureSize, "top"),
                this.loadImage("pot_bottom.png", this.bottomTexture, this.bottomTextureSize, "bottom")
            ]);

            this.onWindowResize();
            this.animate();

            console.log("Fluid simulation initialized");

            // Trigger animations after WebGL is ready
            setupAnimations();

        } catch (error) {
            console.error("Initialization failed:", error);
            // Show fallback image
            const fallback = document.querySelector('.fallback-img');
            if (fallback) fallback.style.opacity = 1;
        }
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true, // Important for blending with light background
            precision: "highp"
        });

        // Use device pixel ratio but cap it for performance
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const targetSettings = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        };

        this.pingPongTargets = [
            new THREE.WebGLRenderTarget(this.size, this.size, targetSettings),
            new THREE.WebGLRenderTarget(this.size, this.size, targetSettings)
        ];
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.simScene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }

    setupMaterials() {
        this.topTexture = this.createPlaceholderTexture("#333");
        this.bottomTexture = this.createPlaceholderTexture("#CCFF00");

        this.trailsMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uPrevTrails: { value: null },
                uMouse: { value: this.mouse },
                uPrevMouse: { value: this.prevMouse },
                uResolution: { value: new THREE.Vector2(this.size, this.size) },
                uDecay: { value: 0.98 }, // Longer trails
                uIsMoving: { value: false }
            },
            vertexShader: vertexShader,
            fragmentShader: FluidFragmentShader
        });

        this.displayMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uFluid: { value: null },
                uTopTexture: { value: this.topTexture },
                uBottomTexture: { value: this.bottomTexture },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uDpr: { value: window.devicePixelRatio },
                uTopTextureSize: { value: this.topTextureSize },
                uBottomTextureSize: { value: this.bottomTextureSize }
            },
            vertexShader: vertexShader,
            fragmentShader: displayFragmentShader,
            transparent: true // Enable transparency
        });
    }

    setupMeshes() {
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.simMesh = new THREE.Mesh(geometry, this.trailsMaterial);
        this.simScene.add(this.simMesh);
        this.displayMesh = new THREE.Mesh(geometry, this.displayMaterial);
        this.scene.add(this.displayMesh);
    }

    setupInputListeners() {
        // Track mouse relative to viewport, but map to canvas in update
        window.addEventListener("mousemove", this.onMouseMove.bind(this));
        window.addEventListener("touchmove", this.onTouchMove.bind(this), { passive: false });
        window.addEventListener("resize", this.onWindowResize.bind(this));
    }

    createPlaceholderTexture(color) {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 64, 64);
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    loadImage(url, targetTexture, textureSizeVector, type) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                textureSizeVector.set(img.width, img.height);

                const canvas = document.createElement("canvas");
                // Resize if too big
                const MAX_SIZE = 2048;
                let w = img.width;
                let h = img.height;
                if (w > MAX_SIZE || h > MAX_SIZE) {
                    const aspect = w / h;
                    if (w > h) { w = MAX_SIZE; h = MAX_SIZE / aspect; }
                    else { h = MAX_SIZE; w = MAX_SIZE * aspect; }
                }

                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);

                const newTexture = new THREE.CanvasTexture(canvas);
                newTexture.minFilter = THREE.LinearFilter;
                newTexture.magFilter = THREE.LinearFilter;

                if (type === "top") {
                    this.displayMaterial.uniforms.uTopTexture.value = newTexture;
                } else {
                    this.displayMaterial.uniforms.uBottomTexture.value = newTexture;
                }
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load ${url}`);
                resolve();
            };
            img.src = url;
        });
    }

    onMouseMove(event) {
        // We need to map mouse position to the Canvas UV space (0 to 1) 
        // considering the canvas is centered and might be smaller than viewport
        const rect = this.canvas.getBoundingClientRect();

        // Check if mouse is near/inside canvas
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // Simple hit test with generic mapping
        if (mouseX >= rect.left && mouseX <= rect.right &&
            mouseY >= rect.top && mouseY <= rect.bottom) {

            this.prevMouse.copy(this.mouse);
            this.mouse.x = (mouseX - rect.left) / rect.width;
            this.mouse.y = 1 - (mouseY - rect.top) / rect.height;
            this.isMoving = true;
            this.lastMoveTime = performance.now();
        } else {
            this.isMoving = false;
        }
    }

    onTouchMove(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                this.prevMouse.copy(this.mouse);
                this.mouse.x = (touch.clientX - rect.left) / rect.width;
                this.mouse.y = 1 - (touch.clientY - rect.top) / rect.height;
                this.isMoving = true;
                this.lastMoveTime = performance.now();
            }
        }
    }

    onWindowResize() {
        // Because canvas is CSS-sized to specific aspect ratio or % of vh,
        // we update renderer size to match clientHeight/Width for sharpness
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.renderer.setSize(width, height, false); // false = don't update style
        this.displayMaterial.uniforms.uResolution.value.set(width, height);
        this.displayMaterial.uniforms.uDpr.value = window.devicePixelRatio;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        if (this.isMoving && performance.now() - this.lastMoveTime > 100) {
            this.isMoving = false;
        }

        const prevTarget = this.pingPongTargets[this.currentTarget];
        this.currentTarget = (this.currentTarget + 1) % 2;
        const currentTarget = this.pingPongTargets[this.currentTarget];

        this.trailsMaterial.uniforms.uPrevTrails.value = prevTarget.texture;
        this.trailsMaterial.uniforms.uMouse.value.copy(this.mouse);
        this.trailsMaterial.uniforms.uPrevMouse.value.copy(this.prevMouse);
        this.trailsMaterial.uniforms.uIsMoving.value = this.isMoving;

        this.renderer.setRenderTarget(currentTarget);
        this.renderer.render(this.simScene, this.camera);

        this.displayMaterial.uniforms.uFluid.value = currentTarget.texture;
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);
    }
}

// Start
new FluidSimulation();