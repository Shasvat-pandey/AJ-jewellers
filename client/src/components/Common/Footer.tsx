import { useState } from "react";
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaPinterestP,
  FaWhatsapp,
} from "react-icons/fa";
import {
  ChevronRight,
  Plus,
  Minus,
  ArrowUp,
  Globe,
  Truck,
  ShieldCheck,
  Headphones,
  ArrowRight,
} from "lucide-react";
import logo from "../../assets/logo.png"; // Adjust the path as necessary

const INSTAGRAM_URL = "https://www.instagram.com/anshjewellers05";
const FACEBOOK_URL = "https://facebook.com/ajjewellers";
const YOUTUBE_URL = "https://youtube.com";
const PINTEREST_URL = "https://pinterest.com";
const WHATSAPP_NUMBER = "919876543210";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const shopLinks = [
  { label: "Necklaces", href: "/collections/necklaces" },
  { label: "Earrings", href: "/collections/earrings" },
  { label: "Bangles", href: "/collections/bangles" },
  { label: "Rings", href: "/collections/rings" },
  { label: "Mangalsutra", href: "/collections/mangalsutra" },
  { label: "Bracelets", href: "/collections/bracelets" },
  { label: "All Collections", href: "/collections" },
];

const helpLinks = [
  { label: "Gold Exchange", href: "/visit-us?book=1" },
  { label: "Insured Shipping", href: "/help/shipping" },
  { label: "Returns & Exchanges", href: "/help/returns" },
  { label: "Care Guide", href: "/care-guide" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "FAQs", href: "/help/faqs" },
  { label: "Contact Concierge", href: "/help/contact" },
];

const aboutLinks = [
  { label: "Our Story", href: "/about" },
  { label: "Master Craftsmanship", href: "/about" },
  { label: "Boutique Viewing", href: "/visit-us?book=1" },
  { label: "Live Gold Rates", href: "/gold-rate" },
  { label: "Bridal Vault", href: "/bridal-vault" },
  { label: "Jewellery Care Guide", href: "/care-guide" },
];

