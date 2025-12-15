import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// Config ชื่อเกมให้ตรงกับ Database
const GAME_INFO = {
  snake: { name: "Neon Snake", icon: "🐍", color: "from-green-500 to-emerald-700" },
  dino: { name: "Dino Run", icon: "🦖", color: "from-blue-400 to-cyan-600" },
  xo: { name: "Tic Tac Toe", icon: "❌⭕", color: "from-purple-500 to-indigo-700" },
  fruitcut: { name: "Fruit Cut", icon: "🍉", color: "from-red-400 to-orange-500" },
  whack: { name: "Whack-a-Ghost", icon: "👻", color: "from-green-700 to-teal-900" },
  typing: { name: "Typing Rain", icon: "⌨️", color: "from-sky-500 to-blue-700" },
  memory: { name: "Memory Magic", icon: "🃏", color: "from-pink-500 to-rose-600" },
  wheel: { name: "Lucky Wheel", icon: "🎡", color: "from-yellow-400 to-orange-600" },
  coin: { name: "Coin Flip", icon: "🪙", color: "from-yellow-500 to-yellow-700" },
  breakout: { name: "Breakout", icon: "🧱", color: "from-blue-600 to-cyan-400" },
  game2048: { name: "2048", icon: "🔢", color: "from-orange-300 to-orange-600" },
  minesweeper: { name: "Minesweeper", icon: "💣", color: "from-slate-500 to-slate-700" },
};

export default function MyStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // -----------------------------------------------------------
      // 🛠️ แก้ไขจุดที่ 1: เปลี่ยน URL ให้มี /score ตาม server.js
      // -----------------------------------------------------------
      const res = await axios.get("http://localhost:4000/api/score/my-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // -----------------------------------------------------------
      // 🛠️ แก้ไขจุดที่ 2: เช็คว่าเป็น Array จริงไหม ก่อน set state
      // -----------------------------------------------------------
      if (Array.isArray(res.data)) {
        setStats(res.data);
      } else {
        console.warn("API did not return an array:", res.data);
        setStats([]); // เซ็ตค่าว่างกันแอปพัง
      }

    } catch (error) {
      console.error("Error fetching stats:", error);
      // ถ้า Error 401 (Token หมดอายุ) อาจจะ Redirect ไป Login ได้
      if (error.response?.status === 401) {
         // window.location.href = '/login'; // เปิดบรรทัดนี้ถ้าอยากให้เด้งไปหน้า Login
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              📊 YOUR STATISTICS
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Your gaming history and achievements
            </p>
          </div>
          <Link to="/" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition">
            🏠 Back to Home
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 animate-pulse">Loading stats...</div>
        ) : stats.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700">
            <p className="text-2xl mb-4">No stats found 😢</p>
            <p className="text-slate-400 mb-6">Go play some games to track your score!</p>
            <Link to="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold">
              Play Games
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((item, index) => {
              // หาข้อมูลเกมจาก Config (ถ้าไม่เจอให้ใช้ค่า Default)
              const info = GAME_INFO[item.game] || { name: item.game, icon: "🎮", color: "from-gray-500 to-gray-700" };
              
              return (
                <div 
                  key={index} 
                  className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 hover:scale-105 transition-transform duration-300"
                >
                  {/* Card Header */}
                  <div className={`bg-gradient-to-r ${info.color} p-4 flex items-center gap-3`}>
                    <span className="text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm shadow-sm">{info.icon}</span>
                    <h2 className="text-xl font-bold text-white drop-shadow-md">{info.name}</h2>
                  </div>

                  {/* Stats Detail */}
                  <div className="p-6 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Best Score</p>
                      <p className="text-2xl font-black text-white">{item.bestScore?.toLocaleString() || '-'}</p>
                    </div>
                    <div className="border-l border-slate-700">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Played</p>
                      <p className="text-2xl font-black text-indigo-400">{item.playCount} <span className="text-sm font-normal text-slate-500">times</span></p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}