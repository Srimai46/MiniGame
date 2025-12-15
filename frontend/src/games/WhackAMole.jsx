import { useState, useEffect, useRef } from 'react';
import axios from "axios"; // 1. Import axios

export default function WhackAMole() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeHole, setActiveHole] = useState(null);
  
  // State สำหรับ Best Score
  const [bestScore, setBestScore] = useState(0);

  const timerRef = useRef(null);
  const moleTimerRef = useRef(null);

  const holes = Array(9).fill(null);

  // โหลดสถิติจาก LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('whackBestScore');
    if (saved) setBestScore(parseInt(saved));
  }, []);

  // --- 2. ฟังก์ชันบันทึกคะแนนลง DB ---
  const saveScoreToDB = async (finalScore) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.post("http://localhost:4000/api/score", 
        { 
          game: "whackamole", // ชื่อเกมสำหรับ DB
          score: finalScore 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Score saved:", finalScore);
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  };

  // เริ่มเกม
  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setActiveHole(null);
    
    // เริ่ม Loop ผี (รอแป๊บหนึ่งค่อยโผล่ตัวแรก)
    setTimeout(() => {
        nextMole();
    }, 500);
  };

  // Logic สุ่มผี
  const nextMole = () => {
    // เช็คค่าจาก ref หรือ state ไม่ได้แม่นยำใน setTimeout closure เสมอไป 
    // ดังนั้นจะเช็คที่ useEffect หลักแทน หรือเช็ค condition ง่ายๆ
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);

    const randomTime = Math.random() * 700 + 400; // เร็วขึ้นนิดหน่อย
    const randomHole = Math.floor(Math.random() * holes.length);

    setActiveHole(randomHole);

    moleTimerRef.current = setTimeout(() => {
      setActiveHole(null);
      // เรียกตัวเองซ้ำถ้ายังเล่นอยู่ (Logic นี้จะถูก control โดย useEffect ด้านล่างอีกทีเพื่อความชัวร์)
    }, randomTime);
  };

  // Loop ของเกม: เรียกผีตัวต่อไปเมื่อตัวเก่าหายไป และยังไม่หมดเวลา
  useEffect(() => {
    if (isPlaying && activeHole === null && timeLeft > 0) {
        // รอแป๊บนึงแล้วสุ่มตัวใหม่
        const timeout = setTimeout(nextMole, 200); 
        return () => clearTimeout(timeout);
    }
  }, [activeHole, isPlaying, timeLeft]);

  // จับเวลาถอยหลัง & จบเกม
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isPlaying && timeLeft === 0) {
      // --- จบเกม ---
      setIsPlaying(false);
      setActiveHole(null);
      clearTimeout(moleTimerRef.current);
      
      // บันทึกคะแนน
      saveScoreToDB(score);

      // อัปเดต Best Score (ยิ่งมากยิ่งดี)
      setBestScore(prev => {
        const newBest = score > prev ? score : prev;
        localStorage.setItem('whackBestScore', newBest);
        return newBest;
      });
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, timeLeft, score]);

  // ฟังก์ชันตี
  const whack = (index) => {
    if (!isPlaying) return;
    if (index === activeHole) {
      setScore(s => s + 1);
      setActiveHole(null); // ผีหายทันที
      // useEffect จะทำงานต่อเพื่อเรียกตัวใหม่เอง
    }
  };

  return (
    // Wrapper UI แบบเดียวกับ Memory Game
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 font-sans text-white relative overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          WHACK A GHOST
        </h1>
        
        {/* Stats */}
        <div className="flex gap-4 text-sm font-bold">
            <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700 flex flex-col items-center min-w-[70px]">
                <span className="text-xs text-slate-400">SCORE</span>
                <span className="text-pink-400 text-lg">{score}</span>
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700 flex flex-col items-center min-w-[70px]">
                 <span className="text-xs text-slate-400">TIME</span>
                 <span className={`text-lg ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-purple-300'}`}>
                    {timeLeft}s
                 </span>
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700 flex flex-col items-center min-w-[70px]">
                <span className="text-xs text-slate-400">BEST</span>
                <span className="text-yellow-400 text-lg">{bestScore}</span>
            </div>
        </div>
      </div>

      {/* Game Area Container */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-inner flex justify-center">
        <div className="grid grid-cols-3 gap-4">
            {holes.map((_, i) => (
            <div 
                key={i}
                onClick={() => whack(i)}
                className="w-24 h-24 sm:w-28 sm:h-28 relative flex items-end justify-center overflow-hidden cursor-pointer group"
            >
                {/* หลุม (Style แบบ Portal/Dark) */}
                <div className="absolute bottom-0 w-full h-1/3 bg-slate-800 rounded-[50%] border-b-2 border-slate-600 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.5)]"></div>
                <div className="absolute bottom-1 w-[80%] h-1/4 bg-black blur-md opacity-60"></div>

                {/* ตัวผี */}
                <div 
                    className={`text-6xl transition-all duration-150 ease-out transform select-none ${
                    activeHole === i 
                        ? "translate-y-2 scale-110 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                        : "translate-y-32 scale-50 opacity-0"
                    }`}
                >
                    👻
                </div>

                {/* Effect ตอน Hover (ถ้ายังไม่ตี) */}
                <div className="absolute inset-0 rounded-full hover:bg-white/5 transition-colors pointer-events-none"></div>
            </div>
            ))}
        </div>
      </div>

      {/* Overlay: Start / Game Over */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-2xl animate-fade-in">
          {timeLeft === 0 && (
              <>
                <div className="text-5xl mb-2 animate-bounce">💀</div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-2">
                    GAME OVER
                </h2>
                <p className="text-slate-300 mb-6 text-xl">
                    Score: <span className="text-white font-bold">{score}</span>
                </p>
              </>
          )}
          
          {timeLeft === 30 && (
             <div className="mb-6 text-center">
                <div className="text-5xl mb-4">👻</div>
                <h2 className="text-3xl font-bold text-white">Ready to Hunt?</h2>
             </div>
          )}

          <button 
            onClick={startGame}
            className="px-10 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 text-white font-bold text-xl rounded-full shadow-lg transition active:scale-95"
          >
            {timeLeft === 0 ? "Replay" : "Start Game"}
          </button>
        </div>
      )}

       {/* CSS for custom animation */}
       <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-in-out forwards; }
      `}</style>
    </div>
  );
}