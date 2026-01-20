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
        vec4 prevState = texture2D(uPrevTrails, vUv);
        float newValue = prevState.r * uDecay;
        
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
                float lineWidth = 0.15; // Width of the fluid brush
                
                // More intense falloff for sharper trails
                float intensity = smoothstep(lineWidth, 0.0, dist) * 0.8; 
                
                newValue += intensity;
            }
        }
        
        // Clamp to prevent blowout
        newValue = min(newValue, 1.0);
        
        gl_FragColor = vec4(newValue, 0.0, 0.0, 1.0);
    }
`;

export const displayFragmentShader = `
    uniform sampler2D uFluid;
    uniform sampler2D uTopTexture;
    uniform sampler2D uBottomTexture;
    uniform vec2 uResolution;
    varying vec2 vUv;
    
    void main() {
        vec4 fluid = texture2D(uFluid, vUv);
        vec4 topColor = texture2D(uTopTexture, vUv);
        vec4 bottomColor = texture2D(uBottomTexture, vUv);
        
        // Boost the reveal effect "200%"
        // Using power function to make the edge sharper
        float mixFactor = fluid.r;
        mixFactor = smoothstep(0.0, 0.8, mixFactor); // Sharpen the transition
        
        // Add a subtle "energy glow" at the edge of the reveal
        float edge = smoothstep(0.4, 0.5, fluid.r) - smoothstep(0.5, 0.6, fluid.r);
        vec3 glowColor = vec3(0.8, 1.0, 0.0); // Acid green glow
        
        vec4 finalColor = mix(topColor, bottomColor, mixFactor);
        
        // Add the glow on top
        // finalColor.rgb += glowColor * edge * 0.5; 
        
        gl_FragColor = finalColor;
    }
`;
