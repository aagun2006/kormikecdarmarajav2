import React, { useState, ReactNode } from 'react';
import { Sidebar, NavPageId } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { UserSession } from '../../types';

interface MainLayoutProps {
  session?: UserSession | null;
  activePage: NavPageId;
  onNavigate: (page: NavPageId) => void;
  onLogout: () => void;
  onOpenLogin?: () => void;
  onOpenNewReport?: () => void;
  hasCustomApiUrl: boolean;
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  session,
  activePage,
  onNavigate,
  onLogout,
  onOpenLogin,
  onOpenNewReport,
  hasCustomApiUrl,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div id="app-root-layout" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Sidebar Desktop & Drawer Mobile */}
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        userRole={session?.role}
        userName={session?.nama}
        userDesa={session?.namaDesa}
        onLogout={onLogout}
        onOpenLogin={onOpenLogin}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Body */}
      <div className="lg:pl-72 flex flex-col flex-1 pb-20 lg:pb-8">
        {/* Top Header */}
        <Header
          activePage={activePage}
          userRole={session?.role}
          userName={session?.nama}
          userDesa={session?.namaDesa}
          hasCustomApiUrl={hasCustomApiUrl}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={onNavigate}
          onOpenNewReport={session ? onOpenNewReport : undefined}
          onOpenLogin={onOpenLogin}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          activePage={activePage}
          onNavigate={onNavigate}
          userRole={session?.role}
          onOpenNewReport={session ? onOpenNewReport : undefined}
          onOpenLogin={onOpenLogin}
        />
      </div>
    </div>
  );
};
