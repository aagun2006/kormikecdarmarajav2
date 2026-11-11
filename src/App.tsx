import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/Toast/Toast';
import { UserSession, LaporanSenam, Desa, JenisSenam, User } from './types';
import { storage } from './services/storage';
import { api } from './services/api';
import { LoginPage } from './pages/Login/LoginPage';
import { MainLayout } from './components/Layout/MainLayout';
import { NavPageId } from './components/Layout/Sidebar';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { LaporanListPage } from './pages/Laporan/LaporanListPage';
import { LaporanFormModal } from './pages/Laporan/LaporanFormModal';
import { LaporanDetailModal } from './pages/Laporan/LaporanDetailModal';
import { PhotoLightboxModal } from './components/Modal/PhotoLightboxModal';
import { DesaPage } from './pages/Desa/DesaPage';
import { JenisSenamPage } from './pages/JenisSenam/JenisSenamPage';
import { UsersPage } from './pages/Users/UsersPage';
import { AuditLogPage } from './pages/AuditLog/AuditLogPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { GasDeploymentGuidePage } from './pages/GasDocs/GasDeploymentGuidePage';

function AppContent() {
  const toast = useToast();

  // Active user session
  const [session, setSession] = useState<UserSession | null>(() => storage.getSession());
  const [activePage, setActivePage] = useState<NavPageId>('dashboard');
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [hasCustomApiUrl, setHasCustomApiUrl] = useState<boolean>(() => Boolean(storage.getApiUrl()));

  // Global Quick Add Report Modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [globalDesaList, setGlobalDesaList] = useState<Desa[]>([]);
  const [globalJenisList, setGlobalJenisList] = useState<JenisSenam[]>([]);
  const [globalUsersList, setGlobalUsersList] = useState<User[]>([]);

  // Global Detail Modal (for dashboard clicks)
  const [detailReport, setDetailReport] = useState<LaporanSenam | null>(null);

  // Global Lightbox Modal
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string | undefined>();

  // Fetch reference data
  const loadReferenceData = async () => {
    try {
      const [desaRes, jsRes, usersRes] = await Promise.all([
        api.getDesa(),
        api.getJenisSenam(),
        api.getUsers(),
      ]);
      if (desaRes.success && desaRes.data) setGlobalDesaList(desaRes.data);
      if (jsRes.success && jsRes.data) setGlobalJenisList(jsRes.data);
      if (usersRes.success && usersRes.data) setGlobalUsersList(usersRes.data);
    } catch {
      // Handled silently
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, [session]);

  const handleLoginSuccess = (newSession: UserSession) => {
    storage.setSession(newSession);
    setSession(newSession);
    setShowLoginPage(false);
    setActivePage('dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // local cleanup regardless
    }
    setSession(null);
    setShowLoginPage(false);
    setActivePage('dashboard');
    toast.info('Anda telah keluar dari aplikasi.');
  };

  const handleNavigate = (page: NavPageId) => {
    if (page === 'login') {
      setShowLoginPage(true);
      return;
    }

    // Role access control redirects
    if (!session) {
      if (page !== 'dashboard') {
        toast.info('Silakan masuk akun terlebih dahulu untuk mengakses menu ini.');
        setShowLoginPage(true);
        return;
      }
    } else {
      if (page === 'input-laporan') {
        setIsQuickAddOpen(true);
        return;
      }
      if (session.role === 'Kader' && ['jenis-senam', 'desa', 'users', 'audit-log', 'gas-guide'].includes(page)) {
        toast.warning('Akses dibatasi. Menu ini khusus untuk Administrator dan Koordinator.');
        setActivePage('dashboard');
        return;
      }
      if (session.role === 'Koordinator' && ['audit-log', 'gas-guide'].includes(page)) {
        toast.warning('Akses dibatasi. Menu ini khusus untuk Administrator.');
        setActivePage('dashboard');
        return;
      }
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user requested login page
  if (showLoginPage && !session) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToPublic={() => setShowLoginPage(false)}
      />
    );
  }

  // Render Page Content based on Active Navigation
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            session={session}
            onOpenReportDetail={(rep) => setDetailReport(rep)}
            onNavigateToLaporan={() => {
              if (session) {
                setActivePage('laporan');
              } else {
                toast.info('Silakan login untuk membuka halaman manajemen laporan lengkap.');
                setShowLoginPage(true);
              }
            }}
            onOpenNewReport={session ? () => setIsQuickAddOpen(true) : undefined}
            onOpenLogin={() => setShowLoginPage(true)}
          />
        );
      case 'laporan':
        if (!session) {
          return (
            <DashboardPage
              session={session}
              onOpenReportDetail={(rep) => setDetailReport(rep)}
              onOpenLogin={() => setShowLoginPage(true)}
            />
          );
        }
        return <LaporanListPage session={session} />;
      case 'desa':
        return session ? <DesaPage session={session} /> : null;
      case 'jenis-senam':
        return session ? <JenisSenamPage session={session} /> : null;
      case 'users':
        return session ? <UsersPage session={session} /> : null;
      case 'audit-log':
        return session ? <AuditLogPage session={session} /> : null;
      case 'gas-guide':
        return session ? <GasDeploymentGuidePage /> : null;
      case 'profile':
        return session ? (
          <ProfilePage
            session={session}
            onLogout={handleLogout}
            onApiUrlChanged={() => setHasCustomApiUrl(Boolean(storage.getApiUrl()))}
            onSessionUpdated={(updated) => {
              setSession(updated);
              loadReferenceData();
            }}
          />
        ) : null;
      default:
        return (
          <DashboardPage
            session={session}
            onOpenReportDetail={(rep) => setDetailReport(rep)}
            onOpenLogin={() => setShowLoginPage(true)}
          />
        );
    }
  };

  return (
    <MainLayout
      session={session}
      activePage={activePage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onOpenLogin={() => setShowLoginPage(true)}
      onOpenNewReport={session ? () => setIsQuickAddOpen(true) : undefined}
      hasCustomApiUrl={hasCustomApiUrl}
    >
      {renderPage()}

      {/* Global Quick Add / Input Laporan Modal */}
      {isQuickAddOpen && (
        <LaporanFormModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          onSuccess={() => {
            setIsQuickAddOpen(false);
            // Refresh reference data
            loadReferenceData();
            // If on dashboard or laporan page, re-render happens naturally
          }}
          session={session}
          desaList={globalDesaList}
          jenisSenamList={globalJenisList}
          usersList={globalUsersList}
        />
      )}

      {/* Global Report Detail Modal */}
      {detailReport && (
        <LaporanDetailModal
          isOpen={Boolean(detailReport)}
          onClose={() => setDetailReport(null)}
          report={detailReport}
          onOpenLightbox={(url, cap) => {
            setLightboxUrl(url);
            setLightboxCaption(cap);
          }}
        />
      )}

      {/* Global Photo Lightbox Zoom Modal */}
      {lightboxUrl && (
        <PhotoLightboxModal
          isOpen={Boolean(lightboxUrl)}
          onClose={() => {
            setLightboxUrl(null);
            setLightboxCaption(undefined);
          }}
          imageUrl={lightboxUrl}
          caption={lightboxCaption}
        />
      )}
    </MainLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
