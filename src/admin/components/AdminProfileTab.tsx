import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Input } from '../../components/ui/react/Input';
import { UserCog, Lock, Eye, EyeOff, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminProfileTabProps {
  onProfileUpdated?: (user: any) => void;
}

export const AdminProfileTab: React.FC<AdminProfileTabProps> = ({ onProfileUpdated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .getMe()
      .then((res) => {
        if (res.success && res.user) {
          setName(res.user.name || '');
          setEmail(res.user.email || '');
          setPhone(res.user.phone || '');
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error('Nama dan email administrator wajib diisi.');
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        toast.error('Kata sandi baru minimal 6 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
      if (!currentPassword) {
        toast.error('Masukkan kata sandi saat ini untuk mengubah sandi.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (res.success && res.user) {
        localStorage.setItem('omoo_customer_user', JSON.stringify(res.user));
        window.dispatchEvent(new Event('omoo:auth-changed'));
        onProfileUpdated?.(res.user);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success(res.message || 'Profil berhasil diperbarui.');
      } else {
        toast.error(res.message || 'Gagal memperbarui profil.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted text-xs uppercase tracking-[0.1em]">
        Memuat profil administrator...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b border-line pb-5">
        <div className="flex items-center gap-2">
          <UserCog className="w-5 h-5 text-accent" />
          <h3 className="font-display text-2xl font-light text-ink">
            Profil &amp; Keamanan Akun Admin
          </h3>
        </div>
        <p className="text-xs text-muted mt-1">
          Ubah nama tampilan, alamat email login, nomor kontak, serta kata sandi akun administrator Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Info Card */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <div className="border-b border-line/70 pb-3">
            <h4 className="font-display text-lg text-ink font-normal">
              Informasi Akun
            </h4>
          </div>

          <Input
            label="Nama Lengkap *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Administrator OMOO"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Login *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@omoo.web.id"
              required
            />
            <Input
              label="Nomor WhatsApp / Telepon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08..."
            />
          </div>
        </div>

        {/* Password Change Card */}
        <div className="border border-line bg-surface/20 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-line/70 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" />
              <h4 className="font-display text-lg text-ink font-normal">
                Ubah Kata Sandi (Opsional)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[0.68rem] uppercase tracking-wider text-muted hover:text-ink cursor-pointer"
            >
              {showPasswords ? (
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

          <p className="text-[0.72rem] text-muted">
            Kosongkan kolom kata sandi di bawah ini jika Anda hanya ingin mengubah nama atau email.
          </p>

          <Input
            label="Kata Sandi Saat Ini"
            type={showPasswords ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Kata Sandi Baru"
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
            />
            <Input
              label="Konfirmasi Kata Sandi Baru"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi sandi baru"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span>Perubahan langsung aktif pada sesi Anda</span>
          </span>

          <Button
            type="submit"
            isLoading={isSaving}
            icon={<Save className="w-4 h-4 text-accent" />}
          >
            Simpan Perubahan Profil
          </Button>
        </div>
      </form>
    </div>
  );
};
