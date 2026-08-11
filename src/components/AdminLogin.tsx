import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Lock, Mail, AlertCircle, ShieldAlert } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('E-mail ou senha incorretos.');
        } else {
          setError(authError.message);
        }
      } else {
        onLoginSuccess();
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full bg-cream-light border border-cream-dark shadow-lg rounded-3xl p-6 md:p-8 space-y-6">
        
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-2 border-b border-cream-medium pb-4">
          <div className="w-12 h-12 bg-chocolate/10 border border-chocolate/20 text-chocolate rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-chocolate">Painel Administrativo</h2>
          <p className="text-xs text-chocolate-pale">Apenas para administradores da Viva Doce</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-xs flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-bold text-chocolate uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-chocolate-pale/60" />
              <input
                id="admin-email"
                type="email"
                placeholder="admin@vivadoce.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-cream-medium/50 border border-cream-dark rounded-xl text-chocolate placeholder-chocolate-pale/50 focus:outline-none focus:ring-2 focus:ring-chocolate/20 focus:border-chocolate transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-bold text-chocolate uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-chocolate-pale/60" />
              <input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-cream-medium/50 border border-cream-dark rounded-xl text-chocolate placeholder-chocolate-pale/50 focus:outline-none focus:ring-2 focus:ring-chocolate/20 focus:border-chocolate transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-chocolate hover:bg-chocolate-light text-cream-light font-bold rounded-xl shadow-md shadow-chocolate/10 hover:shadow-chocolate/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-cream-light border-t-transparent rounded-full animate-spin" />
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>

        <div className="text-center pt-2 flex items-center justify-center gap-1 text-[10px] text-chocolate-pale opacity-75">
          <ShieldAlert className="w-3 h-3 text-accent-gold" />
          <span>Acesso monitorado e restrito por políticas RLS.</span>
        </div>

      </div>
    </div>
  );
};
