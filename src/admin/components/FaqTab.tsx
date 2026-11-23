import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Input, Textarea } from '../../components/ui/react/Input';
import { Modal } from '../../components/ui/react/Modal';
import { toast } from 'sonner';
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  Save,
  ExternalLink,
  CheckCircle2,
  MessageCircleQuestion,
} from 'lucide-react';

export interface FaqItem {
  id?: string;
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: 'Bisakah saya berkunjung langsung ke toko / butik OMOO?',
    answer:
      'Tentu bisa. Kunjungan dibuka Selasa sampai Jumat dengan konfirmasi terlebih dahulu. Anda bisa chat ke WhatsApp kami atau email hello@omoo.studio untuk mencocokkan jadwal kedatangan.',
  },
  {
    question: 'Bagaimana cara memesan parfum?',
    answer:
      'Pemesanan dapat dilakukan langsung di website ini dengan memilih produk dan checkout via QRIS/Transfer, atau bisa juga langsung memesan secara praktis melalui WhatsApp resmi OMOO.',
  },
  {
    question: 'Berapa lama estimasi pengiriman pesanan?',
    answer:
      'Pesanan dikirimkan dalam 1-2 hari kerja menggunakan ekspedisi terpercaya (JNE YES / Paxel) dengan kemasan botol aman berlapis bubble wrap tebal dan asuransi pengiriman.',
  },
  {
    question: 'Bagaimana cara menyimpan botol parfum yang benar?',
    answer:
      'Simpan botol parfum dalam posisi berdiri tegak, di tempat sejuk dan terhindar dari paparan sinar matahari langsung atau suhu panas berlebih agar kualitas aroma tetap terjaga sempurna.',
  },
  {
    question: 'Apakah wewangian OMOO cocok untuk pria dan wanita (unisex)?',
    answer:
      'Ya, seluruh wewangian OMOO dirancang unisex. Setiap orang bebas memilih aroma yang paling cocok dengan karakter dan selera masing-masing.',
  },
  {
    question: 'Apakah produk OMOO sudah terdaftar BPOM dan Halal?',
    answer:
      'Ya, seluruh produk wewangian OMOO telah teruji aman dan resmi terdaftar di BPOM RI serta bersertifikasi Halal.',
  },
];

