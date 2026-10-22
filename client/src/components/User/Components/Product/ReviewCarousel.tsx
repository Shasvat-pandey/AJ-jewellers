import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { API_BASE } from "../../../../utils/api";

export default function ReviewCarousel({ reviews }: { reviews: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(2);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCardsToShow(1);
      } else {
        setCardsToShow(2);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!reviews || reviews.length === 0) return null;

  const totalSlides = Math.ceil(reviews.length / cardsToShow);
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
  };

  // Group reviews into slides based on cardsToShow
  const slides = [];
  for (let i = 0; i < reviews.length; i += cardsToShow) {
    slides.push(reviews.slice(i, i + cardsToShow));
  }

  return (
    <div className="relative w-full mt-10 flex flex-col items-center">
      {/* Carousel container */}
      <div className="flex items-center w-full justify-between gap-4 md:gap-8">
        
        {/* Left Arrow (Desktop) */}
        <button 
          onClick={handlePrev}
          className="shrink-0 w-10 h-10 rounded-full border border-[#EAE3D5] flex items-center justify-center bg-white text-[#7A6A5C] hover:text-[#C9A24B] hover:border-[#C9A24B] transition-colors shadow-sm hidden md:flex"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>

        {/* Slides */}
        <div className="overflow-hidden w-full py-2">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {slides.map((slideGroup, slideIdx) => (
              <div key={slideIdx} className="w-full shrink-0 flex gap-6">
                {slideGroup.map((review: any) => (
                  <div 
                    key={review._id} 
                    className="bg-white p-6 md:p-8 border border-[#EAE3D5] rounded-xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] w-full flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-cormorant font-medium text-lg md:text-xl text-[#4A0E1B]">{review.user?.name || "Customer"}</p>
                        <p className="font-jost text-[10px] md:text-xs text-[#7A6A5C] uppercase tracking-wider mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={15}
                            className={star <= review.rating ? "text-[#C9A24B] fill-[#C9A24B]" : "text-gray-200"}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="font-jost text-sm md:text-[15px] text-[#7A6A5C] leading-relaxed flex-grow mt-2">
                      {review.comment}
                    </p>
                    
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-3 mt-6">
                        {review.images.map((img: any, idx: number) => (
                          <div 
                            key={idx} 
                            className="w-16 h-16 md:w-20 md:h-20 border border-[#EAE3D5] rounded-lg overflow-hidden cursor-pointer hover:border-[#C9A24B] transition-colors"
                            onClick={() => window.open(`${API_BASE}${img.original}`, '_blank')}
                          >
                            <img src={`${API_BASE}${img.thumbnail || img.original}`} alt="Review" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Pad if the last slide doesn't have enough cards */}
                {cardsToShow > 1 && slideGroup.length < cardsToShow && (
                  <div className="w-full hidden md:block opacity-0 pointer-events-none"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow (Desktop) */}
        <button 
          onClick={handleNext}
          className="shrink-0 w-10 h-10 rounded-full border border-[#EAE3D5] flex items-center justify-center bg-white text-[#7A6A5C] hover:text-[#C9A24B] hover:border-[#C9A24B] transition-colors shadow-sm hidden md:flex"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      </div>
      
      {/* Mobile Arrows & Dots */}
      <div className="flex items-center justify-between w-full mt-8 md:justify-center">
        <button 
          onClick={handlePrev}
          className="md:hidden w-8 h-8 rounded-full border border-[#EAE3D5] flex items-center justify-center bg-white text-[#7A6A5C]"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>

        {/* Dots */}
        <div className="flex gap-2.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${currentIndex === idx ? "bg-[#C9A24B]" : "bg-[#EAE3D5]"}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="md:hidden w-8 h-8 rounded-full border border-[#EAE3D5] flex items-center justify-center bg-white text-[#7A6A5C]"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
