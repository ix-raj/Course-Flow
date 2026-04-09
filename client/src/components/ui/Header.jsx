import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../../context/AuthContext';

export function Header({ isDarkMode, setIsDarkMode, activePage, positionClass = "sticky top-0" }) {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const mobileNavRef = useRef(null);

  const navItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'library', label: 'My Library', path: '/library' },
    { id: 'goals', label: 'Goals', path: '/goals' }
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target)) {
        setIsMobileNavOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsAccountMenuOpen(false);
    setIsMobileNavOpen(false);
    navigate('/auth');
  };

  const handleNavigate = (path) => {
    setIsMobileNavOpen(false);
    navigate(path);
  };

  return (
    <div
      className={`${positionClass} w-full py-4 z-50 transition-colors duration-200 border-b ${
        isDarkMode ? 'bg-[#0B1120] border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div className="w-[96%] max-w-[1600px] mx-auto flex flex-col gap-3 sm:gap-0">
        <div className="flex justify-between items-center gap-3">
          <div className="opacity-90 hover:opacity-100 transition-opacity shrink-0">
            <BrandLogo onClick={() => navigate('/')} className="cursor-pointer mb-y" />
          </div>

          <div className="flex items-center gap-3 sm:gap-8 min-w-0">
            <nav className="hidden sm:flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`text-md font-medium transition-colors duration-200 relative pb-1 ${
                      isActive
                        ? (isDarkMode ? 'text-white' : 'text-slate-900')
                        : (isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className={`absolute left-0 bottom-0 w-full h-[2px] ${isDarkMode ? 'bg-white' : 'bg-slate-900'}`}></span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="relative sm:hidden" ref={mobileNavRef}>
                <button
                  onClick={() => setIsMobileNavOpen(prev => !prev)}
                  className={` rounded-xl flex items-center justify-center transition-all `}
                  aria-label="Open navigation menu"
                >
                  {isMobileNavOpen ? <Menu className="w-9 h-9 text-white/80" ></Menu> : <Menu className="w-9 h-9 text-white/40" />}
                </button>

                {isMobileNavOpen && (
                  <div className={`absolute right-0 mt-3 w-56 rounded-2xl border shadow-xl overflow-hidden z-50 ${
                    isDarkMode ? 'bg-[#1E293B] border-slate-700 shadow-black/50' : 'bg-white border-slate-200 shadow-slate-200/60'
                  }`}>
                    <div className="p-2">
                      {navItems.map((item) => {
                        const isActive = activePage === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigate(item.path)}
                            className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                              isActive
                                ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900')
                                : (isDarkMode ? 'text-slate-300 hover:bg-slate-800/70' : 'text-slate-700 hover:bg-slate-50')
                            }`}
                          >
                            <span>{item.label}</span>
                            {isActive && <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-cyan-400' : 'bg-indigo-500'}`}></span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            <div className={`w-px h-4  ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

            <div className="flex items-center gap-2 sm:gap-4">
              

              <button
                onClick={() => setIsDarkMode(prev => !prev)}
                className={`w-14 sm:w-16 h-9 flex items-center rounded-full p-1 transition-all duration-300 border ${
                  isDarkMode ? 'bg-[#111822] border-slate-700/60' : 'bg-slate-100 border-slate-300'
                }`}
              >
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-full transform transition-all duration-300 shadow-md bg-slate-800 text-white ${
                    isDarkMode ? 'translate-x-0' : 'translate-x-5 sm:translate-x-7'
                  }`}
                >
                  {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
              </button>

              {user ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className={`flex items-center gap-2 rounded-full border transition-all ${
                      isDarkMode ? 'bg-[#111822] border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                      isDarkMode ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white' : 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'
                    }`}>
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {isAccountMenuOpen && (
                    <div className={`absolute right-0 mt-4 sm:mt-8 w-64 rounded-2xl border shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 ${
                      isDarkMode ? 'bg-[#1E293B] border-slate-700 shadow-black/50' : 'bg-white border-slate-200 shadow-slate-200/50'
                    }`}>
                      <div className={`p-5 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Account</p>
                        <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user.email}</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            isDarkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          Sign out <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/auth')}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 sm:px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
                >
                  Log In
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
