import necklaces from "../../../../assets/categories/necklaces.jpg";
import jhumkas from "../../../../assets/categories/jhumkas.jpg";
import bangles from "../../../../assets/categories/bangles.jpg";
import rings from "../../../../assets/categories/rings.jpg";
import mangalsutra from "../../../../assets/categories/mangalsutra.jpg";
import chains from "../../../../assets/categories/chains.jpg";
import pendants from "../../../../assets/categories/pendants.jpg";

const earrings = "/image_7b2ac2.jpg";

// Add or remove categories here — the scroll and loop handle any length automatically.
const categories = [
  { name: "Necklaces", image: necklaces },
  { name: "Jhumkas", image: jhumkas },
  { name: "Bangles", image: bangles },
  { name: "Rings", image: rings },
  { name: "Mangalsutra", image: mangalsutra },
  { name: "Earrings", image: earrings },
  { name: "Chains", image: chains },
  { name: "Pendants", image: pendants },
];

export default function CategoryScroll() {
  // Render the list twice back-to-back; the animation shifts exactly -50%,
  // so the moment the first copy scrolls fully offscreen, the second copy
  // is in the exact same position it started in — the loop point is invisible.
  const loopedCategories = [...categories, ...categories];

  return (
    <section className="bg-[#FDFBF4] py-14 md:py-20 overflow-hidden">
      <div className="text-center mb-10 md:mb-14 px-6">
        <h2 className="font-cormorant text-3xl md:text-5xl text-brand-burgundy">
          Shop by Category
        </h2>
        <div className="w-16 md:w-24 h-px bg-gold mx-auto mt-4" />
      </div>

      <div className="relative">
        {/* Fade edges so items don't appear to clip abruptly */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-24 bg-linear-to-r from-[#FDFBF4] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-24 bg-linear-to-l from-[#FDFBF4] to-transparent z-10" />

        <div className="w-full overflow-hidden">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            {loopedCategories.map((category, i) => (
              <a
                href={`/collections/${category.name.toLowerCase()}`}
                key={`${category.name}-${i}`}
                className="flex flex-col items-center gap-3 mx-4 sm:mx-6 md:mx-8 shrink-0"
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-gold p-1">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover rounded-full"
                    draggable={false}
                  />
                </div>
                <span className="font-jost text-[11px] md:text-xs tracking-[0.12em] text-brand-burgundy font-medium">
                  {category.name.toUpperCase()}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}