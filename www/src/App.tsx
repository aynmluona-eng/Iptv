/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { XtreamCredentials } from './lib/xtream';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Live from './pages/Live';
import Movies from './pages/Movies';
import Series from './pages/Series';
import SeriesDetails from './pages/SeriesDetails';
import MovieDetails from './pages/MovieDetails';
import LiveDetails from './pages/LiveDetails';
import Player from './pages/Player';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';

export default function App() {
  const [credentials, setCredentials] = useState<XtreamCredentials | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('xtream_credentials');
    if (saved) {
      setCredentials(JSON.parse(saved));
    }
  }, []);

  const handleLogin = (creds: XtreamCredentials) => {
    localStorage.setItem('xtream_credentials', JSON.stringify(creds));
    setCredentials(creds);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('xtream_credentials');
    setCredentials(null);
    navigate('/login');
  };

  if (credentials === null && window.location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[100dvh] bg-dark text-gray-100 flex flex-col font-arabic">
      <Toaster position="top-center" theme="dark" richColors />
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/" element={<Dashboard credentials={credentials!} onLogout={handleLogout} />} />
        <Route path="/live" element={<Live credentials={credentials!} />} />
        <Route path="/live/:id" element={<LiveDetails credentials={credentials!} />} />
        <Route path="/movies" element={<Movies credentials={credentials!} />} />
        <Route path="/series" element={<Series credentials={credentials!} />} />
        <Route path="/movie/:id" element={<MovieDetails credentials={credentials!} />} />
        <Route path="/series/:id" element={<SeriesDetails credentials={credentials!} />} />
        <Route path="/favorites" element={<Favorites credentials={credentials!} />} />
        <Route path="/settings" element={<Settings credentials={credentials!} onLogout={handleLogout} />} />
        <Route path="/player/:type/:id" element={<Player credentials={credentials!} />} />
      </Routes>
    </div>
  );
}
