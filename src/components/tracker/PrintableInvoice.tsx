import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';

export interface PrintableInvoiceProps {
  order: any;
  onBack: () => void;
  backLabel?: string;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  order,
  onBack,
  backLabel = 'Kembali ke Pesanan',
}) => {
  if (!order) return null;

  // Extract GPS coordinates
  const match = (order.shippingAddress || '').match(/\[GPS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
  const gps = match ? { lat: parseFloat(match[1]), lng: parseFloat(match[2]) } : null;

  const cleanAddress = order.shippingAddress
    ? order.shippingAddress.replace(/\[GPS:\s*[^\]]+\]/, '').trim().replace(/,\s*$/, '')
    : '-';

  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isPaid = order.status !== 'PENDING_PAYMENT' && order.status !== 'CANCELLED';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200">
      <style>{`
        @media print {
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, header, footer, aside, .print\\:hidden, #nav, [data-page-veil], .skip-link {
            display: none !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-root, #printable-invoice-root * {
            visibility: visible !important;
          }
          #printable-invoice-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 16px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 12mm;
          }
        }
      `}</style>

      {/* Top Controls (Hidden on Print) */}
      <div className="flex items-center justify-between gap-4 border-b border-line pb-3 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-bg text-xs font-semibold uppercase tracking-wider hover:bg-ink/80 transition-colors cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4 text-accent" />
          <span>Cetak / Unduh PDF Faktur (1 Halaman)</span>
        </button>
      </div>

      {/* SINGLE-PAGE INVOICE DOCUMENT */}
      <div
        id="printable-invoice-root"
        className="official-invoice-sheet bg-white text-black p-8 sm:p-10 border border-gray-300 shadow-md text-[12px] leading-normal font-sans rounded-none"
        style={{
          color: '#111827',
          backgroundColor: '#ffffff',
          maxWidth: '820px',
          margin: '0 auto',
        }}
      >
        {/* Header Kop Surat */}
        <div className="flex items-start justify-between border-b-2 border-black pb-4">
          <div>
            <h1 className="text-3xl font-serif tracking-[0.15em] font-light uppercase text-black">
              OMOO
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-600 mt-0.5">
              Toko Parfum Resmi &bull; Jakarta
            </p>
            <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
              Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan 12190<br />
              Email: hello@omoo.studio &bull; WhatsApp: +62 812-0000-0000
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500 block">
              Faktur Tagihan Resmi
            </span>
            <p className="font-mono text-xl font-bold text-black mt-0.5">
              INV/OMOO/{order.orderNumber}
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              Tanggal: <strong>{orderDate}</strong>
            </p>
            <div className="mt-2 inline-block">
              {isPaid ? (
                <span className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  LUNAS (Terverifikasi)
                </span>
              ) : (
                <span className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  Menunggu Pembayaran
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info Pemesan & Pengiriman */}
        <div className="grid grid-cols-2 gap-6 py-4 border-b border-gray-300 text-[11px]">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">
              Ditujukan Kepada (Customer):
            </span>
            <p className="font-bold text-black text-[13px]">{order.customerName}</p>
            <p className="text-gray-700">{order.customerEmail}</p>
            <p className="font-mono text-gray-700">{order.customerPhone}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">
              Tujuan Pengiriman & Ekspedisi:
            </span>
            <p className="font-medium text-black leading-snug">{cleanAddress}</p>
            <p className="text-gray-700">
              {order.shippingCity || 'Indonesia'}, {order.shippingPostal || ''}
            </p>
            <p className="text-[11px] font-semibold text-gray-900 mt-1">
              Kurir: {order.shippingCourier || 'JNE REG'}{' '}
              {order.trackingNumber ? `(No. Resi: ${order.trackingNumber})` : ''}
            </p>
          </div>
        </div>

        {/* Tabel Produk */}
        <div className="py-3">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-black text-[10px] uppercase tracking-wider text-gray-600 bg-gray-50">
                <th className="py-2 px-3">No</th>
                <th className="py-2 px-3">Deskripsi Produk</th>
                <th className="py-2 px-3 text-center">Ukuran</th>
                <th className="py-2 px-3 text-center">Jumlah</th>
                <th className="py-2 px-3 text-right">Harga Satuan</th>
                <th className="py-2 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(order.items || []).map((it: any, i: number) => (
                <tr key={i}>
                  <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                  <td className="py-2 px-3 font-medium text-black">
                    {it.name}
                    <span className="block text-[10px] text-gray-500">Extrait de Parfum</span>
                  </td>
                  <td className="py-2 px-3 text-center text-gray-600">{it.volume || '50 ml'}</td>
                  <td className="py-2 px-3 text-center font-mono font-medium">{it.quantity}</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-700">
                    Rp {Number(it.unitPrice).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-black">
                    Rp {Number(it.subtotal).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ringkasan Biaya & Total */}
        <div className="border-t border-black pt-3 flex items-start justify-between">
          <div className="text-[10px] text-gray-600 max-w-xs leading-relaxed space-y-1">
            <p className="font-semibold text-black uppercase tracking-wider">Catatan Pengiriman:</p>
            <p>
              Pesanan dikemas aman dengan bubble wrap dan perlindungan botol kaca.
            </p>
            {gps && (
              <p className="font-mono text-gray-500">
                Titik GPS: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
              </p>
            )}
          </div>

          <div className="w-64 space-y-1 text-[11px]">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal Produk:</span>
              <span className="font-mono">Rp {Number(order.totalAmount).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Biaya Pengiriman:</span>
              <span className="font-semibold text-emerald-700">GRATIS</span>
            </div>
            <div className="flex justify-between text-black font-bold text-[13px] pt-1.5 border-t border-gray-300">
              <span>Total Pembayaran:</span>
              <span className="font-mono text-[14px]">
                Rp {Number(order.totalAmount).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer & Tanda Tangan */}
        <div className="pt-6 mt-4 border-t border-gray-200 flex items-end justify-between text-[10px] text-gray-600">
          <div>
            <p className="font-serif text-[13px] font-medium text-black">Admin OMOO</p>
            <p className="uppercase tracking-wider text-gray-500">Pengelola Toko</p>
          </div>

          <div className="text-right">
            <p className="font-mono uppercase tracking-widest text-gray-700 font-bold border border-gray-300 px-3 py-1 inline-block">
              FAKTUR PENJUALAN RESMI OMOO
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5">Dicetak melalui website omoo.studio</p>
          </div>
        </div>
      </div>
    </div>
  );
};
