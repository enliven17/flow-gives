'use client';

import { useEffect, useRef } from 'react';

/**
 * ShaderAnimation Component
 * 
 * A WebGL shader animation background component
 */
export function ShaderAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize canvas size immediately
    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.style.display = 'block';
      } else {
        // Fallback if no parent
        const width = window.innerWidth;
        const height = 600;
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.style.display = 'block';
      }
    };

    // Initial size - use setTimeout to ensure DOM is ready
    setTimeout(() => {
      updateCanvasSize();
    }, 0);

    let gl = canvas.getContext('webgl', { 
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false
    }) as WebGLRenderingContext | null;

    if (!gl) {
      console.warn('WebGL not supported, trying WebGL2');
      // Try webgl2
      const gl2 = canvas.getContext('webgl2') as WebGLRenderingContext | null;
      if (!gl2) {
        console.error('WebGL and WebGL2 not supported');
        return;
      }
      gl = gl2;
    }
    
    if (!gl) {
      console.error('Failed to get WebGL context');
      return;
    }

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader - optimized for mobile performance
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        
        // Center UV coordinates
        vec2 center = vec2(0.5, 0.5);
        vec2 centered = uv - center;
        
        // Slower rotation for better mobile performance
        float angle = u_time * 0.3;
        float cos_a = cos(angle);
        float sin_a = sin(angle);
        vec2 rotated = vec2(
          centered.x * cos_a - centered.y * sin_a,
          centered.x * sin_a + centered.y * cos_a
        );
        
        // Reduced wave complexity for mobile
        float wave1 = sin(rotated.x * 8.0 + u_time * 2.0) * 0.5 + 0.5;
        float wave2 = sin(rotated.y * 6.0 + u_time * 1.5) * 0.5 + 0.5;
        float wave3 = sin((rotated.x + rotated.y) * 5.0 + u_time * 1.2) * 0.5 + 0.5;
        float wave4 = sin(length(rotated) * 10.0 - u_time * 2.5) * 0.5 + 0.5;
        
        // Subtle orange tones - more muted and balanced
        vec3 color1 = vec3(0.4, 0.25, 0.15);    // dark brown-orange
        vec3 color2 = vec3(0.5, 0.3, 0.2);      // medium brown-orange
        vec3 color3 = vec3(0.35, 0.2, 0.15);    // deep brown
        vec3 color4 = vec3(0.45, 0.28, 0.18);   // warm brown
        
        // Mix colors based on waves - simplified for mobile
        vec3 color = mix(color1, color2, wave1);
        color = mix(color, color3, wave2 * 0.6);
        color = mix(color, color4, wave3 * 0.5);
        color = mix(color, color1, wave4 * 0.3);
        
        // Radial gradient fade - softer edges
        float dist = length(centered);
        float fade = 1.0 - smoothstep(0.0, 0.7, dist);
        color *= fade;
        
        // Lower opacity for subtle effect
        gl_FragColor = vec4(color, 0.4);
      }
    `;

    // Compile shader
    function compileShader(source: string, type: number): WebGLShader | null {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        console.error('Shader compile error:', error);
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }

    // Create shader program
    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) {
      console.error('Failed to compile shaders');
      return;
    }

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    // Geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    // Resize function
    function resize() {
      updateCanvasSize();
      if (!gl || !canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // Animation
    let startTime = Date.now();
    let lastFrameTime = startTime;
    let isActive = true;

    function animate() {
      // Check if component is still mounted
      if (!isActive || !canvas || !gl) {
        return;
      }

      const now = Date.now();
      const deltaTime = now - lastFrameTime;
      lastFrameTime = now;
      
      // Throttle resize for mobile performance
      if (deltaTime > 200 || animationFrameRef.current === undefined) {
        resize();
      }
      
      // Skip frames on mobile for better performance
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile && deltaTime < 16) {
        // Skip frame if too fast (target 30fps on mobile instead of 60fps)
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Check if program is still valid
      if (!gl.isProgram(program)) {
        return;
      }
      
      gl.useProgram(program);
      
      // Clear with transparent background
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // Set uniforms
      const timeLocation = gl.getUniformLocation(program, 'u_time');
      const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
      
      const currentTime = (now - startTime) / 1000.0;
      if (timeLocation) {
        gl.uniform1f(timeLocation, currentTime);
      }
      if (resolutionLocation) {
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      }
      
      // Set attributes
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      if (positionLocation >= 0) {
        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }

    // Start animation after a small delay to ensure canvas is ready
    setTimeout(() => {
      if (isActive) {
        animate();
      }
    }, 50);

    // Handle resize
    const handleResize = () => {
      if (isActive) {
        resize();
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      isActive = false;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      
      window.removeEventListener('resize', handleResize);
      
      // Only delete if context is still valid
      if (gl && gl.isProgram(program)) {
        gl.deleteProgram(program);
      }
      if (gl && vertexShader && gl.isShader(vertexShader)) {
        gl.deleteShader(vertexShader);
      }
      if (gl && fragmentShader && gl.isShader(fragmentShader)) {
        gl.deleteShader(fragmentShader);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ 
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        display: 'block',
        opacity: 1,
        zIndex: 0,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    />
  );
}
