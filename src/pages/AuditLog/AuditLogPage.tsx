import React, { useEffect, useState } from 'react';
import { ShieldCheck, Database, Clock } from 'lucide-react';
import { AuditLog, UserSession } from '../../types';
import { api } from '../../services/api';
import { DataTable, Column } from '../../components/DataTable/DataTable';
import { formatDateTimeIndo } from '../../utils/formatters';
import { useToast } from '../../components/Toast/Toast';

export const AuditLogPage: React.FC<{ session: UserSession }> = ({ session }) => {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAuditLog();
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      toast.error('Gagal memuat audit log.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (action.includes('CREATE')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (action.includes('DELETE')) return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const columns: Column<AuditLog>[] = [
    {
      header: 'Waktu Aktivitas',
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDateTimeIndo(row.timestamp)}</span>
        </div>
      ),
    },
    {
      header: 'Pengguna',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.namaUser}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {row.idUser} • {row.role}
          </span>
        </div>
      ),
    },
    {
      header: 'Aksi',
      accessor: (row) => (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${getActionColor(row.action)}`}>
          {row.action}
        </span>
      ),
    },
    {
      header: 'Tabel Target',
      accessor: (row) => (
        <div className="flex items-center gap-1 text-xs font-mono text-slate-700">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.tableName}</span>
        </div>
      ),
    },
    {
      header: 'Keterangan Aktivitas',
      accessor: (row) => (
        <div className="text-xs text-slate-700 max-w-md">
          <p>{row.description}</p>
          {row.recordId && (
            <span className="text-[10px] text-slate-400 font-mono">Record: {row.recordId}</span>
          )}
        </div>
      ),
    },
  ];

  const renderMobileCard = (row: AuditLog) => {
    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getActionColor(row.action)}`}>
            {row.action}
          </span>
          <span className="text-[10px] text-slate-400">{formatDateTimeIndo(row.timestamp)}</span>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-800">{row.namaUser} ({row.role})</h4>
          <p className="text-xs text-slate-600 mt-1">{row.description}</p>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
          <span>Tabel: {row.tableName}</span>
          {row.recordId && <span>ID: {row.recordId}</span>}
        </div>
      </div>
    );
  };

  return (
    <div id="audit-log-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Audit Log Aktivitas Sistem</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekam jejak keamanan, autentikasi, dan perubahan database secara realtime
          </p>
        </div>
      </div>

      <DataTable
        id="audit-log-datatable"
        data={logs}
        columns={columns}
        keyExtractor={(l) => l.idLog}
        searchPlaceholder="Cari pengguna, aksi, tabel, atau keterangan..."
        searchFilter={(item, query) =>
          item.namaUser.toLowerCase().includes(query.toLowerCase()) ||
          item.action.toLowerCase().includes(query.toLowerCase()) ||
          item.tableName.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        }
        renderMobileCard={renderMobileCard}
        isLoading={isLoading}
      />
    </div>
  );
};
