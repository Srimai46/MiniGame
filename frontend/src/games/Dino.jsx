import { useEffect, useRef, useState } from 'react';
import axios from "axios"; // <--- 1. เพิ่ม axios

export default function Dino() {
  const canvasRef = useRef(null);
  
  // Game States
  const [gameState, setGameState] = useState('START'); // 'START', 'PLAYING', 'GAMEOVER'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Refs for Game Logic
  const scoreRef = useRef(0);
  const requestRef = useRef();

  // Load High Score on Mount
  useEffect(() => {
    const saved = localStorage.getItem('dinoHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // --- Config ---
    const GROUND_Y = 250;
    const GRAVITY = 0.6;
    const JUMP_FORCE = -11;
    
    // --- Game Variables ---
    // Dino
    let dino = { x: 50, y: GROUND_Y, w: 40, h: 40, vy: 0, isJumping: false, frame: 0 };
    
    // Obstacles
    let obstacles = [];
    
    // Background Elements (Clouds)
    let clouds = [
        { x: 100, y: 50, speed: 0.5 },
        { x: 300, y: 80, speed: 0.3 },
        { x: 500, y: 40, speed: 0.6 },
    ];

    let gameSpeed = 5;
    let lastTime = performance.now();
    let spawnTimer = 0;
    let nextSpawnTime = Math.random() * 1000 + 1500;

    // --- Functions ---

    // --- 2. ฟังก์ชันบันทึกคะแนน ---
    const saveScoreToDB = async (currentScore) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        await axios.post("http://localhost:4000/api/score", 
          { 
            game: "dino", // ชื่อเกมต้องตรงกับ DB
            score: currentScore 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Score saved:", currentScore);
      } catch (error) {
        console.error("Failed to save score:", error);
      }
    };
    // ----------------------------

    const spawnObstacle = () => {
      const type = Math.random() < 0.6 ? 'cactus' : 'bird'; 
      const isBird = type === 'bird';
      
      // Hitbox adjustment based on Emoji shape
      const h = isBird ? 30 : 45; 
      const w = isBird ? 40 : 30; 
      const y = isBird ? GROUND_Y - (Math.random() * 50 + 20) : GROUND_Y - 5; 

      obstacles.push({ x: canvas.width, y, w, h, type });
    };

    const jump = () => {
      if (!dino.isJumping) {
        dino.vy = JUMP_FORCE;
        dino.isJumping = true;
      }
    };

    // Hitbox ที่แม่นยำขึ้น (ลดขนาดกล่องเช็คลงนิดหน่อยเพื่อให้แฟร์กับผู้เล่น)
    const checkCollision = (d, o) => {
      const padding = 8; 
      return (
        d.x + padding < o.x + o.w - padding &&
        d.x + d.w - padding > o.x + padding &&
        d.y + padding < o.y + o.h - padding &&
        d.y + d.h - padding > o.y + padding
      );
    };

    const drawEmoji = (emoji, x, y, size) => {
        ctx.font = `${size}px serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(emoji, x, y);
    };

    const loop = (time) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      // --- 1. Update Logic ---
      
      // Clouds (Parallax)
      clouds.forEach(c => {
          c.x -= c.speed;
          if (c.x < -50) c.x = canvas.width;
      });

      // Dino Physics
      dino.vy += GRAVITY;
      dino.y += dino.vy;
      
      if (dino.y >= GROUND_Y) {
        dino.y = GROUND_Y;
        dino.vy = 0;
        dino.isJumping = false;
      }

      // Spawning
      spawnTimer += deltaTime;
      if (spawnTimer > nextSpawnTime) {
        spawnObstacle();
        spawnTimer = 0;
        // สูตรคำนวณ: ยิ่งเร็ว ยิ่งเกิดถี่ แต่ไม่ต่ำกว่า 600ms
        nextSpawnTime = Math.max(600, Math.random() * 1500 + 1000 - (gameSpeed * 20)); 
      }

      // Move Obstacles
      obstacles.forEach(o => o.x -= gameSpeed);
      obstacles = obstacles.filter(o => o.x + o.w > -50);

      // Collision Detection
      for (let o of obstacles) {
        if (checkCollision(dino, o)) {
          const currentScore = Math.floor(scoreRef.current);
          setScore(currentScore);
          
          // --- 3. เรียกใช้บันทึกคะแนนตรงนี้ ---
          saveScoreToDB(currentScore);
          // ---------------------------------
          
          // Update High Score
          setHighScore(prev => {
              const newHigh = Math.max(prev, currentScore);
              localStorage.setItem('dinoHighScore', newHigh);
              return newHigh;
          });

          setGameState('GAMEOVER'); 
          return; 
        }
      }

      // Score & Speed
      scoreRef.current += 0.15; 
      if (Math.floor(scoreRef.current) % 200 === 0) {
        gameSpeed += 0.02; // Speed up
      }

      // --- 2. Draw Render ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky Background (Gradient)
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#87CEEB"); // Sky Blue
      gradient.addColorStop(1, "#E0F7FA"); // Light Blue
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Clouds ☁️
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      clouds.forEach(c => {
          ctx.beginPath();
          ctx.arc(c.x, c.y, 20, 0, Math.PI * 2);
          ctx.arc(c.x + 15, c.y - 10, 25, 0, Math.PI * 2);
          ctx.arc(c.x + 35, c.y, 20, 0, Math.PI * 2);
          ctx.fill();
      });

      // Draw Ground 🏜️
      ctx.fillStyle = "#8D6E63"; // Brown Soil
      ctx.fillRect(0, GROUND_Y + 40, canvas.width, canvas.height - (GROUND_Y + 40));
      ctx.strokeStyle = "#5D4037";
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 40);
      ctx.lineTo(canvas.width, GROUND_Y + 40);
      ctx.stroke();

      // Draw Dino 🦖
      drawEmoji('🦖', dino.x, dino.y, 45);

      // Draw Obstacles
      obstacles.forEach(o => {
        if (o.type === 'bird') {
             drawEmoji('🦅', o.x, o.y, 35);
        } else {
             drawEmoji('🌵', o.x, o.y - 5, 45); // Adjust Y for cactus
        }
      });

      // Draw Score HUD
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`SCORE: ${Math.floor(scoreRef.current)}`, 20, 30);
      
      // Draw High Score HUD
      ctx.fillStyle = '#d97706'; // Amber color
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`HI: ${Math.max(Math.floor(scoreRef.current), highScore)}`, 20, 60);

      requestRef.current = requestAnimationFrame(loop);
    };

    // --- Input Handlers ---
    const handleInput = (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') || e.type === 'touchstart' || e.type === 'mousedown') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleInput);
    canvas.addEventListener('touchstart', handleInput, { passive: false });
    canvas.addEventListener('mousedown', handleInput);

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleInput);
      canvas.removeEventListener('touchstart', handleInput);
      canvas.removeEventListener('mousedown', handleInput);
    };
  }, [gameState]); // Re-run effect only when gameState changes

  const startGame = () => {
    scoreRef.current = 0;
    setGameState('PLAYING');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4 bg-slate-100 rounded-xl shadow-lg font-mono">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-black text-slate-700 tracking-wider">DINO RUN</h2>
        <div className="flex gap-4 justify-center mt-2 text-sm font-bold">
            <span className="text-slate-500">🏆 BEST: {highScore}</span>
        </div>
      </div>
      
      <div className="relative group">
        <canvas 
          ref={canvasRef} 
          width={700} 
          height={350} 
          className="border-4 border-slate-700 rounded-lg shadow-2xl bg-sky-200 cursor-pointer touch-none block max-w-full"
        />
        
        {/* Overlay Menu */}
        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in z-10">
            {gameState === 'GAMEOVER' && (
              <div className="text-center mb-6">
                <h3 className="text-5xl font-extrabold text-red-500 drop-shadow-md mb-2">GAME OVER</h3>
                <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-md">
                    <p className="text-white text-2xl font-bold">Score: {score}</p>
                    {score >= highScore && score > 0 && (
                        <p className="text-yellow-400 text-sm mt-1 animate-pulse">✨ NEW HIGH SCORE! ✨</p>
                    )}
                </div>
              </div>
            )}
            
            <button 
              onClick={startGame}
              className="group relative px-8 py-4 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl text-xl transition-all shadow-[0_4px_0_rgb(21,128,61)] hover:shadow-[0_2px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1"
            >
              {gameState === 'START' ? '▶ START GAME' : '🔄 TRY AGAIN'}
            </button>
            
            <p className="text-slate-400 text-sm mt-6">
              Press <span className="text-white font-bold border border-slate-500 px-2 py-0.5 rounded bg-slate-800">Space</span> or Click to Jump
            </p>
          </div>
        )}
      </div>
      
      {/* Decorative footer */}
      <div className="mt-4 text-slate-400 text-xs text-center">
        Tip: Watch out for the Eagles! 🦅
      </div>
    </div>
  );
}