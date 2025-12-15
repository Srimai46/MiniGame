import { Link } from 'react-router-dom';

export default function Lobby() {
  return (
    <div className="max-w-xl mx-auto mt-10 space-y-4">
      <h1 className="text-2xl font-bold text-center">🎮 MiniGame Lobby</h1>
      <div className="grid grid-cols-1 gap-4">
        <Link className="card" to="/xo"><span className="font-semibold">Tic-Tac-Toe (XO)</span> — Multiplayer & Bot</Link>
        <Link className="card" to="/fruitcut"><span className="font-semibold">Fruit Cut</span> — Slice fruits, score up!</Link>
        <Link className="card" to="/dino"><span className="font-semibold">Dino Run</span> — Jump to survive</Link>
        <Link className="card" to="/snakegame"><span className="font-semibold">Snake Game</span> — Eat the apple</Link>
        <Link className="card" to="/coin"><span className="font-semibold">Coin Flip</span> — Guess heads or tails</Link>
        <Link className="card" to="/memorygame"><span className="font-semibold">Memory Game</span> — Find matching pairs</Link>
        <Link className="card" to="/typingrain"><span className="font-semibold">Typing Rain</span> — Type the falling words</Link>
        <Link className="card" to="/whackamole"><span className="font-semibold">Whack-A-Mole</span> — Hit the moles!</Link>
        <Link className="card" to="/breakout"><span className="font-semibold">Breakout</span> — Bounce the ball</Link>
        <Link className="card" to="/minesweeper"><span className="font-semibold">Minesweeper</span> — Clear the minefield</Link>
        <Link className="card" to="/game2048"><span className="font-semibold">2048</span> — Slide to combine numbers</Link>
      </div>
    </div>
  );
}
