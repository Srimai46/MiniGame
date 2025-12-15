import { useEffect, useRef, useState } from 'react';
import axios from "axios";

export default function Breakout() {
  const canvasRef = useRef(null);
  
  // Game States
  const [gameState, setGameState] = useState('START'); // START, PLAYING, WON, GAMEOVER
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);

  // Refs for Logic
  const requestRef = useRef();
  const scoreRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem('breakoutHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Config
    const ballRadius = 8;
    const paddleHeight = 10;
    const paddleWidth = 75;
    const brickRowCount = 5;
    const brickColumnCount = 7;
    const brickWidth = 65;
    const brickHeight = 20;
    const brickPadding = 10;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 35;

    // Variables
    let x = canvas.width / 2;
    let y = canvas.height - 30;
    let dx = 4;
    let dy = -4;
    
    // กำหนดค่าเริ่มต้น paddleX แค่ครั้งแรก (ถ้าจะให้จำตำแหน่งเดิมต้องใช้ Ref แต่ใน Loop นี้ใช้ตัวแปร local ได้เพราะเราไม่ได้ reset มัน)
    let paddleX = (canvas.width - paddleWidth) / 2;
    
    let currentLives = 3;

    // Create Bricks
    const bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1, color: `hsl(${c * 40 + r * 20}, 70%, 60%)` };
      }
    }

    const saveScoreToDB = async (currentScore) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        await axios.post("http://localhost:4000/api/score", 
          { 
            game: "breakout", 
            score: currentScore 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error("Failed to save score:", error);
      }
    };

    const keyDownHandler = (e) => {
      if (e.key === 'Right' || e.key === 'ArrowRight') {
        paddleX = Math.min(paddleX + 20, canvas.width - paddleWidth);
      } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        paddleX = Math.max(paddleX - 20, 0);
      }
    };

    const mouseMoveHandler = (e) => {
      const relativeX = e.clientX - canvas.getBoundingClientRect().left;
      if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
      }
    };

    const collisionDetection = () => {
      let activeBricks = 0;
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks[c][r];
          if (b.status === 1) {
            activeBricks++;
            if (
              x > b.x &&
              x < b.x + brickWidth &&
              y > b.y &&
              y < b.y + brickHeight
            ) {
              dy = -dy;
              b.status = 0; 
              scoreRef.current += 10;
              setScore(scoreRef.current);
              
              if (scoreRef.current % 50 === 0) {
                 dx = dx > 0 ? dx + 0.5 : dx - 0.5;
                 dy = dy > 0 ? dy + 0.5 : dy - 0.5;
              }
            }
          }
        }
      }
      
      if (activeBricks === 0) {
        saveScoreToDB(scoreRef.current);
        setGameState('WON');
        cancelAnimationFrame(requestRef.current);
      }
    };

    const draw = () => {
      if (gameState !== 'PLAYING') return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Bricks
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          if (bricks[c][r].status === 1) {
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;
            ctx.beginPath();
            ctx.rect(brickX, brickY, brickWidth, brickHeight);
            ctx.fillStyle = bricks[c][r].color;
            ctx.fill();
            ctx.closePath();
          }
        }
      }

      // Draw Ball
      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15'; 
      ctx.fill();
      ctx.closePath();

      // Draw Paddle
      ctx.beginPath();
      ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
      ctx.fillStyle = '#38bdf8'; 
      ctx.fill();
      ctx.closePath();
      
      collisionDetection();

      // Ball Movement Logic
      if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
      if (y + dy < ballRadius) dy = -dy;
      else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
          let collidePoint = x - (paddleX + paddleWidth/2);
          collidePoint = collidePoint / (paddleWidth/2);
          let angle = collidePoint * (Math.PI/3); 
          let speed = Math.sqrt(dx*dx + dy*dy);
          dx = speed * Math.sin(angle);
          dy = -speed * Math.cos(angle);
        } else {
          // --- Life Lost Logic ---
          currentLives--;
          setLives(currentLives);
          
          if (currentLives === 0) {
            // Game Over
            const finalScore = scoreRef.current;
            saveScoreToDB(finalScore);
            setHighScore(prev => {
                const newHigh = Math.max(prev, finalScore);
                localStorage.setItem('breakoutHighScore', newHigh);
                return newHigh;
            });
            setGameState('GAMEOVER');
            cancelAnimationFrame(requestRef.current);
            return;
          } else {
            // Reset Ball Only (ไม่ Reset PaddleX แล้ว)
            x = canvas.width / 2;
            y = canvas.height - 30;
            dx = 4;
            dy = -4;
            // paddleX = (canvas.width - paddleWidth) / 2; <--- เอาบรรทัดนี้ออกเพื่อให้ฐานอยู่ที่เดิม
          }
        }
      }

      x += dx;
      y += dy;
      requestRef.current = requestAnimationFrame(draw);
    };

    document.addEventListener('keydown', keyDownHandler, false);
    document.addEventListener('mousemove', mouseMoveHandler, false); 
    draw();

    return () => {
      cancelAnimationFrame(requestRef.current);
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('mousemove', mouseMoveHandler);
    };
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    setGameState('PLAYING');
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 font-sans text-white">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">🧱 BREAKOUT</h1>
        <div className="flex gap-4 text-sm font-mono font-bold">
            <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700">SCORE: <span className="text-yellow-400">{score}</span></div>
            <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700">LIVES: <span className="text-red-400">{'❤️'.repeat(lives)}</span></div>
            <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700">BEST: <span className="text-green-400">{highScore}</span></div>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div className="relative border border-slate-700 rounded-xl overflow-hidden bg-slate-900 shadow-inner flex justify-center">
        <canvas
          ref={canvasRef}
          width={560}
          height={400}
          className="block cursor-none max-w-full" 
        />

        {/* Overlay */}
        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            {gameState === 'WON' && (
                <div className="text-center mb-6 animate-bounce">
                    <h2 className="text-5xl font-extrabold text-yellow-400 mb-2">YOU WIN!</h2>
                    <p className="text-slate-300">All bricks destroyed!</p>
                </div>
            )}
            {gameState === 'GAMEOVER' && (
                <div className="text-center mb-6">
                    <h2 className="text-5xl font-extrabold text-red-500 mb-2">GAME OVER</h2>
                    <p className="text-slate-300 text-xl">Final Score: {score}</p>
                </div>
            )}
            
            <button
              onClick={startGame}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-105 text-white font-bold text-2xl rounded-full shadow-lg transition"
            >
              {gameState === 'START' ? '▶ START GAME' : '🔄 PLAY AGAIN'}
            </button>
          </div>
        )}
      </div>
      <p className="mt-4 text-slate-500 text-sm text-center">Move mouse to control the paddle</p>
    </div>
  );
}