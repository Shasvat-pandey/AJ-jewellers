import { Link } from "react-router-dom";
import { FlaskConical, Droplets, Sparkles, Package, Sun, Heart } from "lucide-react";

// Use actual image files with extensions so Vite/TypeScript can resolve them correctly.
import careHeroImg from "../../../../assets/promos/bridal.png";
import careFooterImg from "../../../../assets/promos/everyday-gold.jpg";

const careSteps = [
  {
    icon: FlaskConical,
    title: "Avoid Chemicals",
    description: "Perfumes, creams, lotions, and cleaning products can dull the shine of your jewellery.",
  },
  {
    icon: Droplets,
    title: "Keep Away From Water",
    description: "Take them off before showering, swimming, or exercising to keep them looking brand new.",
  },
  {
    icon: Sparkles,
    title: "Clean Gently",
    description: "Use a soft, dry cloth to carefully wipe your jewellery after each use.",
  },
  {
    icon: Package,
    title: "Store Separately",
    description: "Keep each piece in its own soft pouch or box to avoid scratches and tangles.",
  },
  {
    icon: Sun,
    title: "Avoid Sun Exposure",
    description: "Direct, prolonged sunlight can affect the color and brilliance of your stones over time.",
  },
  {
    icon: Heart,
    title: "Wear With Love",
    description: "Put your jewellery on as the final step of your routine, and take it off first. Enjoy it for a lifetime.",
  },
];

export default function CareGuidePage() {
  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20">
      
      {/* --- HERO SECTION --- */}
      <section className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto mb-16 md:mb-24">
        <div className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16">
          
          {/* Left Text */}
          <div className="flex-1 text-center md:text-left">
            <p className="font-jost text-[10px] md:text-xs tracking-[0.24em] text-[#C9A24B] uppercase mb-4 font-semibold">
              AJ Jewellers
            </p>
            <h1 className="font-cormorant text-5xl md:text-6xl lg:text-7xl text-[#4A0E1B] leading-none mb-6">
              jewellery <br />
              <span className="italic text-[#C9A24B]">Care</span>
            </h1>
            <div className="w-16 h-px bg-[#C9A24B] mx-auto md:mx-0 mb-6" />
            <p className="font-jost text-lg md:text-xl text-[#7A6A5C] leading-relaxed max-w-[30ch] mx-auto md:mx-0">
              Care for your jewellery, preserve its shine and your history.
            </p>
          </div>

          {/* Right Image */}
          <div className="flex-1 w-full">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#4A0E1B]/5 p-4 border border-[#C9A24B]/20">
              <img
                src={careHeroImg}
                alt="jewellery Care Guide"
                className="w-full h-full object-cover shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- ICONS GRID SECTION --- */}
      <section className="bg-white border-y border-[#C9A24B]/20 py-16 md:py-24 px-6 md:px-12 lg:px-20 mb-16 md:mb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-10">
          {careSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full border border-[#C9A24B] flex items-center justify-center mb-6 bg-[#FDFBF4] group-hover:bg-[#C9A24B]/10 transition-colors duration-300">
                  <Icon size={28} strokeWidth={1.2} className="text-[#4A0E1B]" />
                </div>
                <h3 className="font-jost text-sm md:text-[15px] tracking-[0.16em] text-[#4A0E1B] font-semibold mb-3 uppercase">
                  {step.title}
                </h3>
                <div className="w-6 h-px bg-[#C9A24B]/50 mb-4" />
                <p className="font-jost text-[13px] md:text-sm text-[#7A6A5C] leading-relaxed max-w-[32ch]">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- BOTTOM BANNER SECTION --- */}
      <section className="px-4 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row bg-[#2A0710] overflow-hidden shadow-2xl rounded-sm">
          
          {/* Left Image */}
          <div className="w-full md:w-1/2 aspect-square md:aspect-auto h-[300px] md:h-[500px] relative">
            <img 
              src={careFooterImg} 
              alt="Beautiful jewellery" 
              className="w-full h-full object-cover opacity-90"
            />
            {/* Subtle gradient overlay to blend with the dark side */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#2A0710]/90 md:from-[#2A0710]/50 to-transparent" />
          </div>

          {/* Right Text */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center text-center p-10 md:p-16 relative">
            
            {/* Decorative Stars/Diamonds */}
            <div className="flex gap-2 text-[#C9A24B] mb-6">
              <Sparkles size={16} />
            </div>

            <h2 className="font-cormorant text-2xl md:text-3xl lg:text-4xl text-[#F3E9D8] leading-snug mb-8 max-w-[20ch]">
              YOUR jewellery IS MORE THAN ACCESSORIES. <br />
              <span className="italic text-[#C9A24B]">THEY ARE MEMORIES, EMOTIONS AND PART OF YOUR ESSENCE.</span>
            </h2>
            
            <p className="font-jost text-sm md:text-base text-[#E7C9B8]/80 leading-relaxed max-w-[35ch] mb-10">
              With the correct care, they will accompany you in every special moment of your life.
            </p>

            <div className="mt-auto pt-8 border-t border-[#C9A24B]/20 w-full">
              <p className="font-jost text-[10px] md:text-xs tracking-[0.2em] text-[#C9A24B] uppercase font-semibold mb-1">
                AJ Jewellers
              </p>
              <p className="font-jost text-[10px] tracking-widest text-[#F3E9D8]/60 uppercase">
                Be You. Be Unique. Be Special.
              </p>
            </div>
            
          </div>
        </div>
      </section>

      {/* Back to Shop Button */}
      <div className="text-center mt-16 md:mt-20">
        <Link
          to="/collections"
          onClick={() => window.scrollTo(0, 0)}
          className="inline-block font-jost text-xs md:text-sm tracking-[0.14em] text-[#4A0E1B] border border-[#4A0E1B]/40 px-10 py-4 hover:bg-[#4A0E1B] hover:text-[#FDFBF4] transition-colors"
        >
          RETURN TO BOUTIQUE
        </Link>
      </div>

    </div>
  );
}