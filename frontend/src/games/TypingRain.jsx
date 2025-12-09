import { useState, useEffect, useRef } from "react";

const WORDS = [
  "react",
  "node",
  "code",
  "bug",
  "data",
  "loop",
  "git",
  "java",
  "html",
  "css",
  "web",
  "app",
  "api",
  "cloud",
  "pixel",
  "byte",
  "server",
  "client",
  "logic",
  "mouse",
  "screen",
  "keyboard",
  "wifi",
  "robot",
  "future",
  "tech",
];

export default function TypingRain() {
  const [fallingWords, setFallingWords] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [input, setInput] = useState("");
  const [gameState, setGameState] = useState("START"); // START, PLAYING, GAMEOVER

  const gameStateRef = useRef("START");
  const scoreRef = useRef(0);
  const livesRef = useRef(5);
  const requestRef = useRef();
  const lastTimeRef = useRef(0);
  const spawnTimerRef = useRef(0);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  const startGame = () => {
    setScore(0);
    setLives(5);
    setFallingWords([]);
    setInput("");
    setGameState("PLAYING");

    scoreRef.current = 0;
    livesRef.current = 5;
    spawnTimerRef.current = 0;
    lastTimeRef.current = performance.now();

    cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const spawnWord = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const id = Date.now() + Math.random(); // unique id
    const x = Math.random() * 80 + 10;
    setFallingWords((prev) => [...prev, { id, text: word, x, y: -10 }]);
  };

  const gameLoop = (time) => {
    if (gameStateRef.current !== "PLAYING") return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    spawnTimerRef.current += deltaTime;
    const spawnRate = Math.max(800, 1500 - scoreRef.current * 20);

    if (spawnTimerRef.current > spawnRate) {
      spawnWord();
      spawnTimerRef.current = 0;
    }

    setFallingWords((prev) => {
      const nextWords = [];
      let livesLost = 0;

      prev.forEach((w) => {
        const speed = 0.2 + scoreRef.current * 0.005;
        const newY = w.y + speed;

        if (newY > 95) {
          livesLost++;
        } else {
          nextWords.push({ ...w, y: newY });
        }
      });

      if (livesLost > 0) {
        const newLives = livesRef.current - livesLost;
        setLives(newLives);
        if (newLives <= 0) {
          setGameState("GAMEOVER");
          cancelAnimationFrame(requestRef.current); // ✅ stop loop
        }
      }

      return nextWords;
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // ✅ เช็ค input
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const matchWord = fallingWords.find((w) => w.text === input);
    if (matchWord) {
      setFallingWords((prev) => prev.filter((w) => w.id !== matchWord.id));
      setScore((s) => s + 1);
      setInput("");
    }
  }, [input, fallingWords, gameState]);

  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-xl shadow-2xl h-[500px] w-full max-w-2xl mx-auto font-mono text-white relative overflow-hidden">
      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-center z-10 bg-slate-800/80 border-b border-slate-700">
        <h1 className="text-lg font-bold text-cyan-400">⌨️ TYPING RAIN</h1>
        <div className="flex gap-4 text-sm font-bold">
          <div className="bg-slate-700 px-3 py-1 rounded">
            Score: <span className="text-green-400">{score}</span>
          </div>
          <div className="bg-slate-700 px-3 py-1 rounded">
            Lives:{" "}
            <span className="text-red-500 text-xs">
              {"❤️".repeat(Math.max(0, lives))}
            </span>
          </div>
          <button
            onClick={startGame}
            className="ml-4 px-3 py-1 bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white font-bold rounded-full shadow-md text-xs"
          >
            🔄 Restart
          </button>
          
        </div>
      </div>

      {/* Game Area */}
      <div className="w-full h-full relative bg-slate-900/50 mt-12 mb-16 overflow-hidden">
        {fallingWords.map((w) => {
          const isMatch = w.text.startsWith(input) && input.length > 0;
          return (
            <div
              key={w.id}
              className={`absolute px-2 py-0.5 rounded border shadow-lg text-sm font-bold
                ${
                  isMatch
                    ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 scale-110"
                    : "bg-slate-800 border-slate-600 text-slate-200"
                }
              `}
              style={{ left: `${w.x}%`, top: `${w.y}%` }}
            >
              <span className="text-white">{isMatch ? input : ""}</span>
              <span className={isMatch ? "text-yellow-200 opacity-80" : ""}>
                {isMatch ? w.text.slice(input.length) : w.text}
              </span>
            </div>
          );
        })}
        <div className="absolute bottom-0 w-full h-1 bg-red-500/60 animate-pulse"></div>
      </div>

      {/* Input */}
      <div className="absolute bottom-0 w-full p-4 bg-slate-800 border-t border-slate-700 flex justify-center z-10">
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value.toLowerCase().trim())}
          placeholder={gameState === "PLAYING" ? "Type here..." : "Press Start"}
          disabled={gameState !== "PLAYING"}
          className="w-full max-w-sm bg-slate-900 border-2 border-slate-600 rounded-full px-4 py-2 text-lg text-center text-white"
        />
      </div>

      {/* Overlay */}
      {gameState !== "PLAYING" && (
        <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-20">
          {gameState === "GAMEOVER" && (
            <div className="text-center mb-6">
              <h2 className="text-4xl font-extrabold text-red-500">
                GAME OVER
              </h2>
              <p className="text-xl text-slate-300">Score: {score}</p>
            </div>
          )}
          <button
            onClick={startGame}
            className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xl rounded-full"
          >
            {gameState === "START" ? "▶ START GAME" : "🔄 TRY AGAIN"}
          </button>
          <p className="mt-4 text-slate-500 text-xs">
            Type the words before they hit the red line!
          </p>
        </div>
      )}
    </div>
  );
}
