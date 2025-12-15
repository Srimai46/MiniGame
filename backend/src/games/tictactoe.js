// src/games/tictactoe.js

const rooms = {}; // roomId: { players: [], board, turn, started, starter }

function initGame(io, socket) {
  // 1. Join Room
  socket.on("joinRoom", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        board: Array(9).fill(null),
        turn: "X",
        started: false,
        starter: "X",
      };
    }
    const room = rooms[roomId];
    socket.data.roomId = roomId; // เก็บ Room ID ไว้ใน Socket

    if (room.players.length >= 2) {
      socket.emit("roomFull", roomId);
      return;
    }

    room.players.push(socket.id);
    socket.join(roomId);
    io.to(roomId).emit("roomPlayers", room.players.length);

    if (room.players.length === 2 && !room.started) {
      room.started = true;
      io.to(roomId).emit("gameStart", { board: room.board, turn: room.turn });
    }
  });

  // 2. Move Logic
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
        // Reset Logic หลังจบเกม (Optional: อาจจะรอ user กดเริ่มใหม่ก็ได้)
        // room.started = false; 
    }
  });

  // 3. Restart Game
  socket.on("xoRestart", () => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room) return;

    room.starter = room.starter === "X" ? "O" : "X";
    room.board = Array(9).fill(null);
    room.turn = room.starter;
    room.started = true;

    io.to(roomId).emit("gameStart", { board: room.board, turn: room.turn });
  });

  // 4. Leave Room & Disconnect Logic
  const handleLeave = () => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room) return;

    const idx = room.players.indexOf(socket.id);
    if (idx !== -1) room.players.splice(idx, 1);
    
    io.to(roomId).emit("roomPlayers", room.players.length);
    
    if (room.players.length === 0) {
        delete rooms[roomId];
    } else {
        room.started = false;
        room.board = Array(9).fill(null); // Reset board if someone leaves
        io.to(roomId).emit("waitingForPlayer");
    }
  };

  socket.on("leaveRoom", () => {
      handleLeave();
      socket.leave(socket.data.roomId);
  });
  
  socket.on("disconnect", handleLeave);
}

// Helper Function
function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

module.exports = initGame;