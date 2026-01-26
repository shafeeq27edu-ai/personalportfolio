export const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;


export const MetaballFragmentShader = `
    uniform vec2 uResolution;
    uniform float uTime;
    
    // Metaballs: [x, y, vx, vy] - but we only need positions here [x, y]
    // We can pass an array of vec2
    uniform vec2 uMetaballs[5]; 
    uniform float uRadii[5];
    
    // Textures
    uniform sampler2D uBaseTexture;    // Casual (Base)
    uniform sampler2D uRevealTexture;  // Racing (Reveal)
    uniform float uImageAspect;
    
    varying vec2 vUv;

    // Pseudo-random noise for grain/texture
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
        // 1. Aspect Ratio Correction (Cover Mode)
        float containerAspect = uResolution.x / uResolution.y;
        float imageAspect = uImageAspect;
        
        vec2 scale = vec2(1.0);
        if (containerAspect > imageAspect) {
            scale.y = imageAspect / containerAspect;
        } else {
            scale.x = containerAspect / imageAspect;
        }
        
        // Corrected UVs for texture sampling (0..1 range, centered)
        vec2 uv = (vUv - 0.5) * scale + 0.5;
        
        // Screen space coordinates for metaball calculation (pixels)
        vec2 glFragCoord = vUv * uResolution;
        
        // 2. Calculate Metaball Field
        float totalInfluence = 0.0;
        
        for(int i = 0; i < 5; i++) {
            // Positions are passed in screen/pixel space or UV space? 
            // Let's assume the JS passes them in PIXEL space for ease, or we convert.
            // Recipe said: "vec2 diff = gl_FragCoord.xy - metaballPositions[i];"
            
            vec2 pos = uMetaballs[i]; // Expecting pixel coords [0..Width, 0..Height]
            // Flip Y if needed? Three.js usually 0 is bottom, DOM 0 is top. 
            // Let's ensure JS sends correct GL coords (0 bottom).
            
            vec2 diff = glFragCoord - pos;
            float distSq = dot(diff, diff);
            float radius = uRadii[i];
            
            // Inverse square falloff
            totalInfluence += (radius * radius) / (distSq + 0.01);
        }
        
        // 3. Threshold / Mask with Smoothstep
        // User spec: "smoothstep(0.8, 1.2, totalInfluence)"
        float mask = smoothstep(0.8, 1.2, totalInfluence);
        
        // 4. Advanced Effects
        
        // B. Distortion Field
        // Simple distortion based on gradient of influence could be complex to compute analytically without derivatives
        // Or we use the vector to the centroid of the nearest blob.
        // Simplified approach from spec: "distort UVs based on distance from blob center"
        // We'll use the first metaball (leader) for main distortion or sum them.
        vec2 distortVec = vec2(0.0);
        for(int i=0; i<5; i++) {
             vec2 diff = glFragCoord - uMetaballs[i];
             float dist = length(diff);
             // Stronger near center, weaker far away
             distortVec += normalize(diff) * (uRadii[i] * 5.0) / (dist * dist + 100.0); 
        }
        vec2 distortedUV = uv + distortVec * 0.005; // Scaling factor
        
        // A. Chromatic Aberration at edges
        // We can just offset the UVs for R and B channels slightly based on mask gradient or simple offset
        float aberrationStrength = 0.002;
        
        // Bounds Check Logic
        float boundsMask = 1.0;
        if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) boundsMask = 0.0;
        
        // Sample Textures
        // Base: Casual
        vec4 baseColor = texture2D(uBaseTexture, uv);
        
        // Reveal: Racing (with distortion and aberration)
        vec4 revealColor;
        revealColor.r = texture2D(uRevealTexture, distortedUV + vec2(aberrationStrength, 0.0)).r;
        revealColor.g = texture2D(uRevealTexture, distortedUV).g;
        revealColor.b = texture2D(uRevealTexture, distortedUV - vec2(aberrationStrength, 0.0)).b;
        revealColor.a = 1.0;
        
        // Mix Layers
        vec4 finalColor = mix(baseColor, revealColor, mask);
        
        // C. Glow/Bloom Edge
        // Detect edge where mask transitions (approx 0.5)
        // simple edge detection: value is close to 0.5?
        // Let's add a subtle boost
        float edge = 1.0 - abs(mask * 2.0 - 1.0); // Peaks at mask=0.5
        edge = pow(edge, 8.0); // sharpen
        finalColor.rgb += vec3(0.2) * edge; // Add light
        
        // Apply opacity mask for image bounds
         gl_FragColor = vec4(finalColor.rgb, finalColor.a * boundsMask);
    }
`;

