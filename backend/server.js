const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve frontend build
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

// ✅ ใช้ app.use แทน app.get('*') เพื่อรองรับ Express v5
app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// In-memory room state
const rooms = {}; // roomId: { players: [socketId], board, turn, started }

io.on("connection", (socket) => {
  socket.on("joinRoom", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        board: Array(9).fill(null),
        turn: "X",
        started: false,
        starter: "X"
      };
    }
    const room = rooms[roomId];

    // เก็บ roomId ไว้กับ socket
    socket.data.roomId = roomId;

    // Prevent more than 2 players
    if (room.players.length >= 2) {
      socket.emit("roomFull", roomId);
      return;
    }

    room.players.push(socket.id);
    socket.join(roomId);

    io.to(roomId).emit("roomPlayers", room.players.length);

    // Start game when 2 players
    if (room.players.length === 2 && !room.started) {
      room.started = true;
      io.to(roomId).emit("gameStart", { board: room.board, turn: room.turn });
    }
  });

  socket.on("xoMove", ({ index }) => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room || !room.started) return;

    const playerIndex = room.players.indexOf(socket.id);
    const playerMark = playerIndex === 0 ? "X" : "O";
    if (playerMark !== room.turn) return;
    if (index < 0 || index > 8 || room.board[index]) return;

    room.board[index] = playerMark;
    room.turn = room.turn === "X" ? "O" : "X";

    const winner = checkWinner(room.board);
    const isDraw = !winner && room.board.every((c) => c);

    io.to(roomId).emit("xoUpdate", {
      board: room.board,
      turn: room.turn,
      winner,
      isDraw,
    });

    if (winner || isDraw) {
      room.board = Array(9).fill(null);
      room.starter = room.starter === "X" ? "O" : "X";
      room.turn = room.starter;
      room.started = false;
      io.to(roomId).emit("roundEnd", { winner, isDraw });
      if (room.players.length === 2) {
        room.started = true;
        io.to(roomId).emit("gameStart", {
          board: room.board,
          turn: room.turn,
        });
      }
    }
  });

  // ✅ แก้ xoRestart ให้เริ่มใหม่ทันที
  socket.on("xoRestart", () => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room) return;

    // ✅ สลับ starter
  room.starter = room.starter === "X" ? "O" : "X";

    // ✅ รีเซ็ตกระดานและเริ่มใหม่ทันที
    room.board = Array(9).fill(null);
    room.turn = room.starter;;
    room.started = true;

    io.to(roomId).emit("gameStart", { board: room.board, turn: room.turn });
  });

  socket.on("leaveRoom", () => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room) return;

    const idx = room.players.indexOf(socket.id);
    if (idx !== -1) room.players.splice(idx, 1);
    socket.leave(roomId);
    io.to(roomId).emit("roomPlayers", room.players.length);
    if (room.players.length < 2) {
      room.started = false;
      io.to(roomId).emit("waitingForPlayer");
    }
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room) return;

    const idx = room.players.indexOf(socket.id);
    if (idx !== -1) room.players.splice(idx, 1);
    io.to(roomId).emit("roomPlayers", room.players.length);
    if (room.players.length === 0) delete rooms[roomId];
    else {
      room.started = false;
      io.to(roomId).emit("waitingForPlayer");
    }
  });
});

function checkWinner(b) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b2, c] of lines) {
    if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a];
  }
  return null;
}

const PORT = 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
