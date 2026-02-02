import React, { useState } from 'react';
import { Stylist } from '../types';
import { Scissors, ArrowRight, Lock, Mail, AlertCircle, CheckSquare, Square } from 'lucide-react';

interface LoginProps {
  stylists: Stylist[];
  onLogin: (user: Stylist | 'OWNER', remember: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ stylists, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Find user
    const user = stylists.find(s => s.email.toLowerCase() === email.toLowerCase());

    if (user && user.password === password) {
       // Check if it's the main owner account
       if (user.id === '1') {
           onLogin('OWNER', rememberMe);
       } else {
           onLogin(user, rememberMe);
       }
    } else {
       setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col border border-stone-200">
        {/* Header */}
        <div className="bg-white p-8 text-center relative overflow-hidden border-b border-stone-100">
             <div className="absolute top-0 left-0 w-full h-full opacity-30">
                 <div className="w-32 h-32 bg-emerald-100 rounded-full blur-3xl absolute -top-10 -left-10"></div>
                 <div className="w-32 h-32 bg-emerald-100 rounded-full blur-3xl absolute -bottom-10 -right-10"></div>
             </div>
             
             <div className="relative z-10 flex flex-col items-center">
                 <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-sm mb-4 transform rotate-3 border border-emerald-100">
                     <Scissors className="w-8 h-8 text-emerald-600" />
                 </div>
                 <h1 className="text-3xl font-bold text-stone-900 tracking-tight">SalonSync</h1>
                 <p className="text-stone-500 mt-2">Professional Salon Management</p>
             </div>
        </div>

        {/* Form */}
        <div className="p-8">
            <h2 className="text-xl font-bold text-stone-800 mb-6 text-center">Welcome Back</h2>
            
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 mb-6 border border-red-100">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow bg-stone-50 text-stone-900"
                            placeholder="name@salon.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow bg-stone-50 text-stone-900"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 px-1">
                    <button
                        type="button"
                        onClick={() => setRememberMe(!rememberMe)}
                        className="flex items-center gap-2 text-stone-600 hover:text-stone-800 focus:outline-none"
                    >
                        {rememberMe ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                            <Square className="w-5 h-5 text-stone-400" />
                        )}
                        <span className="text-sm select-none">Remember me</span>
                    </button>
                </div>

                <div className="pt-2">
                    <button 
                        type="submit" 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                    >
                        Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </form>

            <div className="mt-8 text-center text-xs text-stone-400">
                <p>Default Owner: owner@salon.com / admin</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;