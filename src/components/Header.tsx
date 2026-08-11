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
      {/* Brand Logo & Name */}
      <div 
        onClick={() => onToggleView(isAdmin ? 'admin_dashboard' : 'client')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-full bg-cream-light border-2 border-chocolate flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
          {/* Custom SVG Viva Doce Logo */}
          <svg viewBox="0 0 100 100" className="w-9 h-9">
            <style>
              {`
                .logo-text { font-family: 'Playfair Display', 'Georgia', serif; font-weight: bold; fill: #4A3728; }
                .donut-body { fill: #C68E65; stroke: #4A3728; stroke-width: 3; }
                .donut-frosting { fill: #E8A598; }
                .donut-hole { fill: #FBF9F6; stroke: #4A3728; stroke-width: 2.5; }
              `}
            </style>
            
            {/* "viva" text */}
            <text x="50" y="32" fontSize="22" textAnchor="middle" className="logo-text" letterSpacing="-0.5">viva</text>
            
            {/* "d" */}
            <text x="24" y="68" fontSize="24" textAnchor="middle" className="logo-text">d</text>
            
            {/* "o" (Donut/Cookie with a bite) */}
            <g transform="translate(41.5, 48)">
              {/* Donut Body */}
              <circle cx="8" cy="14" r="10" className="donut-body" />
              {/* Donut Frosting */}
              <path d="M 0.5,10 A 10,10 0 0,1 15.5,10 Q 13,11 11,10 Q 8,13 5,11 Q 2,12 0.5,10 Z" className="donut-frosting" />
              {/* Donut Hole */}
              <circle cx="8" cy="14" r="3.5" className="donut-hole" />
              {/* Bite Mark (semi-circle cutting into it) */}
              <circle cx="16.5" cy="8" r="4.5" fill="#EDE7DB" />
              <circle cx="16.5" cy="8" r="4.5" fill="#FBF9F6" className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </g>
            
            {/* "ce" */}
            <text x="69" y="68" fontSize="24" textAnchor="middle" className="logo-text" letterSpacing="-0.5">ce</text>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-chocolate leading-none">viva doce</span>
          <span className="text-[10px] uppercase tracking-widest text-chocolate-pale font-bold">Fidelidade</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {isAdmin ? (
          <>
            <button
              onClick={() => onToggleView(currentView === 'admin_dashboard' ? 'client' : 'admin_dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border border-chocolate text-chocolate hover:bg-chocolate hover:text-cream-light transition-all"
            >
              {currentView === 'admin_dashboard' ? 'Ver como Cliente' : 'Painel Admin'}
            </button>
            <button
              onClick={onLogout}
              className="flex items-center justify-center p-2 rounded-full hover:bg-cream-dark/50 text-chocolate transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onToggleView(currentView === 'admin_login' ? 'client' : 'admin_login')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full text-chocolate hover:bg-cream-dark/50 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Área do Admin
          </button>
        )}
      </div>
    </header>
  );
};
