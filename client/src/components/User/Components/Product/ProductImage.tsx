import { useState } from 'react';
import { Gem } from 'lucide-react';
import {
  getImageUrl,
  buildSrcSet,
  resolveAlt,
  type ImageEntry,
} from '../../../../utils/imageUrl';

type Ratio = 'square' | 'portrait45';

interface ProductImageProps {
  image: ImageEntry;
  /** Meaningful fallback, e.g. product name. Alt from DB object wins. */
  alt: string;
  ratio?: Ratio;
  /** Above-the-fold images: eager + fetchpriority high. */
  eager?: boolean;
  /** Extra classes for the OUTER fixed-ratio box. */
  className?: string;
  /** Extra classes for the <img> itself. */
  imgClassName?: string;
  /** Padding inside the well so jewellery never touches the edge. */
  padded?: boolean;
}

const RATIO_CLASS: Record<Ratio, string> = {
  square: 'aspect-square',
  portrait45: 'aspect-[4/5]',
};

/**
 * FIXED UI CONTAINER + PRESERVED ASPECT + object-fit:contain.
 * The outer box is identical for every product; the photo inside is never
 * stretched or cropped. Dimensions are reserved before load (no layout shift),
 * with skeleton shimmer + branded fallback on error.
 */
export default function ProductImage({
  image,
  alt,
  ratio = 'square',
  eager = false,
  className = '',
  imgClassName = '',
  padded = true,
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const src = getImageUrl(image);
  const srcSet = buildSrcSet(image);
  const finalAlt = resolveAlt(image, alt ? `${alt} product image` : 'Product image');

  return (
    <div
      className={`relative ${RATIO_CLASS[ratio]} w-full overflow-hidden bg-[#4A0E1B]/5 flex items-center justify-center ${className}`}
    >
      {/* Skeleton reserves the exact box before the photo arrives */}
      {!loaded && !failed && (
        <div
          aria-hidden
          className="absolute inset-0 product-img-skeleton"
        />
      )}

      {failed || !src ? (
        <div
          role="img"
          aria-label={finalAlt}
          className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#F3E9D8]/60 text-[#7A6A5C]"
        >
          <Gem size={28} strokeWidth={1.25} className="text-[#C9A24B]" />
          <span className="font-jost text-[10px] md:text-xs tracking-[0.2em] uppercase">
            No Image Available
          </span>
        </div>
      ) : (
        <img
          src={src}
          {...(srcSet ? { srcSet, sizes: '(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 400px' } : {})}
          alt={finalAlt}
          draggable={false}
          loading={eager ? 'eager' : 'lazy'}
          {...(eager ? ({ fetchPriority: 'high' } as any) : {})}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`w-full h-full object-contain object-center transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${padded ? 'p-4' : ''} ${imgClassName}`}
        />
      )}
    </div>
  );
}
