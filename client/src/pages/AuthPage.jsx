import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight, ShieldCheck, MonitorPlay, Cloud, Target, Zap } from 'lucide-react';
import { Header } from '../components/ui/Header';

export default function AuthPage({ isDarkMode, setIsDarkMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = isLogin 
      ? await login(email, password)
      : await register(email, password);

    setIsLoading(false);
    if (success) navigate('/');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-500 font-['Inter',sans-serif] ${isDarkMode ? 'bg-[#05050A]' : 'bg-slate-50'}`}>
      
      {/* --- BACKGROUND GLOW  --- */}
      <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] pointer-events-none z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inset-0 rounded-full blur-[120px] ${isDarkMode ? 'bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-cyan-500/10' : 'bg-gradient-to-tr from-blue-300/40 via-indigo-300/30 to-cyan-200/20'}`}
        />
      </div>

      {/* --- ORIGINAL HEADER (Transparent) --- */}
      <Header 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
        activePage="auth" 
        positionClass="relative z-50 !bg-transparent !border-transparent"
      />

      {/* --- MAIN SPLIT LAYOUT --- */}
      <div className="flex-grow flex flex-col lg:flex-row items-center justify-between w-full max-w-[1400px] mx-auto px-6 lg:px-12 pb-20 relative z-10 gap-16 lg:gap-12">
        
        {/* LEFT SIDE: Text Area */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full lg:w-3/5 text-left pt-10 lg:pt-0"
        >
          <h1 className={`text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.1] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Ready to take your <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isDarkMode ? 'from-blue-400 to-indigo-400' : 'from-blue-600 to-indigo-600'}`}>
              learning to the next level?
            </span>
          </h1>
          
          <p className={`text-lg font-medium max-w-xl mb-12 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Course Flow is the ultimate distraction-free environment. Import your local courses, track your goals, and sync your progress securely in the cloud.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl">
            <div className="flex gap-4">
              <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                 <MonitorPlay className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Native Local Player</h3>
                <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Play your downloaded courses with built-in timestamp tracking.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                 <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Secure Cloud Sync</h3>
                <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Your notes, doubts, and progress are saved seamlessly to MongoDB.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                 <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Goal Tracking</h3>
                <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Plan your week and track your daily productivity accurately.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                 <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Distraction Free</h3>
                <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>No algorithmic feeds or recommendations. Just you and your courses.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT SIDE: Login Card (Updated with specific constraints) */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`w-full lg:w-2/5 max-w-[350px] min-h-[360px] lg:mr-10 p-6 sm:p-8 flex flex-col justify-between rounded-[2rem] backdrop-blur-2xl border shadow-2xl ${isDarkMode ? 'bg-[#0B1120]/70 border-white/10 shadow-indigo-900/20' : 'bg-white/70 border-slate-200 shadow-indigo-500/10'}`}
        >
          <div>
            <div className="mb-6">
              <h2 className={`text-2xl font-black tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                 {isLogin ? 'Enter your details to access.' : 'Set up your cloud workspace.'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex gap-2 items-center">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative group">
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all border ${isDarkMode ? 'bg-[#0F172A]/50 border-white/5 text-white placeholder:text-slate-500' : 'bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                  <input 
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all border ${isDarkMode ? 'bg-[#0F172A]/50 border-white/5 text-white placeholder:text-slate-500' : 'bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" disabled={isLoading}
                className={`w-full mt-2 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-70 flex items-center justify-center gap-2 group ${isDarkMode ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Start journey')}
                {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </motion.button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-500/20 text-center">
            <button 
              onClick={toggleMode} 
              className={`text-xs font-bold transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}