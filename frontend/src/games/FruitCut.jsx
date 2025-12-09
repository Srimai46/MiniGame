import { useEffect, useRef, useState } from 'react';

export default function FruitCut() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let fruits = [];
    let particles = [];
    let running = true;
    let lastSpawn = 0;
    let lastTime = performance.now();

    const rand = (a, b) => Math.random() * (b - a) + a;

    function spawnFruit() {
      const x = rand(60, canvas.width - 60);
      const y = canvas.height + 20;
      const r = rand(14, 24);
      const vx = rand(-1.5, 1.5);
      const vy = rand(-18   , -5);
      fruits.push({ x, y, r, vx, vy, color: 'hsl(' + Math.floor(rand(0, 360)) + ',70%,50%)' });
    }

    function spawnParticles(x, y, color) {
      for (let i = 0; i < 12; i++) {
        particles.push({ x, y, vx: rand(-3, 3), vy: rand(-3, 3), life: 30, color });
      }
    }

    function step(now) {
      const dt = (now - lastTime) / 16.7; // ~60fps delta
      lastTime = now;

      if (now - lastSpawn > 800) {
        spawnFruit();
        lastSpawn = now;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // update fruits
      fruits.forEach(f => {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 0.25 * dt; // gravity
        // draw
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
      });

      // remove offscreen
      fruits = fruits.filter(f => f.y - f.r < canvas.height + 50);

      // particles
      particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= 1 * dt;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      });
      particles = particles.filter(p => p.life > 0);

      // hud
      ctx.fillStyle = '#111';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Score: ${score}`, 10, 20);

      if (running) requestAnimationFrame(step);
    }

    function sliceAt(x, y) {
      let sliced = 0;
      fruits = fruits.filter(f => {
        const hit = Math.hypot(f.x - x, f.y - y) <= f.r + 6;
        if (hit) {
          sliced++;
          spawnParticles(f.x, f.y, f.color);
        }
        return !hit;
      });
      if (sliced) setScore(s => s + sliced);
    }

    function getPos(evt) {
      const rect = canvas.getBoundingClientRect();
      if (evt.touches && evt.touches[0]) {
        return {
          x: evt.touches[0].clientX - rect.left,
          y: evt.touches[0].clientY - rect.top
        };
      } else {
        return { x: evt.offsetX, y: evt.offsetY };
      }
    }

    const onMove = (e) => {
      const { x, y } = getPos(e);
      sliceAt(x, y);
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove, { passive: true });

    requestAnimationFrame(step);

    return () => {
      running = false;
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchmove', onMove);
    };
  }, [score]);

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold">Fruit Cut</h2>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="border rounded"
      />
      <p className="text-sm text-gray-600">Drag your mouse or finger to slice fruits.</p>
    </div>
  );
}
