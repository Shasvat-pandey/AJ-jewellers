import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

import heroModel1 from "../../assets/hero-model1.jpg";
import heroModel2 from "../../assets/hero-model2.png";
import heroModel3 from "../../assets/hero-model3.png";
import heroModel4 from "../../assets/hero-model4.png";
import heroMobileModel2 from "../../assets/hero-mobile-model2.png";
import heroMobileModel3 from "../../assets/hero-mobile-model3.png";
import heroMobileModel4 from "../../assets/hero-mobile-model4.png";

interface HeroSlide {
  id: string;
  image: string;
  mobileImage?: string;
  alt: string;
  subtitle: string;
  titleLine1: string;
  titleLine2: string;
  titleLine2Style?: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

const slides: HeroSlide[] = [
  {
    id: "heritage-bridal",
    image: heroModel1,
    alt: "Bride wearing handcrafted AJ Jewellers gold bridal set",
    subtitle: "SINCE 1974 · HANDCRAFTED IN INDIA",
    titleLine1: "Heirlooms for a",
    titleLine2: "Lifetime",
    titleLine2Style: "text-[#D4AF37]",
    description: "Bridal sets, kundan necklaces, jhumkas and diamond rings — shaped by hand in hallmarked 916 gold.",
    buttonText: "SHOP THE COLLECTION",
    buttonLink: "/collections",
  },
  {
    id: "gold-edition",
    image: heroModel3,
    mobileImage: heroMobileModel3,
    alt: "Handcrafted AJ Jewellers gold bangles, necklace and earrings on pure silk",
    subtitle: "THE GOLD EDITION",
    titleLine1: "Gold That",
    titleLine2: "Feels Like You",
    titleLine2Style: "italic text-[#D4AF37]",
    description: "Discover timeless everyday pieces, crafted to become part of your story.",
    buttonText: "EXPLORE GOLD",
    buttonLink: "/everyday-silver-gold",
  },
  {
    id: "silver-collection",
    image: heroModel4,
    mobileImage: heroMobileModel4,
    alt: "AJ Jewellers handcrafted antique silver jhumkas, cuff and pearl pendant",
    subtitle: "SILVER COLLECTION —",
    titleLine1: "Timeless Beauty",
    titleLine2: "in Every Detail",
    titleLine2Style: "text-[#D4AF37]",
    description: "From delicate earrings to statement pieces, our silver jewellery blends tradition with modern grace.",
    buttonText: "EXPLORE SILVER",
    buttonLink: "/everyday-silver-gold",
  },
  {
    id: "diamond-collection",
    image: heroModel2,
    mobileImage: heroMobileModel2,
    alt: "AJ Jewellers brilliant-cut diamond solitaire ring and halo earrings",
    subtitle: "— THE DIAMOND COLLECTION",
    titleLine1: "A Little Sparkle.",
    titleLine2: "A Lifetime of Meaning.",
    titleLine2Style: "text-[#F3E9D8]",
    description: "Discover diamond pieces designed to celebrate your brightest moments.",
    buttonText: "DISCOVER DIAMONDS",
    buttonLink: "/collections/diamond-jewellery",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);

  // Touch Swipe Gesture State for Mobile UX
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalSlides = slides.length;

  const goToSlide = useCallback((idx: number) => {
    setCurrentSlide((curr) => {
      if (curr === idx) return curr;
      setPrevSlide(curr);
      return idx;
    });
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((curr) => {
      const nextIdx = (curr + 1) % totalSlides;
      setPrevSlide(curr);
      return nextIdx;
    });
  }, [totalSlides]);

  const prevSlideAction = useCallback(() => {
    setCurrentSlide((curr) => {
      const prevIdx = (curr - 1 + totalSlides) % totalSlides;
      setPrevSlide(curr);
      return prevIdx;
    });
  }, [totalSlides]);

  // Automated 3-second continuous slideshow timer (resets cleanly on manual or auto slide change)
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => clearInterval(timer);
  }, [currentSlide, nextSlide]);

  // Clean up transitioning state after animation completes
  useEffect(() => {
    if (prevSlide === null) return;
    const timeout = setTimeout(() => {
      setPrevSlide(null);
    }, 750);

    return () => clearTimeout(timeout);
  }, [prevSlide, currentSlide]);

  // Touch swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlideAction();
    }
  };

  return (
    <section
      className="relative h-screen min-h-[100dvh] w-full pt-16 md:pt-20 flex flex-col justify-end overflow-hidden select-none bg-[#140509]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Jewellery Carousel"
    >
      {/* --- PRE-RENDERED SLIDES WITH RIGHT-TO-LEFT HORIZONTAL SLIDE TRANSITION --- */}
      {slides.map((slide, idx) => {
        const isCurrent = currentSlide === idx;
        const isPrev = prevSlide === idx;

        // Keep inactive slides mounted with pointer-events-none so images stay pre-buffered
        if (!isCurrent && !isPrev) {
          return (
            <div
              key={slide.id}
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none -z-10"
              style={{ transform: "translate3d(100%, 0, 0)" }}
            >
              <picture className="w-full h-full block">
                {slide.mobileImage && (
                  <source media="(max-width: 767px)" srcSet={slide.mobileImage} />
                )}
                <img
                  src={slide.image}
                  alt={slide.alt}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className="w-full h-full object-cover object-center scale-105"
                />
              </picture>
            </div>
          );
        }

        let animationStyle: React.CSSProperties = {
          transform: "translate3d(0, 0, 0)",
        };

        if (isCurrent && prevSlide !== null) {
          animationStyle = {
            animation: "heroSlideInFromRight 2s cubic-bezier(0.25, 1, 0.5, 1) 3s forwards",
          };
        } else if (isPrev) {
          animationStyle = {
            animation: "heroSlideOutToLeft 2s cubic-bezier(0.25, 1, 0.5, 1) 3s forwards",
          };
        }

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full flex flex-col justify-end overflow-hidden ${isCurrent ? "z-20" : "z-10 pointer-events-none"
              }`}
            style={animationStyle}
          >
            {/* Background Image Picture with Responsive Mobile Support */}
            <picture className="absolute inset-0 w-full h-full block">
              {slide.mobileImage && (
                <source media="(max-width: 767px)" srcSet={slide.mobileImage} />
              )}
              <img
                src={slide.image}
                alt={slide.alt}
                loading={idx === 0 ? "eager" : "lazy"}
                className="w-full h-full object-cover object-center transform transition-transform duration-[4000ms] ease-out scale-105"
              />
            </picture>

            {/* Luxury Scrim Gradient Overlays */}
            <div
              className="absolute inset-0 pointer-events-none z-[1]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(20,5,9,0.15) 0%, rgba(20,5,9,0.35) 40%, rgba(20,5,9,0.85) 85%, rgba(15,4,7,0.98) 100%)",
              }}
            />
            <div
              className="absolute inset-0 hidden md:block pointer-events-none z-[1]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(20,5,9,0.88) 0%, rgba(20,5,9,0.65) 35%, rgba(20,5,9,0.2) 65%, rgba(20,5,9,0) 100%)",
              }}
            />

            {/* Slide Content */}
            <div className="relative z-10 px-6 sm:px-10 md:px-16 lg:px-24 pb-16 sm:pb-20 md:pb-24 lg:pb-28">
              <div className="max-w-full md:max-w-xl lg:max-w-2xl">
                {/* Subtitle */}
                <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                  <p className="font-jost text-[10px] sm:text-xs md:text-sm tracking-[0.22em] text-[#C9A24B] uppercase font-semibold">
                    {slide.subtitle}
                  </p>
                </div>

                {/* Headline with serif Cormorant styling */}
                <h1 className="font-cormorant text-[#F3E9D8] leading-[1.0] sm:leading-[0.98] tracking-tight">
                  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal drop-shadow-xs">
                    {slide.titleLine1}
                  </span>
                  <span
                    className={`block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal mt-1 sm:mt-1.5 ${slide.titleLine2Style || "text-[#D4AF37]"
                      }`}
                  >
                    {slide.titleLine2}
                  </span>
                </h1>

                {/* Description */}
                <p className="font-jost text-[13px] sm:text-sm md:text-base text-[#E7C9B8]/95 mt-4 sm:mt-5 md:mt-6 mb-7 sm:mb-8 md:mb-10 leading-relaxed max-w-[36ch] sm:max-w-[42ch]">
                  {slide.description}
                </p>

                {/* CTA Link Button */}
                <div>
                  <Link
                    to={slide.buttonLink}
                    className="inline-flex items-center gap-3 font-jost text-xs sm:text-sm tracking-[0.16em] uppercase text-[#F3E9D8] border border-[#C9A24B] px-7 py-3.5 sm:px-8 sm:py-4 md:px-9 md:py-4 w-full sm:w-auto justify-center hover:bg-[#C9A24B] hover:text-[#2A0A10] transition-all duration-300 font-semibold shadow-md cursor-pointer group"
                  >
                    <span>{slide.buttonText}</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}