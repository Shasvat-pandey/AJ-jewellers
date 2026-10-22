import { BadgeCheck, ArrowLeftRight, ShieldCheck, Gem } from "lucide-react";

const badges = [
  {
    icon: BadgeCheck,
    title: "BIS Hallmarked",
    description: "Certified 916 purity on every piece",
  },
  {
    icon: ArrowLeftRight,
    title: "Lifetime Exchange",
    description: "100% value on gold exchange",
  },
  {
    icon: ShieldCheck,
    title: "Insured Delivery",
    description: "Free & fully insured shipping",
  },
  {
    icon: Gem,
    title: "In-House Karigars",
    description: "Hand-finished by master artisans",
  },
];

export default function TrustBadges() {
  return (
    <section className="bg-[#FDFBF4] py-12 md:py-16 px-6 md:px-12 lg:px-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 max-w-5xl mx-auto text-center">
        {badges.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col items-center">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-[#C9A24B] flex items-center justify-center mb-4">
              <Icon size={22} strokeWidth={1.3} className="text-[#C9A24B]" />
            </div>
            <h3 className="font-jost text-[11px] md:text-xs tracking-[0.14em] text-[#4A0E1B] font-semibold mb-2 uppercase">
              {title}
            </h3>
            <p className="font-jost text-[13px] md:text-sm text-[#7A6A5C] leading-snug">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}