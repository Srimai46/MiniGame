import { useEffect, useRef, useState } from 'react';

export default function Dino() {
  const canvasRef = useRef(null);
  
  // ใช้ State แค่จัดการสถานะเกมและคะแนนตอนจบ (เพื่อไม่ให้ Re-render บ่อย)
  const [gameState, setGameState] = useState('START'); // 'START', 'PLAYING', 'GAMEOVER'
  const [finalScore, setFinalScore] = useState(0);

  // ใช้ Ref เก็บค่าต่างๆ ที่เปลี่ยนแปลงตลอดเวลาใน Game Loop
  const scoreRef = useRef(0);
  const requestRef = useRef();

  useEffect(() => {
    // ถ้าสถานะไม่ใช่ PLAYING ให้จบ useEffect นี้ไปเลย (ไม่รัน Loop)
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // --- Config ---
    const GROUND_Y = 250;
    const GRAVITY = 0.6;
    const JUMP_FORCE = -10;
    
    // --- Game Variables (Local Scope) ---
    // ตัวแปรพวกนี้อยู่ใน Scope ของ useEffect นี้เท่านั้น ไม่ต้องใช้ useRef ก็ได้เพราะมันจะถูกสร้างใหม่เมื่อเริ่มเกม
    let dino = { x: 50, y: GROUND_Y, w: 40, h: 40, vy: 0, isJumping: false };
    let obstacles = [];
    let gameSpeed = 4;
    let lastTime = performance.now();
    let spawnTimer = 0;
    let nextSpawnTime = Math.random() * 1000 + 1500; // สุ่มเวลาเกิด 1.5 - 2.5 วิ

    // --- Functions ---
    const spawnObstacle = () => {
      const type = Math.random() < 0.5 ? 'cactus' : 'bird'; // 50/50 Chance
      const isBird = type === 'bird';
      const h = isBird ? 30 : 40; 
      const w = 20;
      const y = isBird ? GROUND_Y - 50 : GROUND_Y; // นกบินสูงกว่า

      obstacles.push({ x: canvas.width, y, w, h, type });
    };

    const jump = () => {
      if (!dino.isJumping) {
        dino.vy = JUMP_FORCE;
        dino.isJumping = true;
      }
    };

    const checkCollision = (rect1, rect2) => {
      return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y
      );
    };

    const loop = (time) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      // 1. Logic Update
      
      // Dino Physics
      dino.vy += GRAVITY;
      dino.y += dino.vy;
      
      // Ground check
      if (dino.y >= GROUND_Y) {
        dino.y = GROUND_Y;
        dino.vy = 0;
        dino.isJumping = false;
      }

      // Obstacle Spawning (Randomized)
      spawnTimer += deltaTime;
      if (spawnTimer > nextSpawnTime) {
        spawnObstacle();
        spawnTimer = 0;
        nextSpawnTime = Math.random() * 1500 + 1000 - (gameSpeed * 10); // ยิ่งเร็วยิ่งมาถี่
      }

      // Update Obstacles & Remove off-screen
      obstacles.forEach(o => o.x -= gameSpeed);
      obstacles = obstacles.filter(o => o.x + o.w > 0);

      // Check Collision
      for (let o of obstacles) {
        if (checkCollision(dino, o)) {
          setFinalScore(Math.floor(scoreRef.current)); // Save score to State
          setGameState('GAMEOVER'); // Trigger React Re-render
          return; // Stop Loop
        }
      }

      // Update Score & Speed
      scoreRef.current += 0.1; // เพิ่มทีละนิดให้ดูไหลลื่น
      if (Math.floor(scoreRef.current) % 100 === 0) {
        gameSpeed += 0.005; // ค่อยๆ เร็วขึ้น
      }

      // 2. Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Ground
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 40);
      ctx.lineTo(canvas.width, GROUND_Y + 40);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Dino
      ctx.fillStyle = '#4CAF50'; // Green Dino
      ctx.fillRect(dino.x, dino.y, dino.w, dino.h);

      // Draw Obstacles
      obstacles.forEach(o => {
        ctx.fillStyle = o.type === 'bird' ? '#2196F3' : '#f44336'; // Blue Bird, Red Cactus
        ctx.fillRect(o.x, o.y, o.w, o.h);
      });

      // Draw Score (On Canvas - Efficient!)
      ctx.fillStyle = '#333';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, 10, 30);

      requestRef.current = requestAnimationFrame(loop);
    };

    // --- Input Handlers ---
    const handleInput = (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') || e.type === 'click') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleInput);
    canvas.addEventListener('click', handleInput); // Support Click

    // Start Loop
    requestRef.current = requestAnimationFrame(loop);

    // Cleanup
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleInput);
      canvas.removeEventListener('click', handleInput);
    };
  }, [gameState]); // Re-run effect only when gameState changes

  const startGame = () => {
    scoreRef.current = 0;
    setGameState('PLAYING');
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="text-2xl font-bold text-gray-800">🦖 Super Dino Run</h2>
      
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={320} 
          className="border-2 border-gray-400 rounded-lg bg-gray-100 shadow-md cursor-pointer"
        />
        
        {/* Overlay Menu */}
        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
            {gameState === 'GAMEOVER' && (
              <div className="text-center mb-4">
                <h3 className="text-3xl font-bold text-red-500">GAME OVER</h3>
                <p className="text-white text-xl">Score: {finalScore}</p>
              </div>
            )}
            <button 
              onClick={startGame}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full text-lg transition shadow-lg"
            >
              {gameState === 'START' ? 'Start Game' : 'Try Again'}
            </button>
          </div>
        )}
      </div>

      <p className="text-gray-500 text-sm">
        Press <span className="font-bold border px-1 rounded">Space</span> or Click to Jump
      </p>
    </div>
  );
}