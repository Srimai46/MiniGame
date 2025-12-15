import { useEffect, useRef, useState } from 'react';
import axios from "axios";

export default function Snake() {
  const canvasRef = useRef(null);

  const [gameState, setGameState] = useState("START");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const scoreRef = useRef(0);
  const requestRef = useRef();
  const directionRef = useRef({ x: 1, y: 0 });
  const nextDirectionRef = useRef({ x: 1, y: 0 });

  // โหลดสถิติ
  useEffect(() => {
    const saved = localStorage.getItem("snakeHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const grid = 20;
    const count = 20;
    const size = grid * count;

    let snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];

    let food = spawnFood(snake);
    let lastTime = performance.now();
    let moveTimer = 0;

    scoreRef.current = 0;
    setScore(0);
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };

    function spawnFood(snakeBody) {
      let f;
      while (true) {
        f = {
          x: Math.floor(Math.random() * count),
          y: Math.floor(Math.random() * count),
        };
        if (!snakeBody.some(s => s.x === f.x && s.y === f.y)) break;
      }
      return f;
    }

    const saveScoreToDB = async (score) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        await axios.post(
          "http://localhost:4000/api/score",
          { game: "snake", score },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        console.error("SAVE ERROR", e);
      }
    };

    const inputHandler = (e) => changeDir(e.code);

    const loop = (time) => {
      const delta = time - lastTime;
      lastTime = time;
      moveTimer += delta;

      const speed = Math.max(70, 150 - scoreRef.current * 2);

      if (moveTimer >= speed) {
        moveTimer = 0;

        directionRef.current = nextDirectionRef.current;

        const dir = directionRef.current;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        // ชนกำแพง or ตัวเอง → Game Over
        if (
          head.x < 0 ||
          head.x >= count ||
          head.y < 0 ||
          head.y >= count ||
          snake.some(s => s.x === head.x && s.y === head.y)
        ) {
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

      // Clear
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, size, size);

      // Food
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(
        food.x * grid + grid / 2,
        food.y * grid + grid / 2,
        grid / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Snake
      ctx.shadowBlur = 0;
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? "#4ade80" : "#22c55e";
        ctx.fillRect(s.x * grid + 1, s.y * grid + 1, grid - 2, grid - 2);
      });

      requestRef.current = requestAnimationFrame(loop);
    };

    const endGame = () => {
      const sc = scoreRef.current;

      saveScoreToDB(sc);

      setHighScore(prev => {
        const newHigh = Math.max(prev, sc);
        localStorage.setItem("snakeHighScore", newHigh);
        return newHigh;
      });

      setGameState("GAMEOVER");
    };

    window.addEventListener("keydown", inputHandler);
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener("keydown", inputHandler);
    };
  }, [gameState]);

  const changeDir = (key) => {
    const c = directionRef.current;

    if (["ArrowUp", "KeyW"].includes(key) && c.y === 0)
      nextDirectionRef.current = { x: 0, y: -1 };

    else if (["ArrowDown", "KeyS"].includes(key) && c.y === 0)
      nextDirectionRef.current = { x: 0, y: 1 };

    else if (["ArrowLeft", "KeyA"].includes(key) && c.x === 0)
      nextDirectionRef.current = { x: -1, y: 0 };

    else if (["ArrowRight", "KeyD"].includes(key) && c.x === 0)
      nextDirectionRef.current = { x: 1, y: 0 };
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 font-mono text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
          NEON SNAKE
        </h1>

        <div className="flex gap-4 text-sm font-bold">
          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
            SCORE: <span className="text-green-400">{score}</span>
          </div>
          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
            BEST: <span className="text-yellow-400">{highScore}</span>
          </div>
        </div>
      </div>

      {/* GAME CANVAS */}
      <div className="relative bg-slate-900 rounded-xl border border-slate-700 p-2 shadow-inner flex justify-center">
        <canvas ref={canvasRef} width={400} height={400} className="rounded-lg" />

        {/* OVERLAY */}
        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
            {gameState === "GAMEOVER" && (
              <>
                <p className="text-4xl font-extrabold text-red-500 mb-2">GAME OVER</p>
                <p className="text-gray-300 mb-4">Final Score: {score}</p>
              </>
            )}

            <button
              onClick={() => setGameState("PLAYING")}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-full shadow-lg hover:scale-105 transition">
              {gameState === "START" ? "▶ START GAME" : "🔄 TRY AGAIN"}
            </button>
          </div>
        )}
      </div>

      <p className="text-slate-500 text-xs text-center mt-4">Use Arrows / WASD to move</p>
    </div>
  );
}
