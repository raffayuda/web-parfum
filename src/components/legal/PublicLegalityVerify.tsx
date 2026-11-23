import React, { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/query-client';
import { api } from '../../lib/api';
import { ShieldCheck, CheckCircle2, AlertCircle, Building2, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { Badge } from '../ui/react/Badge';

export interface PublicLegalityVerifyProps {
  code: string;
}

const PublicLegalityVerifyInner: React.FC<PublicLegalityVerifyProps> = ({ code }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    setIsLoading(true);

    api
      .verifyCertificate(code)
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Data sertifikasi tidak ditemukan.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Gagal memverifikasi legalitas.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [code]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-display text-xl text-ink">Memverifikasi Dokumen Legalitas...</p>
        <p className="text-xs text-muted mt-1">Menghubungkan ke basis data sertifikasi OMOO Atelier.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[50vh] max-w-lg mx-auto p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="font-display text-2xl text-ink">Dokumen Tidak Ditemukan</h3>
        <p className="text-xs text-muted leading-relaxed">
          Kode verifikasi <code>{code}</code> tidak terdaftar dalam catatan legalitas resmi kami. Pastikan kode dipindai langsung dari dus flacon asli OMOO.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] font-medium text-ink hover:underline pt-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda OMOO</span>
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 py-6">
      {/* Verification Shield Header */}
      <div className="border border-line bg-surface/30 p-8 text-center space-y-4 relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-600 flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[0.62rem] uppercase font-bold tracking-[0.18em] text-emerald-700 dark:text-emerald-400 block mb-1">
            HASIL PEMINDAIAN GOOGLE LENS TEROTENTIKASI
          </span>
          <h2 className="font-display text-3xl font-light text-ink">
            Sertifikasi Legalitas Terverifikasi
          </h2>
          <p className="text-xs text-muted mt-1 max-w-md mx-auto">
            Dokumen ini mengonfirmasi bahwa produk wewangian OMOO di bawah ini telah lulus uji mutu independen dan resmi terdaftar di regulator Republik Indonesia.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs font-semibold uppercase tracking-[0.1em]">
          <CheckCircle2 className="w-4 h-4" />
          <span>STATUS: RESMI AKTIF & ASLI</span>
        </div>
      </div>

      {/* Product & Certificate Details Card */}
      <div className="border border-line bg-surface/10 divide-y divide-line">
        {/* Certificate Number Block */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[0.62rem] uppercase font-semibold tracking-[0.1em] text-muted">
              {data.certType === 'BPOM' ? 'Nomor Notifikasi BPOM RI' : 'Nomor Ketetapan Halal Indonesia'}
            </span>
            <p className="font-mono text-xl font-bold text-ink mt-0.5">{data.certNumber}</p>
          </div>
          <span className={`self-start sm:self-auto px-3 py-1 text-xs font-semibold tracking-[0.1em] border ${
            data.certType === 'BPOM'
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
          }`}>
            {data.certType}
          </span>
        </div>

        {/* Product Identity */}
        <div className="p-6 space-y-1">
          <span className="text-[0.62rem] uppercase font-semibold tracking-[0.1em] text-muted">
            Nama Komposisi / Produk
          </span>
          <h4 className="font-display text-2xl text-ink font-normal">{data.productName}</h4>
        </div>

        {/* Authority & Validity */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[0.62rem] uppercase font-semibold tracking-[0.1em] text-muted block mb-1">
              Lembaga Penerbit
            </span>
            <div className="flex items-center gap-2 font-medium text-ink">
              <Building2 className="w-4 h-4 text-muted shrink-0" />
              <span>{data.authority}</span>
            </div>
          </div>

          <div>
            <span className="text-[0.62rem] uppercase font-semibold tracking-[0.1em] text-muted block mb-1">
              Masa Berlaku Izin
            </span>
            <div className="flex items-center gap-2 font-medium text-ink">
              <Calendar className="w-4 h-4 text-muted shrink-0" />
              <span>Sampai {new Date(data.validUntil).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}</span>
            </div>
          </div>
        </div>

        {/* Laboratory & Batch Details */}
        {data.details && (
          <div className="p-6 space-y-2">
            <span className="text-[0.62rem] uppercase font-semibold tracking-[0.1em] text-muted block">
              Parameter Pengujian Laboratorium
            </span>
            <div className="bg-surface/40 p-4 border border-line text-xs space-y-1.5 font-mono">
              {Object.entries(data.details).map(([key, val]: any) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="font-semibold text-ink">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="text-center pt-4">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] font-medium text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kunjungi Atelier OMOO Online</span>
        </a>
      </div>
    </div>
  );
};

export const PublicLegalityVerify: React.FC<PublicLegalityVerifyProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <PublicLegalityVerifyInner {...props} />
    </QueryClientProvider>
  );
};