export const FaqTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalQuestion, setModalQuestion] = useState('');
  const [modalAnswer, setModalAnswer] = useState('');

  // Query contact page from DB
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-faq-contact-page'],
    queryFn: async () => {
      try {
        const res = await api.getPage('contact', true);
        return res?.data || null;
      } catch {
        return null;
      }
    },
  });

  // Extract FAQs from page section if already stored
  useEffect(() => {
    if (pageData && pageData.sections) {
      const faqSec = pageData.sections.find((s: any) => s.template === 'FAQ_ACCORDION');
      if (faqSec && faqSec.contentData && Array.isArray(faqSec.contentData.faqs) && faqSec.contentData.faqs.length > 0) {
        setFaqs(
          faqSec.contentData.faqs.map((f: any) => ({
            question: f.q || f.question || '',
            answer: f.a || f.answer || '',
          }))
        );
      }
    }
  }, [pageData]);

  // Mutation to Save FAQs
  const saveFaqsMutation = useMutation({
    mutationFn: async (updatedFaqs: FaqItem[]) => {
      // 1. Check if contact page exists
      let page = pageData;
      if (!page) {
        try {
          const createPageRes = await api.createPage({
            slug: 'contact',
            title: 'Kontak & Lokasi OMOO',
            description: 'Halaman kontak resmi OMOO',
            isActive: true,
          });
          page = createPageRes.data;
        } catch {
          // might exist
          const getRes = await api.getPage('contact', true);
          page = getRes.data;
        }
      }

      if (!page || !page.id) {
        throw new Error('Gagal mengakses data halaman kontak');
      }

      const existingFaqSec = (page.sections || []).find((s: any) => s.template === 'FAQ_ACCORDION');

      const cleanFaqs = updatedFaqs.map((f) => ({
        question: f.question.trim(),
        answer: f.answer.trim(),
        q: f.question.trim(),
        a: f.answer.trim(),
      }));

      if (existingFaqSec) {
        await api.updateSection(existingFaqSec.id, {
          contentData: { faqs: cleanFaqs },
        });
      } else {
        await api.addSection(page.id, {
          name: 'Pertanyaan Umum (FAQ)',
          template: 'FAQ_ACCORDION',
          title: 'Frequently Asked Questions',
          subtitle: 'Pertanyaan yang sering ditanyakan seputar produk dan layanan OMOO.',
          order: 99,
          contentData: { faqs: cleanFaqs },
          isActive: true,
        });
      }

      return cleanFaqs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faq-contact-page'] });
      toast.success('Daftar FAQ berhasil disimpan dan live di website!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan perubahan FAQ.');
    },
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setModalQuestion('');
    setModalAnswer('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index);
    setModalQuestion(faqs[index].question);
    setModalAnswer(faqs[index].answer);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalQuestion.trim() || !modalAnswer.trim()) {
      toast.error('Pertanyaan dan jawaban tidak boleh kosong.');
      return;
    }

    let updated: FaqItem[];
    if (editingIndex !== null) {
      updated = [...faqs];
      updated[editingIndex] = {
        question: modalQuestion.trim(),
        answer: modalAnswer.trim(),
      };
    } else {
      updated = [
        ...faqs,
        {
          question: modalQuestion.trim(),
          answer: modalAnswer.trim(),
        },
      ];
    }

    setFaqs(updated);
    setIsModalOpen(false);
    saveFaqsMutation.mutate(updated);
  };

  const handleDelete = (index: number) => {
    if (confirm(`Hapus pertanyaan: "${faqs[index].question}"?`)) {
      const updated = faqs.filter((_, i) => i !== index);
      setFaqs(updated);
      saveFaqsMutation.mutate(updated);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= faqs.length) return;

    const updated = [...faqs];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIdx, 0, moved);

    setFaqs(updated);
    saveFaqsMutation.mutate(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="border border-line bg-surface/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[0.62rem] uppercase font-bold tracking-[0.14em] text-accent">
              Manajemen Konten & CMS
            </span>
            <span className="text-muted text-xs">&bull;</span>
            <span className="text-xs text-muted">Tanya Jawab Pelanggan</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink font-normal mt-1">
            Kelola Pertanyaan Umum (FAQ)
          </h1>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Tambah, perbarui, dan atur urutan pertanyaan yang sering diajukan pelanggan. Perubahan akan langsung aktif dan tampil pada halaman kontak publik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-line bg-surface/40 hover:bg-surface text-ink transition-colors cursor-pointer"
          >
            <span>Lihat di Web Live</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted" />
          </a>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-bg text-xs uppercase tracking-wider font-semibold hover:bg-ink/80 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-accent" />
            <span>Tambah FAQ Baru</span>
          </button>
        </div>
      </div>

      {/* FAQ List */}
      <div className="border border-line bg-surface/10 divide-y divide-line overflow-hidden">
        {faqs.map((item, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-surface/20 transition-colors"
          >
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <span className="w-6 h-6 rounded-full border border-line bg-surface/50 text-[0.65rem] font-mono font-bold text-ink flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-ink leading-snug">
                  {item.question}
                </h3>
                <p className="text-xs text-muted leading-relaxed max-w-3xl whitespace-pre-line">
                  {item.answer}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => handleMove(idx, 'up')}
                disabled={idx === 0}
                className="p-1.5 border border-line hover:border-ink text-muted hover:text-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Pindah ke Atas"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleMove(idx, 'down')}
                disabled={idx === faqs.length - 1}
                className="p-1.5 border border-line hover:border-ink text-muted hover:text-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Pindah ke Bawah"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleOpenEdit(idx)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-line hover:border-accent text-xs text-ink transition-colors cursor-pointer"
                title="Edit FAQ ini"
              >
                <Edit className="w-3 h-3 text-accent" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => handleDelete(idx)}
                className="p-1.5 border border-line hover:border-red-500 text-muted hover:text-red-400 transition-colors cursor-pointer"
                title="Hapus FAQ"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <p className="text-xs text-muted">
          Total: <strong className="text-ink">{faqs.length}</strong> pertanyaan FAQ terdaftar.
        </p>

        <Button
          variant="primary"
          icon={<Save className="w-4 h-4 text-accent" />}
          isLoading={saveFaqsMutation.isPending}
          onClick={() => saveFaqsMutation.mutate(faqs)}
        >
          Simpan Semua Perubahan FAQ
        </Button>
      </div>

      {/* Modal Add / Edit FAQ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIndex !== null ? 'Edit Pertanyaan FAQ' : 'Tambah Pertanyaan FAQ Baru'}
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <Input
            label="Pertanyaan"
            value={modalQuestion}
            onChange={(e) => setModalQuestion(e.target.value)}
            placeholder="Contoh: Berapa lama estimasi pengiriman pesanan?"
            required
          />

          <Textarea
            label="Jawaban Lengkap"
            value={modalAnswer}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setModalAnswer(e.target.value)}
            placeholder="Tuliskan jawaban yang jelas, ramah, dan informatif..."
            rows={4}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={saveFaqsMutation.isPending}>
              {editingIndex !== null ? 'Perbarui FAQ' : 'Simpan FAQ Baru'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
