export type UserRole = 'Admin' | 'Koordinator' | 'Kader';
export type UserStatus = 'Aktif' | 'Nonaktif';
export type StatusAbsensi = 'Hadir' | 'Izin' | 'Alfa';

export interface UserSession {
  idUser: string;
  nama: string;
  username: string;
  role: UserRole;
  idDesa: string;
  namaDesa: string;
  token?: string;
}

export interface User {
  idUser: string;
  nama: string;
  username: string;
  passwordHash?: string;
  role: UserRole;
  idDesa: string;
  namaDesa: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Desa {
  idDesa: string;
  namaDesa: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
  updatedAt: string;
}

export interface JenisSenam {
  idJenis: string;
  namaJenis: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
  updatedAt: string;
}

export interface LaporanSenam {
  idLaporan: string;
  idDesa: string;
  namaDesa: string;
  idKader: string;
  namaKader: string;
  tanggal: string; // YYYY-MM-DD
  jumlahPeserta: number;
  jenisSenam: string;
  statusAbsensi: StatusAbsensi;
  fotoUrl: string;
  fotoFileId?: string;
  captionFoto?: string;
  sourceType?: 'CAMERA' | 'GALLERY';
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  idLog: string;
  timestamp: string;
  idUser: string;
  namaUser: string;
  role: UserRole;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE_USER'
    | 'UPDATE_USER'
    | 'DELETE_USER'
    | 'CREATE_DESA'
    | 'UPDATE_DESA'
    | 'DELETE_DESA'
    | 'CREATE_JENIS_SENAM'
    | 'UPDATE_JENIS_SENAM'
    | 'DELETE_JENIS_SENAM'
    | 'CREATE_LAPORAN'
    | 'UPDATE_LAPORAN'
    | 'DELETE_LAPORAN'
    | 'UPLOAD_FOTO';
  tableName: 'USERS' | 'DESA' | 'JENIS_SENAM' | 'LAPORAN_SENAM' | 'AUTH' | 'SYSTEM';
  recordId: string;
  description: string;
}

export interface DashboardStats {
  totalKegiatan: number;
  totalPeserta: number;
  totalDesa: number;
  totalKader: number;
  kegiatanBulanIni: number;
  pesertaBulanIni: number;
}

export interface SenamTerbanyakItem {
  jenisSenam: string;
  jumlahKegiatan: number;
  totalPeserta: number;
}

export interface SenamDesaTeraktifItem {
  idDesa: string;
  namaDesa: string;
  totalKegiatan: number;
  totalPeserta: number;
  kegiatanTerbaru?: string;
}

export interface DashboardFilter {
  tanggalMulai: string;
  tanggalAkhir: string;
  jenisSenam: string;
  idDesa: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}
