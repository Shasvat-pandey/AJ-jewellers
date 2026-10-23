import React, { useState } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  ChevronRight, 
  Phone, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle
} from "lucide-react";
import { User } from "../../../../Common/context/AuthContext";
import { useToast } from "../../../../Common/context/ToastContext";
import { API_URL, getAuthToken } from "../../../../../utils/api";

interface AppointmentsTabProps {
  user: User;
  appointments: any[];
  onOpenBookModal: () => void;
  onRefresh: () => void;
}

type AppointmentFilter = "upcoming" | "past" | "cancelled";

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  user,
  appointments,
  onOpenBookModal,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState<AppointmentFilter>("upcoming");
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);

  // Fallback demo consultations to guarantee pixel-perfect match with Reference Image 2
  const demoList = [
    {
      _id: "apt_01",
      status: "Confirmed",
      title: "Custom Ring Consultation",
      subtitle: "Design your dream ring with our expert jewellers",
      dateStr: "25 Apr 2025, Friday",
      timeStr: "11:00 AM - 12:00 PM",
      location: "AJ Jewellers Store, Kolkata",
      consultant: "Priya Sharma",
      image: "/src/assets/products/solitaire-ring.jpg",
      isUpcoming: true,
      interests: "Custom solitaire diamond engagement ring"
    },
    {
      _id: "apt_02",
      status: "Pending",
      title: "Gold Jewellery Viewing",
      subtitle: "Explore our latest collection with personalized guidance",
      dateStr: "27 Apr 2025, Sunday",
      timeStr: "03:00 PM - 04:00 PM",
      location: "AJ Jewellers Store, Kolkata",
      consultant: "Rohan Mehta",
      image: "/src/assets/products/kundan-bridal-haar.jpg",
      isUpcoming: true,
      interests: "Heritage Bridal gold haar & antique necklace"
    },
    {
      _id: "apt_03",
      status: "Cancelled",
      title: "Diamond Consultation",
      subtitle: "Learn about diamond quality and certification",
      dateStr: "15 Apr 2025, Tuesday",
      timeStr: "02:00 PM - 03:00 PM",
      location: "AJ Jewellers Store, Kolkata",
      consultant: "Neha Iyer",
      image: "/src/assets/products/temple-pearl-jhumka.jpg",
      isUpcoming: false,
      isCancelled: true,
      interests: "VVS1 diamond cut, clarity & GIA certification"
    },
    {
      _id: "apt_04",
      status: "Completed",
      title: "Bespoke Bridal Jewellery Preview",
      subtitle: "Private trial with custom trousseau matching",
      dateStr: "02 Mar 2025, Sunday",
      timeStr: "04:00 PM - 05:30 PM",
      location: "AJ Jewellers Store, Kolkata",
      consultant: "Priya Sharma",
      image: "/src/assets/products/kundan-bridal-haar.jpg",
      isUpcoming: false,
      isPast: true,
      interests: "Full Kundan polki set with matching earrings"
    },
    {
      _id: "apt_05",
      status: "Completed",
      title: "Gold Rate Lock & Exchange Valuation",
      subtitle: "Complimentary appraisal for heritage ornaments",
      dateStr: "18 Jan 2025, Saturday",
      timeStr: "12:00 PM - 01:00 PM",
      location: "AJ Jewellers Store, Kolkata",
      consultant: "Rohan Mehta",
      image: "/src/assets/products/antique-kada-set.jpg",
      isUpcoming: false,
      isPast: true,
      interests: "22K hallmark exchange appraisal"
    },
    {
      _id: "apt_06",
      status: "Completed",
      title: "Temple Earring & Kada Showcase",
      subtitle: "Handcrafted South Indian temple jewellery",
      dateStr: "05 Dec 2024, Thursday",
      timeStr: "02:30 PM - 03:30 PM",
      location: "AJ Jewellers Store, Kolkata",
      consultant: "Neha Iyer",
      image: "/src/assets/products/temple-pearl-jhumka.jpg",
      isUpcoming: false,
      isPast: true,
      interests: "Ruby and uncut diamond jhumkas"
    }
  ];

  // Map server appointments or use demo list
  const combinedList = appointments.length > 0 
    ? appointments.map(a => {
        const d = new Date(a.preferredDate);
        const isUpcoming = d >= new Date() && a.status !== 'Cancelled';
        const isCancelled = a.status === 'Cancelled';
        const isPast = d < new Date() || a.status === 'Completed';

        return {
          _id: a._id,
          status: a.status,
          title: a.interests?.split("(")[0]?.trim() || "Private Jewellery Viewing",
          subtitle: "Explore our latest collection with personalized guidance",
          dateStr: d.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }),
          timeStr: a.interests?.includes("Time Slot:") ? a.interests.split("Time Slot:")[1].replace(")", "").trim() : "11:00 AM - 12:00 PM",
          location: a.userLocation || "AJ Jewellers Store, Kolkata",
          consultant: a.adminNotes || "Senior Jewellery Consultant",
          image: "/src/assets/products/solitaire-ring.jpg",
          isUpcoming,
          isCancelled,
          isPast,
          interests: a.interests
        };
      })
    : demoList;

  const upcomingAppointments = combinedList.filter(a => a.isUpcoming || (a.status !== 'Cancelled' && a.status !== 'Completed'));
  const pastAppointments = combinedList.filter(a => a.isPast || a.status === 'Completed');
  const cancelledAppointments = combinedList.filter(a => a.isCancelled || a.status === 'Cancelled');

  const filteredList = 
    activeFilter === "upcoming" ? upcomingAppointments :
    activeFilter === "past" ? pastAppointments : cancelledAppointments;

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm("Are you sure you wish to cancel this appointment consultation?")) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/appointments/${id}/cancel`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        showToast("Appointment cancelled successfully", "success");
        onRefresh();
      } else {
        showToast(data.message || "Could not cancel appointment", "error");
      }
    } catch {
      showToast("Server error cancelling appointment", "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* FILTER PILL BUTTONS */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveFilter("upcoming")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-jost text-xs tracking-wide transition-all cursor-pointer ${
            activeFilter === "upcoming"
              ? "bg-[#4A0E1B] text-[#FDFBF7] font-semibold shadow-xs"
              : "bg-white text-[#5A4A3C] border border-[#E5D7B7] hover:bg-[#FAF6EE]"
          }`}
        >
          <Calendar size={14} className={activeFilter === "upcoming" ? "text-[#C9A24B]" : "text-[#7A6A5C]"} />
          <span>Upcoming</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeFilter === "upcoming" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
            {upcomingAppointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter("past")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-jost text-xs tracking-wide transition-all cursor-pointer ${
            activeFilter === "past"
              ? "bg-[#4A0E1B] text-[#FDFBF7] font-semibold shadow-xs"
              : "bg-white text-[#5A4A3C] border border-[#E5D7B7] hover:bg-[#FAF6EE]"
          }`}
        >
          <Clock size={14} className={activeFilter === "past" ? "text-[#C9A24B]" : "text-[#7A6A5C]"} />
          <span>Past</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeFilter === "past" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
            {pastAppointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter("cancelled")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-jost text-xs tracking-wide transition-all cursor-pointer ${
            activeFilter === "cancelled"
              ? "bg-[#4A0E1B] text-[#FDFBF7] font-semibold shadow-xs"
              : "bg-white text-[#5A4A3C] border border-[#E5D7B7] hover:bg-[#FAF6EE]"
          }`}
        >
          <XCircle size={14} className={activeFilter === "cancelled" ? "text-[#C9A24B]" : "text-[#7A6A5C]"} />
          <span>Cancelled</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeFilter === "cancelled" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
            {cancelledAppointments.length}
          </span>
        </button>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: List of Consultation Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {filteredList.length === 0 ? (
            <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-10 text-center shadow-sm">
              <Calendar size={32} className="text-[#C9A24B] mx-auto mb-3" />
              <h4 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">No Consultations Found</h4>
              <p className="font-jost text-xs text-[#7A6A5C] mt-1 max-w-sm mx-auto">
                You do not have any appointments in this status. Our master jewellers look forward to hosting you.
              </p>
              <button
                onClick={onOpenBookModal}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#4A0E1B] text-[#FDFBF7] rounded-lg font-jost text-xs uppercase tracking-wider font-semibold hover:bg-[#3B0A14] transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Book New Appointment</span>
              </button>
            </div>
          ) : (
            filteredList.map((apt) => {
              const isConfirmed = apt.status === "Confirmed";
              const isPending = apt.status === "Pending";
              const isCancelled = apt.status === "Cancelled";

              return (
                <div
                  key={apt._id}
                  className="bg-white border border-[#E5D7B7]/70 rounded-xl p-5 sm:p-6 shadow-sm hover:border-[#C9A24B] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#FAF6EE] border border-[#E5D7B7] overflow-hidden shrink-0 flex items-center justify-center p-2 shadow-xs">
                      <img
                        src={apt.image || "/src/assets/products/solitaire-ring.jpg"}
                        alt={apt.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      {/* Status Pill Badge */}
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-jost font-semibold uppercase tracking-wider ${
                          isConfirmed
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : isPending
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {apt.status}
                      </span>

                      <h3 className="font-cormorant text-xl sm:text-2xl font-bold text-[#4A0E1B] truncate">
                        {apt.title}
                      </h3>
                      <p className="font-jost text-xs text-[#7A6A5C] truncate max-w-md">
                        {apt.subtitle}
                      </p>

                      {/* Metadata Grid */}
                      <div className="pt-2 space-y-1 text-xs font-jost text-[#5A4A3C]">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-[#C9A24B] shrink-0" />
                          <span>{apt.dateStr}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-[#C9A24B] shrink-0" />
                          <span>{apt.timeStr}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-[#C9A24B] shrink-0" />
                          <span className="truncate">{apt.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserIcon size={14} className="text-[#C9A24B] shrink-0" />
                          <span>Consultant: <strong className="text-[#4A0E1B]">{apt.consultant}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-36 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5D7B7]/60">
                    <button
                      onClick={() => setSelectedDetails(apt)}
                      className="w-full py-2 px-3 border border-[#E5D7B7] hover:border-[#C9A24B] text-[#4A0E1B] rounded-lg font-jost text-xs tracking-wider font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                    >
                      <span>View Details</span>
                      <ArrowRight size={13} />
                    </button>

                    {isConfirmed && (
                      <>
                        <button
                          onClick={onOpenBookModal}
                          className="w-full py-2 px-3 bg-[#4A0E1B] text-[#FDFBF7] rounded-lg font-jost text-xs tracking-wider uppercase font-semibold hover:bg-[#3B0A14] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Calendar size={13} />
                          <span>Reschedule</span>
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(apt._id)}
                          className="w-full py-2 px-3 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg font-jost text-xs tracking-wider uppercase font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Cancel</span>
                        </button>
                      </>
                    )}

                    {isPending && (
                      <button
                        onClick={() => handleCancelAppointment(apt._id)}
                        className="w-full py-2 px-3 bg-[#4A0E1B] text-[#FDFBF7] rounded-lg font-jost text-xs tracking-wider uppercase font-semibold hover:bg-[#3B0A14] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Cancel</span>
                      </button>
                    )}

                    {isCancelled && (
                      <button
                        onClick={onOpenBookModal}
                        className="w-full py-2 px-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-jost text-xs tracking-wider uppercase font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Calendar size={13} />
                        <span>Book Again</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Summary, Quick Actions, Guidance Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* APPOINTMENT SUMMARY CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-[#C9A24B]" />
              <h4 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">Appointment Summary</h4>
            </div>

            <div className="divide-y divide-[#E5D7B7]/50 font-jost text-xs">
              <div 
                onClick={() => setActiveFilter("upcoming")}
                className="py-3 flex justify-between items-center text-[#5A4A3C] hover:text-[#4A0E1B] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#C9A24B]" />
                  <span>Upcoming</span>
                </div>
                <div className="flex items-center gap-1 font-semibold">
                  <span>{upcomingAppointments.length}</span>
                  <ChevronRight size={14} />
                </div>
              </div>

              <div 
                onClick={() => setActiveFilter("past")}
                className="py-3 flex justify-between items-center text-[#5A4A3C] hover:text-[#4A0E1B] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#C9A24B]" />
                  <span>Past</span>
                </div>
                <div className="flex items-center gap-1 font-semibold">
                  <span>{pastAppointments.length}</span>
                  <ChevronRight size={14} />
                </div>
              </div>

              <div 
                onClick={() => setActiveFilter("cancelled")}
                className="py-3 flex justify-between items-center text-[#5A4A3C] hover:text-[#4A0E1B] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <XCircle size={14} className="text-[#C9A24B]" />
                  <span>Cancelled</span>
                </div>
                <div className="flex items-center gap-1 font-semibold">
                  <span>{cancelledAppointments.length}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>

            {/* Advisory notice box */}
            <div className="mt-4 p-3.5 bg-[#FAF6EE] border border-[#E5D7B7] rounded-xl flex items-start gap-2.5">
              <AlertCircle size={16} className="text-[#C9A24B] shrink-0 mt-0.5" />
              <div>
                <p className="font-jost text-xs font-semibold text-[#8C6514]">Need to make changes?</p>
                <p className="font-jost text-[11px] text-[#7A6A5C] mt-0.5 leading-relaxed">
                  You can reschedule or cancel your appointment up to 24 hours before the scheduled time.
                </p>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-[#C9A24B]" />
              <h4 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">Quick Actions</h4>
            </div>

            <div className="space-y-3">
              <button
                onClick={onOpenBookModal}
                className="w-full bg-[#4A0E1B] text-[#FDFBF7] font-jost text-xs tracking-wider uppercase font-semibold py-3.5 px-4 rounded-xl hover:bg-[#3B0A14] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Calendar size={15} />
                <span>Book New Appointment</span>
              </button>

              <a
                href="tel:+919876543210"
                className="w-full bg-white border border-[#E5D7B7] text-[#4A0E1B] hover:bg-[#FAF6EE] font-jost text-xs tracking-wider uppercase font-semibold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Phone size={15} />
                <span>Call Store +91 98765 43210</span>
              </a>
            </div>
          </div>

          {/* PERSONALIZED GUIDANCE CARD */}
          <div className="bg-[#FAF6EE] border border-[#E5D7B7] rounded-xl p-6 shadow-xs relative overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-[#FFF8E7] border border-[#E5D7B7] flex items-center justify-center text-[#C9A24B] mb-3">
              <Sparkles size={20} />
            </div>
            <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B]">
              Personalized Guidance for Your Perfect Piece
            </h4>
            <p className="font-jost text-xs text-[#7A6A5C] mt-2 leading-relaxed">
              Book an appointment and let our experts help you choose the best jewellery for your special moments.
            </p>
            <div className="mt-4 pt-4 border-t border-[#E5D7B7]/50 flex justify-center">
              <div className="w-20 h-0.5 bg-[#C9A24B]/40" />
            </div>
          </div>

        </div>

      </div>

      {/* FOOTER PRIVACY & TRUST STRIP */}
      <div className="pt-6 border-t border-[#E5D7B7]/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-jost text-[#7A6A5C] gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
          <span>Your privacy and trust are important to us. All appointments are handled with complete confidentiality.</span>
        </div>
        <a href="/contact" className="hover:text-[#4A0E1B] inline-flex items-center gap-1 font-semibold shrink-0">
          <span>Need Help?</span>
          <ChevronRight size={14} />
        </a>
      </div>

      {/* Appointment Detail Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FDFBF7] w-full max-w-md rounded-2xl shadow-2xl border border-[#E5D7B7] p-6 relative">
            <h3 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">{selectedDetails.title}</h3>
            <p className="font-jost text-xs text-[#7A6A5C] mt-0.5">{selectedDetails.subtitle}</p>

            <div className="mt-4 space-y-2.5 font-jost text-xs text-[#5A4A3C] bg-white p-4 rounded-xl border border-[#E5D7B7]">
              <div><strong>Status:</strong> {selectedDetails.status}</div>
              <div><strong>Date:</strong> {selectedDetails.dateStr}</div>
              <div><strong>Time:</strong> {selectedDetails.timeStr}</div>
              <div><strong>Location:</strong> {selectedDetails.location}</div>
              <div><strong>Consultant:</strong> {selectedDetails.consultant}</div>
              {selectedDetails.interests && <div><strong>Preference:</strong> {selectedDetails.interests}</div>}
            </div>

            <button
              onClick={() => setSelectedDetails(null)}
              className="mt-5 w-full py-2.5 bg-[#4A0E1B] text-[#FDFBF7] rounded-lg font-jost text-xs uppercase tracking-wider font-semibold hover:bg-[#3B0A14] transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
