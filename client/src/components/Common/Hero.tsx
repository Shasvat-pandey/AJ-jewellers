import {Link} from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import heroImage from "../../assets/hero-model.jpg"; // Adjust the path as necessary

export default function Hero() {
  return (
    <section className="relative min-h-screen pt-16 md:pt-20 flex flex-col justify-end overflow-hidden">
      {/* Background image */}
      <img
        src={heroImage}
        alt="Bride wearing handcrafted AJ Jewellers gold bridal set"
        className="absolute inset-0 w-full h-full object-cover object-top md:object-center"
      />

      {/* Scrim: transparent at top, deep maroon at bottom so text stays legible.
          On desktop, add a left-side darkening too so the wider text column stays readable. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(42,10,16,0.05) 0%, rgba(42,10,16,0.35) 45%, rgba(20,5,9,0.92) 88%, rgba(15,4,7,0.98) 100%)",
        }}
      />
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(20,5,9,0.75) 0%, rgba(20,5,9,0.35) 35%, rgba(20,5,9,0) 60%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-6 sm:px-10 md:px-16 lg:px-24 pb-10 md:pb-20 lg:pb-28">
        <div className="max-w-full md:max-w-xl">
          <p className="font-jost text-[11px] md:text-sm tracking-[0.24em] text-[#C9A24B] mb-3 md:mb-4">
            SINCE 1974 · HANDCRAFTED IN INDIA
          </p>

          <h1 className="font-cormorant text-[#F3E9D8] leading-[0.95]">
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              Heirlooms
            </span>
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              for a
            </span>
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#D4AF37]">
              lifetime
            </span>
          </h1>

          <p className="font-jost text-[13px] md:text-base text-[#E7C9B8]/90 mt-5 md:mt-6 mb-8 md:mb-10 leading-relaxed max-w-[34ch] md:max-w-[38ch]">
            Bridal sets, kundan necklaces, jhumkas and diamond rings — shaped
            by hand in hallmarked 916 gold.
          </p>

          <Link
            to="/collections"
            className="inline-flex items-center gap-3 font-jost text-[13px] md:text-sm tracking-[0.14em] text-[#F3E9D8] border border-[#C9A24B] px-7 py-4 md:px-9 md:py-4 w-full sm:w-auto justify-center hover:bg-[#C9A24B] hover:text-[#2A0A10] transition-colors"
          >
            SHOP THE COLLECTION
            <FaArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}