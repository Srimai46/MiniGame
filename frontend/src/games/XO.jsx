import { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";

// เชื่อมต่อ Socket (เปลี่ยน URL ตามเครื่อง Server ของคุณ)
const socket = io(`http://${location.hostname}:4000`, {
  transports: ["websocket"],
});

const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // แนวนอน
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // แนวตั้ง
  [0, 4, 8], [2, 4, 6],             // แนวทแยง
];

// ปรับปรุงฟังก์ชันหาผู้ชนะให้คืนค่า "เส้นที่ชนะ" ด้วยเพื่อทำ Highlight
function getWinnerInfo(board) {
  for (const [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

// Bot Logic เดิม (Win -> Block -> Center -> Corner -> Random)
function botMove(board) {
  const empty = board.map((v, i) => (v ? null : i)).filter((v) => v !== null);

  const tryLine = (mark) => {
    for (const [a, b, c] of winningLines) {
      const line = [board[a], board[b], board[c]];
      const idxs = [a, b, c];
      if (line.filter((v) => v === mark).length === 2 && line.includes(null)) {
        return idxs[line.indexOf(null)];
      }
    }
    return null;
  };

  const winIdx = tryLine("O");
  if (winIdx !== null) return winIdx;
  const blockIdx = tryLine("X");
  if (blockIdx !== null) return blockIdx;
  if (empty.includes(4)) return 4;
  const corners = [0, 2, 6, 8].filter((i) => empty.includes(i));
  if (corners.length) return corners[0];
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

export default function XO() {
  const [mode, setMode] = useState("sp"); // 'mp' or 'sp' (เริ่มที่ SP ก่อนเพื่อง่ายต่อการเทส)
  const [roomId, setRoomId] = useState("");
  const [playersCount, setPlayersCount] = useState(0);
  const [joined, setJoined] = useState(false);

  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("X");
  
  // ใช้ useMemo หาผู้ชนะและเส้นที่ชนะ
  const winnerInfo = useMemo(() => getWinnerInfo(board), [board]);
  const winner = winnerInfo?.winner;
  const winningLine = winnerInfo?.line || [];

  const isDraw = useMemo(
    () => !winner && board.every(Boolean),
    [board, winner]
  );

  // --- Socket Effects ---
  useEffect(() => {
    socket.on("roomPlayers", (count) => setPlayersCount(count));
    socket.on("roomFull", () => alert("🚫 ห้องเต็มแล้วครับ"));
    
    socket.on("gameStart", ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
      setJoined(true);
    });

    socket.on("xoUpdate", ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
      // ไม่ใช้ Alert แล้ว ให้ UI จัดการแสดงผล Winner แทน
    });

    socket.on("roundEnd", () => {}); // Handle logic on server or visual only
    
    socket.on("waitingForPlayer", () => {
      setJoined(false); // หรือแสดง Status ว่ารอ
    });

    return () => {
      socket.off();
    };
  }, []);

  // --- Bot Effect ---
  useEffect(() => {
    if (mode === "sp" && turn === "O" && !winner && !isDraw) {
      // หน่วงเวลา Bot นิดหน่อยให้ดูเหมือนคิด (300ms)
      const timeout = setTimeout(() => {
        const idx = botMove(board);
        if (idx !== null) {
          const next = [...board];
          next[idx] = "O";
          setBoard(next);
          setTurn("X");
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [mode, turn, board, winner, isDraw]);

  // --- Actions ---
  const joinRoom = () => {
    if (!roomId.trim()) return;
    socket.emit("joinRoom", roomId.trim());
    setJoined(true); // Optimistic UI
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setPlayersCount(0);
    resetBoard();
  };

  const resetBoard = () => {
    if (mode === "mp") {
      socket.emit("xoRestart");
    } else {
      setBoard(Array(9).fill(null));
      setTurn("X");
    }
  };

  const playCell = (index) => {
    if (winner || isDraw || board[index]) return;

    // Single Player
    if (mode === "sp") {
      if (turn !== "X") return; // ห้ามแย่งเล่นตอนตาบอท
      const next = [...board];
      next[index] = "X";
      setBoard(next);
      setTurn("O");
      return;
    }

    // Multiplayer
    socket.emit("xoMove", { index });
  };

  // --- Render Helpers ---
  const getStatusMessage = () => {
    if (winner) return `ผู้ชนะคือ ${winner} 🎉`;
    if (isDraw) return "เสมอ! 🤝";
    if (mode === "mp" && playersCount < 2) return "รอเพื่อนเข้าห้อง...";
    return `ตาของ: ${turn}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-6 relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TIC TAC TOE
          </h1>
          <p className="text-sm text-slate-500 font-medium">Classic Game Remastered</p>
        </div>

        {/* Mode Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex text-sm font-semibold">
          <button
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === "sp" ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => { setMode("sp"); leaveRoom(); }}
          >
            🤖 เล่นกับบอท
          </button>
          <button
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === "mp" ? "bg-white shadow text-purple-600" : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setMode("mp")}
          >
            👥 ออนไลน์
          </button>
        </div>

        {/* Multiplayer Config */}
        {mode === "mp" && (
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-3">
            {!joined ? (
              <div className="flex gap-2">
                <input
                  className="flex-1 px-4 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="ใส่ชื่อห้อง..."
                />
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow transition-transform active:scale-95"
                  onClick={joinRoom}
                >
                  Join
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="text-purple-800 font-medium flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  ห้อง: {roomId} ({playersCount}/2)
                </div>
                <button
                  className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 transition"
                  onClick={leaveRoom}
                >
                  ออกห้อง
                </button>
              </div>
            )}
          </div>
        )}

        {/* Status Bar */}
        <div className={`text-center py-3 rounded-xl font-bold text-lg transition-colors ${
          winner 
            ? "bg-green-100 text-green-700 animate-pulse" 
            : isDraw 
              ? "bg-yellow-100 text-yellow-700"
              : "bg-slate-50 text-slate-700"
        }`}>
          {getStatusMessage()}
        </div>

        {/* Board */}
        <div className="relative">
            <div className="grid grid-cols-3 gap-3">
            {board.map((cell, i) => {
                const isWinningCell = winningLine.includes(i);
                const isX = cell === "X";
                return (
                <button
                    key={i}
                    className={`
                    h-24 w-full rounded-xl text-5xl font-black shadow-sm transition-all duration-200
                    flex items-center justify-center
                    ${!cell && !winner && !isDraw ? "hover:bg-slate-50 hover:shadow-inner cursor-pointer" : "cursor-default"}
                    ${isWinningCell ? (isX ? "bg-rose-100" : "bg-amber-100") : "bg-white border-2 border-slate-100"}
                    ${isX ? "text-rose-500" : "text-amber-500"}
                    ${isWinningCell ? "scale-105 shadow-lg border-transparent ring-2 ring-offset-2 ring-transparent" : ""}
                    `}
                    onClick={() => playCell(i)}
                    disabled={!!cell || !!winner || !!isDraw}
                >
                    {cell && (
                    <span className="animate-[pop_0.3s_ease-out]">
                        {cell}
                    </span>
                    )}
                </button>
                );
            })}
            </div>
            
            {/* Overlay Game Over (ถ้าจบเกมแล้ว) */}
            {(winner || isDraw) && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-10 animate-[fade_0.5s]">
                    <div className="text-center transform scale-110">
                        <div className="text-6xl mb-2">{winner ? "🏆" : "🤝"}</div>
                        <button 
                            className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-slate-900 hover:shadow-xl transition-all active:translate-y-1"
                            onClick={resetBoard}
                        >
                            เล่นใหม่อีกครั้ง
                        </button>
                    </div>
                </div>
            )}
        </div>
        
        {/* Footer info (เฉพาะตอนเล่นกับบอท) */}
        {mode === 'sp' && (
            <div className="text-center">
                 <button 
                    onClick={resetBoard}
                    className="text-sm text-slate-400 hover:text-red-500 underline decoration-dotted transition-colors"
                >
                    เริ่มกระดานใหม่ (ยอมแพ้)
                </button>
            </div>
        )}

      </div>

      {/* Custom CSS for Pop Animation */}
      <style>{`
        @keyframes pop {
          0% { transform: scale(0.5); opacity: 0; }
          80% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade {
            from { opacity: 0; }
            to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}