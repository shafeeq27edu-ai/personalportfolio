import * as THREE from 'three';
import { vertexShader, MetaballFragmentShader } from './shaders.js';

class LiquidHero {
    constructor() {
        this.container = document.getElementById('hero-3d-container');
        this.canvas = document.getElementById('hero-3d-canvas');

        if (!this.container || !this.canvas) return;

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Metaball State
        this.metaballCount = 5;
        // Arrays for uniforms
        this.metaballPositions = new Float32Array(this.metaballCount * 2); // [x, y, x, y...]
        this.metaballRadii = new Float32Array(this.metaballCount);

        // Physics State Objects
        this.metaballs = [];
        for (let i = 0; i < this.metaballCount; i++) {
            this.metaballs.push({
                x: this.width * 0.5,
                y: this.height * 0.5,
                vx: 0,
                vy: 0,
                // Staggered stiffness/damping for trail effect
                // Leader is stiffest (closest to mouse), tails are looser
                stiffness: 0.15 - (i * 0.02), // 0.15 down to 0.07
                damping: 0.85 + (i * 0.02),   // 0.85 up to 0.93 (more slide)
                radius: 100 - (i * 10) // 100px down to 60px
            });
            this.metaballRadii[i] = this.metaballs[i].radius;
        }

        // Mouse State
        this.mouse = new THREE.Vector2(this.width * 0.5, this.height * 0.5);
        this.targetMouse = new THREE.Vector2(this.width * 0.5, this.height * 0.5);

        this.init();
        this.loadAssets().then(() => {
            this.createScene();
            this.animate();
        });

        this.handleResize();
        this.handleInput();
    }

    init() {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Camera
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Clock
        this.clock = new THREE.Clock();
    }

    async loadAssets() {
        const loader = new THREE.TextureLoader();

        // Helper to load texture
        const loadTex = (url) => new Promise(resolve => {
            loader.load(url, (tex) => {
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.format = THREE.RGBAFormat;
                resolve(tex);
            });
        });

        // Load Casual and Racing images
        // User requested: "apply this as hero" (likely casual as base, racing as reveal)
        this.texCasual = await loadTex('casual.png');
        this.texRacing = await loadTex('racing.png');
    }

    createScene() {
        this.scene = new THREE.Scene();

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: MetaballFragmentShader,
            uniforms: {
                uResolution: { value: new THREE.Vector2(this.width, this.height) },
                uTime: { value: 0 },
                uMetaballs: { value: this.metaballPositions }, // vector2 array
                uRadii: { value: this.metaballRadii },         // float array
                uBaseTexture: { value: this.texCasual },
                uRevealTexture: { value: this.texRacing },
                uImageAspect: { value: 1.0 } // Default, updated on load
            },
            transparent: true
        });

        // Update Aspect once textures are ready (assuming consistent aspect)
        if (this.texCasual.image) {
            this.material.uniforms.uImageAspect.value = this.texCasual.image.width / this.texCasual.image.height;
        }

        const planeGeo = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(planeGeo, this.material);
        this.scene.add(this.mesh);
    }

    handleInput() {
        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = e.clientX;
            // Three.js and GL coords: 0 is bottom
            this.targetMouse.y = this.height - e.clientY;
        });

        // Touch support
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.targetMouse.x = e.touches[0].clientX;
                this.targetMouse.y = this.height - e.touches[0].clientY;
            }
        });
    }

    updatePhysics() {
        // Physics Loop
        for (let i = 0; i < this.metaballCount; i++) {
            const ball = this.metaballs[i];

            // For the first ball, target is mouse
            // For subsequent balls, target is the PREVIOUS ball (snake/chain effect) 
            // OR all follow mouse with different delay?
            // User said: "Multiple invisible 'influence points' follow the cursor with slight delays"
            // "1 point = hard circle... 3-5 lines with staggered delays = liquid stretching"
            // Standard implementation: All follow mouse, but with different stiffness. 
            // OR Chain: 0->Mouse, 1->0, 2->1 ... 
            // Chain creates a nicer "tail". Let's try "All follow mouse" first as per the spring params (stiffness drops). 
            // Actually, if stiffness drops for trails, they will lag behind naturally.

            const targetX = this.targetMouse.x;
            const targetY = this.targetMouse.y;

            // Optimization: If far, maybe snap? Nah, sleekness key.

            // Spring force
            const dx = targetX - ball.x;
            const dy = targetY - ball.y;

            ball.vx += dx * ball.stiffness;
            ball.vy += dy * ball.stiffness;

            // Damping
            ball.vx *= ball.damping;
            ball.vy *= ball.damping;

            // Update pos
            ball.x += ball.vx;
            ball.y += ball.vy;

            // Update Uniform Array
            // 2 floats per ball [x, y]
            this.metaballPositions[i * 2] = ball.x;
            this.metaballPositions[i * 2 + 1] = ball.y;
        }
    }

    handleResize() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            if (this.material) {
                this.material.uniforms.uResolution.value.set(this.width, this.height);
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const t = this.clock.getElapsedTime();

        this.updatePhysics();

        // Update Uniforms
        this.material.uniforms.uTime.value = t;
        // this.metaballPositions is a TypedArray reference, usually need to tell GL it changed if it wasn't a Uniform object wrapper? 
        // Three.js ShaderMaterial uniforms value update is sufficient if it's a vector/value type, but for Arrays (v1v, v2v), 
        // we might need to set needsUpdate or re-assign? 
        // Actually for Uniforms, simply modifying the value property (primitive) updates it. 
        // But here 'value' is an array. Three.js checks reference equality or content? 
        // Safer to re-assign or set uniform flag. 
        // Three.js webgl renderer checks array contents. But let's be safe.
        // this.material.uniforms.uMetaballs.value = this.metaballPositions; 

        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize on load
if (document.readyState === 'complete') {
    new LiquidHero();
} else {
    window.addEventListener('load', () => new LiquidHero());
}
