import { useState, useEffect } from 'react';
import axios from 'axios';

// 1. กำหนดค่าคงที่สำหรับโหมด 30x30
const CONFIG = { rows: 30, cols: 30, mines: 150 };

// 2. ใช้ธีมสีม่วง (Violet) เป็นธีมหลักธีมเดียว
const THEME = {
  gradientText: 'from-violet-400 to-fuchsia-400',
  bgGradient: 'from-violet-900/20 via-slate-900 to-black',
  border: 'border-violet-500/30',
  glow: 'shadow-violet-500/20',
  iconColor: 'text-violet-400',
  buttonPrimary: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-violet-500/40',
};

export default function Minesweeper() {
  const [grid, setGrid] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [minesLeft, setMinesLeft] = useState(CONFIG.mines);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [zoom, setZoom] = useState(0.7); // Default Zoom ให้เล็กลงหน่อยเพราะกระดานใหญ่
  const [flagMode, setFlagMode] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  const saveScoreToDB = async (finalTime) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await axios.post("http://localhost:4000/api/score", 
        { game: "minesweeper", score: finalTime }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) { console.error("Failed to save score:", error); }
  };

  const initGame = () => {
    const { rows, cols, mines } = CONFIG;
    // สร้าง Grid เปล่าๆ
    let newGrid = Array(rows).fill().map(() => 
      Array(cols).fill({ 
        isMine: false, isRevealed: false, isFlagged: false, neighborCount: 0 
      })
    );
    setGrid(newGrid);
    setGameOver(false);
    setWin(false);
    setMinesLeft(mines);
    setTimer(0);
    setGameStarted(false);
  };

  const generateMines = (firstR, firstC) => {
    const { rows, cols, mines } = CONFIG;
    let newGrid = Array(rows).fill().map(() => 
        Array(cols).fill({ isMine: false, isRevealed: false, isFlagged: false, neighborCount: 0 })
    );

    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      // Safe zone รอบจุดที่คลิกครั้งแรก
      const isSafeZone = Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1;

      if (!newGrid[r][c].isMine && !isSafeZone) {
        newGrid[r][c] = { ...newGrid[r][c], isMine: true };
        minesPlaced++;
      }
    }

    // คำนวณตัวเลขรอบระเบิด
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          getNeighbors(r, c, rows, cols).forEach(([nr, nc]) => {
            if (newGrid[nr][nc].isMine) count++;
          });
          newGrid[r][c] = { ...newGrid[r][c], neighborCount: count };
        }
      }
    }
    return newGrid;
  };

  useEffect(() => {
    let interval;
    if (gameStarted && !gameOver && !win) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, win]);

  useEffect(() => {
    if (win) {
        saveScoreToDB(timer);
        const saved = localStorage.getItem('minesweeperBestTime');
        if (!saved || timer < parseInt(saved)) {
            localStorage.setItem('minesweeperBestTime', timer);
        }
    }
  }, [win]);

  const getNeighbors = (r, c, rows, cols) => {
    const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
    return directions
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols);
  };

  const revealCell = (board, r, c) => {
    if (board[r][c].isRevealed || board[r][c].isFlagged) return;
    board[r][c].isRevealed = true;
    if (board[r][c].neighborCount === 0 && !board[r][c].isMine) {
      getNeighbors(r, c, CONFIG.rows, CONFIG.cols).forEach(([nr, nc]) => {
        revealCell(board, nr, nc);
      });
    }
  };

  const checkWin = (board) => {
    for (let r = 0; r < CONFIG.rows; r++) {
      for (let c = 0; c < CONFIG.cols; c++) {
        if (!board[r][c].isMine && !board[r][c].isRevealed) return;
      }
    }
    setWin(true);
    setGameOver(true);
  };

  const handleCellClick = (r, c) => {
    if (gameOver || win) return;
    let currentGrid = [...grid];
    
    if (!gameStarted) {
        setGameStarted(true);
        currentGrid = generateMines(r, c);
    } else {
        currentGrid = JSON.parse(JSON.stringify(grid));
    }

    if (flagMode) {
      toggleFlag(r, c, currentGrid);
      setGrid(currentGrid);
      return;
    }
    if (currentGrid[r][c].isFlagged) return;

    if (currentGrid[r][c].isMine) {
      currentGrid[r][c].isRevealed = true;
      setGameOver(true);
      // เปิดเผยระเบิดทั้งหมด
      currentGrid.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
        if (cell.isMine) currentGrid[rowIndex][colIndex].isRevealed = true;
      }));
    } else {
      revealCell(currentGrid, r, c);
      checkWin(currentGrid);
    }
    setGrid(currentGrid);
  };

  const toggleFlag = (r, c, board) => {
    const cell = board[r][c];
    if (!cell.isRevealed) {
        if (cell.isFlagged) {
          cell.isFlagged = false;
          setMinesLeft(m => m + 1);
        } else {
          cell.isFlagged = true;
          setMinesLeft(m => m - 1);
        }
    }
  };

  const handleRightClick = (e, r, c) => {
    if (e) e.preventDefault();
    if (gameOver || win) return;
    const newGrid = [...grid];
    toggleFlag(r, c, newGrid);
    setGrid(newGrid);
  };

  const getNumColor = (num) => {
    const colors = ['', 'text-blue-400', 'text-emerald-400', 'text-red-400', 'text-violet-400', 'text-amber-400', 'text-pink-400', 'text-teal-400', 'text-gray-400'];
    return colors[num] || 'text-white';
  };

  return (
    <div className="w-full h-screen font-sans text-white flex flex-col overflow-hidden relative transition-all duration-700 ease-in-out bg-slate-900">
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${THEME.bgGradient} transition-all duration-1000 ease-in-out pointer-events-none z-0`} />

      {/* --- HEADER (Simplified) --- */}
      <div className="z-20 shrink-0 p-4 flex justify-center pointer-events-none">
        <div className={`pointer-events-auto flex flex-col items-center gap-3 bg-slate-900/90 backdrop-blur-xl border ${THEME.border} shadow-2xl p-4 rounded-3xl max-w-fit mx-auto`}>
            
            {/* Title & Stats */}
            <div className="flex items-center gap-6 md:gap-10 border-b border-white/5 pb-3">
                <h1 className={`text-xl md:text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${THEME.gradientText} drop-shadow-sm cursor-default`}>
                    MINESWEEPER <span className="text-xs font-normal text-slate-500 block not-italic tracking-normal">30x30 EXPERT</span>
                </h1>

                <div className="flex gap-2">
                    <div className="bg-slate-950/50 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">MINES</span>
                        <span className={`text-lg font-mono font-bold ${THEME.iconColor}`}>
                            {String(Math.max(0, minesLeft)).padStart(3, '0')}
                        </span>
                    </div>
                    <div className="bg-slate-950/50 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">TIME</span>
                        <span className="text-lg font-mono font-bold text-white">
                            {String(Math.min(999, timer)).padStart(3, '0')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center justify-center gap-2 w-full pt-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Zoom</span>
                <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-lg border border-white/5">
                    <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition">-</button>
                    <button onClick={() => setZoom(0.7)} className="text-[10px] font-mono text-slate-400 w-8 text-center hover:text-white cursor-pointer" title="Reset Zoom">{Math.round(zoom * 100)}%</button>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition">+</button>
                </div>
            </div>
        </div>
      </div>

      {/* --- GAME AREA --- */}
      <div className="flex-1 relative overflow-hidden z-10">
        <div className="absolute inset-0 overflow-auto custom-scrollbar p-4">
            <div className="min-w-full min-h-full flex items-center justify-center py-8">
                <div 
                    className={`grid gap-px bg-slate-800/80 p-3 rounded-lg shadow-2xl backdrop-blur-sm transition-transform duration-200 border-2 border-slate-700/50 ${THEME.glow}`}
                    style={{ 
                        gridTemplateColumns: `repeat(${CONFIG.cols}, 24px)`,
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center top'
                    }}
                >
                    {grid.map((row, r) => (
                        row.map((cell, c) => (
                        <div
                            key={`${r}-${c}`}
                            onClick={() => handleCellClick(r, c)}
                            onContextMenu={(e) => handleRightClick(e, r, c)}
                            className={`
                            w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer select-none transition-colors duration-75 rounded-[2px]
                            ${cell.isRevealed 
                                ? 'bg-slate-900/90 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.6)]' 
                                : `bg-slate-700 hover:bg-slate-600 border-t border-l border-white/10 border-b border-r border-black/30 hover:brightness-110` 
                            }
                            ${cell.isFlagged ? 'bg-slate-700' : ''}
                            `}
                        >
                            {cell.isRevealed ? (
                            cell.isMine ? <span className="animate-bounce drop-shadow-[0_0_5px_rgba(255,0,0,0.8)] text-base">💣</span> : 
                            (cell.neighborCount > 0 && <span className={`${getNumColor(cell.neighborCount)} drop-shadow-sm scale-110`}>{cell.neighborCount}</span>)
                            ) : (cell.isFlagged && <span className="text-red-500 drop-shadow-md text-[14px] animate-pulse">🚩</span>)}
                        </div>
                        ))
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Mobile Toggle */}
      <div className="absolute bottom-8 right-8 sm:hidden z-50">
        <button onClick={() => setFlagMode(!flagMode)} className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-xl transition-all border-4 ${flagMode ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-700 border-slate-500 text-slate-300'}`}>
          {flagMode ? '🚩' : '⛏️'}
        </button>
      </div>

      {/* Modal */}
      {(gameOver || win) && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in">
             <div className={`bg-slate-900 p-6 rounded-2xl border ${THEME.border} shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center max-w-sm w-full mx-4 relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-b ${THEME.bgGradient} opacity-20 pointer-events-none`} />
                <div className="relative z-10 flex flex-col items-center w-full">
                    <div className="text-6xl mb-3 animate-bounce drop-shadow-2xl">{win ? '🏆' : '💀'}</div>
                    <h2 className={`text-3xl font-black italic mb-2 text-transparent bg-clip-text bg-gradient-to-r ${THEME.gradientText}`}>{win ? 'CLEARED!' : 'GAME OVER'}</h2>
                    <div className="bg-black/30 rounded-lg p-3 w-full mb-4 border border-white/5 text-center backdrop-blur-md">
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Time Elapsed</p>
                        <p className="text-3xl font-mono font-bold text-white">{timer}<span className="text-sm text-slate-500 ml-1 font-sans font-normal">s</span></p>
                    </div>
                    <button onClick={initGame} className={`w-full py-3 ${THEME.buttonPrimary} text-white font-bold text-base rounded-lg shadow-lg transition-all hover:brightness-110`}>PLAY AGAIN</button>
                </div>
             </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}