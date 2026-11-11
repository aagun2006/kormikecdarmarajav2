import React from 'react';
import { LayoutDashboard, FileText, PlusCircle, UserCircle, Users, LogIn } from 'lucide-react';
import { UserRole } from '../../types';
import { NavPageId } from './Sidebar';

interface MobileNavProps {
  activePage: NavPageId;
  onNavigate: (page: NavPageId) => void;
  userRole?: UserRole | null;
  onOpenNewReport?: () => void;
  onOpenLogin?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activePage,
  onNavigate,
  userRole,
  onOpenNewReport,
  onOpenLogin,
}) => {
  const isPublic = !userRole;

  if (isPublic) {
    return (
      <div
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-6 py-2 flex items-center justify-around shadow-lg"
      >
        <button
          id="mobile-nav-dashboard"
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors ${
            activePage === 'dashboard' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[11px]">Dashboard Publik</span>
        </button>

        <button
          id="mobile-nav-login"
          onClick={onOpenLogin}
          className="flex items-center gap-2 py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
        >
          <LogIn className="w-4 h-4" />
          <span>Masuk Akun</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg"
    >
      <button
        id="mobile-nav-dashboard"
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
          activePage === 'dashboard' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px]">Dashboard</span>
      </button>

      <button
        id="mobile-nav-laporan"
        onClick={() => onNavigate('laporan')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
          activePage === 'laporan' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <FileText className="w-5 h-5" />
        <span className="text-[10px]">{userRole === 'Kader' ? 'Laporan' : 'Semua Lap.'}</span>
      </button>

      {/* Floating Center Input Action */}
      {onOpenNewReport && (
        <button
          id="mobile-nav-quick-add"
          onClick={onOpenNewReport}
          className="flex flex-col items-center justify-center -mt-5 bg-emerald-600 text-white w-12 h-12 rounded-full shadow-lg shadow-emerald-600/40 hover:bg-emerald-700 active:scale-95 transition-all"
          aria-label="Input Laporan Baru"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      )}

      {userRole !== 'Kader' ? (
        <button
          id="mobile-nav-users"
          onClick={() => onNavigate('users')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activePage === 'users' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Users</span>
        </button>
      ) : (
        <button
          id="mobile-nav-input"
          onClick={() => onNavigate('input-laporan')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activePage === 'input-laporan' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px]">Input</span>
        </button>
      )}

      <button
        id="mobile-nav-profile"
        onClick={() => onNavigate('profile')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
          activePage === 'profile' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <UserCircle className="w-5 h-5" />
        <span className="text-[10px]">Profil</span>
      </button>
    </div>
  );
};
