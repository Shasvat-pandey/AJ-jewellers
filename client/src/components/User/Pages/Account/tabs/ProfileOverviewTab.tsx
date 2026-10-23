import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Heart, 
  Calendar, 
  ChevronRight, 
  Edit3, 
  Camera, 
  Mail, 
  Phone, 
  CheckCircle, 
  Check, 
  Crown, 
  Home, 
  Plus, 
  Sparkles, 
  User as UserIcon,
  Diamond,
  Package
} from "lucide-react";
import { User } from "../../../../Common/context/AuthContext";
import { AccountTab } from "../ProfileSidebar";
import { AddressItem } from "../modals/AddressModal";
import { getImageUrl } from "../../../../../utils/imageUrl";

interface ProfileOverviewTabProps {
  user: User;
  orders: any[];
  appointments: any[];
  wishlistCount: number;
  onNavigateTab: (tab: AccountTab) => void;
  onSelectOrder: (order: any) => void;
  onOpenEditProfile: () => void;
  onOpenAddAddress: () => void;
}

export const ProfileOverviewTab: React.FC<ProfileOverviewTabProps> = ({
  user,
  orders,
  appointments,
  wishlistCount,
  onNavigateTab,
  onSelectOrder,
  onOpenEditProfile,
  onOpenAddAddress,
}) => {
  const navigate = useNavigate();
  const [avatarUploading, setAvatarUploading] = useState(false);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDOB = (dobStr?: string) => {
    if (!dobStr) return "12 Jan 2004";
    try {
      const d = new Date(dobStr);
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dobStr;
    }
  };

  // Extract primary/default address or fallback
  const defaultAddress: AddressItem = (user.addresses && user.addresses.length > 0)
    ? (user.addresses.find((a: any) => a.isDefault) || user.addresses[0])
    : {
        tag: "Home",
        isDefault: true,
        name: user.name || "Shasvat Pandey",
        phone: user.phone || "+91 98765 43210",
        addressLine: user.address || "C-12, Sunrise Apartments, 4th Floor, MG Road",
        city: user.city || "Bengaluru",
        state: user.state || "Karnataka",
        pincode: user.pincode || "560001",
      };

  // Recent 3 orders or demo preview
  const displayOrders = orders.length > 0 
    ? orders.slice(0, 3) 
    : [
        {
          _id: "661f001234567890abcdef01",
          orderIdDisplay: "AJ20250478",
          createdAt: "2025-04-15T11:24:00.000Z",
          orderStatus: "Processing",
          totalAmount: 68500,
          items: [{ product: "6ad90aa0b06f728e321519a2", name: "Classic Solitaire Diamond Ring", image: "/src/assets/products/solitaire-ring.jpg" }]
        },
        {
          _id: "661f001234567890abcdef02",
          orderIdDisplay: "AJ20250312",
          createdAt: "2025-03-12T14:10:00.000Z",
          orderStatus: "Delivered",
          totalAmount: 124000,
          items: [{ product: "6ad90aa0b06f728e321519a2", name: "Kundan Heritage Bridal Haar", image: "/src/assets/products/kundan-bridal-haar.jpg" }]
        },
        {
          _id: "661f001234567890abcdef03",
          orderIdDisplay: "AJ20250221",
          createdAt: "2025-02-21T09:45:00.000Z",
          orderStatus: "Delivered",
          totalAmount: 45800,
          items: [{ product: "6ad90aa0b06f728e321519a2", name: "Temple Pearl Drop Jhumkas", image: "/src/assets/products/temple-pearl-jhumka.jpg" }]
        }
      ];

  const upcomingCount = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending').length || 1;
  const ordersCount = orders.length > 0 ? orders.length : 5;

  return (
    <div className="space-y-6">
      {/* 2-Column Responsive Layout for Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT / CENTER COLUMN: User Card, Stat Cards, Quick Info, Journey Card */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* USER PROFILE HEADER CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 sm:p-7 shadow-sm relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Large Avatar with camera icon */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FAF3E0] border-2 border-[#E5D7B7] flex items-center justify-center font-cormorant text-4xl font-bold text-[#8C6514] overflow-hidden shadow-xs">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={52} className="text-[#8C6514]/70" />
                  )}
                </div>
                <button
                  onClick={onOpenEditProfile}
                  title="Upload profile photo"
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#4A0E1B] text-[#F3E9D8] border-2 border-white flex items-center justify-center hover:bg-[#3B0A14] transition-colors shadow-sm cursor-pointer"
                >
                  <Camera size={14} />
                </button>
              </div>

              {/* User Identity & Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#4A0E1B]">
                    {user.name || "Shasvat Pandey"}
                  </h2>
                  <button
                    onClick={onOpenEditProfile}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#C9A24B]/50 text-[#8C6514] hover:bg-[#FAF6EE] text-xs font-jost font-medium transition-colors cursor-pointer self-center sm:self-auto"
                  >
                    <Edit3 size={13} />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-jost text-[#7A6A5C]">
                    <Mail size={14} className="text-[#C9A24B] shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-jost text-[#7A6A5C]">
                    <Phone size={14} className="text-[#C9A24B] shrink-0" />
                    <span>{user.phone || "+91 98765 43210"}</span>
                  </div>
                </div>

                {/* Verified Account Pill */}
                <div className="mt-3.5 flex items-center justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-jost font-medium">
                    <CheckCircle size={12} className="text-emerald-600" />
                    <span>Verified Account</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 METRIC CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Orders */}
            <div
              onClick={() => onNavigateTab("orders")}
              className="bg-white border border-[#E5D7B7]/70 rounded-xl p-4 sm:p-5 shadow-sm hover:border-[#C9A24B] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-[#FAF6EE] border border-[#E5D7B7] flex items-center justify-center text-[#8C6514] group-hover:bg-[#4A0E1B] group-hover:text-[#F3E9D8] transition-colors">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p className="font-jost text-[11px] text-[#7A6A5C] uppercase tracking-wider">Total Orders</p>
                  <p className="font-cormorant text-2xl font-bold text-[#4A0E1B] leading-tight">{ordersCount}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#C9A24B] group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Wishlist Items */}
            <div
              onClick={() => onNavigateTab("wishlist")}
              className="bg-white border border-[#E5D7B7]/70 rounded-xl p-4 sm:p-5 shadow-sm hover:border-[#C9A24B] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-[#FAF6EE] border border-[#E5D7B7] flex items-center justify-center text-[#8C6514] group-hover:bg-[#4A0E1B] group-hover:text-[#F3E9D8] transition-colors">
                  <Heart size={20} />
                </div>
                <div>
                  <p className="font-jost text-[11px] text-[#7A6A5C] uppercase tracking-wider">Wishlist Items</p>
                  <p className="font-cormorant text-2xl font-bold text-[#4A0E1B] leading-tight">{wishlistCount || 3}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#C9A24B] group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Upcoming Appointments */}
            <div
              onClick={() => onNavigateTab("appointments")}
              className="bg-white border border-[#E5D7B7]/70 rounded-xl p-4 sm:p-5 shadow-sm hover:border-[#C9A24B] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-[#FAF6EE] border border-[#E5D7B7] flex items-center justify-center text-[#8C6514] group-hover:bg-[#4A0E1B] group-hover:text-[#F3E9D8] transition-colors">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="font-jost text-[11px] text-[#7A6A5C] uppercase tracking-wider">Appointments</p>
                  <p className="font-cormorant text-2xl font-bold text-[#4A0E1B] leading-tight">{upcomingCount}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#C9A24B] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* QUICK INFORMATION CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 sm:p-7 shadow-sm">
            <div className="flex justify-between items-center pb-4 mb-5 border-b border-[#E5D7B7]/60">
              <h3 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">Quick Information</h3>
              <button
                onClick={onOpenEditProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-[#E5D7B7] text-[#8C6514] hover:bg-[#FAF6EE] text-xs font-jost font-medium transition-colors cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-4 font-jost text-xs sm:text-sm">
              {/* Full Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1">
                <div className="flex items-center gap-2.5 text-[#7A6A5C]">
                  <UserIcon size={16} className="text-[#C9A24B]" />
                  <span>Full Name</span>
                </div>
                <span className="font-medium text-[#4A0E1B]">{user.name || "Shasvat Pandey"}</span>
              </div>

              {/* Email Address */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1">
                <div className="flex items-center gap-2.5 text-[#7A6A5C]">
                  <Mail size={16} className="text-[#C9A24B]" />
                  <span>Email Address</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#4A0E1B] truncate">{user.email}</span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                    <Check size={10} /> Verified
                  </span>
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1">
                <div className="flex items-center gap-2.5 text-[#7A6A5C]">
                  <Phone size={16} className="text-[#C9A24B]" />
                  <span>Phone Number</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#4A0E1B]">{user.phone || "+91 98765 43210"}</span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                    <Check size={10} /> Verified
                  </span>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1">
                <div className="flex items-center gap-2.5 text-[#7A6A5C]">
                  <Calendar size={16} className="text-[#C9A24B]" />
                  <span>Date of Birth</span>
                </div>
                <span className="font-medium text-[#4A0E1B]">{formatDOB(user.dob)}</span>
              </div>

              {/* Gender */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1">
                <div className="flex items-center gap-2.5 text-[#7A6A5C]">
                  <UserIcon size={16} className="text-[#C9A24B]" />
                  <span>Gender</span>
                </div>
                <span className="font-medium text-[#4A0E1B]">{user.gender || "Male"}</span>
              </div>
            </div>
          </div>

          {/* JEWELLERY JOURNEY CARD */}
          <div className="bg-[#FAF6EE] border border-[#E5D7B7] rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FFF8E7] border border-[#E5D7B7] flex items-center justify-center text-[#C9A24B] shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B]">Your Jewellery Journey</h4>
                <p className="font-jost text-xs text-[#7A6A5C] mt-1 max-w-md leading-relaxed">
                  From your first purchase to your latest collection, we are here for every special moment.
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center pr-2">
              <span className="font-script text-2xl sm:text-3xl text-[#8C6514] -rotate-3 select-none">
                More than just jewellery <span className="text-red-600 font-sans">♡</span>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Premium Benefits, Delivery Addresses, Recent Orders */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* PREMIUM CUSTOMER CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#FFF8E7] border border-[#E5D7B7] flex items-center justify-center text-[#C9A24B] shrink-0">
                <Crown size={20} className="fill-[#C9A24B]/30" />
              </div>
              <div>
                <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B]">Premium Customer</h4>
                <p className="font-jost text-xs text-[#7A6A5C] mt-1 leading-relaxed">
                  Enjoy exclusive offers, early access to new collections and personalized concierge assistance.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("appointments")}
              className="mt-2 text-xs font-jost font-semibold text-[#8C6514] hover:text-[#4A0E1B] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Benefits</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* DELIVERY ADDRESSES CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Home size={18} className="text-[#C9A24B]" />
                <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B]">Delivery Addresses</h4>
              </div>
              <button
                onClick={() => onNavigateTab("addresses")}
                className="text-xs font-jost text-[#8C6514] hover:text-[#4A0E1B] font-medium flex items-center gap-0.5 cursor-pointer"
              >
                <span>Manage Addresses</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Default address box */}
            <div
              onClick={() => onNavigateTab("addresses")}
              className="bg-[#FAF6EE]/80 border border-[#E5D7B7] rounded-lg p-4 transition-all hover:bg-[#FAF6EE] cursor-pointer group relative"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FFF8E7] text-[#8C6514] border border-[#E5D7B7] text-[10px] font-jost font-semibold">
                    Default
                  </span>
                  <span className="font-jost text-xs font-semibold text-[#4A0E1B]">
                    {defaultAddress.name}
                  </span>
                </div>
                <ChevronRight size={16} className="text-[#C9A24B] group-hover:translate-x-1 transition-transform" />
              </div>

              <p className="font-jost text-xs text-[#5A4A3C] leading-relaxed">
                {defaultAddress.addressLine}, {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}, India
              </p>
              <p className="font-jost text-xs text-[#7A6A5C] mt-2">
                {defaultAddress.phone}
              </p>
            </div>

            <button
              onClick={onOpenAddAddress}
              className="mt-4 w-full py-2.5 px-4 border border-[#4A0E1B]/30 text-[#4A0E1B] hover:bg-[#4A0E1B]/5 font-jost text-xs tracking-wider uppercase font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add New Address</span>
            </button>
          </div>

          {/* RECENT ORDERS CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B]">Recent Orders</h4>
              <button
                onClick={() => onNavigateTab("orders")}
                className="text-xs font-jost text-[#8C6514] hover:text-[#4A0E1B] font-medium flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {displayOrders.map((ord: any) => {
                const orderNumber = ord.orderIdDisplay || `AJ-${ord._id.slice(-6).toUpperCase()}`;
                const dateText = new Date(ord.createdAt || Date.now()).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const firstItem = ord.items?.[0];
                const productId = firstItem?.product?._id || firstItem?.product || firstItem?.productId || firstItem?._id;
                const itemImg = getImageUrl(firstItem?.image) || "/src/assets/products/solitaire-ring.jpg";
                const isDelivered = ord.orderStatus === "Delivered";

                return (
                  <div
                    key={ord._id}
                    onClick={() => {
                      onSelectOrder(ord);
                      onNavigateTab("orders");
                    }}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#E5D7B7]/50 hover:border-[#C9A24B] hover:bg-[#FAF6EE]/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        onClick={(e) => {
                          if (productId) {
                            e.stopPropagation();
                            navigate(`/products/${productId}`);
                          }
                        }}
                        title={productId ? "View product details" : undefined}
                        className={`w-12 h-12 rounded-lg bg-[#FAF6EE] border border-[#E5D7B7] overflow-hidden shrink-0 flex items-center justify-center p-1 transition-all ${
                          productId ? "hover:border-[#C9A24B] hover:scale-105" : ""
                        }`}
                      >
                        <img src={itemImg} alt={firstItem?.name || "Jewellery"} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-jost text-xs font-semibold text-[#4A0E1B] truncate">
                          Order #{orderNumber}
                        </p>
                        <p className="font-jost text-[11px] text-[#7A6A5C] mt-0.5">
                          {dateText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-2">
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-jost font-semibold uppercase rounded-full ${
                            isDelivered
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {ord.orderStatus || "Processing"}
                        </span>
                        <p className="font-cormorant text-sm font-bold text-[#4A0E1B] mt-0.5">
                          {formatINR(ord.totalAmount || 68500)}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-[#C9A24B] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
