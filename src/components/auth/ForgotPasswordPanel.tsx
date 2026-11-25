import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/react/Button';
import { Input } from '../ui/react/Input';
import { ArrowLeft, MailCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordPanelProps {
  initialEmail?: string;
  onCancel: () => void;
  onSuccess: (email: string) => void;
}

export const ForgotPasswordPanel: React.FC<ForgotPasswordPanelProps> = ({
  initialEmail = '',
  onCancel,
  onSuccess,
}) => {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Masukkan alamat email akun Anda.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.sendForgotPasswordOtp(email.trim());
      if (!res.success) {
        throw new Error(res.message || 'Gagal mengirim kode OTP.');
      }
      setStep('verify');
      setCooldown(res.cooldownSeconds || 45);
      toast.success(res.message || 'Kode OTP reset kata sandi dikirim ke email Anda.');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim kode OTP.');
      toast.error(err.message || 'Gagal mengirim kode OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.resetPasswordWithOtp({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      if (!res.success) {
        throw new Error(res.message || 'Gagal mereset kata sandi.');
      }

      toast.success(res.message || 'Kata sandi berhasil diperbarui!');
      onSuccess(email.trim());
    } catch (err: any) {
      setError(err.message || 'Kode OTP atau data tidak valid.');
      toast.error(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'email') {
    return (
      <form onSubmit={handleSendOtp} className="space-y-4">
        <div className="space-y-1">
          <h4 className="font-display text-xl text-ink font-normal">Lupa Kata Sandi</h4>
          <p className="text-xs text-muted leading-relaxed">
            Masukkan email akun Anda. Kami akan mengirimkan kode OTP 6 digit untuk mengatur ulang kata sandi.
          </p>
        </div>

        <Input
          label="Email Akun"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
          required
        />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
          Kirim Kode OTP Reset
        </Button>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors cursor-pointer pt-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke halaman masuk</span>
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="border border-line bg-surface/30 p-3.5 flex items-start gap-3">
        <MailCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <p className="font-medium text-ink">Masukkan Kode OTP &amp; Sandi Baru</p>
          <p className="text-muted">
            Kode OTP dikirim ke <strong className="text-ink">{email.trim()}</strong>.
          </p>
        </div>
      </div>

      <Input
        label="Kode OTP (6 Digit)"
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        className="font-mono text-center text-lg tracking-[0.4em]"
        required
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-wider text-muted hover:text-ink cursor-pointer"
        >
          {showPassword ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Sembunyikan</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Lihat Sandi</span>
            </>
          )}
        </button>
      </div>

      <Input
        label="Kata Sandi Baru"
        type={showPassword ? 'text' : 'password'}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Minimal 8 karakter"
        minLength={8}
        required
      />

      <Input
        label="Konfirmasi Kata Sandi Baru"
        type={showPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Ulangi kata sandi baru"
        minLength={8}
        required
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isSubmitting}
        disabled={otp.length < 6}
      >
        Simpan Kata Sandi Baru
      </Button>

      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setOtp('');
            setError(null);
          }}
          className="inline-flex items-center gap-1.5 text-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ganti Email</span>
        </button>

        <button
          type="button"
          disabled={cooldown > 0 || isSubmitting}
          onClick={() => handleSendOtp()}
          className="text-accent hover:text-ink disabled:text-muted/60 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
        >
          {cooldown > 0 ? `Kirim ulang (${cooldown}d)` : 'Kirim Ulang OTP'}
        </button>
      </div>
    </form>
  );
};
