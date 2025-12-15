import { useState, useEffect, useRef } from 'react';
import axios from "axios";

export default function Game2048() {
  // State
  const [grid, setGrid] = useState(Array(4).fill().map(() => Array(4).fill(null)));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const uniqueId = useRef(1);

  // --- 1. เพิ่ม Refs สำหรับเก็บสถานะล่าสุด (เพื่อใช้ตอน Unmount) ---
  const scoreRefVal = useRef(0);      // เก็บ Score ล่าสุด
  const gameOverRef = useRef(false);  // เก็บสถานะ Game Over
  const isWonRef = useRef(false);     // เก็บสถานะ Win

  // Sync State to Refs (อัปเดต Refs ทุกครั้งที่ State เปลี่ยน)
  useEffect(() => { scoreRefVal.current = score; }, [score]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { isWonRef.current = isWon; }, [isWon]);


  // โหลด High Score
  useEffect(() => {
    const saved = localStorage.getItem('2048BestScore');
    if (saved) setBestScore(parseInt(saved));
    initGame();
  }, []);

  // Logic จับเวลา
  useEffect(() => {
    let interval = null;
    if (isActive && !gameOver && !isWon) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (gameOver || isWon) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, gameOver, isWon]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ฟังก์ชันบันทึกคะแนน
  const saveScoreToDB = async (currentScore) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.post("http://localhost:4000/api/score", 
        { 
          game: "game2048", 
          score: currentScore 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`Score saved: ${currentScore}`);
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  };

  // Trigger การบันทึก (เมื่อจบเกม หรือ ชนะ)
  useEffect(() => {
    if (gameOver) {
        setIsActive(false);
        saveScoreToDB(score);
    }
  }, [gameOver]);

  useEffect(() => {
    if (isWon) {
        setIsActive(false); 
        saveScoreToDB(score); 
    }
  }, [isWon]);

  // --- 2. เพิ่ม Logic บันทึกตอนกดออก (Unmount) ---
  useEffect(() => {
    return () => {
        // ทำงานเมื่อ Component ถูกทำลาย (กดออก / เปลี่ยนหน้า)
        // เช็คว่า: คะแนน > 0 และ เกมยังไม่จบ (เพราะถ้าจบแล้วมันบันทึกไปแล้วใน useEffect ข้างบน)
        if (scoreRefVal.current > 0 && !gameOverRef.current && !isWonRef.current) {
            console.log("Saving score on exit...");
            saveScoreToDB(scoreRefVal.current);
        }
    };
  }, []); // Empty dependency array = ทำงานตอน Mount และ Unmount เท่านั้น

  // --- Core Logic ---

  const getEmptyCells = (currentGrid) => {
    const cells = [];
    for(let r=0; r<4; r++){
        for(let c=0; c<4; c++){
            if(!currentGrid[r][c]) cells.push({r,c});
        }
    }
    return cells;
  };

  const spawnTile = (currentGrid) => {
    const empty = getEmptyCells(currentGrid);
    if(empty.length === 0) return;
    
    const {r, c} = empty[Math.floor(Math.random() * empty.length)];
    currentGrid[r][c] = {
        value: Math.random() < 0.9 ? 2 : 4,
        id: uniqueId.current++,
        isNew: true,
        isMerged: false
    };
  };

  const initGame = () => {
    const newGrid = Array(4).fill().map(() => Array(4).fill(null));
    uniqueId.current = 1;
    spawnTile(newGrid);
    spawnTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setSeconds(0); 
    setIsActive(true); 
    setGameOver(false);
    setIsWon(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
          e.preventDefault();
          const direction = e.key.replace("Arrow", "");
          moveGrid(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [grid, gameOver, isWon]);

  const rotateLeft = (g) => {
    const newG = Array(4).fill().map(() => Array(4).fill(null));
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            newG[r][c] = g[c][3-r];
        }
    }
    return newG;
  };

  const moveGrid = (dir) => {
    let newGrid = grid.map(row => row.map(tile => tile ? {...tile, isNew: false, isMerged: false} : null));
    let moved = false;
    let scoreAdd = 0;

    let rotatedGrid = newGrid;
    let rotations = 0;
    if (dir === 'Up') { rotatedGrid = rotateLeft(newGrid); rotations=1; }
    else if (dir === 'Right') { rotatedGrid = rotateLeft(rotateLeft(newGrid)); rotations=2; }
    else if (dir === 'Down') { rotatedGrid = rotateLeft(rotateLeft(rotateLeft(newGrid))); rotations=3; }

    for(let r=0; r<4; r++) {
        let row = rotatedGrid[r].filter(t => t); 
        for(let i=0; i<row.length-1; i++) {
            if(row[i].value === row[i+1].value) {
                row[i].value *= 2;
                row[i].isMerged = true;
                scoreAdd += row[i].value;
                if(row[i].value === 2048 && !isWon) setIsWon(true);
                row.splice(i+1, 1); 
            }
        }
        while(row.length < 4) row.push(null);
        if(JSON.stringify(rotatedGrid[r]) !== JSON.stringify(row)) moved = true;
        rotatedGrid[r] = row;
    }

    let finalGrid = rotatedGrid;
    for(let i=0; i < (4-rotations)%4; i++) finalGrid = rotateLeft(finalGrid);

    if(moved) {
        spawnTile(finalGrid);
        setGrid(finalGrid);
        setScore(s => {
            const ns = s + scoreAdd;
            if(ns > bestScore) { 
                setBestScore(ns); 
                localStorage.setItem('2048BestScore', ns); 
            }
            return ns;
        });
        
        if(checkGameOver(finalGrid)) setGameOver(true);
    }
  };

  const checkGameOver = (g) => {
      if(getEmptyCells(g).length > 0) return false;
      for(let r=0; r<4; r++) {
          for(let c=0; c<4; c++) {
              if(c<3 && g[r][c].value === g[r][c+1].value) return false;
              if(r<3 && g[r][c].value === g[r+1][c].value) return false;
          }
      }
      return true;
  };

  const getTileStyle = (tile) => {
    const base = "absolute flex items-center justify-center rounded-lg font-bold transition-all duration-100 shadow-sm";
    
    let colorClass = "";
    const v = tile.value;
    if(v===2) colorClass="bg-gray-200 text-gray-700";
    else if(v===4) colorClass="bg-orange-100 text-gray-800";
    else if(v===8) colorClass="bg-orange-300 text-white";
    else if(v===16) colorClass="bg-orange-400 text-white";
    else if(v===32) colorClass="bg-orange-500 text-white";
    else if(v===64) colorClass="bg-orange-600 text-white";
    else if(v>=128 && v<1024) colorClass="bg-yellow-400 text-white shadow-[0_0_10px_#eab308]";
    else if(v>=1024) colorClass="bg-yellow-600 text-white shadow-[0_0_15px_#eab308]";

    const animClass = tile.isNew ? "animate-pop" : tile.isMerged ? "animate-merge" : "";
    return `${base} ${colorClass} ${animClass} w-[90%] h-[90%] text-3xl select-none`;
  };

  const keepPlaying = () => {
      setIsWon(false);
      setIsActive(true); 
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 font-sans text-white">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-600">2048</h1>
        
        <div className="flex gap-3 text-center">
            <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg min-w-[70px]">
                <div className="text-xs font-bold text-slate-400">TIME</div>
                <div className="text-lg font-mono font-bold text-cyan-400">{formatTime(seconds)}</div>
            </div>
            
            <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg min-w-[80px]">
                <div className="text-xs font-bold text-slate-400">SCORE</div>
                <div className="text-xl font-bold text-white">{score}</div>
            </div>
            <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg min-w-[80px]">
                <div className="text-xs font-bold text-slate-400">BEST</div>
                <div className="text-xl font-bold text-yellow-400">{bestScore}</div>
            </div>
        </div>
      </div>

      {/* Game Board Wrapper */}
      <div className="flex justify-center">
        <div className="bg-[#bbada0] p-3 rounded-xl relative shadow-2xl aspect-square touch-none w-full max-w-[400px]">
            
            {/* Background Grid */}
            <div className="grid grid-cols-4 gap-3 w-full h-full absolute top-0 left-0 p-3">
                {Array(16).fill(0).map((_, i) => (
                    <div key={i} className="bg-[#cdc1b4] rounded-lg w-full h-full shadow-inner"></div>
                ))}
            </div>

            {/* Active Tiles */}
            <div className="grid grid-cols-4 gap-3 w-full h-full relative z-10">
                {grid.map((row, r) => (
                    row.map((tile, c) => (
                        <div key={`${r}-${c}`} className="w-full h-full flex items-center justify-center relative">
                            {tile && (
                                <div key={tile.id} className={getTileStyle(tile)}>
                                    {tile.value}
                                </div>
                            )}
                        </div>
                    ))
                ))}
            </div>

            {/* Overlays (Win / Lose) */}
            {(gameOver || isWon) && (
                <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl animate-fade-in z-20 text-center px-4">
                    <h2 className="text-5xl font-extrabold mb-2 text-white drop-shadow-lg">
                        {isWon ? "YOU WIN! 🎉" : "GAME OVER"}
                    </h2>
                    
                    <div className="mb-6 text-slate-300 text-lg">
                        <p>Final Score: <span className="text-white font-bold">{score}</span></p>
                        <p>Time Played: <span className="text-cyan-400 font-mono">{formatTime(seconds)}</span></p>
                    </div>
                    
                    <div className="flex gap-4">
                        {isWon && (
                            <button 
                                onClick={keepPlaying}
                                className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold text-lg rounded-full shadow-lg transition"
                            >
                                Keep Playing
                            </button>
                        )}
                        <button 
                            onClick={initGame}
                            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105 text-white font-bold text-lg rounded-full shadow-lg transition"
                        >
                            {isWon ? "New Game" : "Try Again"}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center text-sm text-slate-400">
          <p>Use <b>Arrow Keys</b> to join numbers!</p>
          <button onClick={initGame} className="text-orange-400 hover:text-orange-300 font-bold underline decoration-2 underline-offset-4">New Game</button>
      </div>

      <style>{`
          @keyframes pop {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.2); }
              100% { transform: scale(1); opacity: 1; }
          }
          @keyframes merge {
              0% { transform: scale(1); }
              50% { transform: scale(1.2); }
              100% { transform: scale(1); }
          }
          @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
          }
          .animate-pop { animation: pop 0.2s ease-in-out backwards; }
          .animate-merge { animation: merge 0.2s ease-in-out backwards; }
          .animate-fade-in { animation: fade-in 0.5s ease-in-out forwards; }
      `}</style>
    </div>
  );
}