import Hero from "../../Common/Hero";
import CategoryScroll from "../Components/Collections/CategoryScroll";
import FavouritesGrid from "./Wishlist/FavouritesGrid";
import GoldRateBanner from "../../Common/Goldratebanner";
import TrustBadges from "../../Common/Trustbadges";
import CollectionSplit from "../Components/Collections/Collectionsplit";
import PrivateViewing from "../Components/About/Privateviewing";
import InstagramFeed from "../Components/Home/Instagramfeed";

export default function Home() {
  return (
    <main>
      <section id="home">
        <Hero />
      </section>
      
      {/* Note: I removed the id="collections" from here since Collections is now a separate page */}
      <CategoryScroll />
      
      <section id="bestsellers">
        <FavouritesGrid />
      </section>
      
      <section id="gold-rate">
        <GoldRateBanner />
      </section>
      
      <TrustBadges />
      
      <section id="bridal">
        <CollectionSplit />
      </section>
      
      <section id="visit-us">
        <PrivateViewing />
      </section>
      
      <InstagramFeed />
    </main>
  );
}