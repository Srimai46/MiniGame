import { useState, useEffect } from 'react';

const EMOJIS = ['👻', '🎃', '👽', '🤖', '🤡', '👹', '👺', '💀'];

export default function MemoryGame() {
  const [cards, setCards] = useState([]);
  const [turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState(null);
  const [choiceTwo, setChoiceTwo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);

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
  };

  useEffect(() => {
    shuffleCards();
  }, []);

  const handleChoice = (card) => {
    if (choiceOne && choiceOne.id === card.id) return;
    choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
  };

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

  const isWin = matchedCount === EMOJIS.length;

  return (
    // ปรับ Container ให้เป็น Card ขนาดพอดี (max-w-lg)
    <div className="bg-violet-900 flex flex-col items-center justify-center p-6 rounded-2xl shadow-2xl max-w-lg mx-auto font-sans relative overflow-hidden">
      
      {/* Header */}
      <div className="text-center mb-6 w-full">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-3">
          MEMORY MAGIC
        </h1>
        <div className="flex gap-4 justify-center text-white font-bold text-sm">
          <p className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 min-w-[80px]">Turns: {turns}</p>
          <button 
            onClick={shuffleCards} 
            className="bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-lg shadow-lg transition transform active:scale-95 flex items-center gap-2"
          >
            🔄 New Game
          </button>
        </div>
      </div>

      {/* Card Grid - ปรับขนาดการ์ดให้เล็กลงนิดหน่อยเพื่อให้พอดี */}
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card) => (
          <div 
            key={card.id} 
            className="relative w-14 h-14 sm:w-16 sm:h-16 cursor-pointer perspective-1000"
            onClick={() => !disabled && !card.matched && handleChoice(card)}
          >
            <div 
              className={`w-full h-full relative transition-all duration-500 transform-style-3d ${
                card === choiceOne || card === choiceTwo || card.matched ? "rotate-y-180" : ""
              }`}
            >
              {/* หน้าการ์ด (Emoji) */}
              <div className="absolute w-full h-full bg-white rounded-lg flex items-center justify-center text-3xl shadow-md backface-hidden rotate-y-180 border-2 border-pink-300">
                {card.src}
              </div>
              
              {/* หลังการ์ด (ลาย) */}
              <div className="absolute w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg backface-hidden shadow-md border border-indigo-400 flex items-center justify-center">
                <span className="text-xl opacity-50">✨</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Win Modal - เปลี่ยนเป็น absolute เพื่อให้อยู่แค่ในกรอบเกม */}
      {isWin && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm rounded-2xl p-4">
          <div className="bg-white p-6 rounded-xl text-center shadow-2xl transform scale-110 w-full max-w-xs">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold text-purple-600 mb-1">You Won!</h2>
            <p className="text-gray-500 mb-4 text-sm">Finished in {turns} turns</p>
            <button 
              onClick={shuffleCards}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}