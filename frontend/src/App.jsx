import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Lobby from "./Lobby";
import XO from "./games/XO";
import FruitCut from "./games/FruitCut";
import Dino from "./games/Dino";
import SnakeGame from "./games/SnakeGame";
import Coin from "./games/coin";
import MemoryGame from "./games/MemoryGame";
import TypingRain from "./games/TypingRain";
import WhackAMole from "./games/WhackAMole";
import Breakout from "./games/Breakout";

export default function App() {
  return (
    <BrowserRouter>
      <header className="p-4 bg-indigo-600 text-white flex justify-between items-center shadow-md">
        <Link to="/" className="font-bold">
          MiniGame
        </Link>
      </header>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/xo" element={<XO />} />
          <Route path="/fruitcut" element={<FruitCut />} />
          <Route path="/dino" element={<Dino />} />
          <Route path="/snakegame" element={<SnakeGame />} />
          <Route path="/coin" element={<Coin />} />
          <Route path="/memorygame" element={<MemoryGame />} />
          <Route path="/typingrain" element={<TypingRain />} />
          <Route path="/whackamole" element={<WhackAMole />} />
          <Route path="/breakout" element={<Breakout />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
