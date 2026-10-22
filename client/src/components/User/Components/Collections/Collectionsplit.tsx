import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import bridalVault from "../../../../assets/promos/bridal-vault.jpg";
import everydayGold from "../../../../assets/promos/everyday-gold.jpg";

const panels = [
  {
    title: "Bridal Vault",
    description:
      "Complete sets for the wedding day — haar, jhumka, maang tikka and kada.",
    image: bridalVault,
    href: "/bridal-vault",
    textTone: "light" as const,
  },
  {
    title: "Everyday Silver & Gold",
    description: "Featherlight chains and studs made to never come off.",
    image: everydayGold,
    href: "/everyday-silver-gold",
    textTone: "dark" as const,
  },
];

export default function CollectionSplit() {
  return (
    <section className="flex flex-col md:flex-row">
      {panels.map((panel) => (
        <Link
          to={panel.href}
          key={panel.title}
          onClick={() => window.scrollTo(0, 0)}
          className="relative flex-1 overflow-hidden group block cursor-pointer"
        >
          <img
            src={panel.image}
            alt={panel.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-105"
          />

          {/* Scrim to make text readable */}
          <div
            className="absolute inset-0"
            style={{
              background:
                panel.textTone === "light"
                  ? "linear-gradient(180deg, rgba(20,5,9,0.05) 0%, rgba(20,5,9,0.3) 50%, rgba(15,4,7,0.85) 100%)"
                  : "linear-gradient(180deg, rgba(253,251,244,0) 0%, rgba(253,251,244,0.4) 50%, rgba(253,251,244,0.9) 100%)",
            }}
          />

          <div className="relative z-10 h-fit min-h-[350px] md:min-h-[450px] flex flex-col justify-end p-6 md:p-10 lg:p-14">
            <h3
              className={`font-cormorant text-3xl md:text-4xl lg:text-5xl mb-3 md:mb-4 ${
                panel.textTone === "light" ? "text-[#F3E9D8]" : "text-[#3B0E17]"
              }`}
            >
              {panel.title}
            </h3>
            <p
              className={`font-jost text-sm md:text-base mb-6 md:mb-8 max-w-[36ch] leading-relaxed ${
                panel.textTone === "light"
                  ? "text-[#E7C9B8]/90"
                  : "text-[#4A3A30]/90"
              }`}
            >
              {panel.description}
            </p>
            
            {/* The DISCOVER button is styled here and will route to panel.href */}
            <div
              className={`inline-flex items-center gap-2 self-start font-jost text-xs md:text-sm tracking-[0.14em] border px-6 py-3 md:px-7 md:py-3.5 transition-all duration-300 ${
                panel.textTone === "light"
                  ? "text-[#F3E9D8] border-[#C9A24B] md:group-hover:bg-[#C9A24B] md:group-hover:text-[#fefefe]"
                  : "text-[#3B0E17] border-[#C9A24B] md:group-hover:bg-[#C9A24B] md:group-hover:text-[#2A0A10]"
              }`}
            >
              DISCOVER 
              <FaArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}