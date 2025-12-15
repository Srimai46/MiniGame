import { useEffect, useRef, useState } from 'react';
import axios from "axios"; // <--- 1. อย่าลืม import axios

// รายการผลไม้
const FRUIT_TYPES = [
  { emoji: '🍉', color: '#ff5252' }, // แตงโม
  { emoji: '🍊', color: '#ff9800' }, // ส้ม
  { emoji: '🥝', color: '#76ff03' }, // กีวี่
  { emoji: '🍎', color: '#ff1744' }, // แอปเปิ้ล
  { emoji: '🥥', color: '#fff' },    // มะพร้าว
  { emoji: '🍋', color: '#ffea00' }, // เลมอน
];

const GAME_DURATION = 60; // 60 วินาที

export default function FruitCut() {
  const canvasRef = useRef(null);
  
  // Game State
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  
  // State ควบคุมหน้าจอ
  const [gameStatus, setGameStatus] = useState('IDLE'); // IDLE, PLAYING, GAME_OVER
  
  // Refs
  const scoreRef = useRef(0);
  const missedRef = useRef(0);
  const timeRef = useRef(GAME_DURATION);
  const requestRef = useRef(null);

  // --- 2. เพิ่มฟังก์ชันบันทึกคะแนน ---
  const saveScoreToDB = async (finalScore) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.post("http://localhost:4000/api/score", 
        { 
          game: "fruitcut", // ชื่อเกมต้องตรงกับใน Database และ Config
          score: finalScore 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Score saved:", finalScore);
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  };
  // ---------------------------------

  // ฟังก์ชันเริ่มเกม
  const startGame = () => {
    scoreRef.current = 0;
    missedRef.current = 0;
    timeRef.current = GAME_DURATION;
    
    setScore(0);
    setMissed(0);
    setTimeLeft(GAME_DURATION);
    setGameStatus('PLAYING'); // เริ่มรันเกม
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    // ถ้าสถานะไม่ใช่ PLAYING ไม่ต้องรัน Loop เกม
    if (gameStatus !== 'PLAYING') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let fruits = [];
    let particles = [];
    let trail = [];
    let lastSpawn = 0;
    let lastTime = performance.now();
    let lastTimerUpdate = performance.now();

    const rand = (a, b) => Math.random() * (b - a) + a;

    function spawnFruit() {
      const type = FRUIT_TYPES[Math.floor(rand(0, FRUIT_TYPES.length))];
      const x = rand(50, rect.width - 50);
      const y = rect.height + 30;
      const size = 40;
      
      const vx = (rect.width / 2 - x) * 0.005 + rand(-1, 1);
      const vy = rand(-14, -9);
      const rot = rand(0, 360);
      const rotSpeed = rand(-0.1, 0.1);

      fruits.push({ x, y, vx, vy, size, type, rot, rotSpeed });
    }

    function spawnParticles(x, y, color) {
      for (let i = 0; i < 15; i++) {
        particles.push({ 
          x, y, vx: rand(-5, 5), vy: rand(-5, 5), life: 1.0, color, size: rand(2, 6)
        });
      }
    }

    function drawTrail() {
      if (trail.length < 2) return;
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'white';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) {
        ctx.lineWidth = 4 * (i / trail.length);
        ctx.lineTo(trail[i].x, trail[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function step(now) {
      const dt = (now - lastTime) / 16.7;
      lastTime = now;

      // Timer Logic
      if (now - lastTimerUpdate > 1000) {
        timeRef.current -= 1;
        setTimeLeft(timeRef.current);
        lastTimerUpdate = now;

        if (timeRef.current <= 0) {
          // --- 3. บันทึกคะแนนเมื่อหมดเวลา ---
          saveScoreToDB(scoreRef.current);
          // ------------------------------
          setGameStatus('GAME_OVER');
          return; 
        }
      }

      // Spawn Logic
      if (now - lastSpawn > 600) {
        spawnFruit();
        lastSpawn = now;
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Fruits Logic
      const fruitsBefore = fruits.length;
      fruits.forEach(f => {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 0.15 * dt;
        f.rot += f.rotSpeed * dt;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.type.emoji, 0, 0);
        ctx.restore();
      });

      fruits = fruits.filter(f => f.y < rect.height + 50);

      // Missed Logic
      const missedCount = fruitsBefore - fruits.length;
      if (missedCount > 0) {
        missedRef.current += missedCount;
        setMissed(missedRef.current);
      }

      // Particles Logic
      particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.2 * dt;
        p.life -= 0.03 * dt;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      particles = particles.filter(p => p.life > 0);

      // Trail Logic
      drawTrail();
      if (trail.length > 0) trail.shift();

      requestRef.current = requestAnimationFrame(step);
    }

    // Input Handling
    function sliceAt(x, y) {
      if (timeRef.current <= 0) return;
      let slicedCount = 0;
      fruits = fruits.filter(f => {
        const hit = Math.hypot(f.x - x, f.y - y) <= 35;
        if (hit) {
          slicedCount++;
          spawnParticles(f.x, f.y, f.type.color);
        }
        return !hit; 
      });

      if (slicedCount > 0) {
        scoreRef.current += slicedCount;
        setScore(scoreRef.current);
      }
    }

    const handleInput = (clientX, clientY) => {
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      trail.push({ x, y });
      if (trail.length > 12) trail.shift();
      sliceAt(x, y);
    };

    const onMouseMove = (e) => handleInput(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if(e.touches[0]) handleInput(e.touches[0].clientX, e.touches[0].clientY);
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });

    requestRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(requestRef.current);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
    };
  }, [gameStatus]); // Re-run effect when game status changes

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-slate-900 rounded-xl p-4 shadow-2xl">
      <div className="w-full max-w-[600px] relative">
        
        {/* --- Top Bar UI (แสดงเฉพาะตอนเล่น) --- */}
        {gameStatus === 'PLAYING' && (
          <div className="absolute top-4 left-0 right-0 z-10 flex justify-between px-6 animate-fade-in">
            <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-green-500/30">
              <span className="text-xl font-bold text-green-400">Score: {score}</span>
            </div>
            <div className={`px-4 py-2 rounded-full border backdrop-blur-sm font-mono text-xl font-bold ${timeLeft <= 10 ? 'bg-red-900/50 border-red-500 text-red-200 animate-pulse' : 'bg-black/50 border-white/20 text-white'}`}>
              ⏰ {formatTime(timeLeft)}
            </div>
            <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-red-500/30">
              <span className="text-xl font-bold text-red-400">Missed: {missed}</span>
            </div>
          </div>
        )}
        
        {/* --- Canvas --- */}
        <canvas
          ref={canvasRef}
          className="w-full h-[400px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-inner cursor-crosshair touch-none border-2 border-slate-700 block"
          style={{ width: '100%', height: '400px' }} 
        />
        
        {/* --- 🟢 Start Screen (หน้าเริ่มเกม) --- */}
        {gameStatus === 'IDLE' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-50">
            <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2 drop-shadow-lg">
              FRUIT CUT
            </h1>
            <p className="text-gray-300 text-lg mb-8">Slice fruits, avoid dropping them!</p>
            
            <button 
              onClick={startGame}
              className="px-10 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-2xl rounded-full shadow-lg transition transform hover:scale-105 active:scale-95"
            >
              ▶ START GAME
            </button>
          </div>
        )}

        {/* --- 🔴 Game Over Screen (หน้าจบเกม) --- */}
        {gameStatus === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-50">
            <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4 drop-shadow-lg">
              TIME'S UP!
            </h2>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 text-center space-y-2 shadow-2xl transform scale-110 mb-8">
              <p className="text-gray-400 text-lg">Final Score</p>
              <p className="text-6xl font-bold text-white mb-2">{score}</p>
              <div className="flex justify-center gap-4 text-sm text-gray-400 border-t border-slate-700 pt-3 mt-3">
                 <span>❌ Missed: <b className="text-red-400">{missed}</b></span>
                 <span>⚔️ Precision: <b className="text-green-400">{score + missed > 0 ? Math.round((score / (score + missed)) * 100) : 0}%</b></span>
              </div>
            </div>
            
            <button 
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-xl rounded-full shadow-lg transition transform hover:scale-105 active:scale-95"
            >
              🔄 Play Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}