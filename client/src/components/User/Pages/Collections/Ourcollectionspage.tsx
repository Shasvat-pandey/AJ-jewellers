import { useState } from "react";
import { Link } from "react-router-dom";

import necklaces from "../../../../assets/categories/necklaces.jpg";
import jhumkas from "../../../../assets/categories/jhumkas.jpg";
import bangles from "../../../../assets/categories/bangles.jpg";
import rings from "../../../../assets/categories/rings.jpg";
import mangalsutra from "../../../../assets/categories/mangalsutra.jpg";
import bridalVault from "../../../../assets/categories/pendants.jpg";
import everydayGold from "../../../../assets/categories/chains.jpg";
import earrings from "../../../../assets/categories/mangalsutra.jpg";
import chainsPendants from "../../../../assets/categories/mangalsutra.jpg";
import anklets from "../../../../assets/categories/mangalsutra.jpg";
import templeJewellery from "../../../../assets/categories/mangalsutra.jpg";
import diamondJewellery from "../../../../assets/categories/mangalsutra.jpg";
import mensCollection from "../../../../assets/categories/mangalsutra.jpg";

const collections = [
  {
    name: "Necklaces",
    description: "Kundan haars, temple chokers and polki collars in hallmarked 916 gold.",
    image: necklaces,
    pieces: 3,
    href: "/collections/necklaces",
  },
  {
    name: "Jhumkas",
    description: "Pearl-drop jhumkas, chandbalis and everyday studs hand-finished in house.",
    image: jhumkas,
    pieces: 3,
    href: "/collections/jhumkas",
  },
  {
    name: "Bangles",
    description: "Antique kadas, thin stacking bangles and openable diamond bracelets.",
    image: bangles,
    pieces: 3,
    href: "/collections/bangles",
  },
  {
    name: "Rings",
    description: "Solitaires, engagement bands and cocktail rings certified for purity.",
    image: rings,
    pieces: 3,
    href: "/collections/rings",
  },
  {
    name: "Mangalsutra",
    description: "Nakshatra pendants and long chains designed for daily wear.",
    image: mangalsutra,
    pieces: 3,
    href: "/collections/mangalsutra",
  },
  {
    name: "Everyday Gold",
    description: "Featherlight chains and studs made to never come off.",
    image: everydayGold,
    pieces: 3,
    href: "/collections/everyday-gold",
  },
  {
    name: "Earrings",
    description: "Studs, hoops and danglers in gold and gold-diamond combinations.",
    image: earrings,
    pieces: 3,
    href: "/collections/earrings",
  },
  {
    name: "Chains & Pendants",
    description: "Solid gold chains and everyday pendants in classic and modern motifs.",
    image: chainsPendants,
    pieces: 3,
    href: "/collections/chains-pendants",
  },
  {
    name: "Anklets",
    description: "Payals and anklets in fine link and antique temple designs.",
    image: anklets,
    pieces: 3,
    href: "/collections/anklets",
  },
  {
    name: "Temple Jewellery",
    description: "Traditional South Indian motifs handcrafted for weddings and worship.",
    image: templeJewellery,
    pieces: 3,
    href: "/collections/temple-jewellery",
  },
  {
    name: "Diamond Jewellery",
    description: "Certified diamonds set in gold — from everyday studs to statement pieces.",
    image: diamondJewellery,
    pieces: 3,
    href: "/collections/diamond-jewellery",
  },
  {
    name: "Men's Collection",
    description: "Chains, kadas and rings crafted for everyday and ceremonial wear.",
    image: mensCollection,
    pieces: 3,
    href: "/collections/mens",
  },
];





export default function OurCollectionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredCollections = collections.filter(collection => {
    if (selectedCategory === "all") return true;
    return collection.name === selectedCategory;
  });

  return (
    <section className="bg-[#FDFBF4] pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 md:px-12 lg:px-20">
      <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
        <p className="font-jost text-[10px] md:text-xs tracking-[0.24em] text-[#C9A24B] mb-3 md:mb-4">
          THE CATALOGUE
        </p>
        <h1 className="font-cormorant text-4xl md:text-6xl text-[#4A0E1B] mb-4 md:mb-5">
          Our Collections
        </h1>
        <div className="w-16 md:w-24 h-px bg-[#C9A24B] mx-auto mb-5 md:mb-6" />
        <p className="font-jost text-sm md:text-base text-[#7A6A5C] leading-relaxed">
          Every piece is hallmarked, hand-finished in our own workshop and
          backed by lifetime exchange.
        </p>
      </div>

      {/* --- FILTERS --- */}
      <div className="max-w-7xl mx-auto flex justify-end mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="font-jost text-xs md:text-sm bg-transparent border border-[#EAE3D5] text-[#4A0E1B] py-2 px-4 focus:outline-none focus:border-[#C9A24B] cursor-pointer"
        >
          <option value="all">All Categories</option>
          <option value="Necklaces">Necklaces</option>
          <option value="Rings">Rings</option>
          <option value="Bangles">Bangles</option>
          <option value="Earrings">Earrings</option>
          <option value="Mangalsutra">Mangalsutra</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-7xl mx-auto">
        {filteredCollections.length > 0 ? (
          filteredCollections.map((collection) => (
            <Link
              to={collection.href}
              key={collection.name}
              onClick={() => window.scrollTo(0, 0)}
              className="relative aspect-[4/5] overflow-hidden group block"
            >
              <img
                src={collection.image}
                alt={collection.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(20,5,9,0.05) 0%, rgba(20,5,9,0.25) 40%, rgba(15,4,7,0.95) 100%)",
                }}
              />

              <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 md:p-6">
                <h3 className="font-cormorant text-lg sm:text-xl md:text-3xl text-[#F3E9D8] mb-1 md:mb-2">
                  {collection.name}
                </h3>
                <p className="font-jost text-[9px] sm:text-[11px] md:text-[13px] text-[#E7C9B8]/90 leading-snug mb-1.5 md:mb-3 line-clamp-2 md:line-clamp-none">
                  {collection.description}
                </p>
                <span className="font-jost text-[8px] sm:text-[9px] md:text-xs tracking-[0.16em] text-[#C9A24B]">
                  {collection.pieces} PIECES
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-[#7A6A5C] font-jost">
            No collections found for this category.
          </div>
        )}
      </div>

    </section>
  );
}