import React, { useState } from 'react';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/query-client';
import { api } from '../../lib/api';
import { CheckoutModal } from '../checkout/CheckoutModal';
import { Button } from '../ui/react/Button';
import { Badge } from '../ui/react/Badge';
import { ArrowRight, ShieldCheck, ChevronDown, Sparkles, ShoppingBag } from 'lucide-react';

export interface PageSectionsProps {
  pageSlug: string;
  initialSections?: any[];
}

const PageSectionsInner: React.FC<PageSectionsProps> = ({ pageSlug, initialSections }) => {
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Dynamic Query for Page Sections
  const { data: pageData } = useQuery({
    queryKey: ['page-sections', pageSlug],
    queryFn: () => api.getPage(pageSlug),
    initialData: initialSections ? { success: true, data: { sections: initialSections } } : undefined,
  });

  // Dynamic Query for Perfumes (for FRAGRANCE_GRID template)
  const { data: perfumesData } = useQuery({
    queryKey: ['catalog-perfumes'],
    queryFn: () => api.getPerfumes(),
  });

  const sections = pageData?.data?.sections || initialSections || [];
  const perfumes = perfumesData?.data || [];

  const handleOpenCheckout = (product: any) => {
    setSelectedProductForCheckout(product);
    setIsCheckoutOpen(true);
  };

  const renderSection = (section: any) => {
    const { template, title, eyebrow, subtitle, contentData = {} } = section;

    switch (template) {
      case 'HERO_EDITORIAL':
        return (
          <section key={section.id} className="relative overflow-hidden py-16 sm:py-24 border-b border-line">
            <div className="mx-auto max-w-5xl px-6 text-center space-y-6">
              {eyebrow && (
                <span className="text-[0.68rem] uppercase font-semibold tracking-[0.2em] text-muted block">
                  {eyebrow}
                </span>
              )}
              {title && (
                <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light text-ink leading-[0.95] text-balance">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                {contentData.ctaLink && (
                  <a
                    href={contentData.ctaLink}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-bg text-xs uppercase tracking-[0.12em] font-medium hover:bg-ink/90 transition-colors"
                  >
                    <span>{contentData.ctaText || 'Jelajahi Koleksi'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
                {contentData.secondaryLink && (
                  <a
                    href={contentData.secondaryLink}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-line bg-surface/30 text-ink text-xs uppercase tracking-[0.12em] font-medium hover:border-ink transition-colors"
                  >
                    <span>{contentData.secondaryText || 'Tentang Maison'}</span>
                  </a>
                )}
              </div>
            </div>
          </section>
        );

      case 'FRAGRANCE_GRID':
        return (
          <section key={section.id} className="py-16 sm:py-20 border-b border-line">
            <div className="mx-auto max-w-7xl px-6">
              {/* Header */}
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                {eyebrow && (
                  <span className="text-[0.65rem] uppercase font-semibold tracking-[0.18em] text-muted block">
                    {eyebrow}
                  </span>
                )}
                {title && <h2 className="font-display text-3xl sm:text-4xl text-ink font-light">{title}</h2>}
                {subtitle && <p className="text-xs text-muted leading-relaxed">{subtitle}</p>}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {perfumes.map((perfume: any) => (
                  <div
                    key={perfume.id}
                    className="group border border-line bg-surface/20 flex flex-col justify-between p-6 transition-all duration-300 hover:border-ink"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-display text-sm text-muted">{perfume.edition}</span>
                        <Badge variant={perfume.isAvailable ? 'available' : 'unavailable'}>
                          {perfume.isAvailable ? 'Tersedia' : 'Stok Habis'}
                        </Badge>
                      </div>

                      {/* Image Preview */}
                      <div className="aspect-[4/5] bg-surface/60 border border-line mb-4 flex items-center justify-center p-6 overflow-hidden">
                        <img
                          src={perfume.bottleImage}
                          alt={perfume.name}
                          className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <h3 className="font-display text-2xl text-ink font-normal">{perfume.name}</h3>
                      <p className="text-[0.68rem] text-accent font-medium uppercase tracking-[0.08em] mt-0.5">
                        {perfume.family} &bull; {perfume.concentration}
                      </p>
                      <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
                        {perfume.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-ink">
                        Rp {perfume.price.toLocaleString('id-ID')}
                      </span>

                      {perfume.isAvailable ? (
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<ShoppingBag className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenCheckout(perfume)}
                        >
                          Checkout QRIS
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          Habis
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'MATERIAL_STORY':
        return (
          <section key={section.id} className="py-16 sm:py-20 border-b border-line bg-surface/10">
            <div className="mx-auto max-w-5xl px-6 space-y-10">
              <div className="text-center space-y-2 max-w-xl mx-auto">
                {eyebrow && (
                  <span className="text-[0.65rem] uppercase font-semibold tracking-[0.18em] text-muted block">
                    {eyebrow}
                  </span>
                )}
                {title && <h2 className="font-display text-3xl sm:text-4xl text-ink font-light">{title}</h2>}
                {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(contentData.materials || []).map((m: any, idx: number) => (
                  <div key={idx} className="border border-line bg-bg p-6 space-y-3">
                    <span className="text-[0.62rem] font-mono text-muted">ORIGIN 0{idx + 1}</span>
                    <h4 className="font-display text-xl text-ink font-medium">{m.name}</h4>
                    <span className="inline-block text-[0.68rem] uppercase font-semibold text-accent tracking-[0.08em]">
                      {m.origin}
                    </span>
                    <p className="text-xs text-muted italic leading-relaxed">"{m.quote}"</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'PROCESS_STEPS':
        return (
          <section key={section.id} className="py-16 sm:py-20 border-b border-line">
            <div className="mx-auto max-w-5xl px-6 space-y-10">
              <div className="text-center space-y-2 max-w-xl mx-auto">
                {eyebrow && (
                  <span className="text-[0.65rem] uppercase font-semibold tracking-[0.18em] text-muted block">
                    {eyebrow}
                  </span>
                )}
                {title && <h2 className="font-display text-3xl sm:text-4xl text-ink font-light">{title}</h2>}
                {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(contentData.steps || []).map((step: any, idx: number) => (
                  <div key={idx} className="border border-line bg-surface/20 p-6 space-y-2">
                    <span className="font-mono text-2xl font-bold text-accent">{step.step || `0${idx + 1}`}</span>
                    <h4 className="font-display text-xl text-ink font-medium">{step.title}</h4>
                    <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'HALAL_BPOM_BADGE':
        return (
          <section key={section.id} className="py-16 sm:py-20 border-b border-line bg-surface/30">
            <div className="mx-auto max-w-4xl px-6 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-600 text-emerald-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                {eyebrow && (
                  <span className="text-[0.65rem] uppercase font-semibold tracking-[0.18em] text-emerald-800 dark:text-emerald-400 block mb-1">
                    {eyebrow}
                  </span>
                )}
                {title && <h2 className="font-display text-3xl sm:text-4xl text-ink font-light">{title}</h2>}
                {subtitle && <p className="text-xs text-muted max-w-xl mx-auto mt-2 leading-relaxed">{subtitle}</p>}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={`/verify/${contentData.featuredCode || 'BPOM-OM01-VETIVER'}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-bg text-xs uppercase tracking-[0.1em] font-medium hover:bg-ink/90 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cek Bukti Legalitas Google Lens</span>
                </a>
              </div>
            </div>
          </section>
        );

      case 'DISCOVERY_BANNER':
        return (
          <section key={section.id} className="py-16 sm:py-20 border-b border-line">
            <div className="mx-auto max-w-4xl px-6 border border-line bg-surface/40 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-center md:text-left">
                {eyebrow && (
                  <span className="text-[0.65rem] uppercase font-semibold tracking-[0.16em] text-accent block">
                    {eyebrow}
                  </span>
                )}
                <h3 className="font-display text-3xl sm:text-4xl text-ink font-light">{title}</h3>
                <p className="text-xs text-muted max-w-md leading-relaxed">{subtitle}</p>
                {contentData.price && (
                  <p className="font-mono text-lg font-bold text-ink">
                    Rp {Number(contentData.price).toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              <Button
                variant="primary"
                onClick={() =>
                  handleOpenCheckout({
                    name: title || 'Discovery Set (6 x 2 ml)',
                    volume: '6 x 2 ml',
                    price: contentData.price || 450000,
                  })
                }
                className="shrink-0"
              >
                {contentData.ctaText || 'Pesan Discovery Set'}
              </Button>
            </div>
          </section>
        );

      case 'FAQ_ACCORDION':
        return (
          <section key={section.id} className="py-16 sm:py-20 border-b border-line">
            <div className="mx-auto max-w-3xl px-6 space-y-8">
              <div className="text-center space-y-2">
                {eyebrow && (
                  <span className="text-[0.65rem] uppercase font-semibold tracking-[0.18em] text-muted block">
                    {eyebrow}
                  </span>
                )}
                {title && <h2 className="font-display text-3xl text-ink font-light">{title}</h2>}
                {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
              </div>

              <div className="divide-y divide-line border border-line">
                {(contentData.faqs || []).map((faq: any, idx: number) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div key={idx} className="bg-surface/10">
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        className="w-full text-left p-5 flex items-center justify-between gap-4 font-medium text-sm text-ink hover:bg-surface/30 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-xs text-muted leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {sections.map(renderSection)}

      {/* Reusable Checkout QRIS Modal */}
      {selectedProductForCheckout && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          product={selectedProductForCheckout}
        />
      )}
    </>
  );
};

export const PageSections: React.FC<PageSectionsProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <PageSectionsInner {...props} />
    </QueryClientProvider>
  );
};
