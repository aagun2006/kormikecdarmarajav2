import React, { useState } from 'react';
import { Activity, Lock, User, Eye, EyeOff, Loader2, Sparkles, Shield, UserCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast/Toast';
import { UserSession } from '../../types';
import { APP_NAME, APP_SHORT_NAME, APP_TAGLINE } from '../../constants/config';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
  onBackToPublic?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToPublic }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Username wajib diisi.');
      return;
    }
    if (!password) {
      setErrorMessage('Password wajib diisi.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.login(username.trim(), password);

      if (res.success && res.data) {
        toast.success(`Selamat datang, ${res.data.nama}!`);
        onLoginSuccess(res.data);
      } else {
        setErrorMessage(res.message || 'Login gagal. Periksa kembali username dan password Anda.');
      }
    } catch (err: any) {
      setErrorMessage('Terjadi masalah saat memproses autentikasi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div
      id="login-page-root"
      className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden"
    >
      {/* Background Sporty Glow Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20">
          {onBackToPublic && (
            <div className="mb-4 -mt-2">
              <button
                type="button"
                id="login-back-to-public-btn"
                onClick={onBackToPublic}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Lihat Dashboard Publik</span>
              </button>
            </div>
          )}

          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-emerald-600 via-teal-600 to-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/20 mb-4 transform hover:scale-105 transition-transform">
              <Activity className="w-9 h-9 text-white" />
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3 h-3 text-amber-600" /> KORMI KECAMATAN DARMARAJA
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {APP_NAME}
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Monitoring Aktivitas Senam
            </p>
            <p className="text-xs font-semibold text-emerald-700 italic mt-1.5">
              &ldquo;{APP_TAGLINE}&rdquo;
            </p>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div
              id="login-error-banner"
              className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-center gap-2 animate-shake"
            >
              <div className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          KORMI Kecamatan Darmaraja • KORMI Kabupaten Sumedang
        </p>
      </div>
    </div>
  );
};
