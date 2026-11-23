import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Input, Textarea } from '../../components/ui/react/Input';
import { MessageSquare, CheckCircle, Copy, ExternalLink, Sparkles } from 'lucide-react';

export const ManualOrderTab: React.FC = () => {
  const queryClient = useQueryClient();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('Jakarta Selatan');
  const [shippingPostal, setShippingPostal] = useState('12190');
  const [selectedPerfumeSlug, setSelectedPerfumeSlug] = useState('vetiver-obscura');
  const [quantity, setQuantity] = useState('1');
  const [paymentStatus, setPaymentStatus] = useState('PROCESSING');
  const [adminNotes, setAdminNotes] = useState('Pesanan dikonfirmasi via WhatsApp.');

  // Result state after creation
  const [result, setResult] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Perfumes catalogue query
  const { data: perfumesData } = useQuery({
    queryKey: ['admin-perfumes'],
    queryFn: () => api.getPerfumes(),
  });

  const perfumes = perfumesData?.data || [];

  const manualOrderMutation = useMutation({
    mutationFn: (data: any) => api.createManualOrder(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setResult(res.data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const perfume = perfumes.find((p: any) => p.slug === selectedPerfumeSlug) || perfumes[0];
    if (!perfume) return;

    manualOrderMutation.mutate({
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingPostal,
      paymentStatus,
      adminNotes,
      items: [
        {
          name: perfume.name,
          volume: perfume.volume,
          quantity: Number(quantity),
          unitPrice: perfume.price,
          fragranceId: perfume.id,
        },
      ],
    });
  };

  const handleCopyText = () => {
    if (result?.customerNotificationText) {
      navigator.clipboard.writeText(result.customerNotificationText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const cleanPhone = (phone: string) => {
    return phone.replace(/[^0-9]/g, '').replace(/^0/, '62');
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="border border-line bg-surface/30 p-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          <h3 className="font-display text-2xl text-ink font-normal">
            Buat Akun Customer & Pesanan Manual (Order via WhatsApp)
          </h3>
        </div>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          Fitur ini digunakan saat ada pembeli yang memesan langsung melalui WhatsApp dan tidak membuat akun di web,
          tetapi ingin memantau tracker pesanannya di web tanpa repot mendaftar sendiri. Sistem akan otomatis membuatkan akun,
          mencatatkan pesanan, dan menyiapkan teks konfirmasi WhatsApp beserta kredensial login mereka.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form input */}
        <div className="border border-line bg-surface/10 p-6 space-y-4">
          <h4 className="font-display text-xl text-ink">Form Input Data Pembeli</h4>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Lengkap Customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Contoh: Raden Mas Danang"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nomor WhatsApp / HP"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="081234567890"
                required
              />
              <Input
                label="Email Customer (Untuk Login Akun)"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="danang@gmail.com"
                required
              />
            </div>

            {/* Perfume Picker */}
            <div className="w-full flex flex-col gap-1.5 text-left">
              <label className="text-[0.65rem] font-medium tracking-[0.1em] uppercase text-muted">
                Pilih Parfum yang Dipesan
              </label>
              <select
                value={selectedPerfumeSlug}
                onChange={(e) => setSelectedPerfumeSlug(e.target.value)}
                className="w-full bg-surface/50 border border-line text-ink px-3.5 py-2.5 text-xs outline-none"
              >
                {perfumes.map((p: any) => (
                  <option key={p.slug} value={p.slug}>
                    {p.edition} &mdash; {p.name} (Rp {p.price.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Jumlah (Botol)"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              <div className="w-full flex flex-col gap-1.5 text-left">
                <label className="text-[0.65rem] font-medium tracking-[0.1em] uppercase text-muted">
                  Status Pembayaran Awal
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-surface/50 border border-line text-ink px-3.5 py-2.5 text-xs outline-none"
                >
                  <option value="PROCESSING">Lunas (Langsung Diramu)</option>
                  <option value="PENDING_PAYMENT">Menunggu Pembayaran</option>
                </select>
              </div>
            </div>

            <Textarea
              label="Alamat Pengiriman Lengkap"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan..."
              rows={2}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Kota"
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                required
              />
              <Input
                label="Kode Pos"
                value={shippingPostal}
                onChange={(e) => setShippingPostal(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={manualOrderMutation.isPending}
            >
              Generate Akun & Pesanan Sekarang
            </Button>
          </form>
        </div>

        {/* Output result card */}
        <div>
          {result ? (
            <div className="border border-line bg-surface/30 p-6 space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-accent">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <h4 className="font-display text-xl text-ink font-normal">
                  Akun & Pesanan Berhasil Dibuat!
                </h4>
              </div>

              {/* Order and credentials summary */}
              <div className="border border-line bg-bg p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Nomor Pesanan:</span>
                  <span className="font-mono font-bold text-ink">{result.order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total Tagihan:</span>
                  <span className="font-mono text-ink">Rp {result.order.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Email Login:</span>
                  <span className="font-semibold text-ink">{result.customer.email}</span>
                </div>
                {result.customer.isNewAccount && (
                  <div className="flex justify-between text-accent">
                    <span className="font-medium">Password Sementara:</span>
                    <span className="font-mono font-bold">{result.customer.temporaryPassword}</span>
                  </div>
                )}
              </div>

              {/* Ready-to-send WhatsApp message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-muted">
                    Format Pesan WhatsApp Siap Kirim
                  </label>
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1 text-[0.68rem] text-accent hover:underline font-medium cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isCopied ? 'Tersalin!' : 'Salin Pesan'}</span>
                  </button>
                </div>

                <pre className="border border-line bg-bg p-4 text-xs font-sans text-ink whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {result.customerNotificationText}
                </pre>
              </div>

              {/* Quick WhatsApp Action Button */}
              <a
                href={`https://wa.me/${cleanPhone(customerPhone)}?text=${encodeURIComponent(
                  result.customerNotificationText
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs uppercase tracking-[0.1em] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka & Kirim Langsung ke WhatsApp Customer</span>
              </a>
            </div>
          ) : (
            <div className="border-2 border-dashed border-line p-12 text-center text-muted">
              <Sparkles className="w-8 h-8 mx-auto text-muted/60 mb-3" />
              <p className="text-sm font-medium text-ink">Hasil Pembuatan Akun & Link Tracker</p>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                Setelah Anda mengisi form di sebelah kiri dan menekan tombol buat, informasi kredensial login dan pesan WhatsApp otomatis akan tampil di sini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
