import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Lobby from './Lobby';
import XO from './games/XO';
import FruitCut from './games/FruitCut';
import Dino from './games/Dino';

export default function App() {
  return (
    <BrowserRouter>
      <header className="p-4 border-b flex justify-between">
        <Link to="/" className="font-bold">MiniGame</Link>
        <nav className="space-x-4">
          <Link to="/xo">XO</Link>
          <Link to="/fruitcut">Fruit Cut</Link>
          <Link to="/dino">Dino</Link>
        </nav>
      </header>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/xo" element={<XO />} />
          <Route path="/fruitcut" element={<FruitCut />} />
          <Route path="/dino" element={<Dino />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
