import React, { useState } from 'react';
import { Menu, Plus, Cloud, CloudOff, LogIn, Globe, User as UserIcon } from 'lucide-react';

// Defining inline types and mock utility functions to ensure the component is self-contained
export type UserRole = 'Admin' | 'Koordinator' | 'Kader' | 'Public';
export type NavPageId = 'dashboard' | 'laporan' | 'input-laporan' | 'jenis-senam' | 'desa' | 'users' | 'audit-log' | 'gas-guide' | 'profile';

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

interface HeaderProps {
  activePage: NavPageId;
  userRole?: UserRole | null;
  userName?: string | null;
  userDesa?: string | null;
  hasCustomApiUrl: boolean;
  onOpenMobileSidebar: () => void;
  onNavigate: (page: NavPageId) => void;
  onOpenNewReport?: () => void;
  onOpenLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage = 'dashboard', // Default props for preview
  userRole = 'Kader',      // Default props for preview
  userName = 'Pengguna Uji',// Default props for preview
  userDesa,
  hasCustomApiUrl = true,  // Default props for preview
  onOpenMobileSidebar = () => console.log('Open Sidebar'),
  onNavigate = (page) => console.log('Navigate to:', page),
  onOpenNewReport = () => console.log('Open New Report'),
  onOpenLogin = () => console.log('Open Login'),
}) => {
  const isPublic = !userRole || userRole === 'Public';
  const roleBadge = userRole ? getRoleBadge(userRole) : null;

  const getPageTitle = (page: NavPageId): { title: string; subtitle: string } => {
    switch (page) {
      case 'dashboard':
        return {
          title: 'Dashboard Monitoring',
          subtitle: 'Statistik & Analisis Kegiatan Senam KORMI Kecamatan Darmaraja',
        };
      case 'laporan':
        return {
          title: userRole === 'Kader' ? 'Laporan Saya' : 'Laporan Senam',
          subtitle: 'Daftar dokumentasi dan absensi kegiatan senam seluruh desa',
        };
      case 'input-laporan':
        return {
          title: 'Input Laporan Kegiatan',
          subtitle: 'Catat absensi dan unggah dokumentasi foto kamera kegiatan',
        };
      case 'jenis-senam':
        return {
          title: 'Master Jenis Senam',
          subtitle: 'Kelola kategori senam resmi KORMI Kecamatan & Desa',
        };
      case 'desa':
        return {
          title: 'Master Data Desa',
          subtitle: 'Daftar 12 Desa di wilayah Kecamatan Darmaraja',
        };
      case 'users':
        return {
          title: userRole === 'Koordinator' ? 'Manajemen Kader' : 'Manajemen Users & Role',
          subtitle: 'Hak akses login Admin, Koordinator, dan Kader Desa',
        };
      case 'audit-log':
        return {
          title: 'Audit Log Sistem',
          subtitle: 'Rekam jejak aktivitas, CRUD, dan autentikasi pengguna',
        };
      case 'gas-guide':
        return {
          title: 'Apps Script & Database Setup',
          subtitle: 'Source code modular Google Apps Script & Deployment Guide',
        };
      case 'profile':
        return {
          title: 'Profil Pengguna',
          subtitle: 'Informasi akun dan konfigurasi koneksi API Google Sheets',
        };
      default:
        return { title: 'KORMI Darmaraja V.2', subtitle: 'Monitoring Senam' };
    }
  };

  const { title, subtitle } = getPageTitle(activePage);

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-sm w-full"
    >
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        
        {/* Left: Mobile Toggle, Logo, & Page Title */}
        <div className="flex items-center gap-3">
          <button
            id="header-sidebar-toggle-btn"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo KORMI */}
          <img 
            src="https://iconlogovector.com/uploads/images/2026/02/lg-698670722ef4a-KORMI.webp" 
            alt="Logo KORMI" 
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-sm shrink-0 rounded-full bg-white p-0.5 border border-slate-100"
          />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span>{title}</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block truncate max-w-md">{subtitle}</p>
          </div>
        </div>

        {/* Right: Actions, API status, Profile or Login */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Quick Add Laporan Button (Logged in only) */}
          {!isPublic && onOpenNewReport && (
            <button
              id="header-quick-add-laporan-btn"
              onClick={onOpenNewReport}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all shrink-0 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Input Laporan</span>
              <span className="sm:hidden">Lapor</span>
            </button>
          )}

          {/* Public Login Button / State */}
          {isPublic ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[11px]">Mode Publik</span>
              </span>

              <button
                id="header-login-btn"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Akun</span>
              </button>
            </div>
          ) : (
            <>
              {/* Apps Script Connection Indicator */}
              <button
                id="header-api-status-btn"
                onClick={() => onNavigate('profile')}
                title={
                  hasCustomApiUrl
                    ? 'Terhubung ke Google Apps Script Web App'
                    : 'Mode Penyimpanan Lokal Aktif (Klik untuk konfigurasi GAS URL)'
                }
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  hasCustomApiUrl
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {hasCustomApiUrl ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px]">GAS Live</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px]">Local Mode</span>
                  </>
                )}
              </button>

              {/* User Profile Pill */}
              <button
                id="header-profile-pill-btn"
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-50 text-left transition-colors border border-transparent hover:border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  {userName ? userName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                    {userName || 'User'}
                  </p>
                  {roleBadge && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md mt-0.5 inline-block ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                  )}
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

// Simple wrapper to mount the component for preview
export default function App() {
  const [isPublic, setIsPublic] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 w-full flex flex-col font-sans">
      <Header 
        activePage="dashboard" 
        userRole={isPublic ? null : 'Kader'} 
        userName={isPublic ? null : "Budi Santoso"}
        hasCustomApiUrl={true}
        onOpenMobileSidebar={() => {}}
        onNavigate={(p) => console.log('Navigated to', p)}
      />
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h1 className="text-xl font-bold text-slate-800 mb-2">Simulasi Header</h1>
           <p className="text-slate-600 mb-6">Logo KORMI telah berhasil ditambahkan di sebelah kiri judul. Coba ubah mode pengguna untuk melihat perubahan state pada header.</p>
           
           <div className="flex gap-4">
             <button 
                onClick={() => setIsPublic(!isPublic)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors border border-slate-300"
             >
               Ganti ke Mode {isPublic ? 'Login' : 'Publik'}
             </button>
           </div>
        </div>
      </main>
    </div>
  );
}