import { useState, useEffect } from "react";
import axios from "axios"; // <--- 1. เพิ่ม axios

export default function Coin() {
  const [result, setResult] = useState(null);
  const [guess, setGuess] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [rotation, setRotation] = useState(0);

  // --- 2. เพิ่ม State สำหรับเก็บสถิติ ---
  const [streak, setStreak] = useState(0);      // ทายถูกติดต่อกันปัจจุบัน
  const [bestStreak, setBestStreak] = useState(0); // สถิติสูงสุดใน session นี้

  // โหลดสถิติเก่าจาก LocalStorage (ถ้าอยากให้จำค่าแม้รีเฟรชหน้าเว็บ)
  useEffect(() => {
    const savedBest = localStorage.getItem('coinBestStreak');
    if (savedBest) setBestStreak(parseInt(savedBest));
  }, []);

  // --- 3. ฟังก์ชันบันทึกคะแนนลง DB ---
  const saveScoreToDB = async (currentStreak) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // บันทึกเฉพาะเมื่อ Streak ปัจจุบัน มากกว่าหรือเท่ากับสถิติสูงสุด
      // หรือจะบันทึกทุกครั้งที่ทายถูกก็ได้ (แต่แบบนี้ประหยัด Request กว่า)
      await axios.post("/api/score", 
        { 
          game: "coin", // ชื่อเกมต้องตรงกับใน MyStats
          score: currentStreak 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Streak saved:", currentStreak);
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  };

  const flipCoin = () => {
    if (!guess) return; 
    if (isFlipping) return;

    setIsFlipping(true);
    setResult(null);

    // 1. สุ่มผลลัพธ์
    const isHeads = Math.random() < 0.5;
    const outcome = isHeads ? "หัว" : "ก้อย";

    // 2. คำนวณองศาการหมุน
    const baseRotation = 1800; 
    let newRotation = rotation + baseRotation;
    const currentMod = newRotation % 360;
    
    if (isHeads) {
      newRotation += (360 - currentMod);
    } else {
      newRotation += (180 - currentMod) + 360; 
    }

    setRotation(newRotation);

    // 3. รอ Animation จบ (3 วินาที)
    setTimeout(() => {
      setResult(outcome);
      setIsFlipping(false);

      // --- 4. คำนวณ Streak ---
      if (outcome === guess) {
        // ทายถูก
        const newStreak = streak + 1;
        setStreak(newStreak);
        
        // เช็ค High Score
        if (newStreak > bestStreak) {
            setBestStreak(newStreak);
            localStorage.setItem('coinBestStreak', newStreak);
            saveScoreToDB(newStreak); // บันทึกสถิติใหม่ลง DB
        } else {
            // ถ้ายังไม่ทำลายสถิติเดิม ก็บันทึกคะแนนปัจจุบันไปเรื่อยๆ ก็ได้ (ขึ้นอยู่กับ Logic)
            // ในที่นี้ผมให้บันทึกทุกครั้งที่ทายถูก เพื่อ update playCount
            saveScoreToDB(newStreak);
        }

      } else {
        // ทายผิด -> รีเซ็ต Streak
        setStreak(0);
      }

    }, 3000);
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-slate-50 shadow-2xl rounded-2xl space-y-6 text-center border border-slate-200 mt-10 font-sans">
      
      {/* Header & Stats */}
      <div>
        <h2 className="text-3xl font-extrabold text-indigo-700 mb-2">🪙 เกมเสี่ยงทาย</h2>
        <div className="flex justify-center gap-4 text-sm font-bold">
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-600">
                STREAK 🔥: <span className="text-orange-500 text-lg">{streak}</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-600">
                BEST 🏆: <span className="text-yellow-500 text-lg">{bestStreak}</span>
            </div>
        </div>
      </div>
      
      {/* พื้นที่แสดงเหรียญ 3D */}
      <div className="h-40 flex justify-center items-center perspective-container py-4">
        <div 
          className="relative w-32 h-32 transition-transform duration-[3000ms] ease-out preserve-3d"
          style={{ transform: `rotateY(${rotation}deg)` }}
        >
          {/* ด้านหัว */}
          <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-4 border-yellow-700 flex items-center justify-center shadow-xl backface-hidden">
             <span className="text-4xl font-bold text-white drop-shadow-md">หัว</span>
          </div>
          
          {/* ด้านก้อย */}
          <div 
            className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border-4 border-gray-600 flex items-center justify-center shadow-xl backface-hidden"
            style={{ transform: "rotateY(180deg)" }}
          >
             <span className="text-4xl font-bold text-white drop-shadow-md">ก้อย</span>
          </div>
        </div>
      </div>

      {/* ปุ่มเลือก */}
      <div className="flex justify-center gap-4">
        <button
          disabled={isFlipping}
          className={`flex-1 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
            guess === "หัว" 
              ? "bg-yellow-500 text-white ring-4 ring-yellow-200 shadow-lg scale-105" 
              : "bg-white text-gray-600 border hover:bg-gray-50"
          } ${isFlipping ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => setGuess("หัว")}
        >
          🙆‍♂️ ทายว่า หัว
        </button>
        <button
          disabled={isFlipping}
          className={`flex-1 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
            guess === "ก้อย" 
              ? "bg-gray-500 text-white ring-4 ring-gray-200 shadow-lg scale-105" 
              : "bg-white text-gray-600 border hover:bg-gray-50"
          } ${isFlipping ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => setGuess("ก้อย")}
        >
          🐢 ทายว่า ก้อย
        </button>
      </div>

      {/* ปุ่มโยนเหรียญ */}
      <button
        className={`w-full py-4 text-xl font-bold text-white rounded-xl shadow-lg transition-all transform ${
            !guess 
             ? "bg-gray-400 cursor-not-allowed" 
             : isFlipping 
                ? "bg-indigo-300 cursor-wait" 
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl active:scale-95"
        }`}
        onClick={flipCoin}
        disabled={isFlipping || !guess}
      >
        {!guess ? "กรุณาเลือกฝั่งก่อน" : isFlipping ? "⏳ กำลังหมุน..." : "🚀 โยนเหรียญเลย!"}
      </button>

      {/* ส่วนแสดงผลลัพธ์ */}
      <div className={`transition-all duration-500 transform ${result ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {result && (
              <div className={`p-4 rounded-xl border-2 ${
                  result === guess 
                    ? "bg-green-50 border-green-200 text-green-700" 
                    : "bg-red-50 border-red-200 text-red-700"
              }`}>
                  <p className="text-lg font-medium text-gray-600 mb-1">ผลออก: <span className="font-bold text-black">{result}</span></p>
                  
                  <h3 className="text-2xl font-extrabold">
                      {result === guess ? "🎉 ถูกต้อง! (+1 Streak)" : "❌ ผิด! (Reset Streak)"}
                  </h3>
              </div>
          )}
      </div>

      <style>{`
        .perspective-container { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}</style>
    </div>
  );
}