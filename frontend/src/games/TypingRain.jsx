import { useState, useEffect, useRef } from "react";
import axios from "axios";

const WORDS = [
  "react","node","code","bug","data","loop","git","java",
  "html","css","web","app","api","cloud","pixel","byte",
  "server","client","logic","mouse","screen","keyboard",
  "wifi","robot","future","tech","prisma","mysql","state",
  "props","hook","component","render","mount","effect"
];

// ---------------- external helper: save score ----------------
async function saveScoreToDB(finalScore) {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    await axios.post(
      "http://localhost:4000/api/score",
      { game: "typing", score: finalScore },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Score saved:", finalScore);
  } catch (err) {
    console.error("Failed to save score:", err);
  }
}
// ------------------------------------------------------------

export default function TypingRain() {
  const [renderWords, setRenderWords] = useState([]); // used for UI rendering (throttled)
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [input, setInput] = useState("");
  const [gameState, setGameState] = useState("START"); // START, PLAYING, GAMEOVER
  const [highScore, setHighScore] = useState(0);

  // Refs for stable, high-frequency state
  const wordsRef = useRef([]); // [{id, text, x, y}] positions in percent (0..100)
  const scoreRef = useRef(0);
  const livesRef = useRef(5);
  const gameStateRef = useRef("START");
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const spawnAccRef = useRef(0);

  // Render throttle control
  const lastRenderRef = useRef(0);
  const RENDER_THROTTLE_MS = 80; // update UI ~12.5 FPS (good balance)

  // config
  const START_LIVES = 5;
  const SPAWN_BASE_MS = 1500;
  const SPAWN_MIN_MS = 600;
  const SPEED_BASE = 0.02; // percent per ms (y increases)
  const SPEED_SCALE = 0.0008; // how much score affects speed
  const SPEED_MAX = 0.12; // percent per ms cap

  // load high score
  useEffect(() => {
    const saved = localStorage.getItem("typingHighScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // keep refs in sync with state where needed
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  // game over handler (cancels RAF and persists score)
  const handleGameOver = () => {
    if (gameStateRef.current !== "PLAYING") return;
    // stop loop
    cancelAnimationFrame(rafRef.current);
    // update states
    setGameState("GAMEOVER");
    gameStateRef.current = "GAMEOVER";

    const finalScore = scoreRef.current;
    setHighScore(prev => {
      const newHigh = Math.max(prev, finalScore);
      localStorage.setItem("typingHighScore", newHigh);
      return newHigh;
    });

    // save once
    saveScoreToDB(finalScore);
  };

  // spawn new word into wordsRef
  const spawnWord = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    const x = Math.random() * 80 + 10; // percent left 10..90
    // start slightly above top
    wordsRef.current.push({ id, text: word, x, y: -6 });
  };

  // Start game
  const startGame = () => {
    // reset refs & state
    wordsRef.current = [];
    setRenderWords([]);
    scoreRef.current = 0;
    setScore(0);
    livesRef.current = START_LIVES;
    setLives(START_LIVES);
    setInput("");
    setGameState("PLAYING");
    gameStateRef.current = "PLAYING";

    spawnAccRef.current = 0;
    lastTimeRef.current = performance.now();

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  };

  // handle input (immediate check against wordsRef to avoid stale state)
  const handleInputChange = (e) => {
    const valRaw = e.target.value;
    const val = valRaw.toLowerCase().trim();
    if (gameStateRef.current !== "PLAYING") {
      setInput(valRaw);
      return;
    }
    setInput(valRaw);

    if (val.length === 0) return;

    // find exact match in wordsRef (use current snapshot)
    const idx = wordsRef.current.findIndex(w => w.text === val);
    if (idx !== -1) {
      // remove matched word from ref
      const match = wordsRef.current.splice(idx, 1)[0];

      // update score (use refs then batch setState less frequently)
      scoreRef.current += 1;
      // immediate small UI update for score (fine)
      setScore(scoreRef.current);

      // clear input
      setInput("");
      // update renderWords immediately to remove matched element (avoid visible lag)
      setRenderWords(wordsRef.current.slice());
    }
  };

  // main game loop: updates positions and handles spawn/lives
  const gameLoop = (time) => {
    if (gameStateRef.current !== "PLAYING") return;

    const dt = Math.min(40, time - lastTimeRef.current); // clamp dt to avoid huge jumps
    lastTimeRef.current = time;

    // spawn logic
    spawnAccRef.current += dt;
    const spawnRate = Math.max(SPAWN_MIN_MS, SPAWN_BASE_MS - Math.floor(scoreRef.current) * 40);
    if (spawnAccRef.current >= spawnRate) {
      spawnAccRef.current = 0;
      spawnWord();
    }

    // compute per-ms speed based on score (capped)
    const perMsSpeed = Math.min(SPEED_MAX, SPEED_BASE + scoreRef.current * SPEED_SCALE);

    // update positions
    let lost = 0;
    for (let i = wordsRef.current.length - 1; i >= 0; i--) {
      const w = wordsRef.current[i];
      w.y += perMsSpeed * dt; // y in percent
      if (w.y > 95) {
        // word fell past bottom -> remove and lose life
        wordsRef.current.splice(i, 1);
        lost++;
      }
    }

    if (lost > 0) {
      // decrement lives (batch update)
      const newLives = Math.max(0, livesRef.current - lost);
      livesRef.current = newLives;
      setLives(newLives);
      setInput("");
      if (newLives <= 0) {
        // call game over in next tick to ensure all state updates flushed
        handleGameOver();
        return;
      }
    }

    // throttle render updates to reduce re-renders
    if (time - lastRenderRef.current > RENDER_THROTTLE_MS) {
      lastRenderRef.current = time;
      setRenderWords(wordsRef.current.slice()); // shallow copy for render
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // small helper to display hearts
  const hearts = (n) => "❤️".repeat(Math.max(0, n));

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 font-sans text-white relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          ⌨️ TYPING RAIN
        </h1>
        <div className="flex gap-4 text-sm font-bold font-mono">
          <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700">
            SCORE: <span className="text-cyan-400 text-lg">{score}</span>
          </div>
          <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700">
            BEST: <span className="text-yellow-400 text-lg">{highScore}</span>
          </div>
          <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700">
            LIVES: <span className="text-red-500 text-lg">{hearts(lives)}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative w-full h-[420px] bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-700">
        {/* falling words (renderWords updated throttled) */}
        {renderWords.map((w) => {
          const isPrefix = input.trim().length > 0 && w.text.startsWith(input.trim().toLowerCase());
          return (
            <div
              key={w.id}
              className={`absolute px-3 py-1 rounded-full shadow-lg text-sm font-mono font-bold transition-all duration-100
                ${isPrefix ? "bg-yellow-500/20 border border-yellow-400 text-yellow-300 scale-105 z-10" : "bg-slate-800 border border-slate-600 text-slate-300"}
              `}
              style={{ left: `${w.x}%`, top: `${w.y}%` }}
            >
              {isPrefix ? (
                <>
                  <span className="text-white">{input}</span>
                  <span className="text-yellow-200 opacity-80">{w.text.slice(input.length)}</span>
                </>
              ) : (
                <span>{w.text}</span>
              )}
            </div>
          );
        })}

        <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-red-600/0 via-red-500/80 to-red-600/0 animate-pulse z-0"></div>

        {/* Overlay */}
        {gameState !== "PLAYING" && (
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-fade-in">
            {gameState === "GAMEOVER" && (
              <div className="text-center mb-6">
                <h2 className="text-5xl font-extrabold text-red-500 mb-2 drop-shadow-md">GAME OVER</h2>
                <p className="text-xl text-slate-300">Final Score: <span className="text-white font-bold">{score}</span></p>
              </div>
            )}

            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:scale-105 text-white font-bold text-xl rounded-full shadow-lg transition transform active:scale-95"
            >
              {gameState === "START" ? "▶ START GAME" : "🔄 TRY AGAIN"}
            </button>

            <p className="mt-6 text-slate-500 text-sm">Type the words before they hit the red line!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-4 relative">
        <input
          autoFocus
          value={input}
          onChange={handleInputChange}
          placeholder={gameState === "PLAYING" ? "Type here..." : "Press Start"}
          disabled={gameState !== "PLAYING"}
          className="w-full bg-slate-900 border-2 border-slate-600 rounded-full px-6 py-3 text-xl text-center text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono shadow-lg"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm hidden sm:block pointer-events-none">⌨️</div>
      </div>
    </div>
  );
}
