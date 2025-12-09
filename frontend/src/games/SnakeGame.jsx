import { useEffect, useRef, useState } from 'react';

export default function Snake() {
  const canvasRef = useRef(null);
  
  // Game States
  const [gameState, setGameState] = useState('START'); // 'START', 'PLAYING', 'GAMEOVER'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Refs for Game Logic
  const scoreRef = useRef(0);
  const requestRef = useRef();
  const directionRef = useRef({ x: 1, y: 0 }); 
  const nextDirectionRef = useRef({ x: 1, y: 0 }); 

  useEffect(() => {
    const savedScore = localStorage.getItem('snakeHighScore');
    if (savedScore) setHighScore(parseInt(savedScore));
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Config
    const gridSize = 20;
    const tileCount = 20; // 400px / 20px
    const canvasSize = gridSize * tileCount;

    // Game Variables
    let snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]; 
    let food = spawnFood(snake);
    let lastTime = performance.now();
    let moveTimer = 0;
    
    // Reset Refs
    scoreRef.current = 0;
    setScore(0);
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };

    function spawnFood(currentSnake) {
      let newFood;
      while (true) {
        newFood = {
          x: Math.floor(Math.random() * tileCount),
          y: Math.floor(Math.random() * tileCount),
        };
        const isOnSnake = currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
        if (!isOnSnake) break;
      }
      return newFood;
    }

    const handleInput = (e) => {
      const key = e.code;
      changeDirection(key);
    };

    const drawGrid = () => {
        ctx.strokeStyle = '#334155'; 
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvasSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvasSize, i * gridSize);
            ctx.stroke();
        }
    };

    const loop = (time) => {
      const delta = time - lastTime;
      moveTimer += delta;
      lastTime = time;

      const currentSpeed = Math.max(80, 150 - (scoreRef.current * 2));

      if (moveTimer > currentSpeed) {
        moveTimer = 0;
        directionRef.current = nextDirectionRef.current;
        const dir = directionRef.current;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
          endGame();
          return;
        }

        if (snake.some(s => s.x === head.x && s.y === head.y)) {
            endGame();
            return;
        }

        snake.unshift(head); 

        if (head.x === food.x && head.y === food.y) {
          scoreRef.current += 1;
          setScore(scoreRef.current); 
          food = spawnFood(snake);
        } else {
          snake.pop(); 
        }
      }

      ctx.fillStyle = '#0f172a'; 
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      drawGrid();

      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f87171';
      ctx.fillStyle = '#ef4444'; 
      ctx.beginPath();
      const foodCx = food.x * gridSize + gridSize / 2;
      const foodCy = food.y * gridSize + gridSize / 2;
      ctx.arc(foodCx, foodCy, gridSize / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; 

      snake.forEach((s, index) => {
        ctx.fillStyle = index === 0 ? '#4ade80' : '#22c55e'; 
        if (index === 0) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#4ade80';
        } else {
            ctx.shadowBlur = 0;
        }
        const x = s.x * gridSize;
        const y = s.y * gridSize;
        ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
      });
      ctx.shadowBlur = 0;

      requestRef.current = requestAnimationFrame(loop);
    };

    const endGame = () => {
      const finalScore = scoreRef.current;
      setHighScore(prev => {
        const newHigh = Math.max(prev, finalScore);
        localStorage.setItem('snakeHighScore', newHigh);
        return newHigh;
      });
      setGameState('GAMEOVER');
    };

    window.addEventListener('keydown', handleInput);
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleInput);
    };
  }, [gameState]);

  const changeDirection = (key) => {
    const currentDir = directionRef.current;
    
    switch (key) {
      case 'ArrowUp':
      case 'KeyW':
        if (currentDir.y === 0) nextDirectionRef.current = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
      case 'KeyS':
        if (currentDir.y === 0) nextDirectionRef.current = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
      case 'KeyA':
        if (currentDir.x === 0) nextDirectionRef.current = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
      case 'KeyD':
        if (currentDir.x === 0) nextDirectionRef.current = { x: 1, y: 0 };
        break;
    }
  };

  const startGame = () => {
    setGameState('PLAYING');
  };

  return (
    // เปลี่ยนจาก min-h-screen เป็น py-8 และ bg-slate-800 แบบพอดีตัว
    <div className="bg-slate-800 flex flex-col items-center justify-center py-8 px-4 rounded-xl shadow-xl font-mono max-w-lg mx-auto mt-10">
      
      {/* Header */}
      <div className="mb-4 text-center w-full">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-4">
          NEON SNAKE
        </h1>
        <div className="flex justify-center gap-4 text-white text-sm font-bold">
          <div className="bg-slate-700 px-3 py-1 rounded border border-slate-600 min-w-[100px] text-center">
            SCORE: <span className="text-green-400 block text-lg">{score}</span>
          </div>
          <div className="bg-slate-700 px-3 py-1 rounded border border-slate-600 min-w-[100px] text-center">
            BEST: <span className="text-yellow-400 block text-lg">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="border-2 border-slate-600 rounded-lg bg-slate-900 shadow-lg block max-w-full h-auto"
        />

        {/* Overlay Menu */}
        {gameState !== 'PLAYING' && (
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-lg z-10 animate-fade-in">
            {gameState === 'GAMEOVER' && (
              <div className="text-center mb-4">
                <h3 className="text-4xl font-extrabold text-red-500 drop-shadow-md mb-1">GAME OVER</h3>
                <p className="text-slate-300 text-lg">Score: {score}</p>
              </div>
            )}
            
            <button
              onClick={startGame}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-full text-lg shadow-lg transition transform hover:scale-105 active:scale-95"
            >
              {gameState === 'START' ? '▶ START' : '🔄 RETRY'}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls & Info */}
      <div className="mt-6 w-full max-w-[300px]">
        {/* Mobile D-Pad */}
        <div className="grid grid-cols-3 gap-2 sm:hidden">
            <div></div>
            <button className="bg-slate-700 p-3 rounded-lg active:bg-slate-600 text-white shadow-md text-xl" onClick={() => changeDirection('ArrowUp')}>⬆️</button>
            <div></div>
            <button className="bg-slate-700 p-3 rounded-lg active:bg-slate-600 text-white shadow-md text-xl" onClick={() => changeDirection('ArrowLeft')}>⬅️</button>
            <button className="bg-slate-700 p-3 rounded-lg active:bg-slate-600 text-white shadow-md text-xl" onClick={() => changeDirection('ArrowDown')}>⬇️</button>
            <button className="bg-slate-700 p-3 rounded-lg active:bg-slate-600 text-white shadow-md text-xl" onClick={() => changeDirection('ArrowRight')}>➡️</button>
        </div>

        <p className="text-slate-500 text-xs text-center mt-2 hidden sm:block">
           Use <b className="text-slate-300">Arrows</b> or <b className="text-slate-300">WASD</b>
        </p>
      </div>
    </div>
  );
}