import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { resolvePublicImageUrl } from '../../data/images';

export interface ProductGalleryImageItem {
  url: string;
  alt: string;
  label?: string;
}

interface ProductGalleryViewerProps {
  images: ProductGalleryImageItem[];
  productName: string;
}

export const ProductGalleryViewer: React.FC<ProductGalleryViewerProps> = ({
  images,
  productName,
}) => {
  const safeImages =
    Array.isArray(images) && images.length > 0
      ? images
      : [
          {
            url: '/images/products/emerald-lifestyle.webp',
            alt: productName,
            label: 'Foto Produk',
          },
        ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [fitMap, setFitMap] = useState<Record<number, 'cover' | 'contain'>>({});

  const currentIndex = activeIndex % safeImages.length;
  const activeImage = safeImages[currentIndex];
  const resolvedActiveUrl = resolvePublicImageUrl(activeImage.url);
  const activeFit = fitMap[currentIndex] || 'cover';

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % safeImages.length);
  }, [safeImages.length]);

  const handleImageLoad = (idx: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    // Tall portrait images (< 0.65) use contain over ambient blur so bottles/flowers aren't cropped
    const fit: 'cover' | 'contain' = ratio < 0.65 ? 'contain' : 'cover';
    setFitMap((prev) => (prev[idx] === fit ? prev : { ...prev, [idx]: fit }));
  };

  return (
    <div className="space-y-4">
      {/* Main Interactive Product Stage */}
      <div className="group relative aspect-[4/5] w-full overflow-hidden border border-line bg-surface">
        {activeFit === 'contain' && (
          <img
            src={resolvedActiveUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl"
          />
        )}

        <img
          key={resolvedActiveUrl}
          src={resolvedActiveUrl}
          alt={activeImage.alt || productName}
          onLoad={(e) => handleImageLoad(currentIndex, e)}
          className={`relative h-full w-full transition-all duration-500 animate-in fade-in ${
            activeFit === 'contain'
              ? 'object-contain p-3 sm:p-5'
              : 'object-cover object-center group-hover:scale-[1.02]'
          }`}
        />

        {/* Subtle label & photo index badge */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2 border border-line/80 bg-bg/90 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink backdrop-blur-sm">
          <Images className="h-3.5 w-3.5 text-accent" />
          <span>{activeImage.label || `Foto ${currentIndex + 1}`}</span>
          <span className="text-muted font-mono">
            {String(currentIndex + 1).padStart(2, '0')}/{String(safeImages.length).padStart(2, '0')}
          </span>
        </div>

        {/* Left / Right navigation arrows if multiple images */}
        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Foto sebelumnya"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center border border-line bg-bg/85 text-ink backdrop-blur-sm transition-all hover:border-accent hover:bg-bg cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Foto berikutnya"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center border border-line bg-bg/85 text-ink backdrop-blur-sm transition-all hover:border-accent hover:bg-bg cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Clickable Thumbnail Strip Directly Below Main Photo */}
      {safeImages.length > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[0.62rem] uppercase tracking-[0.14em] text-muted">
            <span>Pilih Sudut &amp; Kemasan Produk</span>
            <span className="font-mono">{safeImages.length} Foto</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {safeImages.map((img, idx) => {
              const thumbUrl = resolvePublicImageUrl(img.url);
              const isSelected = idx === currentIndex;

              return (
                <button
                  key={`${thumbUrl}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Tampilkan ${img.label || `foto ${idx + 1}`}`}
                  aria-pressed={isSelected}
                  className={`group/thumb flex flex-col overflow-hidden border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-ink bg-surface/60 ring-1 ring-accent'
                      : 'border-line bg-surface/20 opacity-75 hover:opacity-100 hover:border-ink/60'
                  }`}
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-surface">
                    <img
                      src={thumbUrl}
                      alt={img.alt || `${productName} - ${idx + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover/thumb:scale-105"
                    />
                  </div>
                  <span
                    className={`w-full truncate px-2 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em] ${
                      isSelected ? 'text-ink' : 'text-muted'
                    }`}
                  >
                    {img.label || `Foto ${idx + 1}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
