import { useEffect, useState } from 'react';
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
 * Differently-sized sources align perfectly; photos use contain (never cut),
 * video thumbs keep cover only as a small preview affordance.
 */
export default function ProductGallery({ images, videoUrl, productName }: ProductGalleryProps) {
  const [active, setActive] = useState(0);

  useEffect(() => setActive(0), [productName]);

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

  const go = (dir: 1 | -1) =>
    setActive((a) => (a + dir + media.length) % media.length);

  const current = media[active];

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <div className="relative">
        {current.type === 'image' ? (
          <ProductImage
            image={current.entry}
            alt={current.alt}
            ratio="portrait45"
            eager
            imgClassName="md:p-8 transition-transform duration-700 group-hover:scale-105"
            className="shadow-sm"
          />
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

        {media.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full text-[#4A0E1B] hover:text-[#C9A24B] shadow-sm transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full text-[#4A0E1B] hover:text-[#C9A24B] shadow-sm transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {media.map((m, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              aria-label={`View ${idx + 1}`}
              aria-pressed={active === idx}
              className={`relative shrink-0 w-20 h-24 sm:w-24 sm:h-28 overflow-hidden border-2 transition-all duration-300 bg-[#4A0E1B]/5 ${
                active === idx
                  ? 'border-[#C9A24B] opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
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
