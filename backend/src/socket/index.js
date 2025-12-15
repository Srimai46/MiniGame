// backend/src/socket/index.js

// นำเข้า Logic ของแต่ละเกม
const initTicTacToe = require('../games/tictactoe');
// const initSnake = require('../games/snake'); // ตัวอย่างสำหรับอนาคต

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // ส่ง Socket ไปให้ Logic ของเกม XO จัดการต่อ
    initTicTacToe(io, socket);

    // ถ้ามีเกมอื่น ก็เรียกใช้ตรงนี้ได้เลย
    // initSnake(io, socket);

    // Event พื้นฐานอื่นๆ (ถ้ามี)
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};