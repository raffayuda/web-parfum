import React, { useState } from 'react';
import { Modal } from '../ui/react/Modal';
import { Button } from '../ui/react/Button';
import { Input, Textarea } from '../ui/react/Input';
import { FileUploader } from '../ui/react/FileUploader';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { QrCode, CheckCircle2, MessageSquare, ArrowRight, Truck, ExternalLink } from 'lucide-react';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id?: string;
    name: string;
    volume: string;
    price: number;
    edition?: string;
  };
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  product = {
    name: 'Vetiver Obscura Extrait de Parfum',
    volume: '50 ml',
    price: 2450000,
    edition: 'OM-01',
  },
}) => {
  const [step, setStep] = useState<'form' | 'qris' | 'success'>('form');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('Jakarta Selatan');
  const [shippingPostal, setShippingPostal] = useState('12190');
  const [quantity, setQuantity] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isReceiptSubmitted, setIsReceiptSubmitted] = useState(false);

  const totalAmount = product.price * quantity;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.createOrder({
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingCity,
        shippingPostal,
        shippingCourier: 'JNE YES (Next Day)',
        totalAmount,
        items: [
          {
            name: product.name,
            volume: product.volume,
            quantity,
            unitPrice: product.price,
            fragranceId: product.id,
          },
        ],
      });

      if (res.success) {
        setOrderResult(res.data);
        setStep('qris');
        toast.success(`Pesanan #${res.data.orderNumber} berhasil dibuat!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmProof = async () => {
    if (!receiptUrl || !orderResult?.id) return;
    setIsLoading(true);

    try {
      await api.uploadReceipt(orderResult.id, receiptUrl, 'Bukti bayar diunggah via web checkout');
      setIsReceiptSubmitted(true);
      setStep('success');
      toast.success('Bukti pembayaran berhasil dikirim!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim bukti bayar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setOrderResult(null);
    setReceiptUrl(null);
    setIsReceiptSubmitted(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={
        step === 'form'
          ? 'Pemesanan Flacon Atelier'
          : step === 'qris'
          ? 'Pembayaran via QRIS'
          : 'Konfirmasi Diterima'
      }
      subtitle={
        step === 'form'
          ? `${product.edition ? `${product.edition} — ` : ''}${product.name} (${product.volume})`
          : step === 'qris'
          ? `Pesanan #${orderResult?.orderNumber} — Total Rp ${totalAmount.toLocaleString('id-ID')}`
          : 'Terima kasih, pesanan Anda sedang kami proses di atelier.'
      }
      maxWidth="md"
    >
      {step === 'form' && (
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {/* Order Summary Pill */}
          <div className="border border-line bg-surface/30 p-3.5 flex items-center justify-between text-xs">
            <div>
              <p className="font-medium text-ink">{product.name}</p>
              <p className="text-muted text-[0.68rem]">{product.volume} &bull; Rp {product.price.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted text-[0.68rem]">Jumlah:</span>
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-12 bg-bg border border-line text-center text-xs py-1"
              />
            </div>
          </div>

          <Input
            label="Nama Lengkap"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama penerima paket"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nomor WhatsApp"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="081234567890"
              required
            />
            <Input
              label="Email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="email@anda.com"
              required
            />
          </div>

          <Textarea
            label="Alamat Pengiriman"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Jalan, nomor rumah, gedung, lantai..."
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

          <div className="pt-3 border-t border-line flex items-center justify-between">
            <div>
              <span className="text-[0.65rem] uppercase text-muted tracking-[0.1em] block">Total Pembayaran</span>
              <span className="font-mono text-base font-bold text-ink">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Lanjut ke QRIS
            </Button>
          </div>
        </form>
      )}

      {step === 'qris' && orderResult && (
        <div className="space-y-5 text-center">
          {/* QR Code Container */}
          <div className="p-4 bg-white border border-line inline-block shadow-sm">
            <img
              src={orderResult.qrisQrCodeUrl}
              alt="QRIS OMOO Studio"
              className="w-52 h-52 mx-auto"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted">
              Pindai kode QR di atas menggunakan aplikasi BCA Mobile, GoPay, OVO, Dana, ShopeePay, atau m-Banking Anda.
            </p>
            <p className="font-mono text-sm font-bold text-ink">
              Nominal: Rp {totalAmount.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Upload Proof */}
          <div className="border-t border-line pt-4 text-left">
            <FileUploader
              label="Unggah Bukti Transfer QRIS"
              helperText="Tangkapan layar struk berhasil dari aplikasi pembayaran Anda."
              onUploadSuccess={(url) => setReceiptUrl(url)}
            />
          </div>

          {/* Confirmation Options */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              className="w-full"
              disabled={!receiptUrl}
              isLoading={isLoading}
              onClick={handleConfirmProof}
            >
              Kirim Bukti & Verifikasi Pesanan
            </Button>

            {/* Direct WhatsApp Confirmation */}
            <a
              href={orderResult.waConfirmationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-line bg-surface hover:bg-surface/80 text-ink text-xs uppercase tracking-[0.08em] font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>Konfirmasi Langsung via WhatsApp Admin</span>
            </a>
          </div>
        </div>
      )}

      {step === 'success' && orderResult && (
        <div className="py-6 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-accent mx-auto" />
          <div>
            <h4 className="font-display text-2xl text-ink font-normal">
              Bukti Pembayaran Diterima!
            </h4>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto leading-relaxed">
              Pesanan #{orderResult.orderNumber} telah kami jadwalkan untuk proses maceration & pembotolan di atelier.
            </p>
          </div>

          <div className="p-4 border border-line bg-surface/30 text-xs text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted">Nomor Pesanan:</span>
              <span className="font-mono font-bold text-ink">{orderResult.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Status:</span>
              <span className="text-accent font-medium">Menunggu Verifikasi Concierge</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-3">
            <a
              href={`/account/tracker?order=${orderResult.orderNumber}`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-ink text-bg text-xs uppercase tracking-[0.1em] font-medium hover:bg-ink/90 transition-colors"
            >
              <span>Pantau Status di Order Tracker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <Button variant="ghost" onClick={handleReset}>
              Kembali ke Toko
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
