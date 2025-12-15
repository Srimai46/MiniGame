const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

// Import Routes
const authRoutes = require("./src/routes/auth");
// const statsRoutes = require("./src/routes/stats"); // ❌ ลบทิ้งได้เลย ถ้าใช้แบบ All-in-One
const scoreRoutes = require("./src/routes/score"); // ✅ ใช้ตัวนี้ตัวเดียวจบ

const initTicTacToe = require("./src/games/tictactoe"); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*", methods: ["GET", "POST"] } 
});

// Middlewares
app.use(cors());
app.use(express.json());

// Serve Frontend
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

// --- ✅ API Routes ---
app.use("/api/auth", authRoutes);

// ✅ เปลี่ยนตรงนี้! Mount ไปที่ /api/score
// จะทำให้ URL ทั้งหมดเป็นหมวดหมู่เดียวกัน:
// 1. บันทึก: POST /api/score
// 2. สถิติฉัน: GET /api/score/my-stats
// 3. อันดับ:   GET /api/score/leaderboard/:gameName
app.use("/api/score", scoreRoutes); 


// --- ✅ Socket.io Connection ---
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  initTicTacToe(io, socket);
});

// Fallback Route
app.use((req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});