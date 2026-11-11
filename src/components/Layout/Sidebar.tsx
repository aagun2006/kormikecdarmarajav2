import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Dumbbell,
  MapPin,
  Users,
  ShieldCheck,
  UserCircle,
  LogOut,
  LogIn,
  Code2,
  Activity,
  X,
  Sparkles,
  Globe,
} from 'lucide-react';

// --- Mocks to make it a standalone runnable file ---
export type UserRole = 'Admin' | 'Koordinator' | 'Kader' | 'Public';
export type NavPageId =
  | 'dashboard'
  | 'laporan'
  | 'input-laporan'
  | 'jenis-senam'
  | 'desa'
  | 'users'
  | 'audit-log'
  | 'profile'
  | 'gas-guide'
  | 'login';

const APP_SHORT_NAME = 'KORMI App';
const APP_TAGLINE = 'Sehat Bugar Gembira Luar Biasa';
const APP_VERSION = '2.0.0';

export const getRoleBadge = (role: UserRole | string | null | undefined): { label: string; bg: string; text: string } | null => {
  if (!role) return null;
  switch (role) {
    case 'Admin':
      return { label: 'Admin', bg: 'bg-indigo-100 text-indigo-700', text: 'text-indigo-700' };
    case 'Koordinator':
      return { label: 'Koordinator', bg: 'bg-blue-100 text-blue-700', text: 'text-blue-700' };
    case 'Kader':
      return { label: 'Kader Desa', bg: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700' };
    default:
      return { label: role, bg: 'bg-slate-100 text-slate-700', text: 'text-slate-700' };
  }
};
// ----------------------------------------------------

interface SidebarProps {
  activePage: NavPageId;
  onNavigate: (page: NavPageId) => void;
  userRole?: UserRole | null;
  userName?: string | null;
  userDesa?: string | null;
  onLogout: () => void;
  onOpenLogin?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage = 'dashboard', // default for preview
  onNavigate = () => {},
  userRole = 'Public',      // <--- Ubah jadi 'Public' (atau null)
  userName = null,          // <--- Ubah jadi null
  userDesa = null,          // <--- Ubah jadi null
  onLogout = () => {},
  onOpenLogin = () => {},
  isOpenMobile = true, 
  onCloseMobile = () => {},
}) => {
  const isPublic = !userRole || userRole === 'Public';
  const roleBadge = userRole ? getRoleBadge(userRole) : null;

  const navItems = [
    {
      id: 'dashboard' as NavPageId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Koordinator', 'Kader'] as UserRole[],
    },
    // Kader specific quick input
    {
      id: 'input-laporan' as NavPageId,
      label: 'Input Laporan',
      icon: PlusCircle,
      badge: 'Baru',
      roles: ['Kader'] as UserRole[],
    },
    {
      id: 'laporan' as NavPageId,
      label: userRole === 'Kader' ? 'Laporan Saya' : 'Laporan Senam',
      icon: FileText,
      roles: ['Admin', 'Koordinator', 'Kader'] as UserRole[],
    },
    {
      id: 'jenis-senam' as NavPageId,
      label: 'Jenis Senam',
      icon: Dumbbell,
      roles: ['Admin', 'Koordinator'] as UserRole[],
    },
    {
      id: 'desa' as NavPageId,
      label: 'Data Desa',
      icon: MapPin,
      roles: ['Admin', 'Koordinator'] as UserRole[],
    },
    {
      id: 'users' as NavPageId,
      label: userRole === 'Koordinator' ? 'Data Kader' : 'Users / Kader',
      icon: Users,
      roles: ['Admin', 'Koordinator'] as UserRole[],
    },
    {
      id: 'audit-log' as NavPageId,
      label: 'Audit Log',
      icon: ShieldCheck,
      roles: ['Admin'] as UserRole[],
    },
    {
      id: 'gas-guide' as NavPageId,
      label: 'Apps Script & Setup',
      icon: Code2,
      roles: ['Admin'] as UserRole[],
    },
    {
      id: 'profile' as NavPageId,
      label: 'Profil Saya',
      icon: UserCircle,
      roles: ['Admin', 'Koordinator', 'Kader'] as UserRole[],
    },
  ];

  const allowedNav = isPublic
    ? [{ id: 'dashboard' as NavPageId, label: 'Dashboard Publik', icon: LayoutDashboard }]
    : navItems.filter((item) => userRole && item.roles.includes(userRole));

  const handleItemClick = (pageId: NavPageId) => {
    onNavigate(pageId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo KORMI menggantikan icon Activity */}
              <img
                src="https://iconlogovector.com/uploads/images/2026/02/lg-698670722ef4a-KORMI.webp"
                alt="Logo KORMI"
                className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shadow-md shrink-0"
              />
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>{APP_SHORT_NAME}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded-sm border border-emerald-500/30">
                    V.2
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide truncate max-w-[150px]">
                  Kecamatan Darmaraja
                </p>
              </div>
            </div>

            <button
              id="sidebar-close-mobile-btn"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Tutup menu navigasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Snapshot Card or Public Visitor Card */}
          {isPublic ? (
            <div className="mx-4 my-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-100 truncate">Pengunjung Publik</p>
                  <p className="text-[10px] text-emerald-400 font-medium">Mode Akses Terbuka</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-4 my-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-100 truncate">{userName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {roleBadge && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${roleBadge.bg}`}>
                        {roleBadge.label}
                      </span>
                    )}
                    {userDesa && (
                      <span className="text-[10px] text-slate-400 truncate">
                        • {userDesa}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-290px)]">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Menu Navigasi
            </p>
            {allowedNav.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {'badge' in item && item.badge && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & Tagline */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-800/40 text-center">
            <p className="text-[11px] font-semibold text-emerald-300 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>&ldquo;{APP_TAGLINE}&rdquo;</span>
            </p>
          </div>

          {isPublic ? (
            <button
              id="sidebar-login-btn"
              onClick={() => {
                onCloseMobile();
                if (onOpenLogin) onOpenLogin();
                else onNavigate('login');
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Akun Pengurus</span>
            </button>
          ) : (
            <button
              id="sidebar-logout-btn"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-950/50 rounded-xl border border-rose-900/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Aplikasi</span>
            </button>
          )}

          <p className="text-center text-[10px] text-slate-500">
            KORMI Darmaraja • v{APP_VERSION}
          </p>
        </div>
      </aside>
    </>
  );
};

export default function App() {
  const [active, setActive] = useState<NavPageId>('dashboard');
  
  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Simulation Wrapper */}
      <div className="relative flex w-full">
        <Sidebar 
          activePage={active} 
          onNavigate={(page) => setActive(page)} 
          isOpenMobile={true} 
          onCloseMobile={() => {}} 
          onLogout={() => {}}
        />
        
        {/* Main Content Area Simulation (Offset by sidebar width 72/288px) */}
        <main className="flex-1 ml-72 p-8">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-2xl">
             <h1 className="text-xl font-bold text-slate-800 mb-2">Simulasi Sidebar</h1>
             <p className="text-slate-600 mb-4">
               Logo KORMI sekarang sudah terpasang dengan cantik di sudut kiri atas sidebar.
             </p>
             <p className="text-sm text-slate-500">
               Halaman Aktif saat ini: <span className="font-semibold text-emerald-600">{active}</span>
             </p>
           </div>
        </main>
      </div>
    </div>
  );
}