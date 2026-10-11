import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err) {
      alert("Invalid Login Credentials!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Gugan Cakes - Baker Login</h2>
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Baker Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full border p-3 rounded-lg" 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full border p-3 rounded-lg" 
            required 
          />
          <button type="submit" className="w-full bg-pink-600 text-white font-bold py-3 rounded-lg hover:bg-pink-700">
            Login to Dashboard
          </button>
        </div>
      </form>
    </div>
  );
}