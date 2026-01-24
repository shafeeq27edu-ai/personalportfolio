import * as THREE from 'three';
import { vertexShader, FluidFragmentShader, displayFragmentShader } from './shaders.js';

class FluidSimulation {
    constructor(renderer, size) {
        this.renderer = renderer;
        this.size = size;

        // Render Targets for Ping-Pong (Double Buffering)
        // Using Half Float for precision if supported, or Float
        this.current = new THREE.WebGLRenderTarget(size.width, size.height, {
            type: THREE.HalfFloatType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false,
            depthBuffer: false
        });

        this.next = this.current.clone();

        // Simulation Material
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uPrevTrails: { value: null },
                uMouse: { value: new THREE.Vector2(-10, -10) },
                uPrevMouse: { value: new THREE.Vector2(-10, -10) },
                uResolution: { value: new THREE.Vector2(size.width, size.height) },
                uDecay: { value: 0.98 }, // Trail fade speed
                uIsMoving: { value: false }
            },
            vertexShader: vertexShader,
            fragmentShader: FluidFragmentShader,
            transparent: true
        });

        // Full screen quad for simulation
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
        this.scene = new THREE.Scene();
        this.scene.add(this.mesh);

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }

    update(dt, mouse, isMoving) {
        // Update Uniforms
        this.material.uniforms.uPrevTrails.value = this.current.texture;
        this.material.uniforms.uMouse.value.copy(mouse);
        // Assuming prevMouse is tracked externally or we track it here.
        // For simplicity, we'll let the main app update individual vectors if needed, 
        // but here we just pass the current mouse. The shader needs dist from prev to current.
        // Let's rely on the main update loop to pass specific vectors if wanted, 
        // OR we track inside here. Let's track here for encapsulation if we passed 'mouse' as raw norm coords.

        this.material.uniforms.uIsMoving.value = isMoving;

        // Render to 'next'
        this.renderer.setRenderTarget(this.next);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);

        // Ping Pong Swap
        const temp = this.current;
        this.current = this.next;
        this.next = temp;
    }

    setPrevMouse(vec) {
        this.material.uniforms.uPrevMouse.value.copy(vec);
    }
}

class LiquidHero {
    constructor() {
        this.container = document.querySelector('.hero-figure-wrapper');
        this.canvas = document.querySelector('#hero-canvas');

        if (!this.container || !this.canvas) {
            console.warn("LiquidHero: Container or Canvas not found");
            return;
        }

        this.init();
    }

    async init() {
        // 1. Setup Three.js
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Perf cap

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // 2. Load Textures
        const loader = new THREE.TextureLoader();

        // Helper to async load
        const loadTex = (url) => new Promise(resolve => loader.load(url, resolve));

        const [texCa, texRa] = await Promise.all([
            loadTex('casual.png'),
            loadTex('racing.png')
        ]);

        texCa.minFilter = THREE.LinearFilter;
        texCa.magFilter = THREE.LinearFilter;
        texRa.minFilter = THREE.LinearFilter;
        texRa.magFilter = THREE.LinearFilter;

        // 3. Fluid Simulation
        // UPDATED: Higher resolution for smoother fluid (256 vs 128)
        const simSize = { width: 256, height: 256 };
        this.fluid = new FluidSimulation(this.renderer, simSize);

        // 4. Display Mesh
        this.displayMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uFluid: { value: null }, // Will bind to fluid.current.texture
                uTopTexture: { value: texCa },
                uBottomTexture: { value: texRa },
                uResolution: { value: new THREE.Vector2(this.container.offsetWidth, this.container.offsetHeight) },
                uImageAspect: { value: texCa.image.width / texCa.image.height }
            },
            vertexShader: vertexShader,
            fragmentShader: displayFragmentShader,
            transparent: true
        });

        this.displayMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.displayMaterial);
        this.scene.add(this.displayMesh);

        // 5. Input Handling
        this.mouse = new THREE.Vector2(0, 0);
        this.prevMouse = new THREE.Vector2(0, 0);
        this.isMoving = false;

        // Track mouse relative to container for UVs (0 to 1)
        this.uvMouse = new THREE.Vector2(0, 0);
        this.uvPrevMouse = new THREE.Vector2(0, 0);

        this.setupEvents();
        this.startLoop();
    }

    setupEvents() {
        // We track global mouse but map it to the container's specialized UV space
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();

            // Norm config for Shader (-1 to 1?? No, fluid shader likely expects UV 0-1 or similar)
            // FluidShader details: uses vUv. 
            // So we need to map mouse to UV space (0..1)

            const x = (e.clientX - rect.left) / rect.width;
            const y = 1.0 - (e.clientY - rect.top) / rect.height; // Flip Y for WebGL

            this.isMoving = true;
            this.mouse.set(x, y);

            // Reset "moving" flag after a bit if no event
            clearTimeout(this.moveTimer);
            this.moveTimer = setTimeout(() => { this.isMoving = false; }, 100);
        });

        window.addEventListener('resize', () => {
            if (!this.container) return;
            const w = this.container.offsetWidth;
            const h = this.container.offsetHeight;
            this.renderer.setSize(w, h);
            this.displayMaterial.uniforms.uResolution.value.set(w, h);
        });
    }

    startLoop() {
        const update = () => {
            requestAnimationFrame(update);

            // 1. Update Simulation
            // We pass the UV-space mouse to the simulation
            // The simulation shader uses this to draw lines/brush
            if (this.fluid) {
                this.fluid.setPrevMouse(this.prevMouse);
                this.fluid.update(0.016, this.mouse, this.isMoving);

                // Update display bind
                this.displayMaterial.uniforms.uFluid.value = this.fluid.current.texture;
            }

            // 2. Render Final
            this.renderer.setRenderTarget(null);
            this.renderer.render(this.scene, this.camera);

            // 3. Cycle Mouse
            this.prevMouse.copy(this.mouse);
        };
        update();
    }
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure layout
    setTimeout(() => {
        if (document.querySelector('#hero-canvas')) {
            new LiquidHero();
            console.log("🌊 Liquid Effect Initialized");
        }
    }, 500);
});
