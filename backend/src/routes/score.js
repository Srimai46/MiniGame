const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');

const prisma = new PrismaClient();

// รายชื่อเกมที่ "ค่าน้อย = ดี" (เช่น เกมจับเวลา)
const LOW_SCORE_GAMES = ['minesweeper', 'memory', 'breakout'];

// ========================================================
// 1. POST: บันทึกคะแนน (Save Score)
// URL: /api/score
// ========================================================
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { game, score } = req.body;
    const userId = req.user.id;

    console.log(`Saving score for user ${userId}: ${game} -> ${score}`);

    if (!game || score === undefined) {
       return res.status(400).json({ error: "Missing game or score" });
    }

    const saved = await prisma.gameScore.create({
      data: {
        gameName: game,        // map จาก req.body.game -> db.gameName
        score: Number(score),  // แปลงเป็นตัวเลขเสมอ
        userId: userId
      }
    });

    res.json(saved);
  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ error: "Failed to save score" });
  }
});

// ========================================================
// 2. GET: สถิติส่วนตัว (My Stats)
// URL: /api/score/my-stats
// ========================================================
router.get('/my-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await prisma.gameScore.groupBy({
      by: ['gameName'],
      where: { userId: userId },
      _max: { score: true }, // เตรียมไว้สำหรับเกมแต้มเยอะ
      _min: { score: true }, // เตรียมไว้สำหรับเกมเวลาน้อย
      _count: { score: true },
    });

    const formattedStats = stats.map(item => {
      const game = item.gameName;
      const isLowScoreGame = LOW_SCORE_GAMES.includes(game);

      return {
        game: game,
        // Logic เลือก Best Score ตามประเภทเกม
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

// ========================================================
// 3. GET: ตารางอันดับ (Leaderboard)
// URL: /api/score/leaderboard/:gameName
// ========================================================
router.get('/leaderboard/:gameName', async (req, res) => {
    try {
        const { gameName } = req.params;

        // เช็ค Logic การเรียงลำดับ
        const isLowScoreGame = LOW_SCORE_GAMES.includes(gameName);
        const sortOrder = isLowScoreGame ? 'asc' : 'desc';

        const leaderboard = await prisma.gameScore.findMany({
            where: { gameName }, 
            orderBy: { score: sortOrder }, // เรียงตาม sortOrder
            take: 10,
            include: {
                user: { select: { username: true } }
            }
        });
        
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