export const displayFragmentShader = `
    uniform sampler2D uFluid;
    uniform sampler2D uTopTexture;    // Casual
    uniform sampler2D uBottomTexture; // Suited/Racing
    uniform vec2 uResolution;
    uniform float uImageAspect;
    varying vec2 vUv;

    // Pseudo-random noise function
    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    float fbm(vec2 p) {
        float v = 0.0;
        v += 0.5 * noise(p); p *= 2.0;
        v += 0.25 * noise(p); p *= 2.0;
        v += 0.125 * noise(p); p *= 2.0;
        return v;
    }
    
    void main() {
        // 1. Aspect Ratio Correction
        float containerAspect = uResolution.x / uResolution.y;
        float imageAspect = uImageAspect;
        
        vec2 scale = vec2(1.0);
        if (containerAspect > imageAspect) {
            scale.y = imageAspect / containerAspect;
        } else {
            scale.x = containerAspect / imageAspect;
        }

        vec2 correctedUv = (vUv - 0.5) * scale + 0.5;
        
        // 2. Liquid Distortion Logic
        // Sample fluid trail (r channel)
        vec4 fluid = texture2D(uFluid, vUv);
        // Enhance the fluid value to make it punchier
        float fluidIntensity = smoothstep(0.0, 0.5, fluid.r);
        
        // Generate organic noise map
        // Lower frequency (2.0) for larger, softer liquid blobs
        float n = fbm(correctedUv * 2.0 + fluidIntensity * 1.5);
        
        // COMBINED Distortion: Purely driven by fluid
        // The distortion strength is high where the fluid is present
        // INCREASED STRENGTH per user request
        float distortionStrength = 0.15 * fluidIntensity; 
        
        vec2 flowVector = vec2(
            sin(correctedUv.y * 8.0 + n * 4.0 + fluidIntensity * 4.0),
            cos(correctedUv.x * 8.0 + n * 4.0 + fluidIntensity * 4.0)
        );
        
        vec2 finalUv = correctedUv + flowVector * distortionStrength;

        // 3. Texture Sampling
        vec4 casualColor = texture2D(uTopTexture, finalUv);
        vec4 suitedColor = texture2D(uBottomTexture, finalUv);
        
        // 4. Organic Reveal
        // The reveal is DIRECTLY linked to the fluid intensity + noise
        // No global hover param. If there is no fluid, there is no reveal.
        
        float revealFactor = fluidIntensity; 
        
        // Modulate reveal by noise for ink-bleed effect
        // UPDATED: Lower threshold (0.1) makes it reveal easier/faster
        // Wider range (0.8) makes the transition smoother/richer
        float mixFactor = smoothstep(0.1, 0.8, revealFactor + n * 0.3); // Increased noise influence too
        
        // 5. Bounds Check
        float mask = 1.0;
        if(finalUv.x < 0.0 || finalUv.x > 1.0 || finalUv.y < 0.0 || finalUv.y > 1.0) {
            mask = 0.0;
        }
        
        vec4 finalColor = mix(casualColor, suitedColor, mixFactor);
        
        gl_FragColor = vec4(finalColor.rgb, finalColor.a * mask);
    }
`;
