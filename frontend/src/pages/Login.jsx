import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // ยิง API ไปที่ Backend Port 4000
      const res = await axios.post('http://localhost:4000/api/auth/login', form);
      
      // ถ้าสำเร็จ: เก็บ Token และ Username ลงเครื่อง
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      
      alert('Login Success! 🎉');
      navigate('/'); // ย้ายไปหน้าแรก (หน้าเลือกเกม)
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <h2 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-6">
          ARCADE LOGIN
        </h2>

        {error && (
          <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg mb-4 text-center text-sm border border-red-500/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Username</label>
            <input
              name="username"
              type="text"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 rounded-lg shadow-lg transition transform active:scale-95"
          >
            LOGIN
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}