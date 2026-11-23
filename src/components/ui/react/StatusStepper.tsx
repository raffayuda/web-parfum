import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  QrCode,
  FileCheck,
} from 'lucide-react';

export interface TimelineEvent {
  title: string;
  description: string;
  timestamp?: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
  icon: any;
  meta?: React.ReactNode;
}

export interface StatusStepperProps {
  currentStatus:
    | 'PENDING_PAYMENT'
    | 'AWAITING_VALIDATION'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'COMPLETED'
    | 'CANCELLED';
  trackingNumber?: string | null;
  courier?: string | null;
  createdAt?: string;
  validatedAt?: string | null;
  updatedAt?: string;
  paymentProofUrl?: string | null;
  paymentMethod?: string;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({
  currentStatus,
  trackingNumber,
  courier,
  createdAt,
  validatedAt,
  updatedAt,
  paymentProofUrl,
  paymentMethod = 'QRIS',
}) => {
  const [copiedResi, setCopiedResi] = useState(false);

  const handleCopyResi = (resi: string) => {
    navigator.clipboard.writeText(resi);
    setCopiedResi(true);
    setTimeout(() => setCopiedResi(false), 2000);
  };

  const statusOrder = {
    PENDING_PAYMENT: 0,
    AWAITING_VALIDATION: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    COMPLETED: 4,
    CANCELLED: -1,
  };

  const currentIndex = statusOrder[currentStatus] ?? 0;

  if (currentStatus === 'CANCELLED') {
    return (
      <div className="p-4 border border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-300 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
        <div>
          <p className="text-xs font-semibold">Pesanan Telah Dibatalkan</p>
          <p className="text-[0.68rem] text-muted">Pesanan ini dibatalkan oleh pihak concierge atelier atau sistem.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  const timelineEvents: TimelineEvent[] = [
    {
      title: '01. Pesanan Dibuat',
      description:
        paymentMethod === 'WHATSAPP_MANUAL'
          ? 'Pesanan dibuat via WhatsApp.'
          : 'Menunggu konfirmasi pembayaran QRIS.',
      timestamp: formatDate(createdAt) || 'Waktu pemesanan',
      isCompleted: currentIndex > 0,
      isCurrent: currentIndex === 0,
      icon: QrCode,
    },
    {
      title: '02. Pembayaran Terverifikasi',
      description:
        currentIndex >= 2
          ? 'Pembayaran berhasil diverifikasi lunas.'
          : currentIndex === 1
          ? 'Bukti transfer diunggah. Menunggu verifikasi.'
          : 'Silakan lakukan transfer pembayaran.',
      timestamp: formatDate(validatedAt) || (currentIndex >= 2 ? 'Lunas' : undefined),
      isCompleted: currentIndex > 1,
      isCurrent: currentIndex === 1,
      icon: FileCheck,
      meta: paymentProofUrl ? (
        <a
          href={paymentProofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-2 text-[0.68rem] font-semibold text-accent underline hover:text-ink"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Lihat Bukti Transfer</span>
        </a>
      ) : null,
    },
    {
      title: '03. Pesanan Sedang Dikemas',
      description: 'Pesanan sedang dipersiapkan dan dikemas aman untuk pengiriman.',
      timestamp: currentIndex >= 2 && updatedAt ? formatDate(updatedAt) : undefined,
      isCompleted: currentIndex > 2,
      isCurrent: currentIndex === 2,
      icon: Package,
    },
    {
      title: '04. Pesanan Sedang Dikirim',
      description: trackingNumber
        ? `Paket diserahkan ke ${courier || 'Kurir'}.`
        : 'Paket siap dijemput oleh pihak ekspedisi.',
      timestamp: currentIndex >= 3 && updatedAt ? formatDate(updatedAt) : undefined,
      isCompleted: currentIndex > 3,
      isCurrent: currentIndex === 3,
      icon: Truck,
      meta: trackingNumber ? (
        <div className="mt-2.5 p-2.5 bg-surface/40 border border-line flex items-center justify-between gap-3 max-w-sm">
          <div>
            <span className="text-[0.6rem] uppercase tracking-wider text-muted block">
              Kurir: {courier || 'Ekspedisi'}
            </span>
            <span className="font-mono text-xs font-bold text-ink">{trackingNumber}</span>
          </div>
          <button
            type="button"
            onClick={() => handleCopyResi(trackingNumber)}
            className="flex items-center gap-1 px-2.5 py-1 text-[0.65rem] uppercase font-semibold border border-line hover:border-ink transition-colors cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            <span>{copiedResi ? 'Disalin!' : 'Salin Resi'}</span>
          </button>
        </div>
      ) : null,
    },
    {
      title: '05. Pesanan Selesai',
      description: 'Paket telah berhasil diterima oleh pemesan.',
      timestamp: currentIndex === 4 && updatedAt ? formatDate(updatedAt) : undefined,
      isCompleted: currentIndex === 4,
      isCurrent: currentIndex === 4,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="w-full py-2">
      {/* Visual Stepper Bar Header */}
      <div className="grid grid-cols-5 gap-1 mb-8">
        {timelineEvents.map((ev, idx) => {
          const isDone = ev.isCompleted;
          const isCurrent = ev.isCurrent;
          return (
            <div key={idx} className="space-y-1.5">
              <div
                className={`h-1.5 w-full transition-all duration-300 ${
                  isDone
                    ? 'bg-accent'
                    : isCurrent
                    ? 'bg-ink animate-pulse'
                    : 'bg-line/40'
                }`}
              />
              <span
                className={`text-[0.55rem] uppercase tracking-wider font-semibold block truncate ${
                  isDone || isCurrent ? 'text-ink' : 'text-muted/60'
                }`}
              >
                Tahap 0{idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed Timeline List */}
      <div className="relative pl-7 border-l-2 border-line space-y-7">
        {timelineEvents.map((ev, idx) => {
          const isDone = ev.isCompleted;
          const isCurrent = ev.isCurrent;
          const Icon = ev.icon;

          return (
            <div key={idx} className="relative group">
              {/* Dot Icon Indicator */}
              <div
                className={`absolute -left-[37px] top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-accent border-accent text-bg shadow-sm'
                    : isCurrent
                    ? 'bg-bg border-ink ring-4 ring-ink/10 text-ink'
                    : 'bg-surface border-line text-muted/40'
                }`}
              >
                {isDone ? (
                  <Check className="w-3 h-3 text-bg stroke-[3]" />
                ) : (
                  <Icon className="w-2.5 h-2.5" />
                )}
              </div>

              {/* Event Content */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h6
                    className={`font-display text-sm tracking-wide ${
                      isDone || isCurrent ? 'text-ink font-semibold' : 'text-muted'
                    }`}
                  >
                    {ev.title}
                  </h6>
                  {ev.timestamp && (
                    <span className="text-[0.62rem] font-mono text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ev.timestamp}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted leading-relaxed max-w-xl">
                  {ev.description}
                </p>

                {ev.meta && <div className="pt-1">{ev.meta}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
