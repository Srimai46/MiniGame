import { Link } from 'react-router-dom';

export default function Lobby() {
  return (
    <div className="max-w-xl mx-auto mt-10 space-y-4">
      <h1 className="text-2xl font-bold text-center">🎮 MiniGame Lobby</h1>
      <div className="grid grid-cols-1 gap-4">
        <Link className="card" to="/xo"><span className="font-semibold">Tic-Tac-Toe (XO)</span> — Multiplayer & Bot</Link>
        <Link className="card" to="/fruitcut"><span className="font-semibold">Fruit Cut</span> — Slice fruits, score up!</Link>
        <Link className="card" to="/dino"><span className="font-semibold">Dino Run</span> — Jump to survive</Link>
      </div>
    </div>
  );
}
