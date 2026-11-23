import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Modal } from '../../components/ui/react/Modal';
import { Badge } from '../../components/ui/react/Badge';
import { Table } from '../../components/ui/react/Table';
import { ShieldCheck, Printer, ExternalLink, QrCode } from 'lucide-react';

export const CertificatesTab: React.FC = () => {
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const { data: certsData, isLoading } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: () => api.getCertificates(),
  });

  const certs = certsData?.data || [];

  const handleOpenPrint = (cert: any) => {
    setSelectedCert(cert);
    setIsPrintModalOpen(true);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="border border-line bg-surface/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h3 className="font-display text-2xl text-ink font-normal">
              Sertifikasi Halal & BPOM RI
            </h3>
          </div>
          <p className="text-xs text-muted mt-0.5 max-w-2xl leading-relaxed">
            Data sertifikat resmi keaslian dan legalitas formulasi OMOO. Setiap sertifikat memiliki kode verifikasi unik
            dan QR Code resolusi tinggi yang dapat dicetak untuk dus botol dan dapat dipindai oleh <strong>Google Lens</strong> atau kamera smartphone untuk memverifikasi keabsahan legalitas langsung di website.
          </p>
        </div>
      </div>

      {/* Table */}
      <Table
        headers={['Jenis', 'Nomor Sertifikat / Registrasi', 'Produk Terkait', 'Masa Berlaku', 'Kode Verifikasi QR', 'Aksi']}
        isEmpty={certs.length === 0}
      >
        {certs.map((c: any) => (
          <tr key={c.id} className="hover:bg-surface/30 transition-colors">
            {/* Type */}
            <td className="py-4 px-4 whitespace-nowrap">
              <span className={`px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.08em] border ${
                c.certType === 'BPOM'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
              }`}>
                {c.certType}
              </span>
            </td>

            {/* Cert Number & Authority */}
            <td className="py-4 px-4">
              <p className="font-mono font-bold text-ink text-xs">{c.certNumber}</p>
              <p className="text-[0.68rem] text-muted mt-0.5">{c.authority}</p>
            </td>

            {/* Product */}
            <td className="py-4 px-4 text-xs font-medium text-ink">
              {c.productName}
            </td>

            {/* Validity */}
            <td className="py-4 px-4 text-xs text-muted whitespace-nowrap">
              Sampai {new Date(c.validUntil).toLocaleDateString('id-ID', {
                month: 'short',
                year: 'numeric',
              })}
            </td>

            {/* Code */}
            <td className="py-4 px-4 whitespace-nowrap">
              <code className="text-[0.68rem] bg-surface px-2 py-0.5 border border-line text-ink font-mono">
                {c.verifyCode}
              </code>
            </td>

            {/* Actions */}
            <td className="py-4 px-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenPrint(c)}
                >
                  Cetak Lembar Sertifikat & QR
                </Button>
                <a
                  href={`/verify/${c.verifyCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 border border-line hover:border-ink transition-colors text-ink inline-flex items-center"
                  title="Buka halaman verifikasi Google Lens"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {/* Modal: Printable Certificate Sheet */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Lembar Sertifikasi Resmi & QR Code"
        subtitle="Siap dicetak sebagai sisipan kemasan flacon parfum atau dus pengiriman."
        maxWidth="xl"
      >
        {selectedCert && (
          <div className="space-y-6">
            {/* The Printable Certificate Design Sheet */}
            <div
              id="printable-certificate-sheet"
              className="border-4 border-double border-line p-8 bg-surface/20 text-center relative overflow-hidden"
            >
              {/* Decorative Corner Borders */}
              <div className="absolute top-2 left-2 text-[0.6rem] text-muted tracking-widest uppercase">
                OMOO ATELIER VERIFICATION
              </div>
              <div className="absolute top-2 right-2 text-[0.6rem] text-muted tracking-widest uppercase">
                OFFICIAL SEAL
              </div>

              {/* Header */}
              <p className="font-display italic text-base text-muted">Atelier de Haute Parfumerie</p>
              <h2 className="font-display text-3xl font-light text-ink uppercase tracking-[0.1em] mt-1">
                OMOO JAKARTA
              </h2>
              <div className="w-16 h-px bg-accent mx-auto my-3" />

              <p className="text-[0.68rem] uppercase font-semibold tracking-[0.14em] text-accent">
                SERTIFIKASI KEASLIAN & LEGALITAS RESMI
              </p>

              {/* Title of Certificate */}
              <h3 className="font-display text-xl text-ink font-medium mt-3">
                {selectedCert.productName}
              </h3>
              <p className="text-xs text-muted mt-1 max-w-md mx-auto">
                Telah terdaftar resmi dan diawasi oleh {selectedCert.authority}.
              </p>

              {/* Middle Section: Big QR Code + Registration Number */}
              <div className="my-6 flex flex-col items-center justify-center gap-3">
                <div className="p-3 bg-white border border-line shadow-sm inline-block">
                  <img
                    src={selectedCert.qrCodeUrl}
                    alt="QR Code Verifikasi Google Lens"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[0.68rem] uppercase tracking-[0.1em] font-semibold text-muted">
                    Nomor Registrasi Resmi
                  </p>
                  <p className="font-mono text-sm font-bold text-ink tracking-wider">
                    {selectedCert.certNumber}
                  </p>
                  <p className="text-[0.65rem] text-muted italic">
                    Pindai kode QR di atas menggunakan Google Lens atau kamera ponsel untuk memverifikasi keaslian di web.
                  </p>
                </div>
              </div>

              {/* Footer specs */}
              <div className="grid grid-cols-2 gap-4 border-t border-line/70 pt-4 text-[0.68rem] text-muted">
                <div>
                  <span className="block font-medium text-ink">Masa Berlaku:</span>
                  <span>Hingga {new Date(selectedCert.validUntil).toLocaleDateString('id-ID')}</span>
                </div>
                <div>
                  <span className="block font-medium text-ink">Status Dokumen:</span>
                  <span className="text-emerald-700 font-semibold uppercase">TERVERIFIKASI AKTIF</span>
                </div>
              </div>
            </div>

            {/* Modal Controls */}
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
                  Cetak Sekarang
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
