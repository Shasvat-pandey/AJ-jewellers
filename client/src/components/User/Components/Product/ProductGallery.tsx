import { useEffect, useState, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductImage from './ProductImage';
import { getImageUrl, type ImageEntry } from '../../../../utils/imageUrl';

interface GalleryMedia {
  type: 'image' | 'video';
  entry?: ImageEntry;
  src: string;
  poster?: string;
  alt: string;
}

interface ProductGalleryProps {
  images: ImageEntry[];
  videoUrl?: string;
  productName: string;
}

/**
 * Fixed-ratio gallery: main viewer (4/5) + uniform thumbnails.
 * Features automated slideshow (every ~2.5s), pause on hover,
 * smooth crossfade, slide indicators, and thumbnail synchronization.
 */
export default function ProductGallery({ images, videoUrl, productName }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Reset to first slide when product changes
  useEffect(() => {
    setActive(0);
  }, [productName]);

  const media: GalleryMedia[] = (images || []).map((entry, i) => ({
    type: 'image' as const,
    entry,
    src: getImageUrl(entry),
    alt: `${productName} — view ${i + 1}`,
  }));

  if (videoUrl) {
    media.push({
      type: 'video',
      src: getImageUrl(videoUrl),
      poster: media[0] ? getImageUrl(media[0].entry) : '',
      alt: `${productName} video`,
    });
  }

  if (media.length === 0) {
    media.push({ type: 'image', entry: undefined, src: '', alt: productName });
  }

  // Automated image slideshow every 2.5 seconds
  useEffect(() => {
    if (media.length <= 1 || isPaused) return;

    // Do not auto-advance if the current media item is a video
    if (media[active]?.type === 'video') return;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % media.length);
    }, 2500);

    return () => clearInterval(timer);
  }, [media.length, isPaused, active]);

  // Keep active thumbnail visible in scroll view
  useEffect(() => {
    if (thumbnailRefs.current[active]) {
      thumbnailRefs.current[active]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [active]);

  const go = (dir: 1 | -1) => {
    setActive((a) => (a + dir + media.length) % media.length);
  };

  const current = media[active] || media[0];

  return (
    <div 
      className="flex flex-col gap-4 md:gap-5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* MAIN MEDIA VIEWER */}
      <div className="relative group rounded-sm overflow-hidden bg-[#4A0E1B]/5">
        {current.type === 'image' ? (
          <div key={active} className="animate-in fade-in duration-500">
            <ProductImage
              image={current.entry}
              alt={current.alt}
              ratio="portrait45"
              eager
              imgClassName="md:p-8 transition-transform duration-700 group-hover:scale-105"
              className="shadow-sm"
            />
          </div>
        ) : (
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#4A0E1B]/5 shadow-sm">
            <video
              src={current.src}
              poster={current.poster}
              autoPlay
              loop
              muted
              playsInline
              controls
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* CONTROLS (Only when multiple images exist) */}
        {media.length > 1 && (
          <>
            {/* Prev button */}
            <button
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full text-[#4A0E1B] hover:text-[#C9A24B] shadow-md transition-all cursor-pointer opacity-75 group-hover:opacity-100 z-10"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Next button */}
            <button
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full text-[#4A0E1B] hover:text-[#C9A24B] shadow-md transition-all cursor-pointer opacity-75 group-hover:opacity-100 z-10"
            >
              <ChevronRight size={18} />
            </button>

            {/* Slide Pill Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-full">
              {media.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActive(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    active === idx
                      ? 'w-5 h-1.5 bg-[#C9A24B]'
                      : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* THUMBNAILS ROW */}
      {media.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {media.map((m, idx) => (
            <button
              key={idx}
              ref={(el) => (thumbnailRefs.current[idx] = el)}
              onClick={() => setActive(idx)}
              aria-label={`View angle ${idx + 1}`}
              aria-pressed={active === idx}
              className={`relative shrink-0 w-20 h-24 sm:w-24 sm:h-28 overflow-hidden border-2 transition-all duration-300 bg-[#4A0E1B]/5 cursor-pointer rounded-sm ${
                active === idx
                  ? 'border-[#C9A24B] opacity-100 shadow-xs ring-2 ring-[#C9A24B]/30'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:border-[#E5D7B7]'
              }`}
            >
              {m.type === 'image' ? (
                <img
                  src={getImageUrl(m.entry) || ''}
                  alt={m.alt}
                  loading="lazy"
                  draggable={false}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = 'hidden';
                  }}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <>
                  <img
                    src={m.poster}
                    alt="Video thumbnail"
                    loading="lazy"
                    draggable={false}
                    className="w-full h-full object-contain p-1"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play size={18} fill="currentColor" className="text-white/90 ml-0.5" />
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
