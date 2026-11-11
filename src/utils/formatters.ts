import { StatusAbsensi, UserRole, UserStatus } from '../types';

export function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateTimeStr?: string): string {
  if (!dateTimeStr) return '-';
  try {
    const d = new Date(dateTimeStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateTimeStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch {
    return dateTimeStr;
  }
}

export function formatNumberIndo(num?: number): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

export function getStatusAbsensiBadge(status: StatusAbsensi): { bg: string; text: string; border: string; label: string } {
  switch (status) {
    case 'Hadir':
      return {
        bg: 'bg-emerald-50 text-emerald-700',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'Hadir',
      };
    case 'Izin':
      return {
        bg: 'bg-amber-50 text-amber-700',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: 'Izin',
      };
    case 'Alfa':
      return {
        bg: 'bg-rose-50 text-rose-700',
        text: 'text-rose-700',
        border: 'border-rose-200',
        label: 'Alfa',
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-700',
        text: 'text-slate-700',
        border: 'border-slate-200',
        label: status || '-',
      };
  }
}

export function getRoleBadge(role: UserRole): { bg: string; text: string; label: string } {
  switch (role) {
    case 'Admin':
      return { bg: 'bg-purple-100 text-purple-800 border-purple-200', text: 'text-purple-700', label: 'Administrator' };
    case 'Koordinator':
      return { bg: 'bg-blue-100 text-blue-800 border-blue-200', text: 'text-blue-700', label: 'Koordinator' };
    case 'Kader':
      return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'text-emerald-700', label: 'Kader Desa' };
    default:
      return { bg: 'bg-slate-100 text-slate-800 border-slate-200', text: 'text-slate-700', label: role };
  }
}

export function getStatusBadge(status: UserStatus | 'Aktif' | 'Nonaktif'): { bg: string; text: string } {
  return status === 'Aktif'
    ? { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' }
    : { bg: 'bg-slate-100 text-slate-600 border-slate-200', text: 'text-slate-600' };
}
