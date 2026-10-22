import { FaMapMarkerAlt } from "react-icons/fa";
import { GiSparkles } from "react-icons/gi";
import { Link } from "react-router-dom"; // <-- Added Link

export default function PrivateViewing() {
  return (
    <section className="bg-[#FDFBF4] py-16 md:py-24 px-6 text-center">
      <GiSparkles
        size={22}
        className="text-[#C9A24B] mx-auto mb-5 md:mb-6"
      />

      <h2 className="font-cormorant text-3xl md:text-5xl text-[#4A0E1B] mb-4 md:mb-5">
        Book a private viewing
      </h2>

      <p className="font-jost text-sm md:text-base text-[#7A6A5C] leading-relaxed max-w-[42ch] md:max-w-[52ch] mx-auto mb-8 md:mb-10">
        Sit with our karigars, try the bridal vault and design a piece that is
        entirely yours.
      </p>

      {/* Changed to Link with deep link */}
      <Link
        to="/visit-us?book=1"
        onClick={() => window.scrollTo(0, 0)}
        className="block w-full max-w-xs sm:w-auto sm:inline-block bg-[#3B0E17] text-[#F3E9D8] font-jost text-xs md:text-sm tracking-[0.16em] px-10 py-4 md:px-12 md:py-4 mx-auto hover:bg-[#4A0E1B] transition-colors"
      >
        BOOK AN APPOINTMENT
      </Link>

      {/* Changed to Link pointing to internal Visit Us page */}
      <Link
        to="/visit-us"
        onClick={() => window.scrollTo(0, 0)}
        className="flex items-center justify-center gap-1.5 mt-5 md:mt-6 font-jost text-[11px] md:text-xs tracking-[0.14em] text-[#4A0E1B] hover:text-[#C9A24B] transition-colors"
      >
        <FaMapMarkerAlt size={13} />
        FIND OUR BOUTIQUE
      </Link>
    </section>
  );
}