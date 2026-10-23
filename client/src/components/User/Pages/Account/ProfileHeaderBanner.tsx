import React from "react";
import { Sparkles, Calendar, Package } from "lucide-react";

interface ProfileHeaderBannerProps {
  title: string;
  subtitle: string;
  flourishText?: string;
  badgeTag?: string;
  icon?: "profile" | "appointment" | "order";
}

export const ProfileHeaderBanner: React.FC<ProfileHeaderBannerProps> = ({
  title,
  subtitle,
  flourishText = "Your Journey With Us",
  badgeTag,
  icon,
}) => {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[#E5D7B7]/60 shadow-sm mb-8 bg-[#FDFBF7]">
      {/* Background with silk gradient & subtle banner image */}
      <div 
        className="absolute inset-0 bg-cover bg-right md:bg-center opacity-30 md:opacity-40 mix-blend-multiply pointer-events-none transition-opacity duration-700"
        style={{ backgroundImage: `url('/profile-banner.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6EE] via-[#FAF6EE]/90 to-transparent pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 px-6 sm:px-8 md:px-12 py-8 md:py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          {badgeTag && (
            <div className="flex items-center gap-2 mb-2">
              {icon === "order" ? (
                <Package size={15} className="text-[#C9A24B]" />
              ) : icon === "appointment" ? (
                <Calendar size={15} className="text-[#C9A24B]" />
              ) : (
                <Sparkles size={15} className="text-[#C9A24B]" />
              )}
              <span className="font-jost text-[10px] md:text-xs tracking-[0.2em] uppercase font-semibold text-[#C9A24B]">
                {badgeTag}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {icon === "appointment" && (
              <div className="w-10 h-10 rounded-lg bg-[#C9A24B]/15 border border-[#C9A24B]/30 flex items-center justify-center text-[#4A0E1B] shrink-0">
                <Calendar size={20} />
              </div>
            )}
            <h1 className="font-cormorant text-3xl sm:text-4xl md:text-5xl text-[#4A0E1B] font-semibold tracking-tight">
              {title}
            </h1>
          </div>

          <p className="font-jost text-xs sm:text-sm text-[#7A6A5C] leading-relaxed mt-2.5 max-w-xl">
            {subtitle}
          </p>
        </div>

        {/* Flourish Calligraphy & Ring Illustration */}
        {flourishText && (
          <div className="hidden sm:flex flex-col items-end justify-center select-none shrink-0 pr-2">
            <span 
              className="font-script text-3xl sm:text-4xl md:text-5xl text-[#8C6514] -rotate-3 leading-none opacity-90 transition-transform duration-300 hover:scale-105"
              style={{ textShadow: "0 1px 2px rgba(201, 162, 75, 0.2)" }}
            >
              {flourishText}
            </span>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#C9A24B]/60 to-transparent mt-1.5 mr-3" />
          </div>
        )}
      </div>
    </div>
  );
};
