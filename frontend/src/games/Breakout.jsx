import { useEffect, useRef, useState } from 'react';

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
              b.status = 0; // Destroy brick
              scoreRef.current += 10;
              setScore(scoreRef.current);
              
              // เพิ่มความเร็วเล็กน้อยเมื่อตีโดน
              if (scoreRef.current % 50 === 0) {
                 dx = dx > 0 ? dx + 0.5 : dx - 0.5;
                 dy = dy > 0 ? dy + 0.5 : dy - 0.5;
              }
            }
          }
        }
      }
      
      if (activeBricks === 0) {
        setGameState('WON');
        cancelAnimationFrame(requestRef.current);
      }
    };

    const drawBall = () => {
      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15'; // Yellow ball
      ctx.fill();
      ctx.closePath();
    };

    const drawPaddle = () => {
      ctx.beginPath();
      ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
      ctx.fillStyle = '#38bdf8'; // Sky Blue Paddle
      ctx.fill();
      ctx.closePath();
    };

    const drawBricks = () => {
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
    };

    const draw = () => {
      if (gameState !== 'PLAYING') return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBricks();
      drawBall();
      drawPaddle();
      collisionDetection();

      // Ball Movement Logic
      if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
      }
      if (y + dy < ballRadius) {
        dy = -dy;
      } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
          // Paddle Hit Logic (เพิ่มมุมสะท้อนตามตำแหน่งที่โดนไม้)
          let collidePoint = x - (paddleX + paddleWidth/2);
          collidePoint = collidePoint / (paddleWidth/2);
          
          let angle = collidePoint * (Math.PI/3); // Max angle 60 degrees
          let speed = Math.sqrt(dx*dx + dy*dy);
          
          dx = speed * Math.sin(angle);
          dy = -speed * Math.cos(angle);
        } else {
          // Dead
          currentLives--;
          setLives(currentLives);
          if (currentLives === 0) {
            // High Score Check
            const currentScore = scoreRef.current;
            setHighScore(prev => {
                const newHigh = Math.max(prev, currentScore);
                localStorage.setItem('breakoutHighScore', newHigh);
                return newHigh;
            });
            setGameState('GAMEOVER');
            cancelAnimationFrame(requestRef.current);
            return;
          } else {
            // Reset Ball
            x = canvas.width / 2;
            y = canvas.height - 30;
            dx = 4;
            dy = -4;
            paddleX = (canvas.width - paddleWidth) / 2;
          }
        }
      }

      x += dx;
      y += dy;
      
      requestRef.current = requestAnimationFrame(draw);
    };

    // Event Listeners
    document.addEventListener('keydown', keyDownHandler, false);
    document.addEventListener('mousemove', mouseMoveHandler, false); // ใช้เมาส์เลื่อนได้

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
    <div className="bg-slate-900 flex flex-col items-center justify-center p-6 rounded-2xl shadow-2xl max-w-2xl mx-auto font-sans text-white relative">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4 px-4">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">🧱 BREAKOUT</h1>
        <div className="flex gap-4 font-mono text-sm">
            <div className="bg-slate-800 px-3 py-1 rounded border border-slate-700">SCORE: <span className="text-yellow-400">{score}</span></div>
            <div className="bg-slate-800 px-3 py-1 rounded border border-slate-700">LIVES: <span className="text-red-400">{'❤️'.repeat(lives)}</span></div>
            <div className="bg-slate-800 px-3 py-1 rounded border border-slate-700">BEST: <span className="text-green-400">{highScore}</span></div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative border-b-4 border-slate-700 rounded-lg overflow-hidden bg-slate-800 shadow-inner">
        <canvas
          ref={canvasRef}
          width={560}
          height={400}
          className="block cursor-none" // ซ่อน Cursor เวลาเล่น
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
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-2xl rounded-full shadow-lg transition transform hover:scale-105 active:scale-95"
            >
              {gameState === 'START' ? '▶ START GAME' : '🔄 PLAY AGAIN'}
            </button>
            <p className="mt-6 text-slate-500 text-sm">Move mouse to control the paddle</p>
          </div>
        )}
      </div>
    </div>
  );
}