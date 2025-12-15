import { useState, useEffect, useRef } from 'react';
import axios from "axios"; // <--- 1. Import axios

const EMOJIS = ['👻', '🎃', '👽', '🤖', '🤡', '👹', '👺', '💀'];

export default function MemoryGame() {
  const [cards, setCards] = useState([]);
  const [turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState(null);
  const [choiceTwo, setChoiceTwo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);
  
  // State สำหรับ Best Score (เก็บจำนวน Turn ที่น้อยที่สุด)
  const [bestScore, setBestScore] = useState(0);

  // โหลดสถิติจาก LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('memoryBestScore');
    if (saved) setBestScore(parseInt(saved));
    shuffleCards();
  }, []);

  // --- 2. ฟังก์ชันบันทึกคะแนนลง DB ---
  const saveScoreToDB = async (finalTurns) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // บันทึก Turns ลงในช่อง score
      await axios.post("http://localhost:4000/api/score", 
        { 
          game: "memory", // ชื่อเกมต้องตรงกับ DB
          score: finalTurns 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Score saved:", finalTurns);
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  };

  // เริ่มเกมใหม่ & สับไพ่
  const shuffleCards = () => {
    const shuffledCards = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((card) => ({ id: Math.random(), src: card, matched: false }));

    setChoiceOne(null);
    setChoiceTwo(null);
    setCards(shuffledCards);
    setTurns(0);
    setMatchedCount(0);
    setDisabled(false);
  };

  const handleChoice = (card) => {
    if (choiceOne && choiceOne.id === card.id) return;
    choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
  };

  // Logic การจับคู่
  useEffect(() => {
    if (choiceOne && choiceTwo) {
      setDisabled(true);
      if (choiceOne.src === choiceTwo.src) {
        setCards((prevCards) => {
          return prevCards.map((card) => {
            if (card.src === choiceOne.src) {
              return { ...card, matched: true };
            }
            return card;
          });
        });
        setMatchedCount(prev => prev + 1);
        resetTurn();
      } else {
        setTimeout(() => resetTurn(), 1000);
      }
    }
  }, [choiceOne, choiceTwo]);

  const resetTurn = () => {
    setChoiceOne(null);
    setChoiceTwo(null);
    setTurns((prevTurns) => prevTurns + 1);
    setDisabled(false);
  };

  // --- 3. ตรวจสอบการชนะและบันทึกคะแนน ---
  useEffect(() => {
    if (matchedCount === EMOJIS.length && matchedCount > 0) {
        // บันทึกคะแนน (Turns)
        saveScoreToDB(turns);

        // อัปเดต Best Score (ยิ่งน้อยยิ่งดี)
        setBestScore(prev => {
            // ถ้ายังไม่มีสถิติ (0) หรือ ทำได้น้อยกว่าสถิติเดิม ให้บันทึกค่าใหม่
            const newBest = (prev === 0 || turns < prev) ? turns : prev;
            localStorage.setItem('memoryBestScore', newBest);
            return newBest;
        });
    }
  }, [matchedCount]);

  const isWin = matchedCount === EMOJIS.length;

  return (
    // --- UI มาตรฐาน (Theme Dark, ขอบมน, ขนาดเท่าเกมอื่น) ---
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 font-sans text-white relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          MEMORY MAGIC
        </h1>
        <div className="flex gap-4 text-sm font-bold">
            <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700">
                TURNS: <span className="text-pink-400 text-lg">{turns}</span>
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded border border-slate-700">
                BEST (LOW): <span className="text-yellow-400 text-lg">{bestScore === 0 ? '-' : bestScore}</span>
            </div>
        </div>
      </div>

      {/* Card Grid Container */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner flex justify-center">
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card) => (
            <div 
                key={card.id} 
                className="relative w-14 h-14 sm:w-20 sm:h-20 cursor-pointer perspective-1000"
                onClick={() => !disabled && !card.matched && handleChoice(card)}
            >
                <div 
                className={`w-full h-full relative transition-all duration-500 transform-style-3d ${
                    card === choiceOne || card === choiceTwo || card.matched ? "rotate-y-180" : ""
                }`}
                >
                {/* หน้าการ์ด (Emoji) */}
                <div className="absolute w-full h-full bg-slate-100 rounded-lg flex items-center justify-center text-3xl sm:text-4xl shadow-md backface-hidden rotate-y-180 border-2 border-pink-300">
                    {card.src}
                </div>
                
                {/* หลังการ์ด (ลาย) */}
                <div className="absolute w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg backface-hidden shadow-md border border-slate-600 flex items-center justify-center hover:brightness-110 transition">
                    <span className="text-xl opacity-30">✨</span>
                </div>
                </div>
            </div>
            ))}
        </div>
      </div>

      {/* Win Modal Overlay */}
      {isWin && (
        <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-2xl animate-fade-in">
          <div className="text-5xl mb-2 animate-bounce">🎉</div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-2">
            YOU WON!
          </h2>
          <p className="text-slate-300 mb-6 text-xl">
             Finished in <span className="text-white font-bold">{turns}</span> turns
          </p>
          
          <button 
            onClick={shuffleCards}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 text-white font-bold text-lg rounded-full shadow-lg transition"
          >
            Play Again
          </button>
        </div>
      )}

      {/* CSS */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-in-out forwards; }
      `}</style>
    </div>
  );
}