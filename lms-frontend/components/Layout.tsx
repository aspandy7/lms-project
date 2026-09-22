
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen flex flex-col relative overflow-y-auto">
      {/* Background Shapes simulation */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-cyan/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-8 py-6 flex justify-between items-center shrink-0">
        <Link to="/" className="text-3xl font-display font-black text-white tracking-tight">
          <img src="static/img/logo.svg" alt="infotecs" />
        </Link>

        {user && (
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6 font-display uppercase text-sm tracking-wider">
               <Link to="/" className={`hover:text-brand-green transition-colors ${isActive('/') ? 'text-brand-green' : 'text-white'}`}>Курсы</Link>
               {user.role === 'author' && (
                 <Link to="/create-course" className={`hover:text-brand-green transition-colors ${isActive('/create-course') ? 'text-brand-green' : 'text-white'}`}>Создать</Link>
               )}
            </nav>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold leading-tight">{user.full_name}</div>
                <div className="text-xs opacity-75 leading-tight">{user.username}</div>
              </div>
              <Link to="/profile" className="w-12 h-12 rounded-full border-2 border-brand-purple flex items-center justify-center bg-brand-blue/50 hover:bg-brand-purple transition-colors overflow-hidden">
                 <span className="font-display font-bold text-lg">{user.full_name.charAt(0)}</span>
              </Link>
              <button onClick={handleLogout} className="text-sm font-display text-white/50 hover:text-white uppercase">
                Выйти
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 relative z-10 p-8 container mx-auto">
        {children}
      </main>
    </div>
  );
};
