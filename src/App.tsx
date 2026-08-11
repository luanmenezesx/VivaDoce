import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { Header } from './components/Header';
import { ClientView } from './components/ClientView';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import type { Session } from '@supabase/supabase-js';

type ViewState = 'client' | 'admin_login' | 'admin_dashboard';

function App() {
  const [view, setView] = useState<ViewState>('client');
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCheckingSession(false);
      return;
    }

    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setView('admin_dashboard');
      }
      setCheckingSession(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setView('admin_dashboard');
      } else {
        // If logged out, reset view to public client search
        setView('client');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleToggleView = (targetView: ViewState) => {
    // Protect dashboard view
    if (targetView === 'admin_dashboard' && !session) {
      setView('admin_login');
    } else {
      setView(targetView);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center text-chocolate gap-3">
        <div className="w-8 h-8 border-4 border-chocolate border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest opacity-75">Carregando Viva Doce...</span>
      </div>
    );
  }

  // Se o Supabase não estiver configurado, exibe tela explicativa estilizada
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 text-chocolate font-sans">
        <div className="w-full max-w-xl bg-cream-light border border-cream-dark shadow-xl rounded-3xl p-6 md:p-8 space-y-6">
          <div className="text-center pb-4 border-b border-cream-medium">
            <span className="text-4xl">🍫</span>
            <h1 className="text-2xl font-black text-chocolate mt-2">Configuração do Supabase Pendente</h1>
            <p className="text-xs text-chocolate-pale font-medium mt-1">Siga os passos abaixo para ativar seu sistema de fidelidade digital</p>
          </div>

          <div className="space-y-4 text-xs md:text-sm">
            <div className="flex gap-3">
              <span className="w-6 h-6 shrink-0 bg-chocolate text-cream-light rounded-full flex items-center justify-center font-bold text-xs mt-0.5">1</span>
              <div>
                <p className="font-bold text-chocolate">Crie seu projeto no Supabase</p>
                <p className="text-chocolate-pale text-[11px]">Acesse <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-chocolate">supabase.com</a> e crie um novo projeto gratuito.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-6 h-6 shrink-0 bg-chocolate text-cream-light rounded-full flex items-center justify-center font-bold text-xs mt-0.5">2</span>
              <div>
                <p className="font-bold text-chocolate">Configure o Banco de Dados (SQL)</p>
                <p className="text-chocolate-pale text-[11px]">No menu lateral do Supabase, acesse o <strong>SQL Editor</strong> &gt; <strong>New Query</strong>. Abra o arquivo <code className="bg-cream-medium px-1.5 py-0.5 rounded font-mono text-[10px]">C:\viva-doce-fidelidade\setup_supabase.sql</code> no seu computador, copie todo o conteúdo, cole no SQL Editor e clique em <strong>Run</strong>.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-6 h-6 shrink-0 bg-chocolate text-cream-light rounded-full flex items-center justify-center font-bold text-xs mt-0.5">3</span>
              <div>
                <p className="font-bold text-chocolate">Obtenha as chaves de API</p>
                <p className="text-chocolate-pale text-[11px]">No painel do Supabase, vá em <strong>Project Settings</strong> (ícone de engrenagem) &gt; <strong>API</strong>. Copie o <strong>Project URL</strong> e a chave <strong>anon public API Key</strong>.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-6 h-6 shrink-0 bg-chocolate text-cream-light rounded-full flex items-center justify-center font-bold text-xs mt-0.5">4</span>
              <div>
                <p className="font-bold text-chocolate">Atualize seu arquivo de ambiente</p>
                <p className="text-chocolate-pale text-[11px]">Abra o arquivo <code className="bg-cream-medium px-1.5 py-0.5 rounded font-mono text-[10px]">C:\viva-doce-fidelidade\.env</code> no Bloco de Notas ou editor de código e cole as informações copiadas:</p>
                <pre className="mt-2 bg-chocolate text-cream-light p-3 rounded-xl font-mono text-[10px] overflow-x-auto whitespace-pre">
{`VITE_SUPABASE_URL=seu_url_do_projeto
VITE_SUPABASE_ANON_KEY=sua_chave_anon`}
                </pre>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-6 h-6 shrink-0 bg-chocolate text-cream-light rounded-full flex items-center justify-center font-bold text-xs mt-0.5">5</span>
              <div>
                <p className="font-bold text-chocolate">Reinicie o Servidor</p>
                <p className="text-chocolate-pale text-[11px]">Feche o terminal do servidor atual pressionando <kbd className="bg-cream-medium px-1.5 py-0.5 rounded font-sans text-[10px] font-bold">Ctrl + C</kbd> e inicie novamente com <code className="bg-cream-medium px-1.5 py-0.5 rounded font-mono text-[10px] font-bold text-chocolate">npm run dev</code> para carregar as credenciais configuradas.</p>
              </div>
            </div>
          </div>
          
          <div className="pt-3 text-center text-[10px] text-chocolate-pale border-t border-cream-medium flex justify-between items-center opacity-75">
            <span>Viva Doce © {new Date().getFullYear()}</span>
            <span>Evitando telas brancas 🍫</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans antialiased text-chocolate select-none">
      
      {/* Navigation Header */}
      <Header
        isAdmin={!!session}
        onLogout={handleLogout}
        onToggleView={handleToggleView}
        currentView={view}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {view === 'client' && <ClientView />}
        
        {view === 'admin_login' && (
          <AdminLogin onLoginSuccess={() => setView('admin_dashboard')} />
        )}
        
        {view === 'admin_dashboard' && session && (
          <AdminDashboard adminEmail={session.user.email || 'admin@vivadoce.com'} />
        )}
      </main>

    </div>
  );
}

export default App;
