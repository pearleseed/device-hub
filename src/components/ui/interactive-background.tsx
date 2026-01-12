import React, { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

interface InteractiveBackgroundProps {
  particleCount?: number;
  particleColor?: string;
  maxDistance?: number;
  className?: string;
}

export const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({
  particleCount = 50,
  particleColor = "rgba(255, 255, 255, 0.3)",
  maxDistance = 150,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  const initParticles = useCallback(
    (width: number, height: number) => {
      particlesRef.current = [];
      dimensionsRef.current = { width, height };

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
    },
    [particleCount],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      initParticles(rect.width, rect.height);
    };

    const animate = () => {
      const { width, height } = dimensionsRef.current;
      ctx.clearRect(0, 0, width, height);

      particlesRef.current.forEach((particle) => {
        // Di chuyển tự do
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > width) {
          particle.vx *= -1;
          particle.x = Math.max(0, Math.min(width, particle.x));
        }
        if (particle.y < 0 || particle.y > height) {
          particle.vy *= -1;
          particle.y = Math.max(0, Math.min(height, particle.y));
        }

        // Tương tác với chuột - đẩy ra xa
        const dx = particle.x - mouseRef.current.x;
        const dy = particle.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance && distance > 0) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          particle.vx += Math.cos(angle) * force * 0.5;
          particle.vy += Math.sin(angle) * force * 0.5;
        }

        // Giới hạn tốc độ
        const speed = Math.sqrt(
          particle.vx * particle.vx + particle.vy * particle.vy,
        );
        const maxSpeed = 3;
        if (speed > maxSpeed) {
          particle.vx = (particle.vx / speed) * maxSpeed;
          particle.vy = (particle.vy / speed) * maxSpeed;
        }

        // Giảm dần tốc độ (friction)
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Vẽ particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor.replace(
          /[\d.]+\)$/,
          `${particle.opacity})`,
        );
        ctx.fill();

        // Vẽ đường nối giữa các particles gần nhau
        particlesRef.current.forEach((otherParticle) => {
          if (particle === otherParticle) return;

          const distX = particle.x - otherParticle.x;
          const distY = particle.y - otherParticle.y;
          const dist = Math.sqrt(distX * distX + distY * distY);

          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = particleColor.replace(
              /[\d.]+\)$/,
              `${0.15 * (1 - dist / 120)})`,
            );
            ctx.lineWidth = 0.5;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });

        // Vẽ đường nối với chuột nếu gần
        if (distance < maxDistance) {
          ctx.beginPath();
          ctx.strokeStyle = particleColor.replace(
            /[\d.]+\)$/,
            `${0.3 * (1 - distance / maxDistance)})`,
          );
          ctx.lineWidth = 1;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    resizeCanvas();
    animate();

    window.addEventListener("resize", resizeCanvas);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, particleColor, maxDistance, initParticles]);

  return (
    <div ref={containerRef} className={`absolute inset-0 z-0 ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};
