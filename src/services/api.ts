import { DEFAULT_GAS_API_URL } from '../constants/config';
import {
  ApiResponse,
  AuditLog,
  DashboardFilter,
  DashboardStats,
  Desa,
  JenisSenam,
  LaporanSenam,
  SenamDesaTeraktifItem,
  SenamTerbanyakItem,
  User,
  UserRole,
  UserSession,
} from '../types';
import { getCustomApiUrl, getLocalDb, getStoredSession, saveLocalDb, storage } from './storage';

function getEffectiveApiUrl(): string {
  const custom = getCustomApiUrl();
  if (custom && custom.trim() !== '') return custom.trim();
  return DEFAULT_GAS_API_URL || '';
}

/**
 * Universal request wrapper to communicate with Google Apps Script Web App
 */
async function callAppsScript<T = any>(
  action: string,
  payload: Record<string, any> = {},
  isGet = false
): Promise<ApiResponse<T>> {
  const apiUrl = getEffectiveApiUrl();
  const session = getStoredSession();

  // If no Google Apps Script URL is set, process via built-in high fidelity storage engine
  if (!apiUrl) {
    return handleLocalFallback<T>(action, payload, session);
  }

  try {
    const token =
      session?.token ||
      (session?.idUser
        ? `${session.idUser}|${session.username || ''}|${session.role || ''}|${Date.now()}`
        : '');

    // PERBAIKAN UTAMA: Letakkan ...payload di bagian PALING BAWAH 
    // agar idUser kader yang dikirim dari form tidak tertimpa idUser admin yang login.
    const authPayload = {
      action,
      token,
      auth: token,
      currentSessionUserId: session?.idUser || '',
      ...payload, 
    };

    let resultData: ApiResponse<T>;

    if (isGet) {
      const queryParams = new URLSearchParams({
        action,
        token,
        auth: token,
        ...(session?.idUser ? { idUser: session.idUser } : {}),
        _t: Date.now().toString(), // Anti-cache parameter to guarantee fresh database query
        ...payload,
      }).toString();

      // IMPORTANT: Do NOT include Cache-Control, Pragma, or Content-Type headers
      // Adding them causes the browser to trigger CORS preflight OPTIONS requests, which GAS rejects!
      const res = await fetch(`${apiUrl}?${queryParams}`, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      resultData = await res.json();
    } else {
      // IMPORTANT: For Google Apps Script POST requests:
      // 1. Content-Type MUST be 'text/plain;charset=utf-8' (simple CORS request, NO OPTIONS preflight)
      // 2. DO NOT include Cache-Control or Pragma headers
      // 3. redirect MUST be 'follow' because GAS redirects to script.googleusercontent.com
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(authPayload),
        redirect: 'follow',
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      resultData = await res.json();
    }

    // Sync successfully returned data to local DB cache for instant local mirror
    if (resultData && resultData.success) {
      try {
        const db = getLocalDb();
        if (action === 'getDesa' && Array.isArray(resultData.data)) {
          db.desa = resultData.data as any;
          saveLocalDb(db);
        } else if (action === 'getJenisSenam' && Array.isArray(resultData.data)) {
          db.jenisSenam = resultData.data as any;
          saveLocalDb(db);
        } else if (action === 'getUsers' && Array.isArray(resultData.data)) {
          db.users = resultData.data as any;
          saveLocalDb(db);
        } else if (action === 'getLaporan' && Array.isArray(resultData.data)) {
          db.laporan = resultData.data as any;
          saveLocalDb(db);
        } else if (action === 'getAuditLog' && Array.isArray(resultData.data)) {
          db.auditLogs = resultData.data as any;
          saveLocalDb(db);
        }
      } catch (syncErr) {
        console.warn('Local cache sync notice:', syncErr);
      }
    }

    return resultData;
  } catch (error: any) {
    console.error('Google Apps Script request error:', error);
    return {
      success: false,
      message: `Gagal berkomunikasi dengan Google Spreadsheet: ${error?.message || 'Koneksi gagal'}. Pastikan URL Web App benar dan di-deploy dengan akses 'Anyone'.`,
    };
  }
}

/**
 * High-Fidelity Local Processing Engine mirroring Google Apps Script RBAC & business rules
 */
function handleLocalFallback<T = any>(
  action: string,
  payload: Record<string, any>,
  providedSession: UserSession | null
): ApiResponse<T> {
  const session = providedSession || getStoredSession();
  const db = getLocalDb();
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const addAuditLog = (
    actionName: AuditLog['action'],
    tableName: AuditLog['tableName'],
    recordId: string,
    description: string
  ) => {
    const log: AuditLog = {
      idLog: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: nowStr,
      idUser: session?.idUser || 'SYSTEM',
      namaUser: session?.nama || 'System',
      role: session?.role || 'Admin',
      action: actionName,
      tableName,
      recordId,
      description,
    };
    db.auditLogs.unshift(log);
    saveLocalDb(db);
  };

  switch (action) {
    case 'login': {
      const { username, password } = payload;
      const user = db.users.find(
        (u) => u.username.toLowerCase() === (username || '').toLowerCase().trim()
      );

      if (!user) {
        return { success: false, message: 'Username tidak terdaftar.' };
      }
      if (user.status !== 'Aktif') {
        return { success: false, message: 'Akun Anda dinonaktifkan. Hubungi Administrator.' };
      }
      if (user.passwordHash && user.passwordHash !== password) {
        return { success: false, message: 'Password yang Anda masukkan salah.' };
      }

      const userSession: UserSession = {
        idUser: user.idUser,
        nama: user.nama,
        username: user.username,
        role: user.role,
        idDesa: user.idDesa,
        namaDesa: user.namaDesa,
        token: `${user.idUser}|${user.username}|${user.role}|${Date.now()}`,
      };

      addAuditLog('LOGIN', 'AUTH', user.idUser, `User ${user.nama} (${user.role}) berhasil login`);

      return {
        success: true,
        message: `Login berhasil. Selamat datang, ${user.nama}!`,
        data: userSession as any,
      };
    }

    case 'getDashboard':
    case 'getDashboardStats': {
      const filter = payload as DashboardFilter;
      const filteredReports = filterReports(db.laporan, filter);
      const currentMonthStr = new Date().toISOString().slice(0, 7);

      let totalKegiatan = 0;
      let totalPeserta = 0;
      let kegiatanBulanIni = 0;
      let pesertaBulanIni = 0;

      filteredReports.forEach((r) => {
        if (r.statusAbsensi === 'Hadir') {
          totalKegiatan += 1;
          totalPeserta += Number(r.jumlahPeserta) || 0;
          if (r.tanggal.startsWith(currentMonthStr)) {
            kegiatanBulanIni += 1;
            pesertaBulanIni += Number(r.jumlahPeserta) || 0;
          }
        }
      });

      const totalDesa = db.desa.filter((d) => d.status === 'Aktif').length;
      const totalKader = db.users.filter((u) => u.role === 'Kader' && u.status === 'Aktif').length;

      const stats: DashboardStats = {
        totalKegiatan,
        totalPeserta,
        totalDesa,
        totalKader,
        kegiatanBulanIni,
        pesertaBulanIni,
      };
      return { success: true, message: 'Dashboard stats loaded', data: stats as any };
    }

    case 'getSenamTerbanyak': {
      const filter = payload as DashboardFilter;
      const filtered = filterReports(db.laporan, filter);
      const map: Record<string, { jenisSenam: string; jumlahKegiatan: number; totalPeserta: number }> = {};

      filtered.forEach((r) => {
        if (!map[r.jenisSenam]) {
          map[r.jenisSenam] = { jenisSenam: r.jenisSenam, jumlahKegiatan: 0, totalPeserta: 0 };
        }
        map[r.jenisSenam].jumlahKegiatan += 1;
        map[r.jenisSenam].totalPeserta += Number(r.jumlahPeserta) || 0;
      });

      const list: SenamTerbanyakItem[] = Object.values(map).sort(
        (a, b) => b.jumlahKegiatan - a.jumlahKegiatan
      );
      return { success: true, message: 'OK', data: list as any };
    }

    case 'getSenamTeraktif': {
      const filter = payload as DashboardFilter;
      const filtered = filterReports(db.laporan, filter).filter((r) => r.jenisSenam === 'Senam Desa');
      const map: Record<string, SenamDesaTeraktifItem> = {};

      filtered.forEach((r) => {
        if (!map[r.idDesa]) {
          map[r.idDesa] = {
            idDesa: r.idDesa,
            namaDesa: r.namaDesa,
            totalKegiatan: 0,
            totalPeserta: 0,
          };
        }
        map[r.idDesa].totalKegiatan += 1;
        map[r.idDesa].totalPeserta += Number(r.jumlahPeserta) || 0;
      });

      const list: SenamDesaTeraktifItem[] = Object.values(map).sort(
        (a, b) => b.totalKegiatan - a.totalKegiatan
      );
      return { success: true, message: 'OK', data: list as any };
    }

    case 'getLaporan': {
      const filter = payload as DashboardFilter & { onlyMine?: boolean; idKader?: string };
      let list = filterReports(db.laporan, filter);

      if (session?.role === 'Kader' && filter.onlyMine) {
        list = list.filter((r) => r.idKader === session.idUser);
      }
      return { success: true, message: 'OK', data: list as any };
    }

    case 'saveLaporan': {
      if (!session) return { success: false, message: 'Sesi berakhir', code: 'SESSION_EXPIRED' };

      const {
        tanggal,
        jenisSenam,
        statusAbsensi,
        jumlahPeserta,
        fotoUrl,
        fotoBase64,
        captionFoto,
        sourceType,
      } = payload;

      if (!tanggal) return { success: false, message: 'Tanggal kegiatan wajib diisi.' };
      if (!jenisSenam) return { success: false, message: 'Jenis senam wajib dipilih.' };
      if (!statusAbsensi) return { success: false, message: 'Status absensi wajib dipilih.' };

      // STRICT PHOTO RULE: If Hadir, Photo is MANDATORY
      if (statusAbsensi === 'Hadir' && !fotoUrl && !fotoBase64) {
        return {
          success: false,
          message: "Kegiatan dengan status 'Hadir' WAJIB menyertakan foto dokumentasi kamera.",
        };
      }

      // Lock Kader ID & Desa if Kader role
      let idKader = session.idUser;
      let namaKader = session.nama;
      let idDesa = session.idDesa;
      let namaDesa = session.namaDesa;

      if (session.role === 'Admin' || session.role === 'Koordinator') {
        if (payload.idDesa) idDesa = payload.idDesa;
        if (payload.namaDesa) namaDesa = payload.namaDesa;
        if (payload.idKader) idKader = payload.idKader;
        if (payload.namaKader) namaKader = payload.namaKader;
      }

      const dateClean = tanggal.replace(/-/g, '');
      const count = db.laporan.length + 1;
      const idLaporan = `LAP-${dateClean}-${String(count).padStart(4, '0')}`;

      const newReport: LaporanSenam = {
        idLaporan,
        idDesa,
        namaDesa,
        idKader,
        namaKader,
        tanggal,
        jumlahPeserta: parseInt(jumlahPeserta, 10) || 0,
        jenisSenam,
        statusAbsensi,
        fotoUrl: fotoBase64 || fotoUrl || '',
        fotoFileId: `DRIVE_${Date.now()}`,
        captionFoto: captionFoto || '',
        sourceType: sourceType || (statusAbsensi === 'Hadir' ? 'CAMERA' : 'GALLERY'),
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      db.laporan.unshift(newReport);
      saveLocalDb(db);

      addAuditLog(
        'CREATE_LAPORAN',
        'LAPORAN_SENAM',
        idLaporan,
        `Input laporan senam ${jenisSenam} di ${namaDesa} (${jumlahPeserta || 0} peserta)`
      );

      return {
        success: true,
        message: 'Laporan kegiatan senam berhasil disimpan.',
        data: newReport as any,
      };
    }

    case 'updateLaporan': {
      if (!session) return { success: false, message: 'Sesi berakhir', code: 'SESSION_EXPIRED' };
      const idx = db.laporan.findIndex((l) => l.idLaporan === payload.idLaporan);
      if (idx === -1) return { success: false, message: 'Laporan tidak ditemukan.' };

      // Kader only can edit own report
      if (session.role === 'Kader' && db.laporan[idx].idKader !== session.idUser) {
        return { success: false, message: 'Anda tidak memiliki hak akses mengubah laporan ini.' };
      }

      const prev = db.laporan[idx];
      db.laporan[idx] = {
        ...prev,
        tanggal: payload.tanggal || prev.tanggal,
        jumlahPeserta: payload.jumlahPeserta !== undefined ? parseInt(payload.jumlahPeserta, 10) || 0 : prev.jumlahPeserta,
        jenisSenam: payload.jenisSenam || prev.jenisSenam,
        statusAbsensi: payload.statusAbsensi || prev.statusAbsensi,
        fotoUrl: payload.fotoBase64 || payload.fotoUrl || prev.fotoUrl,
        captionFoto: payload.captionFoto !== undefined ? payload.captionFoto : prev.captionFoto,
        sourceType: payload.sourceType || prev.sourceType,
        updatedAt: nowStr,
      };
      saveLocalDb(db);

      addAuditLog('UPDATE_LAPORAN', 'LAPORAN_SENAM', payload.idLaporan, `Update laporan ${payload.idLaporan}`);
      return { success: true, message: 'Laporan berhasil diperbarui.', data: db.laporan[idx] as any };
    }

    case 'deleteLaporan': {
      if (!session) return { success: false, message: 'Sesi berakhir', code: 'SESSION_EXPIRED' };
      if (session.role !== 'Admin' && session.role !== 'Koordinator') {
        return { success: false, message: 'Hanya Admin dan Koordinator yang dapat menghapus laporan.' };
      }
      const beforeLen = db.laporan.length;
      db.laporan = db.laporan.filter((l) => l.idLaporan !== payload.idLaporan);
      if (db.laporan.length === beforeLen) {
        return { success: false, message: 'Laporan tidak ditemukan.' };
      }
      saveLocalDb(db);

      addAuditLog('DELETE_LAPORAN', 'LAPORAN_SENAM', payload.idLaporan, `Hapus laporan ${payload.idLaporan}`);
      return { success: true, message: 'Laporan berhasil dihapus.' };
    }

    case 'getDesa': {
      return { success: true, message: 'OK', data: db.desa as any };
    }

    case 'saveDesa': {
      if (!session || session.role === 'Kader') {
        return { success: false, message: 'Akses ditolak.' };
      }
      const lastNum = db.desa.length + 1;
      const idDesa = `DSA-${String(lastNum).padStart(4, '0')}`;
      const newDesa: Desa = {
        idDesa,
        namaDesa: payload.namaDesa.trim(),
        status: payload.status || 'Aktif',
        createdAt: nowStr,
        updatedAt: nowStr,
      };
      db.desa.push(newDesa);
      saveLocalDb(db);
      addAuditLog('CREATE_DESA', 'DESA', idDesa, `Tambah desa: ${payload.namaDesa}`);
      return { success: true, message: 'Desa berhasil ditambahkan.', data: newDesa as any };
    }

    case 'updateDesa': {
      if (!session || session.role === 'Kader') {
        return { success: false, message: 'Akses ditolak.' };
      }
      const idx = db.desa.findIndex((d) => d.idDesa === payload.idDesa);
      if (idx === -1) return { success: false, message: 'Desa tidak ditemukan.' };
      db.desa[idx] = {
        ...db.desa[idx],
        namaDesa: payload.namaDesa || db.desa[idx].namaDesa,
        status: payload.status || db.desa[idx].status,
        updatedAt: nowStr,
      };
      saveLocalDb(db);
      addAuditLog('UPDATE_DESA', 'DESA', payload.idDesa, `Update desa ${payload.idDesa}`);
      return { success: true, message: 'Data desa berhasil diperbarui.' };
    }

    case 'deleteDesa': {
      if (!session || session.role !== 'Admin') {
        return { success: false, message: 'Hanya Admin yang dapat menghapus desa.' };
      }
      db.desa = db.desa.filter((d) => d.idDesa !== payload.idDesa);
      saveLocalDb(db);
      addAuditLog('DELETE_DESA', 'DESA', payload.idDesa, `Hapus desa ${payload.idDesa}`);
      return { success: true, message: 'Desa berhasil dihapus.' };
    }

    case 'getJenisSenam': {
      return { success: true, message: 'OK', data: db.jenisSenam as any };
    }

    case 'saveJenisSenam': {
      if (!session || session.role === 'Kader') {
        return { success: false, message: 'Akses ditolak.' };
      }
      const lastNum = db.jenisSenam.length + 1;
      const idJenis = `JS-${String(lastNum).padStart(4, '0')}`;
      const item: JenisSenam = {
        idJenis,
        namaJenis: payload.namaJenis.trim(),
        status: payload.status || 'Aktif',
        createdAt: nowStr,
        updatedAt: nowStr,
      };
      db.jenisSenam.push(item);
      saveLocalDb(db);
      addAuditLog('CREATE_JENIS_SENAM', 'JENIS_SENAM', idJenis, `Tambah jenis senam: ${payload.namaJenis}`);
      return { success: true, message: 'Jenis senam berhasil ditambahkan.', data: item as any };
    }

    case 'updateJenisSenam': {
      if (!session || session.role === 'Kader') {
        return { success: false, message: 'Akses ditolak.' };
      }
      const idx = db.jenisSenam.findIndex((j) => j.idJenis === payload.idJenis);
      if (idx === -1) return { success: false, message: 'Jenis senam tidak ditemukan.' };
      db.jenisSenam[idx] = {
        ...db.jenisSenam[idx],
        namaJenis: payload.namaJenis || db.jenisSenam[idx].namaJenis,
        status: payload.status || db.jenisSenam[idx].status,
        updatedAt: nowStr,
      };
      saveLocalDb(db);
      addAuditLog('UPDATE_JENIS_SENAM', 'JENIS_SENAM', payload.idJenis, `Update jenis senam ${payload.idJenis}`);
      return { success: true, message: 'Jenis senam berhasil diperbarui.' };
    }

    case 'deleteJenisSenam': {
      if (!session || session.role !== 'Admin') {
        return { success: false, message: 'Hanya Admin yang dapat menghapus jenis senam.' };
      }
      db.jenisSenam = db.jenisSenam.filter((j) => j.idJenis !== payload.idJenis);
      saveLocalDb(db);
      addAuditLog('DELETE_JENIS_SENAM', 'JENIS_SENAM', payload.idJenis, `Hapus jenis senam ${payload.idJenis}`);
      return { success: true, message: 'Jenis senam berhasil dihapus.' };
    }

    case 'getUsers': {
      if (!session || session.role === 'Kader') {
        return { success: false, message: 'Akses ditolak.' };
      }
      return { success: true, message: 'OK', data: db.users as any };
    }

    case 'saveUser': {
      if (!session || session.role === 'Kader') {
        return { success: false, message: 'Akses ditolak.' };
      }
      if (!payload.nama || !payload.username || !payload.password) {
        return { success: false, message: 'Nama, username, dan password wajib diisi.' };
      }

      let targetRole: UserRole = payload.role || 'Kader';
      if (session.role === 'Koordinator') {
        targetRole = 'Kader';
      }

      const exists = db.users.some((u) => u.username.toLowerCase() === payload.username.toLowerCase().trim());
      if (exists) {
        return { success: false, message: `Username '${payload.username}' sudah digunakan.` };
      }

      const lastNum = db.users.length + 1;
      const idUser = `USR-${String(lastNum).padStart(4, '0')}`;
      const newUser: User = {
        idUser,
        nama: payload.nama.trim(),
        username: payload.username.trim(),
        passwordHash: payload.password,
        role: targetRole,
        idDesa: payload.idDesa || '',
        namaDesa: payload.namaDesa || '',
        status: payload.status || 'Aktif',
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      db.users.push(newUser);
      saveLocalDb(db);
      addAuditLog('CREATE_USER', 'USERS', idUser, `Tambah user: ${payload.nama} (${targetRole})`);
      return { success: true, message: 'User berhasil ditambahkan.', data: newUser as any };
    }

    case 'updateUser': {
      if (!session || session.role === 'Kader') {
        return { success: false, message: 'Akses ditolak.' };
      }
      
      const idx = db.users.findIndex((u) => u.idUser === payload.idUser);
      if (idx === -1) return { success: false, message: 'User tidak ditemukan.' };

      let targetRole = db.users[idx].role;
      if (session.role === 'Admin' && payload.role) {
        targetRole = payload.role;
      }

      db.users[idx] = {
        ...db.users[idx],
        nama: payload.nama || db.users[idx].nama,
        username: payload.username || db.users[idx].username,
        role: targetRole,
        idDesa: payload.idDesa !== undefined ? payload.idDesa : db.users[idx].idDesa,
        namaDesa: payload.namaDesa !== undefined ? payload.namaDesa : db.users[idx].namaDesa,
        status: payload.status || db.users[idx].status,
        passwordHash: payload.password && payload.password.trim() !== '' ? payload.password : db.users[idx].passwordHash,
        updatedAt: nowStr,
      };
      saveLocalDb(db);
      addAuditLog('UPDATE_USER', 'USERS', payload.idUser, `Update user ${payload.idUser}`);
      return { success: true, message: 'User berhasil diperbarui.' };
    }

    case 'deleteUser': {
      if (!session || session.role !== 'Admin') {
        return { success: false, message: 'Hanya Admin yang dapat menghapus user.' };
      }
      db.users = db.users.filter((u) => u.idUser !== payload.idUser);
      saveLocalDb(db);
      addAuditLog('DELETE_USER', 'USERS', payload.idUser, `Hapus user ${payload.idUser}`);
      return { success: true, message: 'User berhasil dihapus.' };
    }

    case 'updateProfile': {
      if (!session) {
        return { success: false, message: 'Sesi tidak valid atau telah berakhir.' };
      }
      const idx = db.users.findIndex((u) => u.idUser === session.idUser);
      if (idx === -1) return { success: false, message: 'User tidak ditemukan.' };

      const current = db.users[idx];
      const newNama = payload.nama && payload.nama.trim() !== '' ? payload.nama.trim() : current.nama;
      const newPasswordHash =
        payload.password && payload.password.trim() !== '' ? payload.password : current.passwordHash;

      db.users[idx] = {
        ...current,
        nama: newNama,
        passwordHash: newPasswordHash,
        updatedAt: nowStr,
      };
      saveLocalDb(db);

      const updatedSession: UserSession = {
        ...session,
        nama: newNama,
      };
      storage.setSession(updatedSession);

      addAuditLog('UPDATE_USER', 'USERS', session.idUser, `Update profil pribadi (Nama/Password): ${newNama}`);
      return {
        success: true,
        message: 'Profil Anda berhasil diperbarui.',
        data: updatedSession as any,
      };
    }

    case 'getAuditLog': {
      if (!session || session.role !== 'Admin') {
        return { success: false, message: 'Akses ditolak. Hanya Admin yang dapat melihat audit log.' };
      }
      return { success: true, message: 'OK', data: db.auditLogs as any };
    }

    default:
      return { success: false, message: `Action '${action}' tidak dikenali.` };
  }
}

function filterReports(reports: LaporanSenam[], filter?: Partial<DashboardFilter>): LaporanSenam[] {
  if (!filter) return reports;
  return reports.filter((item) => {
    if (filter.idDesa && filter.idDesa !== '' && item.idDesa !== filter.idDesa) return false;
    if (filter.jenisSenam && filter.jenisSenam !== '' && item.jenisSenam !== filter.jenisSenam) return false;
    if (filter.tanggalMulai && filter.tanggalMulai !== '') {
      if (new Date(item.tanggal) < new Date(filter.tanggalMulai)) return false;
    }
    if (filter.tanggalAkhir && filter.tanggalAkhir !== '') {
      if (new Date(item.tanggal) > new Date(filter.tanggalAkhir)) return false;
    }
    return true;
  });
}

// API Service Interface Exports
export const api = {
  login: async (username: string, password: string) => {
    const res = await callAppsScript<UserSession>('login', { username, password });
    if (res.success && res.data) {
      storage.setSession(res.data);
    }
    return res;
  },
  getDashboardStats: (filter?: Partial<DashboardFilter>) => callAppsScript<DashboardStats>('getDashboardStats', filter || {}, true),
  getSenamTerbanyak: (filter?: Partial<DashboardFilter>) => callAppsScript<SenamTerbanyakItem[]>('getSenamTerbanyak', filter || {}, true),
  getSenamTeraktif: (filter?: Partial<DashboardFilter>) => callAppsScript<SenamDesaTeraktifItem[]>('getSenamTeraktif', filter || {}, true),
  getLaporan: (filter?: Partial<DashboardFilter> & { onlyMine?: boolean; idKader?: string; statusAbsensi?: string }) =>
    callAppsScript<LaporanSenam[]>('getLaporan', filter || {}, true),
  saveLaporan: (data: Partial<LaporanSenam> & { fotoBase64?: string }) => callAppsScript<LaporanSenam>('saveLaporan', data),
  updateLaporan: (data: Partial<LaporanSenam> & { fotoBase64?: string }) => callAppsScript('updateLaporan', data),
  deleteLaporan: (idLaporan: string) => callAppsScript('deleteLaporan', { idLaporan }),

  getDesa: () => callAppsScript<Desa[]>('getDesa', {}, true),
  saveDesa: (data: Partial<Desa>) => callAppsScript<Desa>('saveDesa', data),
  updateDesa: (data: Partial<Desa>) => callAppsScript('updateDesa', data),
  deleteDesa: (idDesa: string) => callAppsScript('deleteDesa', { idDesa }),

  getJenisSenam: () => callAppsScript<JenisSenam[]>('getJenisSenam', {}, true),
  saveJenisSenam: (data: Partial<JenisSenam>) => callAppsScript<JenisSenam>('saveJenisSenam', data),
  updateJenisSenam: (data: Partial<JenisSenam>) => callAppsScript('updateJenisSenam', data),
  deleteJenisSenam: (idJenis: string) => callAppsScript('deleteJenisSenam', { idJenis }),

  getUsers: () => callAppsScript<User[]>('getUsers', {}, true),
  saveUser: (data: Partial<User> & { password?: string }) => callAppsScript<User>('saveUser', data),
  updateUser: (data: Partial<User> & { password?: string }) => callAppsScript('updateUser', data),
  updateProfile: async (data: { nama: string; password?: string }): Promise<ApiResponse<UserSession>> => {
    const res = await callAppsScript<UserSession>('updateProfile', data);
    if (res.success && res.data) {
      const current = getStoredSession();
      if (current) {
        const updated = {
          ...current,
          nama: res.data.nama || current.nama,
        };
        storage.setSession(updated);
      }
    }
    return res;
  },
  deleteUser: (idUser: string) => callAppsScript('deleteUser', { idUser }),

  getAuditLog: () => callAppsScript<AuditLog[]>('getAuditLog', {}, true),
  getAuditLogs: () => callAppsScript<AuditLog[]>('getAuditLog', {}, true),

  logout: async (): Promise<ApiResponse> => {
    storage.clearSession();
    return { success: true, message: 'Logged out successfully' };
  },

  resetLocalDatabase: async (): Promise<ApiResponse> => {
    storage.resetLocalDbToDefault();
    return { success: true, message: 'Database lokal berhasil direset ke bawaan.' };
  },

  testConnection: async (url: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${url}?action=health`, { method: 'GET' });
      const data = await res.json();
      return { success: true, message: data.message || 'Koneksi ke Apps Script berhasil.' };
    } catch (e: any) {
      return { success: false, message: 'Gagal terhubung: Pastikan Web App di-deploy dengan akses Anyone.' };
    }
  },
};