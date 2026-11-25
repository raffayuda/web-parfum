import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/react/Modal';
import { Calendar, MapPin, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { resolvePublicImageUrl } from '../../data/images';

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  eventOrLocation: string;
  capturedDate: string;
  image: string;
  description: string;
  aspect?: string;
  featured?: boolean;
  createdAt?: string;
}

interface GalleryGridProps {
  initialItems: GalleryItem[];
  compact?: boolean;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ initialItems, compact = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(initialItems.map((i) => i.category).filter(Boolean))
    );
    return ['ALL', ...unique];
  }, [initialItems]);

  const visibleItems = useMemo(() => {
    if (compact || selectedCategory === 'ALL') return initialItems;
    return initialItems.filter((item) => item.category === selectedCategory);
  }, [initialItems, compact, selectedCategory]);

  // Open specific modal if ?item=<id> is in URL
  useEffect(() => {
    if (typeof window === 'undefined' || compact) return;
    const itemId = new URLSearchParams(window.location.search).get('item');
    if (itemId) {
      const idx = visibleItems.findIndex((i) => i.id === itemId);
      if (idx >= 0) setActiveIndex(idx);
    }
  }, [compact, visibleItems]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev + 1) % visibleItems.length
        );
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev - 1 + visibleItems.length) % visibleItems.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, visibleItems.length]);

  const activeItem = activeIndex !== null ? visibleItems[activeIndex] ?? null : null;

  return (
    <div className="space-y-8">
      {/* Category Filter Pills (full gallery only) */}
      {!compact && categories.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setActiveIndex(null);
                  }}
                  className={`px-3.5 py-2 text-[0.68rem] uppercase tracking-[0.12em] font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? 'border-ink bg-ink text-bg'
                      : 'border-line bg-surface/30 text-muted hover:text-ink hover:border-ink/50'
                  }`}
                >
                  {cat === 'ALL' ? `Semua (${initialItems.length})` : cat}
                </button>
              );
            })}
          </div>
          <span className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">
            Klik foto untuk detail dokumentasi
          </span>
        </div>
      )}

      {/* Gallery Grid */}
      {visibleItems.length > 0 ? (
        <div
          className={`grid grid-cols-1 gap-6 ${
            compact ? 'md:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {visibleItems.map((item, idx) => {
            const imgSrc = resolvePublicImageUrl(item.image);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className="group text-left border border-line bg-surface/20 p-3.5 space-y-3.5 transition-all duration-300 hover:border-ink hover:bg-surface/35 cursor-pointer flex flex-col"
              >
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-surface border border-line/60">
                  <img
                    src={imgSrc}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-bg/90 backdrop-blur-sm border border-line text-[0.58rem] uppercase tracking-[0.12em] font-semibold text-ink">
                    {item.category}
                  </div>
                  <div className="absolute bottom-3 right-3 w-8 h-8 bg-bg/90 backdrop-blur-sm border border-line flex items-center justify-center text-ink opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUpRight className="w-4 h-4 text-accent" />
                  </div>
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col justify-between px-0.5">
                  <div>
                    <h3 className="font-display text-xl text-ink font-normal leading-snug group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-line/60 text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                    <span className="truncate">{item.eventOrLocation || 'Jakarta'}</span>
                    <span className="shrink-0">{item.capturedDate}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="border border-line bg-surface/20 p-12 text-center text-xs text-muted uppercase tracking-[0.12em]">
          Belum ada foto dokumentasi pada kategori ini.
        </div>
      )}

      {/* Photo Documentation Detail Modal */}
      <Modal
        isOpen={Boolean(activeItem)}
        onClose={() => setActiveIndex(null)}
        title={activeItem?.title}
        subtitle={activeItem?.category}
        maxWidth="2xl"
        footer={
          activeItem && visibleItems.length > 1 ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) =>
                    prev === null ? null : (prev - 1 + visibleItems.length) % visibleItems.length
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-line bg-bg hover:border-ink text-xs uppercase tracking-wider text-ink transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <span className="text-[0.68rem] uppercase tracking-[0.12em] text-muted">
                {(activeIndex ?? 0) + 1} / {visibleItems.length}
              </span>

              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) =>
                    prev === null ? null : (prev + 1) % visibleItems.length
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-line bg-bg hover:border-ink text-xs uppercase tracking-wider text-ink transition-colors cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : undefined
        }
      >
        {activeItem && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7 border border-line bg-surface overflow-hidden">
              <img
                src={resolvePublicImageUrl(activeItem.image)}
                alt={activeItem.title}
                className="w-full max-h-[60vh] object-cover"
              />
            </div>

            <div className="md:col-span-5 space-y-5">
              <div className="space-y-2 border-b border-line pb-4">
                <span className="inline-block px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.12em] font-semibold border border-accent bg-accent-fill/20 text-ink">
                  {activeItem.category}
                </span>
                <h4 className="font-display text-2xl text-ink font-normal leading-tight pt-1">
                  {activeItem.title}
                </h4>
              </div>

              <div className="space-y-2 text-xs text-muted">
                {activeItem.eventOrLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-ink font-medium">{activeItem.eventOrLocation}</span>
                  </div>
                )}
                {activeItem.capturedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent shrink-0" />
                    <span>{activeItem.capturedDate}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-line">
                <p className="text-sm text-ink/90 leading-relaxed whitespace-pre-line">
                  {activeItem.description || 'Dokumentasi visual kegiatan dan produksi OMOO.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
