import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Table } from '../../components/ui/react/Table';
import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

const formatBytes = (bytes: number) => {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const BackupsTab: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: backupsRes, isLoading, refetch } = useQuery({
    queryKey: ['admin-backups'],
    queryFn: () => api.getBackups(),
  });

  const runBackupMutation = useMutation({
    mutationFn: () => api.runManualBackup(),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'Backup database berhasil dibuat.');
        queryClient.invalidateQueries({ queryKey: ['admin-backups'] });
      } else {
        toast.error(res.message || 'Gagal membuat backup.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Terjadi kesalahan sistem.'),
  });

  const pruneMutation = useMutation({
    mutationFn: () => api.pruneBackups(),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'Pembersihan selesai.');
        queryClient.invalidateQueries({ queryKey: ['admin-backups'] });
      } else {
        toast.error(res.message || 'Gagal membersihkan backup.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Terjadi kesalahan sistem.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteBackup(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Backup berhasil dihapus.');
        queryClient.invalidateQueries({ queryKey: ['admin-backups'] });
      } else {
        toast.error(res.message || 'Gagal menghapus backup.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Terjadi kesalahan sistem.'),
  });

  const backups: any[] = backupsRes?.data || [];
  const retentionDays: number = backupsRes?.retentionDays || 7;
  const totalSize = backups.reduce((sum, b) => sum + (Number(b.sizeBytes) || 0), 0);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted text-xs uppercase tracking-[0.1em]">
        Memeriksa dan menyinkronkan backup harian...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-accent" />
            <h3 className="font-display text-2xl font-light text-ink">
              Backup Database Otomatis
            </h3>
          </div>
          <p className="text-xs text-muted mt-0.5 max-w-2xl leading-relaxed">
            Snapshot database terkompresi dibuat otomatis setiap hari (pukul 09:00 WIB via Vercel
            Cron &amp; pengecekan harian saat dashboard dibuka). Data yang melewati{' '}
            <strong className="text-ink">{retentionDays} hari</strong> akan dihapus otomatis agar
            penyimpanan tetap ringan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-line bg-surface/40 hover:bg-surface text-xs uppercase tracking-wider text-ink transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted" />
            <span>Segarkan</span>
          </button>

          <Button
            variant="secondary"
            isLoading={pruneMutation.isPending}
            onClick={() => pruneMutation.mutate()}
          >
            Bersihkan (&gt; {retentionDays} Hari)
          </Button>

          <Button
            isLoading={runBackupMutation.isPending}
            onClick={() => runBackupMutation.mutate()}
            icon={<Plus className="w-4 h-4 text-accent" />}
          >
            Backup Sekarang
          </Button>
        </div>
      </div>

      {/* KPI Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-line bg-surface/20 p-4 space-y-1">
          <div className="flex items-center justify-between text-[0.62rem] uppercase tracking-[0.12em] text-muted font-semibold">
            <span>Jadwal Otomatis</span>
            <Clock className="w-3.5 h-3.5 text-accent" />
          </div>
          <p className="font-display text-xl text-ink">Setiap Hari (09:00 WIB)</p>
          <p className="text-[0.68rem] text-muted">Cron harian aktif + auto-sync</p>
        </div>

        <div className="border border-line bg-surface/20 p-4 space-y-1">
          <div className="flex items-center justify-between text-[0.62rem] uppercase tracking-[0.12em] text-muted font-semibold">
            <span>Retensi Otomatis</span>
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          </div>
          <p className="font-display text-xl text-ink">Maksimal {retentionDays} Hari</p>
          <p className="text-[0.68rem] text-accent">Backup lama otomatis terhapus</p>
        </div>

        <div className="border border-line bg-surface/20 p-4 space-y-1">
          <div className="flex items-center justify-between text-[0.62rem] uppercase tracking-[0.12em] text-muted font-semibold">
            <span>Snapshot Tersimpan</span>
            <Database className="w-3.5 h-3.5 text-muted" />
          </div>
          <p className="font-display text-xl text-ink">
            {backups.length} File <span className="text-xs font-sans text-muted">({formatBytes(totalSize)})</span>
          </p>
          <p className="text-[0.68rem] text-muted">Terkompresi Gzip di database</p>
        </div>
      </div>

      {/* Backup History Table */}
      <Table
        headers={['Tanggal Backup', 'Sumber', 'Ringkasan Data', 'Ukuran', 'Dihapus Otomatis', 'Aksi']}
        isEmpty={backups.length === 0}
      >
        {backups.map((b) => {
          const expiresDate = new Date(b.expiresAt);
          const daysLeft = Math.max(
            0,
            Math.ceil((expiresDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          );

          return (
            <tr key={b.id} className="hover:bg-surface/30 transition-colors">
              <td className="py-3.5 px-4 whitespace-nowrap">
                <div className="font-semibold text-ink text-xs">{b.backupDate}</div>
                <div className="text-[0.65rem] text-muted">
                  {new Date(b.createdAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </td>

              <td className="py-3.5 px-4 whitespace-nowrap">
                <span
                  className={`px-2 py-0.5 text-[0.6rem] uppercase font-semibold tracking-wider border ${
                    b.trigger === 'auto'
                      ? 'bg-accent-fill/25 border-accent text-ink'
                      : 'bg-surface border-line text-muted'
                  }`}
                >
                  {b.trigger === 'auto' ? 'Otomatis Harian' : 'Manual'}
                </span>
              </td>

              <td className="py-3.5 px-4 text-[0.7rem] text-muted">
                <span>{b.stats?.users ?? 0} User</span> &middot;{' '}
                <span>{b.stats?.fragrances ?? 0} Produk</span> &middot;{' '}
                <span>{b.stats?.orders ?? 0} Pesanan</span> &middot;{' '}
                <span>{b.stats?.certifications ?? 0} Sertifikat</span>
              </td>

              <td className="py-3.5 px-4 font-mono text-xs text-ink whitespace-nowrap">
                {formatBytes(b.sizeBytes)}
              </td>

              <td className="py-3.5 px-4 text-xs text-muted whitespace-nowrap">
                {daysLeft} hari lagi ({expiresDate.toLocaleDateString('id-ID')})
              </td>

              <td className="py-3.5 px-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <a
                    href={api.getBackupDownloadUrl(b.id)}
                    download
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-line bg-bg hover:border-ink text-[0.65rem] font-semibold uppercase tracking-wider text-ink transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-accent" />
                    <span>Unduh JSON</span>
                  </a>
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Hapus backup tanggal ${b.backupDate}?`)) {
                        deleteMutation.mutate(b.id);
                      }
                    }}
                    className="p-1.5 border border-line hover:border-red-700 hover:text-red-700 transition-colors text-muted cursor-pointer disabled:opacity-50"
                    title="Hapus backup ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
};
