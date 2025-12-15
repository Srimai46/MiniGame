const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');

const prisma = new PrismaClient();

// รายชื่อเกมที่ "ค่าน้อย = ดี" (Low Score Games)
const LOW_SCORE_GAMES = ['minesweeper', 'memory', 'breakout'];

// --------------------------------------------------------
// 1. GET /api/my-stats (ดึงสถิติส่วนตัว)
// --------------------------------------------------------
router.get('/my-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // ดึงทั้ง Max และ Min เตรียมไว้เลย
    const stats = await prisma.gameScore.groupBy({
      by: ['gameName'],
      where: { userId: userId },
      _max: { score: true }, // สำหรับ Snake, Dino (คะแนนมากสุด)
      _min: { score: true }, // สำหรับ Minesweeper (เวลาน้อยสุด)
      _count: { score: true }, // จำนวนครั้งที่เล่น
    });

    // จัดรูปแบบข้อมูล โดยเลือกค่าที่ดีที่สุดตามประเภทเกม
    const formattedStats = stats.map(item => {
      const game = item.gameName;
      // เช็คว่าเป็นเกมที่ต้องใช้ค่าน้อยหรือไม่?
      const isLowScoreGame = LOW_SCORE_GAMES.includes(game);

      return {
        game: game,
        // ถ้าเกมจับเวลาใช้ค่า _min, ถ้าเกมเก็บแต้มใช้ค่า _max
        bestScore: isLowScoreGame ? item._min.score : item._max.score,
        playCount: item._count.score
      };
    });

    res.json(formattedStats);
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// --------------------------------------------------------
// 2. GET /api/leaderboard/:gameName (ดึง Leaderboard ตามเกม)
// --------------------------------------------------------
router.get('/leaderboard/:gameName', async (req, res) => {
    try {
        const { gameName } = req.params;

        // เช็คว่าเกมนี้ต้องเรียงลำดับแบบไหน?
        // Minesweeper: น้อยไปมาก (asc)
        // Snake: มากไปน้อย (desc)
        const isLowScoreGame = LOW_SCORE_GAMES.includes(gameName);
        const sortOrder = isLowScoreGame ? 'asc' : 'desc';

        const leaderboard = await prisma.gameScore.findMany({
            where: { gameName }, // ตรงกับ field ใน DB
            orderBy: { score: sortOrder }, // ใช้ตัวแปร sortOrder ที่คำนวณไว้
            take: 10,
            include: {
                user: { select: { username: true } }
            }
        });
        
        // จัด Format ให้ Frontend เอาไปใช้ง่ายๆ
        const formattedLeaderboard = leaderboard.map((entry, index) => ({
             rank: index + 1,
             username: entry.user.username,
             score: entry.score,
             date: entry.playedAt
        }));

        res.json(formattedLeaderboard);
    } catch (error) {
        console.error("Leaderboard Error:", error);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});

module.exports = router;