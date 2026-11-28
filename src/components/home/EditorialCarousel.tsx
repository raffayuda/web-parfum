import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { type EditorialSlide, DEFAULT_EDITORIAL_SLIDES } from '../../data/carousel';
import { resolvePublicImageUrl } from '../../data/images';

interface EditorialCarouselProps {
  eyebrow?: string;
  heading?: string;
  slides?: EditorialSlide[];
  autoplayMs?: number;
}

const TONE_GLOW: Record<string, string> = {
  emerald: 'bg-emerald-500/12',
  gold: 'bg-amber-500/14',
  amber: 'bg-orange-600/12',
  rose: 'bg-rose-400/14',
};

export const EditorialCarousel: React.FC<EditorialCarouselProps> = ({
  eyebrow = 'Atelier Lookbook • Edisi 30 ml',
  heading = 'Empat karakter. Kemasan baru.',
  slides: propSlides,
  autoplayMs = 6500,
}) => {
  const slides =
    Array.isArray(propSlides) && propSlides.length > 0
      ? propSlides
      : DEFAULT_EDITORIAL_SLIDES;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageFitMap, setImageFitMap] = useState<Record<string, 'cover' | 'contain'>>({});
  const touchStartX = useRef<number | null>(null);

  const safeIndex = activeIndex % slides.length;
  const activeSlide = slides[safeIndex];

  const goTo = useCallback(
    (idx: number) => {
      setActiveIndex((idx + slides.length) % slides.length);
    },
    [slides.length]
  );

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(goNext, autoplayMs);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, autoplayMs, goNext]);

  const handleImageLoad = (slideId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    // Tall portrait images (< 0.65) keep full bottle visible via contain + blurred backdrop
    const fit: 'cover' | 'contain' = ratio < 0.65 ? 'contain' : 'cover';
    setImageFitMap((prev) => (prev[slideId] === fit ? prev : { ...prev, [slideId]: fit }));
  };

  const glowClass = TONE_GLOW[activeSlide?.accentTone || 'gold'] || TONE_GLOW.gold;

  return (
    <section
      className="relative overflow-hidden border-t border-line py-[clamp(3.5rem,7vw,6.5rem)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
        setIsPaused(true);
      }}
      onTouchEnd={(e) => {
        const endX = e.changedTouches[0]?.clientX ?? null;
        if (touchStartX.current !== null && endX !== null) {
          const delta = touchStartX.current - endX;
          if (Math.abs(delta) > 45) {
            if (delta > 0) goNext();
            else goPrev();
          }
        }
        touchStartX.current = null;
        setIsPaused(false);
      }}
    >
      {/* Subtle Ambient Mood Glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute left-[10%] top-[15%] h-[28rem] w-[28rem] rounded-full blur-[120px] transition-colors duration-1000 ${glowClass}`}
        />
        <div className="absolute right-[-8%] bottom-[10%] h-[24rem] w-[24rem] rounded-full bg-accent-fill/20 blur-[110px]" />
      </div>

      <div className="relative mx-auto w-full max-w-page px-gutter">
        {/* Top Header Bar */}
        <div className="mb-10 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>{eyebrow}</span>
            </p>
            <h2 className="mt-2 font-display text-[clamp(2rem,3.8vw,3.4rem)] font-light leading-[0.98] tracking-[-0.02em] text-ink">
              {heading}
            </h2>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-end">
            <span className="font-mono text-xs tracking-wider text-muted mr-1">
              {String(safeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Slide sebelumnya"
              className="inline-flex h-10 w-10 items-center justify-center border border-line bg-surface/40 text-ink transition-colors hover:border-accent hover:bg-surface cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Slide berikutnya"
              className="inline-flex h-10 w-10 items-center justify-center border border-line bg-surface/40 text-ink transition-colors hover:border-accent hover:bg-surface cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Asymmetric Dual-Layer Exhibition Stage */}
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-gutter">
          {/* Left: Layered Visual Stage + Floating Box Inset */}
          <div className="relative lg:col-span-6">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-3 -top-3 bottom-6 right-6 border border-line/70"
            />

            <div className="relative aspect-[4/5] w-full overflow-hidden border border-line/70 bg-surface">
              {slides.map((slide, idx) => {
                const isActive = idx === safeIndex;
                const mainUrl = resolvePublicImageUrl(slide.mainImage);
                const fit = imageFitMap[slide.id] || 'cover';

                return (
                  <a
                    key={slide.id}
                    href={slide.ctaLink || '/collection/'}
                    aria-hidden={!isActive}
                    tabIndex={isActive ? 0 : -1}
                    className={`absolute inset-0 block transition-all duration-700 ease-out ${
                      isActive
                        ? 'opacity-100 scale-100 z-10'
                        : 'opacity-0 scale-[1.03] z-0 pointer-events-none'
                    }`}
                  >
                    {/* Soft blurred fill so tall bottles stay uncropped without stark empty bars */}
                    {fit === 'contain' && (
                      <img
                        src={mainUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl"
                      />
                    )}
                    <img
                      src={mainUrl}
                      alt={slide.mainAlt || slide.title}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      onLoad={(e) => handleImageLoad(slide.id, e)}
                      className={`relative h-full w-full ${
                        fit === 'contain' ? 'object-contain p-3 sm:p-5' : 'object-cover object-center'
                      }`}
                    />
                  </a>
                );
              })}
            </div>

            {/* Overlapping Floating Box Inset */}
            {activeSlide?.insetImage && (
              <div className="absolute -bottom-5 -right-2 sm:-bottom-6 sm:-right-5 z-20 w-28 sm:w-36 lg:w-44 border-[5px] sm:border-[6px] border-bg bg-bg shadow-[0_24px_60px_rgba(0,0,0,0.28)] transition-transform duration-500 hover:-translate-y-1">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
                  <img
                    key={activeSlide.insetImage}
                    src={resolvePublicImageUrl(activeSlide.insetImage)}
                    alt={activeSlide.insetAlt || `Kemasan ${activeSlide.title}`}
                    className="h-full w-full object-cover animate-in fade-in duration-500"
                  />
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 bg-bg/85 backdrop-blur-sm px-2 py-0.5 text-center text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-ink">
                    Box 30 ml
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Editorial Typography & Direct CTA */}
          <div className="relative lg:col-span-5 lg:col-start-8 pt-4 lg:pt-0">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 right-0 hidden select-none font-display text-[clamp(7rem,12vw,11.5rem)] font-light leading-[0.72] text-transparent [-webkit-text-stroke:1px_var(--color-line)] lg:block"
            >
              {activeSlide.editionNumber || String(safeIndex + 1).padStart(2, '0')}
            </span>

            <p className="relative text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent">
              {activeSlide.eyebrow}
            </p>

            <h3 className="relative mt-4 font-display text-[clamp(2.5rem,4.5vw,4.4rem)] font-light leading-[0.95] tracking-[-0.022em] text-ink">
              {activeSlide.title}
            </h3>

            <p className="relative mt-4 font-display text-[clamp(1.2rem,1.8vw,1.55rem)] font-light italic leading-snug text-ink/90">
              {activeSlide.subtitle}
            </p>

            <p className="relative mt-5 max-w-[44ch] text-[0.95rem] leading-[1.7] text-muted">
              {activeSlide.description}
            </p>

            <div className="relative mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">
                {activeSlide.volumeBadge || 'Eau de Parfum • 30 ml'}
              </span>

              <a
                href={activeSlide.ctaLink || '/collection/'}
                className="group inline-flex items-center gap-2.5 bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-bg transition-all hover:bg-ink/85"
              >
                <span>{activeSlide.ctaText || 'Jelajahi'}</span>
                <ArrowRight className="h-3.5 w-3.5 text-accent transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Editorial Progress Tabs */}
        <div className="mt-14 grid grid-cols-2 gap-3 border-t border-line/60 pt-5 sm:grid-cols-3 lg:grid-cols-5">
          {slides.map((slide, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(idx)}
                className={`group relative flex flex-col items-start gap-1.5 border px-3.5 py-3 text-left transition-all cursor-pointer ${
                  isActive
                    ? 'border-ink bg-surface/60 text-ink'
                    : 'border-line/70 bg-transparent text-muted hover:border-line hover:text-ink'
                }`}
              >
                <div className="flex w-full items-center justify-between text-[0.58rem] font-mono uppercase tracking-[0.14em]">
                  <span className={isActive ? 'text-accent font-semibold' : 'text-muted'}>
                    {slide.editionNumber || String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate opacity-70">{slide.volumeBadge?.split('•')?.[0]?.trim() || '30 ml'}</span>
                </div>
                <span className="font-display text-base font-normal leading-tight truncate w-full">
                  {slide.title}
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-1 h-[2px] w-full transition-all duration-500 ${
                    isActive ? 'bg-accent scale-x-100 origin-left' : 'bg-line/40 scale-x-100'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
