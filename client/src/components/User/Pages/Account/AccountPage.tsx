import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../Common/context/AuthContext";
import { useToast } from "../../../Common/context/ToastContext";
import { API_URL, getAuthToken } from "../../../../utils/api";
import { getWishlistItems } from "../../../../utils/wishlist";

// Components
import { ProfileHeaderBanner } from "./ProfileHeaderBanner";
import { ProfileSidebar, AccountTab } from "./ProfileSidebar";
import { ProfileOverviewTab } from "./tabs/ProfileOverviewTab";
import { OrderTrackingTab } from "./tabs/OrderTrackingTab";
import { AppointmentsTab } from "./tabs/AppointmentsTab";
import { AddressesTab } from "./tabs/AddressesTab";
import { WishlistTab } from "./tabs/WishlistTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { ReviewsTab } from "./tabs/ReviewsTab";

// Modals
import { EditProfileModal } from "./modals/EditProfileModal";
import { AddressModal, AddressItem } from "./modals/AddressModal";
import { BookAppointmentModal } from "./modals/BookAppointmentModal";
import { X } from "lucide-react";

export default function AccountPage() {
  const { user, updateUser, logout, openAuthModal, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab synchronized with URL search params
  const rawTab = searchParams.get("tab") as AccountTab;
  const validTabs: AccountTab[] = ["overview", "orders", "addresses", "wishlist", "appointments", "reviews", "settings"];
  const activeTab: AccountTab = validTabs.includes(rawTab) ? rawTab : "overview";

  const handleTabChange = (tab: AccountTab) => {
    setSearchParams({ tab });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // State
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  const [wishlistCount, setWishlistCount] = useState<number>(() => getWishlistItems().length);

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);

  // Return / Resize modal state (Preserved for order integrity)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState<any | null>(null);
  const [returnType, setReturnType] = useState("Return");
  const [returnReason, setReturnReason] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Synchronize Wishlist Count on storage changes
  useEffect(() => {
    const handleStorage = () => {
      setWishlistCount(getWishlistItems().length);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Security Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal({ mode: "login", message: "Sign in to access your luxury account, orders & appointments" });
    } else if (user?.role === "admin") {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [user, authLoading, navigate, openAuthModal]);

  // Fetch Orders
  const fetchMyOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/orders`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Fetch Appointments
  const fetchMyAppointments = useCallback(async () => {
    setIsLoadingAppointments(true);
    try {
      const token = getAuthToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/appointments/my`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setAppointments(data.data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyOrders();
      fetchMyAppointments();
    }
  }, [user, fetchMyOrders, fetchMyAppointments]);

  // Return/Exchange Request submission
  const handleReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrder) return;
    setIsSubmittingReturn(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/orders/${returnOrder._id}/return`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type: returnType, reason: returnReason }),
      });
      const data = await response.json();
      if (data.success) {
        showToast("Request submitted successfully.", "success");
        setIsReturnModalOpen(false);
        setReturnOrder(null);
        setReturnReason("");
        fetchMyOrders();
      } else {
        showToast(data.message || "Failed to submit request.", "error");
      }
    } catch (error) {
      console.error("Error submitting return request:", error);
      showToast("Server error.", "error");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (!user) {
    return (
      <div className="bg-[#FAF6EE] min-h-screen pt-36 pb-24 px-6 flex flex-col items-center justify-center text-center">
        <p className="font-jost text-xs tracking-[0.24em] text-[#C9A24B] uppercase mb-3 font-semibold">
          AJ JEWELLERS CLIENT PRIVILEGE
        </p>
        <h1 className="font-cormorant text-4xl md:text-5xl text-[#4A0E1B] mb-4">
          Client Sign In Required
        </h1>
        <p className="font-jost text-sm text-[#7A6A5C] max-w-md mb-8 leading-relaxed">
          Please sign in to view your jewellery order status, certificates of authenticity, and account details.
        </p>
        <button
          onClick={() => openAuthModal({ mode: "login", message: "Sign in to access your orders, invoices & profile" })}
          className="bg-[#4A0E1B] text-[#F3E9D8] font-jost text-xs tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#3B0A14] transition-colors cursor-pointer shadow-md rounded-lg font-semibold"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  // Header Banner Configurations based on active tab
  const getBannerDetails = () => {
    switch (activeTab) {
      case "orders":
        return {
          title: "Track Your Order",
          subtitle: "Stay updated on your jewellery's journey from our store to your doorstep.",
          flourishText: "Your Dreams Our Priority",
          badgeTag: "ORDER TRACKING",
          icon: "order" as const,
        };
      case "appointments":
        return {
          title: "My Appointments",
          subtitle: "Track your jewellery consultations, view upcoming appointments, and manage your bookings all in one place.",
          flourishText: "Your Dreams Our Priority",
          badgeTag: "BOUTIQUE VIEWING",
          icon: "appointment" as const,
        };
      case "addresses":
        return {
          title: "Delivery Addresses",
          subtitle: "Manage your registered delivery locations for insured express shipping.",
          flourishText: "Safe & Insured Delivery",
          badgeTag: "DESTINATION MANAGER",
          icon: "profile" as const,
        };
      case "wishlist":
        return {
          title: "Saved Wishlist",
          subtitle: "Your curated selection of fine gold heirlooms and certified diamonds.",
          flourishText: "Timeless Heirlooms",
          badgeTag: "FAVORITES VAULT",
          icon: "profile" as const,
        };
      case "reviews":
        return {
          title: "Ratings & Reviews",
          subtitle: "Verified experiences and craftsmanship reviews of your jewellery acquisitions.",
          flourishText: "Verified Heirlooms",
          badgeTag: "CLIENT TESTIMONIALS",
          icon: "profile" as const,
        };
      case "settings":
        return {
          title: "Account Settings",
          subtitle: "Manage password security and notification preferences.",
          flourishText: "Client Privilege",
          badgeTag: "SECURITY & SETTINGS",
          icon: "profile" as const,
        };
      default:
        return {
          title: "My Profile",
          subtitle: "Manage your account details, view your orders, and keep your jewellery journey with us up to date.",
          flourishText: "Your Journey With Us",
          badgeTag: undefined,
          icon: "profile" as const,
        };
    }
  };

  const banner = getBannerDetails();

  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-24 sm:pt-28 md:pt-32 pb-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto">

        {/* TOP LUXURY HERO BANNER */}
        <ProfileHeaderBanner
          title={banner.title}
          subtitle={banner.subtitle}
          flourishText={banner.flourishText}
          badgeTag={banner.badgeTag}
          icon={banner.icon}
        />

        {/* MAIN BODY: SIDEBAR + CONTENT AREA */}
        <div className="flex flex-col md:flex-row items-start gap-8">

          {/* LEFT SIDEBAR (Navigation, user avatar card, concierge) */}
          <ProfileSidebar
            user={user}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onLogout={handleLogout}
          />

          {/* RIGHT / MAIN CONTENT AREA */}
          <div className="flex-1 min-w-0 w-full">
            {activeTab === "overview" && (
              <ProfileOverviewTab
                user={user}
                orders={orders}
                appointments={appointments}
                wishlistCount={wishlistCount}
                onNavigateTab={handleTabChange}
                onSelectOrder={(ord) => setSelectedOrder(ord)}
                onOpenEditProfile={() => setIsEditProfileOpen(true)}
                onOpenAddAddress={() => {
                  setEditingAddress(null);
                  setIsAddressModalOpen(true);
                }}
              />
            )}

            {activeTab === "orders" && (
              <OrderTrackingTab
                user={user}
                orders={orders}
                selectedOrder={selectedOrder}
                onSelectOrder={setSelectedOrder}
                onRequestReturn={(ord) => {
                  setReturnOrder(ord);
                  setIsReturnModalOpen(true);
                }}
                onOpenAddressModal={() => {
                  setEditingAddress(null);
                  setIsAddressModalOpen(true);
                }}
              />
            )}

            {activeTab === "appointments" && (
              <AppointmentsTab
                user={user}
                appointments={appointments}
                onOpenBookModal={() => setIsBookAppointmentOpen(true)}
                onRefresh={fetchMyAppointments}
              />
            )}

            {activeTab === "addresses" && (
              <AddressesTab
                user={user}
                onOpenAddModal={() => {
                  setEditingAddress(null);
                  setIsAddressModalOpen(true);
                }}
                onOpenEditModal={(addr) => {
                  setEditingAddress(addr);
                  setIsAddressModalOpen(true);
                }}
                onUpdateAddresses={(updated, topLevel) => {
                  updateUser({ addresses: updated, ...(topLevel || {}) });
                }}
              />
            )}

            {activeTab === "wishlist" && <WishlistTab />}

            {activeTab === "reviews" && <ReviewsTab user={user} />}

            {activeTab === "settings" && <SettingsTab user={user} />}
          </div>

        </div>

      </div>

      {/* EDIT PROFILE MODAL */}
      <EditProfileModal
        user={user}
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSuccess={(updated) => {
          updateUser(updated);
        }}
      />

      {/* ADDRESS MODAL (Add / Edit) */}
      <AddressModal
        user={user}
        isOpen={isAddressModalOpen}
        editingAddress={editingAddress}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSuccess={(updatedAddrs) => {
          updateUser({ addresses: updatedAddrs });
        }}
      />

      {/* BOOK APPOINTMENT MODAL */}
      <BookAppointmentModal
        user={user}
        isOpen={isBookAppointmentOpen}
        onClose={() => setIsBookAppointmentOpen(false)}
        onSuccess={() => {
          fetchMyAppointments();
          handleTabChange("appointments");
        }}
      />

      {/* RETURN / RESIZING MODAL (Preserved from original) */}
      {isReturnModalOpen && returnOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FDFBF7] w-full max-w-lg rounded-2xl shadow-2xl border border-[#E5D7B7] relative p-6">
            <button
              onClick={() => {
                setIsReturnModalOpen(false);
                setReturnOrder(null);
              }}
              className="absolute top-4 right-4 text-[#7A6A5C] hover:text-red-700 transition-colors p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X size={18} />
            </button>
            <h2 className="font-cormorant text-2xl md:text-3xl font-bold text-[#4A0E1B] mb-1">
              Request Return / Resize
            </h2>
            <p className="font-jost text-xs text-[#7A6A5C] mb-5">
              For Order: AJ-{returnOrder._id.slice(-6).toUpperCase()}
            </p>
            <form onSubmit={handleReturnRequest} className="space-y-4">
              <div>
                <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
                  Request Type
                </label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value)}
                  className="w-full bg-white border border-[#E5D7B7] p-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B] cursor-pointer"
                >
                  <option value="Return">Return &amp; Refund</option>
                  <option value="Resizing">Resizing / Exchange</option>
                </select>
              </div>
              <div>
                <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
                  Reason / Details
                </label>
                <textarea
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={4}
                  placeholder="Please specify why you are requesting a return or resize..."
                  className="w-full bg-white border border-[#E5D7B7] p-3 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B] resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReturnModalOpen(false);
                    setReturnOrder(null);
                  }}
                  className="flex-1 py-3 px-4 border border-[#E5D7B7] text-[#5A4A3C] font-jost text-xs tracking-wider uppercase rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="flex-1 py-3 px-4 bg-[#4A0E1B] text-[#FDFBF7] font-jost text-xs tracking-wider uppercase font-semibold rounded-lg hover:bg-[#3B0A14] transition-colors cursor-pointer disabled:opacity-70"
                >
                  {isSubmittingReturn ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}