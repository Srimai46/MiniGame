import { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";

const socket = io(`http://${location.hostname}:4000`, {
  transports: ["websocket"],
});

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinner(board) {
  for (const [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return board[a];
  }
  return null;
}

// Simple bot: win if possible, block if needed, else center, corner, random
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

  // Win
  const winIdx = tryLine("O");
  if (winIdx !== null) return winIdx;
  // Block
  const blockIdx = tryLine("X");
  if (blockIdx !== null) return blockIdx;
  // Center
  if (empty.includes(4)) return 4;
  // Corner preference
  const corners = [0, 2, 6, 8].filter((i) => empty.includes(i));
  if (corners.length) return corners[0];
  // Random
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

export default function XO() {
  const [mode, setMode] = useState("mp"); // 'mp' or 'sp'
  const [roomId, setRoomId] = useState("");
  const [playersCount, setPlayersCount] = useState(0);
  const [joined, setJoined] = useState(false);

  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("X");
  const winner = useMemo(() => getWinner(board), [board]);
  const isDraw = useMemo(
    () => !winner && board.every(Boolean),
    [board, winner]
  );

  useEffect(() => {
    socket.on("roomPlayers", (count) => setPlayersCount(count));
    socket.on("roomFull", () => alert("Room is full"));
    socket.on("gameStart", ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
      setJoined(true);
    });
    socket.on("xoUpdate", ({ board, turn, winner, isDraw }) => {
      setBoard(board);
      setTurn(turn);
      if (winner) alert(`Winner: ${winner}`);
      if (isDraw) alert("Draw!");
    });
    socket.on("roundEnd", () => {
      // Round ended; waiting or auto start will be handled by server
    });
    socket.on("waitingForPlayer", () => {
      setJoined(false);
    });
    return () => {
      socket.off();
    };
  }, []);

  useEffect(() => {
    if (mode === "sp" && turn === "O" && !winner && !isDraw) {
      const idx = botMove(board);
      if (idx !== null) {
        const next = [...board];
        next[idx] = "O";
        setBoard(next);
        setTurn("X");
      }
    }
  }, [mode, turn, board, winner, isDraw]);

  const joinRoom = () => {
    if (!roomId.trim()) return;
    socket.emit("joinRoom", roomId.trim());
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setPlayersCount(0);
    resetBoard();
  };

  const resetBoard = () => {
    if (mode === "mp") {
      socket.emit("xoRestart"); // ✅ บอก server ให้รีเซ็ตทั้งห้อง
    } else {
      setBoard(Array(9).fill(null));
      setTurn("X");
    }
  };

  const playCell = (index) => {
    if (winner || isDraw || board[index]) return;

    if (mode === "sp") {
      if (turn !== "X") return;
      const next = [...board];
      next[index] = "X";
      setBoard(next);
      setTurn("O");
      return;
    }

    // multiplayer
    socket.emit("xoMove", { index });
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">XO Game</h2>

      <div className="flex gap-2">
        <button
          className={`btn ${mode === "mp" ? "bg-blue-600" : "bg-gray-600"}`}
          onClick={() => setMode("mp")}
        >
          Multiplayer
        </button>
        <button
          className={`btn ${mode === "sp" ? "bg-blue-600" : "bg-gray-600"}`}
          onClick={() => {
            setMode("sp");
            leaveRoom();
          }}
        >
          Single Player
        </button>
      </div>

      {mode === "mp" && (
        <div className="card space-y-2">
          <div className="flex gap-2">
            <input
              className="border p-2 flex-1"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Room ID"
            />
            {!joined ? (
              <button className="btn" onClick={joinRoom}>
                Join
              </button>
            ) : (
              <button
                className="btn bg-red-600 hover:bg-red-700"
                onClick={leaveRoom}
              >
                Leave
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Players: {playersCount}{" "}
            {playersCount < 2 ? "(waiting...)" : "(ready)"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 w-72 mx-auto">
        {board.map((cell, i) => (
          <button
            key={i}
            className="h-24 border text-3xl flex items-center justify-center hover:bg-gray-100"
            onClick={() => playCell(i)}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="text-center">
        {!winner && !isDraw ? <p>Turn: {turn}</p> : null}
        {winner ? <p className="font-semibold">Winner: {winner}</p> : null}
        {isDraw && <p className="font-semibold">Draw!</p>}
        <button className="btn mt-2" onClick={resetBoard}>
          ยอมแพ้และเริ่มใหม่
        </button>
      </div>
    </div>
  );
}
