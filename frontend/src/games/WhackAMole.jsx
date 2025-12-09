import { useState, useEffect, useRef } from 'react';

export default function WhackAMole() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // เวลา 30 วินาที
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeHole, setActiveHole] = useState(null); // ช่องที่มีผีโผล่
  const timerRef = useRef(null);
  const moleTimerRef = useRef(null);

  const holes = Array(9).fill(null); // สร้างหลุม 9 หลุม

  // ฟังก์ชันเริ่มเกม
  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setActiveHole(null);
    nextMole(); // เริ่มปล่อยผี
  };

  // ฟังก์ชันสุ่มหลุม
  const nextMole = () => {
    if (!isPlaying && timeLeft <= 0) return;

    // สุ่มเวลาที่จะโผล่ (0.5 - 1.2 วินาที)
    const randomTime = Math.random() * 700 + 500;
    const randomHole = Math.floor(Math.random() * holes.length);

    setActiveHole(randomHole);

    // ตั้งเวลาให้ผีหายไปแล้วโผล่ใหม่
    moleTimerRef.current = setTimeout(() => {
      setActiveHole(null);
      if (timeLeft > 0) nextMole();
    }, randomTime);
  };

  // จับเวลาถอยหลัง
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
      setActiveHole(null);
      clearTimeout(moleTimerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, timeLeft]);

  // ฟังก์ชันตีผี
  const whack = (index) => {
    if (!isPlaying) return;
    if (index === activeHole) {
      setScore(s => s + 1);
      setActiveHole(null); // ตีโดนแล้วหายไปทันที
      clearTimeout(moleTimerRef.current); // ยกเลิกเวลาเดิม
      nextMole(); // เรียกตัวต่อไปทันที (เกมจะเร็วขึ้น)
    }
  };

  return (
    // ปรับ Container ให้ขนาดกะทัดรัด ไม่เต็มจอ
    <div className="bg-green-900 flex flex-col items-center justify-center p-6 font-sans text-white rounded-2xl shadow-2xl max-w-xl mx-auto mt-8 relative overflow-hidden">
      <h1 className="text-3xl font-extrabold text-yellow-400 mb-4 drop-shadow-md">🔨 WHACK A GHOST</h1>
      
      <div className="flex gap-6 text-lg font-bold mb-6">
        <div className="bg-white/20 px-3 py-1.5 rounded-lg border border-white/30">
          Score: <span className="text-yellow-300">{score}</span>
        </div>
        <div className="bg-white/20 px-3 py-1.5 rounded-lg border border-white/30">
          Time: <span className={`text-red-300 ${timeLeft < 10 ? 'animate-pulse' : ''}`}>{timeLeft}s</span>
        </div>
      </div>

      {/* Grid หลุม (ปรับขนาดให้เล็กลง) */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {holes.map((_, i) => (
          <div 
            key={i}
            onClick={() => whack(i)}
            className="w-24 h-24 sm:w-28 sm:h-28 bg-green-800 rounded-full shadow-inner border-4 border-green-700 relative flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 transition-transform"
          >
            {/* พื้นหลังหลุม (ดิน) */}
            <div className="absolute inset-x-2 bottom-0 h-1/3 bg-black/30 rounded-b-full"></div>
            
            {/* ตัวผี 👻 (โผล่ขึ้นมา) */}
            <div className={`text-5xl sm:text-6xl transition-all duration-100 ease-out transform ${
              activeHole === i ? "translate-y-2 scale-110" : "translate-y-24 scale-0"
            }`}>
              👻
            </div>
          </div>
        ))}
      </div>

      {/* ปุ่มเริ่ม / จบเกม */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm rounded-2xl">
          {timeLeft === 0 && <h2 className="text-4xl font-bold text-white mb-2">GAME OVER!</h2>}
          <p className="text-xl text-gray-300 mb-6">Final Score: {score}</p>
          <button 
            onClick={startGame}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xl px-8 py-3 rounded-full shadow-lg transition transform hover:scale-105"
          >
            {timeLeft === 0 ? "🔄 Play Again" : "▶ Start Game"}
          </button>
        </div>
      )}
    </div>
  );
}