export default function Footer() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderSocialLinks = () => (
    <div className="flex items-center gap-3 mt-6">
      {[
        { Icon: FaInstagram, url: INSTAGRAM_URL, label: "Instagram" },
        { Icon: FaFacebookF, url: FACEBOOK_URL, label: "Facebook" },
        { Icon: FaYoutube, url: YOUTUBE_URL, label: "YouTube" },
        { Icon: FaPinterestP, url: PINTEREST_URL, label: "Pinterest" },
        { Icon: FaWhatsapp, url: WHATSAPP_URL, label: "WhatsApp" },
      ].map(({ Icon, url, label }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="w-8 h-8 rounded-full border border-[#C9A24B]/60 flex items-center justify-center text-[#C9A24B] hover:bg-[#C9A24B] hover:text-[#2A0A10] transition-colors"
        >
          <Icon size={14} />
        </a>
      ))}
    </div>
  );

  const renderNewsletter = () => (
    <div className="flex flex-col">
      <h4 className="font-cormorant text-xl tracking-wide text-[#F3E9D8] mb-1">
        JOIN OUR NEWSLETTER
      </h4>
      <p className="font-jost text-[13px] text-[#F3E9D8]/80 mb-4">
        Get exclusive offers, new arrivals and more.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // API implementation for newsletter here
        }}
        className="relative flex items-center w-full mb-8"
      >
        <input
          type="email"
          placeholder="Enter your email address"
          required
          className="w-full bg-transparent border border-[#C9A24B]/30 rounded-full py-2.5 pl-4 pr-12 text-sm text-[#F3E9D8] placeholder-[#F3E9D8]/50 focus:outline-none focus:border-[#C9A24B] transition-colors font-jost"
        />
        <button
          type="submit"
          className="absolute right-1.5 p-1.5 bg-[#C9A24B] text-[#2A0A10] rounded-full hover:bg-[#EAE3D5] transition-colors"
        >
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="grid grid-cols-3 gap-4 border-t border-[#C9A24B]/20 pt-6">
        <div className="flex flex-col items-start lg:items-center text-left lg:text-center gap-2">
          <Truck className="text-[#C9A24B]" size={24} strokeWidth={1.5} />
          <div className="font-jost text-[10px] sm:text-xs text-[#F3E9D8]/80 leading-tight">
            <span className="block text-[#F3E9D8]">Free</span> Shipping
            <br />
            Above ₹999
          </div>
        </div>
        <div className="flex flex-col items-start lg:items-center text-left lg:text-center gap-2 border-l border-[#C9A24B]/20 pl-4 lg:pl-0 lg:border-l-0 lg:border-x">
          <ShieldCheck className="text-[#C9A24B]" size={24} strokeWidth={1.5} />
          <div className="font-jost text-[10px] sm:text-xs text-[#F3E9D8]/80 leading-tight">
            <span className="block text-[#F3E9D8]">Secure</span> Payments
            <br />
            100% Safe
          </div>
        </div>
        <div className="flex flex-col items-start lg:items-center text-left lg:text-center gap-2 border-l border-[#C9A24B]/20 pl-4 lg:border-l-0">
          <Headphones className="text-[#C9A24B]" size={24} strokeWidth={1.5} />
          <div className="font-jost text-[10px] sm:text-xs text-[#F3E9D8]/80 leading-tight">
            <span className="block text-[#F3E9D8]">24/7</span> Customer
            <br />
            Support
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <footer className="bg-[#2A0A10] text-[#F3E9D8] pt-12 lg:pt-16 pb-6 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto">
        
        {/* ========================================================= */}
        {/* DESKTOP VIEW (>= 1024px lg)                               */}
        {/* ========================================================= */}
        <div className="hidden lg:grid grid-cols-12 gap-8 mb-12 border-b border-[#C9A24B]/20 pb-12">
          {/* Column 1: Brand (3 cols) */}
          <div className="col-span-3 pr-4">
            <img
              src={logo}
              alt="AJ Jewellers"
              className="h-16 w-auto object-contain mb-4 filter brightness-0 invert sepia hue-rotate-[320deg] saturate-[200%] contrast-100"
              style={{ filter: "brightness(0) saturate(100%) invert(86%) sepia(19%) saturate(836%) hue-rotate(345deg) brightness(85%) contrast(85%)" }}
            />
            <h3 className="font-cormorant italic text-lg text-[#F3E9D8] mb-3">
              Timeless Elegance, Forever Yours
            </h3>
            <p className="font-jost text-[13px] text-[#F3E9D8]/80 leading-relaxed mb-6">
              At AJ Jewellers, we bring you exquisite jewellery crafted with
              trust, tradition and timeless beauty.
            </p>
            {renderSocialLinks()}
          </div>

          {/* Column 2: SHOP (2 cols) */}
          <div className="col-span-2">
            <h4 className="font-jost text-xs tracking-[0.18em] text-[#C9A24B] mb-6 uppercase">
              Shop
            </h4>
            <ul className="space-y-4">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group flex items-center justify-between font-jost text-[13px] text-[#F3E9D8]/90 hover:text-[#C9A24B] transition-colors"
                  >
                    <span>{link.label}</span>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: HELP (2 cols) */}
          <div className="col-span-2">
            <h4 className="font-jost text-xs tracking-[0.18em] text-[#C9A24B] mb-6 uppercase">
              Help
            </h4>
            <ul className="space-y-4">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group flex items-center justify-between font-jost text-[13px] text-[#F3E9D8]/90 hover:text-[#C9A24B] transition-colors"
                  >
                    <span>{link.label}</span>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: ABOUT US (2 cols) */}
          <div className="col-span-2">
            <h4 className="font-jost text-xs tracking-[0.18em] text-[#C9A24B] mb-6 uppercase">
              About Us
            </h4>
            <ul className="space-y-4">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group flex items-center justify-between font-jost text-[13px] text-[#F3E9D8]/90 hover:text-[#C9A24B] transition-colors"
                  >
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: NEWSLETTER (3 cols) */}
          <div className="col-span-3 pl-4 border-l border-[#C9A24B]/10">
            {renderNewsletter()}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE & TABLET VIEW (< 1024px)                           */}
        {/* ========================================================= */}
        <div className="lg:hidden flex flex-col mb-8 border-b border-[#C9A24B]/20 pb-8">
          <div className="mb-8">
            <img
              src={logo}
              alt="AJ Jewellers"
              className="h-14 w-auto object-contain mb-4 filter brightness-0 invert sepia hue-rotate-[320deg] saturate-[200%] contrast-100"
              style={{ filter: "brightness(0) saturate(100%) invert(86%) sepia(19%) saturate(836%) hue-rotate(345deg) brightness(85%) contrast(85%)" }}
            />
            <h3 className="font-cormorant italic text-lg text-[#F3E9D8] mb-2">
              Timeless Elegance, Forever Yours
            </h3>
            <p className="font-jost text-[13px] text-[#F3E9D8]/80 leading-relaxed mb-4">
              At AJ Jewellers, we bring you exquisite jewellery crafted with
              trust, tradition and timeless beauty.
            </p>
            {renderSocialLinks()}
          </div>

          <div className="border-t border-[#C9A24B]/20">
            {[
              { title: "SHOP", links: shopLinks },
              { title: "HELP", links: helpLinks },
              { title: "ABOUT US", links: aboutLinks },
            ].map((section) => (
              <div key={section.title} className="border-b border-[#C9A24B]/20">
                <button
                  onClick={() => toggleAccordion(section.title)}
                  className="w-full flex items-center justify-between py-4 text-left font-jost text-xs tracking-[0.18em] text-[#C9A24B] uppercase"
                >
                  {section.title}
                  {openAccordion === section.title ? (
                    <Minus size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openAccordion === section.title
                      ? "max-h-[500px] opacity-100 mb-4"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <ul className="space-y-3 pt-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="font-jost text-[13px] text-[#F3E9D8]/90 hover:text-[#C9A24B] transition-colors"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            {renderNewsletter()}
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM BAR (All Views)                                    */}
        {/* ========================================================= */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-0">
          
          {/* Payment Icons */}
          {/* Supported Payment Methods */}
          <div className="flex flex-wrap items-center gap-2 text-[#F3E9D8]/60 w-full lg:w-auto justify-center lg:justify-start">
            <span className="font-jost text-[11px] text-[#F3E9D8]/80 mr-1 uppercase tracking-wider">
              Settlement:
            </span>
            <span className="text-[10px] font-medium tracking-wide border border-[#C9A24B]/40 bg-[#4A0E1B]/50 px-2 py-0.5 rounded-sm text-[#F3E9D8]">
              💵 Cash at Boutique / COD
            </span>
            <span className="text-[10px] font-medium tracking-wide border border-[#C9A24B]/40 bg-[#4A0E1B]/50 px-2 py-0.5 rounded-sm text-[#F3E9D8]">
              🏦 Bank Transfer (NEFT/IMPS)
            </span>
            <span className="text-[10px] font-medium tracking-wide border border-[#C9A24B]/40 bg-[#4A0E1B]/50 px-2 py-0.5 rounded-sm text-[#F3E9D8]">
              📱 UPI (GPay / PhonePe / Paytm)
            </span>
          </div>

          {/* Copyright */}
          <div className="font-jost text-[11px] text-[#F3E9D8]/60 text-center lg:text-left order-3 lg:order-none">
            © 2026 AJ Jewellers. All rights reserved. | Designed with <span className="text-red-500">♥</span> in India
          </div>

          {/* Selectors & Back to Top */}
          <div className="flex items-center justify-center lg:justify-end gap-4 w-full lg:w-auto order-2 lg:order-none">
            <button className="flex items-center gap-2 border border-[#C9A24B]/40 rounded-full px-4 py-1.5 hover:border-[#C9A24B] transition-colors">
              <Globe size={14} className="text-[#C9A24B]" />
              <span className="font-jost text-[11px] text-[#F3E9D8]">English v</span>
            </button>
            <button className="flex items-center gap-2 border border-[#C9A24B]/40 rounded-full px-4 py-1.5 hover:border-[#C9A24B] transition-colors">
              <span className="font-jost text-[11px] text-[#F3E9D8]">INR (₹) v</span>
            </button>
            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-[#C9A24B] text-[#C9A24B] hover:bg-[#C9A24B] hover:text-[#2A0A10] transition-colors ml-2"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}