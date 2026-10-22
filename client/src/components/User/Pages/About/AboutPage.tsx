import { Link } from "react-router-dom";
import { Gem, BadgeCheck, HeartHandshake, Sparkles } from "lucide-react";
// Using the bridal-vault image as a placeholder for the story image based on your screenshot
import storyImage from "../../../../assets/promos/bridal-vault.jpg";

export default function AboutPage() {
  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-6 md:px-12 lg:px-20">
      
      {/* --- HEADER SECTION --- */}
      <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
        <p className="font-jost text-[10px] md:text-[11px] tracking-[0.24em] text-[#C9A24B] uppercase mb-4 font-semibold">
          SINCE 1974
        </p>
        <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#4A0E1B] mb-5">
          Our Story
        </h1>
        <div className="w-12 md:w-16 h-px bg-[#C9A24B] mx-auto mb-6" />
        <p className="font-jost text-base md:text-lg text-[#4A3A30]/90 leading-relaxed max-w-[50ch] mx-auto">
          AJ Jewellers began as a single bench in a family workshop. Fifty years
          on, three generations of karigars still shape every piece by hand.
        </p>
      </div>

      {/* --- HERO IMAGE --- */}
      <div className="max-w-5xl mx-auto mb-10 md:mb-16">
        <div className="aspect-[4/3] md:aspect-[21/9] overflow-hidden bg-[#4A0E1B]/5">
          <img
            src={storyImage}
            alt="AJ Jewellers Craftsmanship"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      {/* --- STORY PARAGRAPHS --- */}
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 font-jost text-[15px] md:text-base text-[#907a67] leading-relaxed px-2 md:px-0">
        <p>
          What started with kundan setting for neighbourhood weddings grew into a
          boutique known for bridal vaults, temple work and diamond solitaires —
          all held to the same standard: hallmarked purity, honest weight and a
          finish you can feel with your fingertips.
        </p>
        <p>
          We keep the workshop attached to the store on purpose. You can meet the
          karigar who will make your piece, watch a wax model take shape, and
          change the design before a gram of gold is cast.
        </p>
        <p>
          Every invoice carries the exact gross weight, purity and making charge.
          Nothing is hidden, and every gram comes back to you at full value on
          exchange.
        </p>
      </div>

      {/* --- FEATURES / TRUST BADGES --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6 max-w-5xl mx-auto mt-16 md:mt-24 text-center">
        
        {/* Badge 1 */}
        <div className="flex flex-col items-center">
          <Gem size={32} strokeWidth={1} className="text-[#C9A24B] mb-4 md:mb-5" />
          <h3 className="font-jost text-[10px] md:text-xs tracking-[0.2em] text-[#C9A24B] font-medium mb-3 uppercase">
            IN-HOUSE KARIGARS
          </h3>
          <p className="font-jost text-[13px] md:text-sm text-[#7A6A5C] leading-relaxed max-w-[24ch]">
            Every piece is made in our own workshop, never outsourced.
          </p>
        </div>

        {/* Badge 2 */}
        <div className="flex flex-col items-center">
          <BadgeCheck size={32} strokeWidth={1} className="text-[#C9A24B] mb-4 md:mb-5" />
          <h3 className="font-jost text-[10px] md:text-xs tracking-[0.2em] text-[#C9A24B] font-medium mb-3 uppercase">
            HONEST PURITY
          </h3>
          <p className="font-jost text-[13px] md:text-sm text-[#7A6A5C] leading-relaxed max-w-[24ch]">
            BIS hallmarking on all gold and IGI certificates on diamonds.
          </p>
        </div>

        {/* Badge 3 */}
        <div className="flex flex-col items-center">
          <HeartHandshake size={32} strokeWidth={1} className="text-[#C9A24B] mb-4 md:mb-5" />
          <h3 className="font-jost text-[10px] md:text-xs tracking-[0.2em] text-[#C9A24B] font-medium mb-3 uppercase">
            LIFETIME EXCHANGE
          </h3>
          <p className="font-jost text-[13px] md:text-sm text-[#7A6A5C] leading-relaxed max-w-[24ch]">
            Full gold value back on exchange, for as long as you own it.
          </p>
        </div>

        {/* Badge 4 */}
        <div className="flex flex-col items-center">
          <Sparkles size={32} strokeWidth={1} className="text-[#C9A24B] mb-4 md:mb-5" />
          <h3 className="font-jost text-[10px] md:text-xs tracking-[0.2em] text-[#C9A24B] font-medium mb-3 uppercase">
            BESPOKE DESIGN
          </h3>
          <p className="font-jost text-[13px] md:text-sm text-[#7A6A5C] leading-relaxed max-w-[24ch]">
            Sketch, wax model and casting done with you in the room.
          </p>
        </div>

      </div>

      {/* --- CALL TO ACTION --- */}
      <div className="text-center mt-16 md:mt-24">
        <Link
          to="/visit-us"
          onClick={() => window.scrollTo(0, 0)}
          className="inline-block bg-[#4A0E1B] text-[#F3E9D8] font-jost text-[11px] md:text-xs tracking-[0.2em] uppercase px-10 py-4 md:px-12 md:py-4 hover:bg-[#3B0A14] transition-colors shadow-md"
        >
          VISIT THE BOUTIQUE
        </Link>
      </div>

    </div>
  );
}