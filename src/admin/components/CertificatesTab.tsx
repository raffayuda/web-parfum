import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Input } from '../../components/ui/react/Input';
import { Modal } from '../../components/ui/react/Modal';
import { Table } from '../../components/ui/react/Table';
import {
  ShieldCheck,
  Printer,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Grid,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface CertFormState {
  certType: 'BPOM' | 'HALAL';
  certNumber: string;
  productSlug: string;
  productName: string;
  authority: string;
  issueDate: string;
  validUntil: string;
  verifyCode: string;
  status: string;
}

type StickerSizeKey = 'sm' | 'md' | 'lg';
type PrintMode = 'stickers' | 'certificate';

const STICKER_PRESETS: Record<
  StickerSizeKey,
  {
    label: string;
    subtitle: string;
    defaultCount: number;
    cols: number;
    gapMm: number;
    qrMm: number;
    previewColsClass: string;
    previewQrClass: string;
  }
> = {
  sm: {
    label: 'Kecil (2.8 × 3.2 cm)',
    subtitle: '48 stiker / A4 — tutup & bawah botol',
    defaultCount: 48,
    cols: 6,
    gapMm: 2.5,
    qrMm: 18,
    previewColsClass: 'grid-cols-4 sm:grid-cols-6',
    previewQrClass: 'w-14 h-14',
  },
  md: {
    label: 'Sedang (4.3 × 4.3 cm)',
    subtitle: '24 stiker / A4 — badan botol 50 ml / dus',
    defaultCount: 24,
    cols: 4,
    gapMm: 3.5,
    qrMm: 24,
    previewColsClass: 'grid-cols-3 sm:grid-cols-4',
    previewQrClass: 'w-20 h-20',
  },
  lg: {
    label: 'Besar (5.8 × 6.2 cm)',
    subtitle: '12 stiker / A4 — box luar / kartu sisipan',
    defaultCount: 12,
    cols: 3,
    gapMm: 4.5,
    qrMm: 34,
    previewColsClass: 'grid-cols-2 sm:grid-cols-3',
    previewQrClass: 'w-24 h-24',
  },
};

const toInputDate = (val?: string | Date | null, offsetYears = 0) => {
  const d = val ? new Date(val) : new Date();
  if (!val && offsetYears) {
    d.setFullYear(d.getFullYear() + offsetYears);
  }
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
};

const defaultForm = (): CertFormState => ({
  certType: 'BPOM',
  certNumber: '',
  productSlug: '',
  productName: '',
  authority: 'Badan Pengawas Obat dan Makanan RI',
  issueDate: toInputDate(null, 0),
  validUntil: toInputDate(null, 5),
  verifyCode: '',
  status: 'VERIFIED',
});

const CertificateSheetContent: React.FC<{ cert: any; qrDataUrl: string }> = ({
  cert,
  qrDataUrl,
}) => (
  <div className="border-4 border-double border-line p-8 bg-white text-[#141710] text-center relative overflow-hidden">
    <div className="flex items-center justify-between text-[0.6rem] text-[#5d6356] tracking-widest uppercase mb-4">
      <span>OMOO VERIFICATION</span>
      <span>OFFICIAL SEAL</span>
    </div>

    <img
      src="/images/omoo-logo-black.svg"
      alt="OMOO"
      className="h-9 w-auto object-contain mx-auto mb-2"
    />
    <p className="font-display italic text-base text-[#5d6356]">OMOO Parfums</p>
    <h2 className="font-display text-3xl font-light text-[#141710] uppercase tracking-[0.1em] mt-1">
      OMOO JAKARTA
    </h2>
    <div className="w-16 h-px bg-[#4e5f1c] mx-auto my-3" />

    <p className="text-[0.68rem] uppercase font-semibold tracking-[0.14em] text-[#4e5f1c]">
      SERTIFIKASI KEASLIAN &amp; LEGALITAS ({cert.certType})
    </p>

    <h3 className="font-display text-xl text-[#141710] font-medium mt-3">
      {cert.productName}
    </h3>
    <p className="text-xs text-[#5d6356] mt-1 max-w-md mx-auto">
      Telah terdaftar resmi dan diawasi oleh {cert.authority}.
    </p>

    <div className="my-6 flex flex-col items-center justify-center gap-3">
      <div className="p-3 bg-white border border-[#c4c7b9] inline-block">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR Code Verifikasi Google Lens"
            width={192}
            height={192}
            className="w-48 h-48 mx-auto block"
          />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center text-xs text-[#5d6356]">
            Memuat QR Code...
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[0.68rem] uppercase tracking-[0.1em] font-semibold text-[#5d6356]">
          Nomor Registrasi Resmi
        </p>
        <p className="font-mono text-sm font-bold text-[#141710] tracking-wider">
          {cert.certNumber}
        </p>
        <p className="text-[0.65rem] text-[#5d6356] italic">
          Pindai kode QR di atas menggunakan Google Lens atau kamera ponsel untuk memverifikasi
          keaslian di website resmi OMOO.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 border-t border-[#c4c7b9] pt-4 text-[0.68rem] text-[#5d6356]">
      <div>
        <span className="block font-medium text-[#141710]">Masa Berlaku:</span>
        <span>Hingga {new Date(cert.validUntil).toLocaleDateString('id-ID')}</span>
      </div>
      <div>
        <span className="block font-medium text-[#141710]">Status Dokumen:</span>
        <span className="text-emerald-700 font-semibold uppercase">
          {cert.status || 'TERVERIFIKASI AKTIF'}
        </span>
      </div>
    </div>
  </div>
);

const StickerSheetContent: React.FC<{
  cert: any;
  qrDataUrl: string;
  sizeKey: StickerSizeKey;
  count: number;
  showCutGuides: boolean;
  showRegNumber: boolean;
  isPrintDom?: boolean;
}> = ({
  cert,
  qrDataUrl,
  sizeKey,
  count,
  showCutGuides,
  showRegNumber,
  isPrintDom = false,
}) => {
  const preset = STICKER_PRESETS[sizeKey];
  const safeCount = Math.max(1, Math.min(96, Number(count) || preset.defaultCount));
  const items = Array.from({ length: safeCount });

  if (isPrintDom) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${preset.cols}, minmax(0, 1fr))`,
          gap: `${preset.gapMm}mm`,
          width: '100%',
          backgroundColor: '#ffffff',
        }}
      >
        {items.map((_, idx) => (
          <div
            key={idx}
            className="sticker-cell"
            style={{
              border: showCutGuides ? '0.35mm dashed #9ca3af' : '0.25mm solid #e5e7eb',
              padding: sizeKey === 'sm' ? '1.8mm' : '2.5mm',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                fontSize: sizeKey === 'sm' ? '6px' : sizeKey === 'md' ? '7.5px' : '9px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#141710',
                marginBottom: '1mm',
              }}
            >
              OMOO &middot; {cert.certType}
            </div>

            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={`QR ${cert.verifyCode}`}
                style={{
                  width: `${preset.qrMm}mm`,
                  height: `${preset.qrMm}mm`,
                  display: 'block',
                }}
              />
            )}

            <div
              style={{
                fontSize: sizeKey === 'sm' ? '5.5px' : sizeKey === 'md' ? '6.8px' : '8px',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#141710',
                marginTop: '1mm',
                lineHeight: 1.2,
                wordBreak: 'break-all',
              }}
            >
              {showRegNumber ? cert.certNumber : cert.verifyCode}
            </div>
            {sizeKey !== 'sm' && (
              <div
                style={{
                  fontSize: sizeKey === 'md' ? '5.8px' : '7px',
                  color: '#5d6356',
                  marginTop: '0.4mm',
                  lineHeight: 1.15,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                Scan to verify &middot; {cert.verifyCode}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 border border-line max-h-[52vh] overflow-y-auto">
      <div className={`grid ${preset.previewColsClass} gap-2.5`}>
        {items.map((_, idx) => (
          <div
            key={idx}
            className={`bg-white p-2 flex flex-col items-center justify-center text-center ${
              showCutGuides
                ? 'border border-dashed border-gray-400'
                : 'border border-gray-200'
            }`}
          >
            <span className="text-[0.55rem] font-bold tracking-[0.12em] uppercase text-[#141710] mb-1">
              OMOO &middot; {cert.certType}
            </span>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR ${cert.verifyCode}`}
                className={`${preset.previewQrClass} object-contain block`}
              />
            ) : (
              <div className={`${preset.previewQrClass} bg-gray-100 flex items-center justify-center text-[0.55rem] text-gray-500`}>
                QR
              </div>
            )}
            <span className="font-mono text-[0.55rem] font-bold text-[#141710] mt-1 leading-tight break-all">
              {showRegNumber ? cert.certNumber : cert.verifyCode}
            </span>
            {sizeKey !== 'sm' && (
              <span className="text-[0.5rem] text-gray-500 truncate max-w-full mt-0.5">
                {cert.verifyCode}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CertificatesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [resolvedQrUrl, setResolvedQrUrl] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Sticker & Print layout state
  const [printMode, setPrintMode] = useState<PrintMode>('stickers');
  const [stickerSize, setStickerSize] = useState<StickerSizeKey>('md');
  const [stickerCount, setStickerCount] = useState<number>(24);
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
  const [showRegNumber, setShowRegNumber] = useState<boolean>(true);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);
  const [formData, setFormData] = useState<CertFormState>(defaultForm());

  const { data: certsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: () => api.getCertificates(),
  });

  const { data: perfumesData } = useQuery({
    queryKey: ['admin-perfumes'],
    queryFn: () => api.getPerfumes(),
  });

  const certs = certsData?.data || [];
  const perfumes = perfumesData?.data || [];

  // Ensure crisp QR Data URL is always generated client-side if needed for reliable printing
  useEffect(() => {
    if (!selectedCert) {
      setResolvedQrUrl('');
      return;
    }

    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://omoo.web.id';
    const verifyTarget =
      selectedCert.verifyUrl || `${origin}/verify/${selectedCert.verifyCode}`;

    QRCode.toDataURL(verifyTarget, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 320,
      color: { dark: '#141710', light: '#ffffff' },
    })
      .then((url) => setResolvedQrUrl(url))
      .catch(() => setResolvedQrUrl(selectedCert.qrCodeUrl || ''));
  }, [selectedCert]);

  const createMutation = useMutation({
    mutationFn: (payload: CertFormState) => api.createCertificate(payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'Sertifikat berhasil ditambahkan.');
        queryClient.invalidateQueries({ queryKey: ['admin-certificates'] });
        setIsFormModalOpen(false);
      } else {
        toast.error(res.message || 'Gagal menambahkan sertifikat.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Terjadi kesalahan sistem.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CertFormState }) =>
      api.updateCertificate(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'Sertifikat berhasil diperbarui.');
        queryClient.invalidateQueries({ queryKey: ['admin-certificates'] });
        setIsFormModalOpen(false);
      } else {
        toast.error(res.message || 'Gagal memperbarui sertifikat.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Terjadi kesalahan sistem.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCertificate(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Sertifikat berhasil dihapus.');
        queryClient.invalidateQueries({ queryKey: ['admin-certificates'] });
      } else {
        toast.error(res.message || 'Gagal menghapus sertifikat.');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Terjadi kesalahan sistem.'),
  });

  const handleOpenPrint = (cert: any) => {
    setSelectedCert(cert);
    setResolvedQrUrl(cert.qrCodeUrl || '');
    setIsPrintModalOpen(true);
  };

  const handlePrintCertificate = () => {
    if (!resolvedQrUrl) {
      toast.error('QR Code masih dipersiapkan, mohon tunggu sejenak.');
      return;
    }
    setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleSizePresetChange = (key: StickerSizeKey) => {
    setStickerSize(key);
    setStickerCount(STICKER_PRESETS[key].defaultCount);
  };

  const openCreateModal = () => {
    setEditingCert(null);
    setFormData(defaultForm());
    setIsFormModalOpen(true);
  };

  const openEditModal = (cert: any) => {
    setEditingCert(cert);
    setFormData({
      certType: cert.certType === 'HALAL' ? 'HALAL' : 'BPOM',
      certNumber: cert.certNumber || '',
      productSlug: cert.productSlug || '',
      productName: cert.productName || '',
      authority: cert.authority || '',
      issueDate: toInputDate(cert.issueDate),
      validUntil: toInputDate(cert.validUntil),
      verifyCode: cert.verifyCode || '',
      status: cert.status || 'VERIFIED',
    });
    setIsFormModalOpen(true);
  };

  const generateVerifyCode = () => {
    const slugPart = (formData.productSlug || formData.productName || 'OMOO')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 14);
    const suffix = Math.floor(10 + Math.random() * 89);
    setFormData((prev) => ({
      ...prev,
      verifyCode: `${prev.certType}-${slugPart}-${suffix}`,
    }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.certNumber.trim() || !formData.productName.trim() || !formData.verifyCode.trim()) {
      toast.error('Nomor sertifikat, nama produk, dan kode verifikasi wajib diisi.');
      return;
    }

    if (editingCert) {
      updateMutation.mutate({ id: editingCert.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="border border-line bg-surface/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h3 className="font-display text-2xl text-ink font-normal">
              Sertifikasi Halal &amp; BPOM RI ({certs.length})
            </h3>
          </div>
          <p className="text-xs text-muted mt-0.5 max-w-2xl leading-relaxed">
            Kelola data sertifikat resmi keaslian dan legalitas formulasi OMOO. Cetak QR Code dalam
            format lembar stiker botol (banyak stiker per A4) atau lembar sertifikat penuh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-line bg-bg hover:border-ink text-xs uppercase tracking-wider text-ink transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted" />
            <span>Segarkan</span>
          </button>
          <Button
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4 text-accent" />}
          >
            Tambah Sertifikat
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        headers={['Jenis', 'Nomor Sertifikat / Registrasi', 'Produk Terkait', 'Masa Berlaku', 'Kode Verifikasi QR', 'Aksi']}
        isEmpty={!isLoading && certs.length === 0}
      >
        {certs.map((c: any) => (
          <tr key={c.id} className="hover:bg-surface/30 transition-colors">
            <td className="py-4 px-4 whitespace-nowrap">
              <span
                className={`px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.08em] border ${
                  c.certType === 'BPOM'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                }`}
              >
                {c.certType}
              </span>
            </td>

            <td className="py-4 px-4">
              <p className="font-mono font-bold text-ink text-xs">{c.certNumber}</p>
              <p className="text-[0.68rem] text-muted mt-0.5">{c.authority}</p>
            </td>

            <td className="py-4 px-4 text-xs font-medium text-ink">
              {c.productName}
            </td>

            <td className="py-4 px-4 text-xs text-muted whitespace-nowrap">
              Sampai{' '}
              {new Date(c.validUntil).toLocaleDateString('id-ID', {
                month: 'short',
                year: 'numeric',
              })}
            </td>

            <td className="py-4 px-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                {c.qrCodeUrl && (
                  <img
                    src={c.qrCodeUrl}
                    alt={c.verifyCode}
                    className="w-8 h-8 border border-line bg-white p-0.5 shrink-0"
                  />
                )}
                <code className="text-[0.68rem] bg-surface px-2 py-0.5 border border-line text-ink font-mono">
                  {c.verifyCode}
                </code>
              </div>
            </td>

            <td className="py-4 px-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenPrint(c)}
                >
                  Cetak Stiker QR
                </Button>
                <button
                  type="button"
                  onClick={() => openEditModal(c)}
                  className="p-1.5 border border-line hover:border-ink transition-colors text-ink inline-flex items-center cursor-pointer"
                  title="Edit Sertifikat"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Hapus sertifikat "${c.certNumber}"?`)) {
                      deleteMutation.mutate(c.id);
                    }
                  }}
                  className="p-1.5 border border-line hover:border-red-700 hover:text-red-700 transition-colors text-muted inline-flex items-center cursor-pointer disabled:opacity-50"
                  title="Hapus Sertifikat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`/verify/${c.verifyCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 border border-line hover:border-ink transition-colors text-ink inline-flex items-center"
                  title="Buka halaman verifikasi publik"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {/* Modal: Create / Edit Certificate */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingCert ? 'Edit Sertifikat Legalitas' : 'Tambah Sertifikat Baru'}
        subtitle="QR Code verifikasi publik dibuat otomatis berdasarkan kode verifikasi."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.68rem] uppercase tracking-[0.14em] text-muted font-medium mb-1.5">
                Jenis Sertifikat *
              </label>
              <select
                value={formData.certType}
                onChange={(e) => {
                  const nextType = e.target.value as 'BPOM' | 'HALAL';
                  setFormData((prev) => ({
                    ...prev,
                    certType: nextType,
                    authority:
                      prev.authority === 'Badan Pengawas Obat dan Makanan RI' ||
                      prev.authority === 'BPJPH Kementerian Agama RI' ||
                      !prev.authority
                        ? nextType === 'HALAL'
                          ? 'BPJPH Kementerian Agama RI'
                          : 'Badan Pengawas Obat dan Makanan RI'
                        : prev.authority,
                  }));
                }}
                className="w-full bg-surface/40 border border-line px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-ink"
              >
                <option value="BPOM">BPOM RI</option>
                <option value="HALAL">HALAL (BPJPH / MUI)</option>
              </select>
            </div>

            <div>
              <label className="block text-[0.68rem] uppercase tracking-[0.14em] text-muted font-medium mb-1.5">
                Status Dokumen
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-surface/40 border border-line px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-ink"
              >
                <option value="VERIFIED">VERIFIED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="RENEWAL">RENEWAL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nomor Sertifikat / Izin Edar *"
              value={formData.certNumber}
              onChange={(e) => setFormData({ ...formData, certNumber: e.target.value })}
              placeholder="Contoh: NA18260601234"
              required
            />

            <div>
              <label className="block text-[0.68rem] uppercase tracking-[0.14em] text-muted font-medium mb-1.5">
                Kode Verifikasi QR *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.verifyCode}
                  onChange={(e) =>
                    setFormData({ ...formData, verifyCode: e.target.value.toUpperCase() })
                  }
                  placeholder="BPOM-VETIVER-01"
                  className="flex-1 bg-surface/40 border border-line px-3 py-2.5 text-xs font-mono text-ink focus:outline-none focus:border-ink"
                  required
                />
                <button
                  type="button"
                  onClick={generateVerifyCode}
                  className="px-3 py-2 border border-line bg-surface hover:border-ink text-[0.65rem] uppercase tracking-wider font-semibold text-ink cursor-pointer shrink-0"
                >
                  Auto
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.68rem] uppercase tracking-[0.14em] text-muted font-medium mb-1.5">
                Tautkan ke Produk Katalog
              </label>
              <select
                value={formData.productSlug}
                onChange={(e) => {
                  const slug = e.target.value;
                  const matched = perfumes.find((p: any) => p.slug === slug);
                  setFormData((prev) => ({
                    ...prev,
                    productSlug: slug,
                    productName: matched ? `${matched.name} (${matched.volume || '50 ml'})` : prev.productName,
                  }));
                }}
                className="w-full bg-surface/40 border border-line px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-ink"
              >
                <option value="">-- Umum / Semua Produk --</option>
                {perfumes.map((p: any) => (
                  <option key={p.id} value={p.slug}>
                    {p.name} ({p.edition || p.slug})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Nama Produk / Keterangan di Sertifikat *"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="Contoh: Vetiver Obscura Extrait de Parfum"
              required
            />
          </div>

          <Input
            label="Instansi / Otoritas Penerbit *"
            value={formData.authority}
            onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
            placeholder="Badan Pengawas Obat dan Makanan RI"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Terbit"
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              required
            />
            <Input
              label="Berlaku Hingga *"
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editingCert ? 'Simpan Perubahan' : 'Daftarkan Sertifikat'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Printable Bottle QR Sticker Sheet OR Full Certificate */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Cetak Label Stiker QR & Sertifikat"
        subtitle="Pilih mode lembar stiker kecil untuk ditempel langsung di botol/dus, atau lembar sertifikat penuh."
        maxWidth="2xl"
      >
        {selectedCert && (
          <div className="space-y-5">
            {/* Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPrintMode('stickers')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors cursor-pointer ${
                    printMode === 'stickers'
                      ? 'border-ink bg-ink text-bg'
                      : 'border-line bg-surface/30 text-muted hover:text-ink'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Stiker Botol (Banyak QR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('certificate')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors cursor-pointer ${
                    printMode === 'certificate'
                      ? 'border-ink bg-ink text-bg'
                      : 'border-line bg-surface/30 text-muted hover:text-ink'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lembar Sertifikat Besar</span>
                </button>
              </div>

              <span className="text-[0.68rem] font-mono text-muted">
                {selectedCert.productName}
              </span>
            </div>

            {/* Sticker Layout Controls */}
            {printMode === 'stickers' && (
              <div className="border border-line bg-surface/25 p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(Object.keys(STICKER_PRESETS) as StickerSizeKey[]).map((key) => {
                    const p = STICKER_PRESETS[key];
                    const active = stickerSize === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSizePresetChange(key)}
                        className={`p-3 text-left border transition-colors cursor-pointer ${
                          active
                            ? 'border-ink bg-bg'
                            : 'border-line bg-surface/40 hover:border-ink/50'
                        }`}
                      >
                        <div className="text-xs font-semibold text-ink">{p.label}</div>
                        <div className="text-[0.65rem] text-muted mt-0.5">{p.subtitle}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-line/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted font-medium">Jumlah stiker:</span>
                    <input
                      type="number"
                      min={1}
                      max={96}
                      value={stickerCount}
                      onChange={(e) => setStickerCount(Math.max(1, Math.min(96, Number(e.target.value) || 1)))}
                      className="w-16 bg-bg border border-line px-2 py-1 text-xs font-mono text-ink text-center focus:outline-none focus:border-ink"
                    />
                    {[12, 24, 36, 48].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setStickerCount(n)}
                        className={`px-2 py-1 text-[0.65rem] border cursor-pointer ${
                          stickerCount === n
                            ? 'border-ink bg-ink text-bg font-semibold'
                            : 'border-line bg-bg text-muted hover:text-ink'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-1.5 text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCutGuides}
                        onChange={(e) => setShowCutGuides(e.target.checked)}
                        className="w-3.5 h-3.5 accent-ink"
                      />
                      <span>Garis potong</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showRegNumber}
                        onChange={(e) => setShowRegNumber(e.target.checked)}
                        className="w-3.5 h-3.5 accent-ink"
                      />
                      <span>No. Registrasi</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Preview */}
            {printMode === 'stickers' ? (
              <StickerSheetContent
                cert={selectedCert}
                qrDataUrl={resolvedQrUrl || selectedCert.qrCodeUrl}
                sizeKey={stickerSize}
                count={stickerCount}
                showCutGuides={showCutGuides}
                showRegNumber={showRegNumber}
              />
            ) : (
              <CertificateSheetContent
                cert={selectedCert}
                qrDataUrl={resolvedQrUrl || selectedCert.qrCodeUrl}
              />
            )}

            {/* Footer Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-line">
              <a
                href={selectedCert.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka URL Verifikasi Publik</span>
              </a>

              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setIsPrintModalOpen(false)}>
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={handlePrintCertificate}
                >
                  {printMode === 'stickers'
                    ? `Cetak ${stickerCount} Stiker QR`
                    : 'Cetak Sertifikat'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Direct body Portal for crisp A4 Print Output */}
      {typeof document !== 'undefined' &&
        isPrintModalOpen &&
        selectedCert &&
        createPortal(
          <div className="official-certificate-sheet hidden print:block p-2 bg-white text-[#141710]">
            {printMode === 'stickers' ? (
              <StickerSheetContent
                cert={selectedCert}
                qrDataUrl={resolvedQrUrl || selectedCert.qrCodeUrl}
                sizeKey={stickerSize}
                count={stickerCount}
                showCutGuides={showCutGuides}
                showRegNumber={showRegNumber}
                isPrintDom
              />
            ) : (
              <CertificateSheetContent
                cert={selectedCert}
                qrDataUrl={resolvedQrUrl || selectedCert.qrCodeUrl}
              />
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
