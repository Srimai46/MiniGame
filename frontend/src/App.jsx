import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";

// --- Pages ---
import Login from "./pages/Login";
import Register from "./pages/Register";
import Lobby from "./Lobby";
import MyStats from "./pages/MyStats";

// --- Games ---
import XO from "./games/XO"; // แก้ xo เป็น XO ให้ตรงกับชื่อไฟล์จริง
import FruitCut from "./games/FruitCut";
import Dino from "./games/Dino";
import SnakeGame from "./games/SnakeGame";
import Coin from "./games/coin";
import MemoryGame from "./games/MemoryGame";
import TypingRain from "./games/TypingRain";
import WhackAMole from "./games/WhackAMole";
import Breakout from "./games/Breakout";
import Minesweeper from "./games/Minesweeper";
import Game2048 from "./games/Game2048";

// 🧭 Navbar
function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  return (
    <header className="p-4 bg-indigo-600 text-white flex justify-between items-center shadow-lg sticky top-0 z-50">
      <Link
        to="/"
        className="font-extrabold text-2xl tracking-wider flex items-center gap-2 hover:text-indigo-200 transition"
      >
        🕹️ Arcade Hub
      </Link>

      <div className="flex items-center gap-4">
        {token ? (
          // ✅ กรณี Login แล้ว: แสดงปุ่ม Stats, ชื่อ, และ Logout
          <div className="flex items-center gap-3">
            {/* 👇 ปุ่มสถิติ อยู่ตรงนี้ครับ */}
            <Link 
              to="/stats" 
              className="text-white hover:text-yellow-300 font-bold px-3 py-1 bg-white/10 rounded-lg transition border border-transparent hover:border-yellow-300/50 hidden sm:block"
            >
              📊 My Stats
            </Link>

            <span className="text-indigo-100 font-medium hidden sm:block">
              👤 {username}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md active:scale-95"
            >
              Logout
            </button>
          </div>
        ) : (
          // 🔓 กรณี Guest: แสดงปุ่ม Login / Register
          <div className="flex gap-3 text-sm font-semibold">
            <Link
              to="/login"
              className="px-3 py-2 hover:bg-indigo-500 rounded-lg transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg shadow-md transition-transform hover:-translate-y-0.5"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main className="p-4 min-h-[calc(100vh-80px)] bg-slate-100">
        <Routes>
          {/* --- Pages --- */}
          <Route path="/" element={<Lobby />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/stats" element={<MyStats />} /> {/* ✅ ใช้ path /stats ให้ตรงกับปุ่ม */}

          {/* --- Games --- */}
          <Route path="/xo" element={<XO />} />
          <Route path="/fruitcut" element={<FruitCut />} />
          <Route path="/dino" element={<Dino />} />
          <Route path="/snakegame" element={<SnakeGame />} />
          <Route path="/coin" element={<Coin />} />
          <Route path="/memorygame" element={<MemoryGame />} />
          <Route path="/typingrain" element={<TypingRain />} />
          <Route path="/whackamole" element={<WhackAMole />} />
          <Route path="/breakout" element={<Breakout />} />
          <Route path="/minesweeper" element={<Minesweeper />} />
          <Route path="/game2048" element={<Game2048 />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}