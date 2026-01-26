import * as THREE from 'three';

class Hero3DScene {
    constructor() {
        this.container = document.getElementById('hero-3d-container');
        this.canvas = document.getElementById('hero-3d-canvas');

        if (!this.container || !this.canvas) return;

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.init();
        this.createObjects();
        this.animate();
        this.handleResize();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        // this.scene.background = new THREE.Color(0x0b0b0b); // Keep clear for transparency or set to bg color

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
        this.camera.position.z = 5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true // Allow transparency if needed
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Clock for animation
        this.clock = new THREE.Clock();
    }

    createObjects() {
        // Geometry: Abstract Icosahedron
        const geometry = new THREE.IcosahedronGeometry(2, 1); // Radius 2, detail 1

        // Material: Wireframe with accent color feel or clean white/grey
        // Using a custom shader or simple material. Let's stick to a clean Basic/Line wrapper or Points.
        // Let's try a Wireframe mesh for that "Tech/Blueprint" feel.

        const material = new THREE.MeshBasicMaterial({
            color: 0x333333,
            wireframe: true,
            transparent: true,
            opacity: 0
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // Add a second inner mesh for depth
        const innerGeo = new THREE.IcosahedronGeometry(1.2, 0);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xCCFF00, // Accent Color
            wireframe: true,
            transparent: true,
            opacity: 0
        });
        this.innerMesh = new THREE.Mesh(innerGeo, innerMat);
        this.scene.add(this.innerMesh);

        // Store reference for fade-in
        this.materials = [material, innerMat];

        // Initial Reveal Animation
        this.reveal();
    }

    reveal() {
        // Simple manual fade-in logic or use GSAP if desired. 
        // Since we are inside a module, let's keep it self-contained or assume GSAP is global.
        // GSAP is loaded in index.html, so we can use window.gsap

        if (window.gsap) {
            window.gsap.to(this.materials, {
                opacity: 0.3, // Subtle visibility for outer
                duration: 2.5,
                stagger: 0.2,
                ease: "power2.out",
                delay: 0.5
            });
            window.gsap.to(this.materials[1], {
                opacity: 0.6, // Higher visibility for inner accent
                duration: 2.5,
                ease: "power2.out",
                delay: 0.7
            });

            // Scale in effect
            this.mesh.scale.set(0.8, 0.8, 0.8);
            this.innerMesh.scale.set(0.8, 0.8, 0.8);

            window.gsap.to([this.mesh.scale, this.innerMesh.scale], {
                x: 1,
                y: 1,
                z: 1,
                duration: 3,
                ease: "power2.out"
            });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsedTime = this.clock.getElapsedTime();

        // Rotation (Y axis primarily)
        if (this.mesh) {
            this.mesh.rotation.y = elapsedTime * 0.1; // Slow rotation
            this.mesh.rotation.x = Math.sin(elapsedTime * 0.2) * 0.1; // Slight tilt

            // Gentle Floating (Up and Down)
            this.mesh.position.y = Math.sin(elapsedTime * 0.5) * 0.1;
        }

        if (this.innerMesh) {
            this.innerMesh.rotation.y = elapsedTime * -0.05; // Counter rotation slow
            this.innerMesh.rotation.x = Math.cos(elapsedTime * 0.2) * 0.1;

            this.innerMesh.position.y = Math.sin(elapsedTime * 0.5) * 0.1; // Sync float
        }

        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }
}

// Initialize on load
if (document.readyState === 'complete') {
    new Hero3DScene();
} else {
    window.addEventListener('load', () => new Hero3DScene());
}
