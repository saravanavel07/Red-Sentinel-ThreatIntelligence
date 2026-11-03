import React, { useEffect, useRef } from 'react';

interface ParticleNetworkProps {
  reducedMotion?: boolean;
  intensity?: 'subtle' | 'normal' | 'active';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  pulsePhase: number;
  isSpecialNode?: boolean;
}

export const ParticleNetworkCanvas: React.FC<ParticleNetworkProps> = ({
  reducedMotion = false,
  intensity = 'normal',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check system prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const shouldReduceMotion = reducedMotion || mediaQuery.matches;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    // Mouse coordinates for gentle interaction
    const mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Particle pool setup
    let particles: Particle[] = [];
    const count = intensity === 'subtle' ? 38 : intensity === 'active' ? 70 : 50;

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: shouldReduceMotion ? 0 : (Math.random() - 0.5) * 0.45,
          vy: shouldReduceMotion ? 0 : (Math.random() - 0.5) * 0.45,
          radius: Math.random() < 0.15 ? 2.4 : 1.2,
          alpha: Math.random() * 0.4 + 0.2,
          pulsePhase: Math.random() * Math.PI * 2,
          isSpecialNode: Math.random() < 0.12,
        });
      }
    };

    initParticles();

    let isTabVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const connectionDist = 135;
    const mouseRadius = 120;

    let lastTime = performance.now();

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (!isTabVisible) return; // Save CPU when tab is hidden

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Subtle background grid lines
      ctx.strokeStyle = 'rgba(41, 47, 59, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 64;
      const offsetX = 0;
      const offsetY = 0;

      ctx.beginPath();
      for (let x = offsetX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!shouldReduceMotion) {
          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges smoothly
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;

          // Mouse gentle reaction
          if (mouse.active) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouseRadius && dist > 0) {
              const force = (mouseRadius - dist) / mouseRadius;
              p.x -= (dx / dist) * force * 1.2;
              p.y -= (dy / dist) * force * 1.2;
            }
          }
        }

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const lineAlpha = (1 - dist / connectionDist) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.isSpecialNode || p2.isSpecialNode
              ? `rgba(255, 51, 79, ${lineAlpha * 1.4})`
              : `rgba(156, 167, 184, ${lineAlpha * 0.8})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw particle node
        p.pulsePhase += 0.02;
        const pulse = Math.sin(p.pulsePhase) * 0.2 + 0.8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);

        if (p.isSpecialNode) {
          ctx.fillStyle = `rgba(255, 51, 79, ${p.alpha * 1.2})`;
          ctx.shadowColor = '#FF334F';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = `rgba(255, 92, 108, ${p.alpha * 0.6})`;
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [reducedMotion, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
