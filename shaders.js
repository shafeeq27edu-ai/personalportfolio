export const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const FluidFragmentShader = `
    uniform sampler2D uPrevTrails;
    uniform vec2 uMouse;
    uniform vec2 uPrevMouse;
    uniform vec2 uResolution;
    uniform float uDecay;
    uniform bool uIsMoving;
    varying vec2 vUv;
    
    void main(){
        vec2 texelSize = 1.0 / uResolution;
        vec2 uv = vUv;
        
        // 1. Advection (Move fluid based on its own flow)
        // Simple 3x3 blur to spread the fluid
        vec4 old = texture2D(uPrevTrails, uv);
        vec4 left = texture2D(uPrevTrails, uv - vec2(texelSize.x, 0.0));
        vec4 right = texture2D(uPrevTrails, uv + vec2(texelSize.x, 0.0));
        vec4 top = texture2D(uPrevTrails, uv + vec2(0.0, texelSize.y));
        vec4 bottom = texture2D(uPrevTrails, uv - vec2(0.0, texelSize.y));
        
        vec4 blurred = (old + left + right + top + bottom) * 0.2;
        
        float newValue = blurred.r * uDecay;
        
        // 2. Mouse Interaction
        if (uIsMoving) {
            vec2 mouseDirection = uMouse - uPrevMouse;
            float lineLength = length(mouseDirection);
            
            if (lineLength > 0.001) {
                vec2 mouseDir = mouseDirection / lineLength;
                vec2 toPixel = vUv - uPrevMouse;
                float projAlong = dot(toPixel, mouseDir);
                
                projAlong = clamp(projAlong, 0.0, lineLength);
                vec2 closestPoint = uPrevMouse + projAlong * mouseDir;
                float dist = length(vUv - closestPoint);
                float lineWidth = 0.03; // Sharper pen
                
                // Smooth, high-intensity brush
                float intensity = 1.0 - smoothstep(0.0, lineWidth, dist);
                intensity = pow(intensity, 3.0); // Spiky falloff
                
                newValue += intensity * 0.8; // Strong input
            }
        }
        
        newValue = clamp(newValue, 0.0, 1.0);
        gl_FragColor = vec4(newValue, 0.0, 0.0, 1.0);
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
        float distortionStrength = 0.06 * fluidIntensity; 
        
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
        // 0.2 base threshold, spreads with high intensity
        float mixFactor = smoothstep(0.2, 0.6, revealFactor + n * 0.2);
        
        // 5. Bounds Check
        float mask = 1.0;
        if(finalUv.x < 0.0 || finalUv.x > 1.0 || finalUv.y < 0.0 || finalUv.y > 1.0) {
            mask = 0.0;
        }
        
        vec4 finalColor = mix(casualColor, suitedColor, mixFactor);
        
        gl_FragColor = vec4(finalColor.rgb, finalColor.a * mask);
    }
`;
