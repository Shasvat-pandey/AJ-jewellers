import React from "react";
import { 
  Home, 
  Package, 
  MapPin, 
  Heart, 
  Calendar, 
  Star, 
  Settings, 
  LogOut, 
  Crown, 
  Headphones, 
  ArrowRight,
  User as UserIcon
} from "lucide-react";
import { User } from "../../../Common/context/AuthContext";
import { useNavigate } from "react-router-dom";

export type AccountTab = 
  | "overview" 
  | "orders" 
  | "addresses" 
  | "wishlist" 
  | "appointments" 
  | "reviews" 
  | "settings";

interface ProfileSidebarProps {
  user: User;
  activeTab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
  onLogout: () => void;
}

const navItems: { id: AccountTab; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: "overview", label: "Profile Overview", icon: Home },
  { id: "orders", label: "My Orders", icon: Package },
  { id: "addresses", label: "My Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
];

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full md:w-64 lg:w-72 shrink-0 space-y-6">
      {/* User Card Container */}
      <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-5 md:p-6 shadow-sm">
        {/* User Mini Avatar & Info */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-[#E5D7B7]/50">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-[#4A0E1B] text-[#F3E9D8] flex items-center justify-center font-cormorant text-2xl font-semibold shadow-inner border-2 border-[#C9A24B]/40 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={28} className="text-[#F3E9D8]/90" />
              )}
            </div>
          </div>

          <h2 className="font-cormorant text-xl font-bold text-[#4A0E1B] leading-tight">
            {user.name || "Privilege Member"}
          </h2>
          <p className="font-jost text-xs text-[#7A6A5C] truncate max-w-[200px] mt-0.5">
            {user.email}
          </p>

          {/* Premium Customer Pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF8E7] border border-[#E5D7B7] rounded-full text-[11px] font-jost text-[#8C6514] font-medium shadow-xs">
            <Crown size={12} className="text-[#C9A24B] fill-[#C9A24B]/30" />
            <span>Premium Customer</span>
          </div>
        </div>

        {/* Navigation Links (Desktop List / Mobile Scrollable Bar) */}
        <nav className="pt-4 space-y-1 hidden md:block">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-jost text-xs tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#4A0E1B] text-[#FDFBF7] font-medium shadow-sm"
                    : "text-[#5A4A3C] hover:bg-[#FAF6EE] hover:text-[#4A0E1B]"
                }`}
              >
                <Icon size={16} className={isActive ? "text-[#C9A24B]" : "text-[#7A6A5C]"} />
                <span>{label}</span>
              </button>
            );
          })}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-jost text-xs tracking-wide text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors cursor-pointer mt-3 pt-3 border-t border-[#E5D7B7]/40"
          >
            <LogOut size={16} className="text-red-600" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Mobile Horizontal Navigation Bar */}
      <div className="md:hidden overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full font-jost text-xs tracking-wide transition-colors whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? "bg-[#4A0E1B] text-[#FDFBF7] border-[#4A0E1B] font-medium shadow-sm"
                    : "bg-white text-[#5A4A3C] border-[#E5D7B7] hover:bg-[#FAF6EE]"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[#C9A24B]" : "text-[#7A6A5C]"} />
                <span>{label}</span>
              </button>
            );
          })}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full font-jost text-xs tracking-wide text-red-700 bg-white border border-red-200 hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Need Help Concierge Card */}
      <div className="bg-[#FAF6EE] border border-[#E5D7B7] rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="w-10 h-10 rounded-full bg-[#FFF8E7] border border-[#E5D7B7] flex items-center justify-center text-[#C9A24B] mb-3">
          <Headphones size={20} />
        </div>
        <h4 className="font-cormorant text-lg font-bold text-[#4A0E1B]">Need Help?</h4>
        <p className="font-jost text-xs text-[#7A6A5C] mt-1 leading-relaxed">
          Our jewellery experts are here for you.
        </p>
        <button
          onClick={() => navigate("/contact")}
          className="mt-4 w-full bg-[#4A0E1B] text-[#FDFBF7] font-jost text-[11px] tracking-[0.15em] uppercase font-medium py-2.5 px-4 rounded-md hover:bg-[#3B0A14] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span>Contact Us</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
