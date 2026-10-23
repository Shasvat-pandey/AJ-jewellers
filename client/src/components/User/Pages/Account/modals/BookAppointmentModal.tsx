import React, { useState } from "react";
import { X, Calendar, Clock, MapPin, Sparkles, Send } from "lucide-react";
import { User } from "../../../../Common/context/AuthContext";
import { useToast } from "../../../../Common/context/ToastContext";
import { API_URL, getAuthToken } from "../../../../../utils/api";

interface BookAppointmentModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    customerName: user.name || "",
    phone: user.phone || "",
    userLocation: "AJ Jewellers Store, Kolkata",
    preferredDate: "",
    timeSlot: "11:00 AM - 12:00 PM",
    interests: "Custom Ring Consultation & Diamond Viewing",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.preferredDate) {
      showToast("Please choose your preferred date", "error");
      return;
    }
    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          customerName: formData.customerName,
          phone: formData.phone,
          userLocation: formData.userLocation,
          preferredDate: formData.preferredDate,
          interests: `${formData.interests} (Time Slot: ${formData.timeSlot})`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Consultation appointment booked successfully! Our concierge will contact you.", "success");
        onSuccess();
        onClose();
      } else {
        showToast(data.message || "Failed to book appointment", "error");
      }
    } catch (err) {
      console.error("Booking error:", err);
      showToast("Error submitting appointment request", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FDFBF7] w-full max-w-lg rounded-2xl shadow-2xl border border-[#E5D7B7] overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E5D7B7] flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">Book Private Consultation</h3>
            <p className="font-jost text-xs text-[#7A6A5C]">
              Personalized guidance with our master artisans &amp; gemologists
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A6A5C] hover:text-[#4A0E1B] p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full bg-white border border-[#E5D7B7] px-3.5 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B]"
            />
          </div>

          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              Contact Phone (10 digits)
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
              placeholder="9876543210"
              className="w-full bg-white border border-[#E5D7B7] px-3.5 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B]"
            />
          </div>

          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              Store Destination / Location
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-3.5 text-[#C9A24B]" />
              <input
                type="text"
                required
                value={formData.userLocation}
                onChange={(e) => setFormData({ ...formData, userLocation: e.target.value })}
                className="w-full bg-white border border-[#E5D7B7] pl-10 pr-4 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
                Preferred Date
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-3.5 text-[#C9A24B]" />
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full bg-white border border-[#E5D7B7] pl-10 pr-3 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B] cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
                Preferred Time Slot
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3.5 top-3.5 text-[#C9A24B]" />
                <select
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  className="w-full bg-white border border-[#E5D7B7] pl-10 pr-3 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B] cursor-pointer"
                >
                  <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                  <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option>
                  <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                  <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                  <option value="06:30 PM - 07:30 PM">06:30 PM - 07:30 PM</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              Consultation Interest / Details
            </label>
            <textarea
              rows={2}
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              placeholder="e.g. Custom Ring Consultation, Bridal Haar, Diamond Certification"
              className="w-full bg-white border border-[#E5D7B7] p-3 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B] resize-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-[#E5D7B7] text-[#5A4A3C] font-jost text-xs tracking-wider uppercase rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-[#4A0E1B] text-[#FDFBF7] font-jost text-xs tracking-wider uppercase font-semibold rounded-lg hover:bg-[#3B0A14] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
            >
              {isSubmitting ? "Booking..." : <><Send size={15} /> Confirm Booking</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
