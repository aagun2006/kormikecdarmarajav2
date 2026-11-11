import { STORAGE_KEYS } from '../constants/config';
import { INITIAL_USERS, INITIAL_DESA, INITIAL_JENIS_SENAM, INITIAL_LAPORAN, INITIAL_AUDIT_LOGS } from '../constants/defaultData';
import { AuditLog, Desa, JenisSenam, LaporanSenam, User, UserSession } from '../types';

export interface LocalDbState {
  users: User[];
  desa: Desa[];
  jenisSenam: JenisSenam[];
  laporan: LaporanSenam[];
  auditLogs: AuditLog[];
}

export function getStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    const session: UserSession = JSON.parse(raw);
    if (session && !session.token && session.idUser) {
      session.token = `${session.idUser}|${session.username || ''}|${session.role || ''}|${Date.now()}`;
      setStoredSession(session);
    }
    return session;
  } catch {
    return null;
  }
}

export function setStoredSession(session: UserSession | null): void {
  try {
    if (session) {
      if (!session.token && session.idUser) {
        session.token = `${session.idUser}|${session.username || ''}|${session.role || ''}|${Date.now()}`;
      }
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  } catch (e) {
    console.error('Failed to update session in storage', e);
  }
}

export function getCustomApiUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.API_URL) || '';
  } catch {
    return '';
  }
}

export function setCustomApiUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_URL, url.trim());
  } catch (e) {
    console.error('Failed to update API URL', e);
  }
}

export function getLocalDb(): LocalDbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_DATA);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading local db', e);
  }

  const initial: LocalDbState = {
    users: [],
    desa: [],
    jenisSenam: [],
    laporan: [],
    auditLogs: [],
  };
  saveLocalDb(initial);
  return initial;
}

export function saveLocalDb(state: LocalDbState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCAL_DATA, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving local db', e);
  }
}

export function resetLocalDbToDefault(): LocalDbState {
  const initial: LocalDbState = {
    users: [],
    desa: [],
    jenisSenam: [],
    laporan: [],
    auditLogs: [],
  };
  saveLocalDb(initial);
  return initial;
}

export const storage = {
  getSession: getStoredSession,
  setSession: setStoredSession,
  clearSession: () => setStoredSession(null),
  getApiUrl: getCustomApiUrl,
  setApiUrl: setCustomApiUrl,
  getLocalDb,
  saveLocalDb,
  resetLocalDbToDefault,
};