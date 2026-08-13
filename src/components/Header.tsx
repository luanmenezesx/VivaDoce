import React from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  onLogout?: () => void;
  onToggleView: (view: 'client' | 'admin_login' | 'admin_dashboard') => void;
  currentView: string;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onLogout,
  onToggleView,
  currentView,
}) => {
  return (
    <header className="w-full py-4 px-6 bg-cream-medium/80 backdrop-blur-md border-b border-cream-dark sticky top-0 z-40 flex items-center justify-between">
      {/* Brand Name */}
      <div 
        onClick={() => onToggleView(isAdmin ? 'admin_dashboard' : 'client')}
        className="flex flex-col cursor-pointer group"
      >
        <span className="text-2xl font-black tracking-tight text-chocolate leading-none">Viva Doce</span>
        <span className="text-xs uppercase tracking-widest text-chocolate-pale font-bold mt-1">Fidelidade</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {isAdmin ? (
          <>
            <button
              onClick={() => onToggleView(currentView === 'admin_dashboard' ? 'client' : 'admin_dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-chocolate text-chocolate hover:bg-chocolate hover:text-cream-light transition-all cursor-pointer"
            >
              {currentView === 'admin_dashboard' ? (
                <>
                  <span className="hidden sm:inline">Ver como </span>Cliente
                </>
              ) : (
                <>
                  Painel<span className="hidden sm:inline"> Admin</span>
                </>
              )}
            </button>
            <button
              onClick={onLogout}
              className="flex items-center justify-center p-2 rounded-full hover:bg-cream-dark/50 text-chocolate transition-colors cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onToggleView(currentView === 'admin_login' ? 'client' : 'admin_login')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-full text-chocolate hover:bg-cream-dark/50 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};
