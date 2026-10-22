import { FaInstagram } from "react-icons/fa";
import post1 from "../../../../assets/instagram/post-1.jpg";
import post2 from "../../../../assets/instagram/post-2.jpg";
import post3 from "../../../../assets/instagram/post-3.jpg";
import post4 from "../../../../assets/instagram/post-4.jpg";
import post5 from "../../../../assets/instagram/post-5.jpg";
import post6 from "../../../../assets/instagram/post-6.jpg";

const INSTAGRAM_URL =
  "https://www.instagram.com/anshjewellers05?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==";

// Add/remove images here — grid re-flows automatically
// (3 cols on mobile, 6 on desktop).
const posts = [post1, post2, post3, post4, post5, post6];

export default function InstagramFeed() {
  return (
    <section className="bg-[#FDFBF4] pb-14 md:pb-20 px-6 md:px-12 lg:px-20">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="font-cormorant text-3xl md:text-5xl text-brand-burgundy">
          Follow Our Journey
        </h2>
        <div className="w-16 md:w-24 h-px bg-gold mx-auto mt-4" />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 max-w-6xl mx-auto">
        {posts.map((post, i) => (
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            key={i}
            className="relative aspect-square overflow-hidden group"
          >
            <img
              src={post}
              alt={`AJ Jewellers Instagram post ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-105"
            />
          </a>
        ))}
      </div>

      <div className="text-center mt-8 md:mt-10">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-jost text-[11px] md:text-xs tracking-[0.14em] text-brand-burgundy border border-brand-burgundy/30 px-6 py-3 md:px-7 md:py-3.5 hover:border-gold hover:text-gold transition-colors"
        >
          <FaInstagram size={15} aria-hidden="true" />
          @AJ.JEWELLERS
        </a>
      </div>
    </section>
  );
}