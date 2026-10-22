import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, Loader2 } from "lucide-react";
import { useToast } from "../../../Common/context/ToastContext";
import { API_URL } from "../../../../utils/api";

export default function ContactPage() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      showToast("Please fill in your name, email, and message.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/users/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.phone ? `Phone: ${formData.phone.trim()}\n\n${formData.message.trim()}` : formData.message.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast("Thank you for reaching out! Our concierge will contact you shortly.", "success");
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        showToast(data.message || "Failed to deliver message. Please try calling directly.", "error");
      }
    } catch (err) {
      console.error("Contact form error:", err);
      showToast("Network error. Please try again or reach us via phone.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-6 md:px-16 max-w-5xl mx-auto font-jost text-[#4A0E1B]">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A24B] font-semibold mb-2">AJ JEWELLERS</p>
        <h1 className="font-cormorant text-4xl md:text-5xl font-bold mb-4">Contact Our Concierge</h1>
        <div className="w-16 h-0.5 bg-[#C9A24B] mx-auto"></div>
        <p className="text-xs text-[#7A6A5C] mt-3">We are delighted to assist with custom commissions, appointments, and valuations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-4">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <MapPin size={20} className="text-[#C9A24B]" />
            Heritage Boutique
          </h2>
          <p className="text-sm text-[#7A6A5C] leading-relaxed">
            AJ Jewellers Flagship Store<br />
            123 Heritage Lane, Bowbazar<br />
            Kolkata, West Bengal — 700012, India
          </p>
          <div className="pt-2 border-t border-gray-100 space-y-2 text-xs text-[#7A6A5C]">
            <p className="flex items-center gap-2"><Clock size={14} className="text-[#C9A24B]" /> Monday – Saturday: 11:00 AM – 8:00 PM</p>
            <p className="flex items-center gap-2"><Clock size={14} className="text-[#C9A24B]" /> Sunday: Private Appointments Only</p>
          </div>
        </div>

        <div className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-4">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <Phone size={20} className="text-[#C9A24B]" />
            Direct Communication
          </h2>
          <div className="space-y-3 text-sm text-[#7A6A5C]">
            <p className="flex items-center gap-2">
              <Phone size={16} className="text-[#C9A24B]" />
              <span>Concierge Desk: <strong>+91 98765 43210</strong></span>
            </p>
            <p className="flex items-center gap-2">
              <Mail size={16} className="text-[#C9A24B]" />
              <span>Email: <strong>care@ajjewellers.in</strong></span>
            </p>
            <p className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#C9A24B]" />
              <span>WhatsApp: <strong>+91 98765 43210</strong></span>
            </p>
          </div>
        </div>
      </div>

      {/* --- INTERACTIVE CONCIERGE MESSAGE FORM --- */}
      <div className="bg-white p-8 md:p-10 border border-[#C9A24B]/30 rounded-sm shadow-sm">
        <div className="mb-6">
          <h2 className="font-cormorant text-3xl font-bold text-[#4A0E1B] mb-2">Send a Message</h2>
          <p className="text-xs text-[#7A6A5C]">
            Have a custom jewellery design query, gold exchange inquiry, or valuation request? Leave a message below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-2 font-semibold">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Radhika Sharma"
                className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 text-sm text-[#4A0E1B] outline-none focus:border-[#C9A24B] rounded-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-2 font-semibold">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. radhika@example.com"
                className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 text-sm text-[#4A0E1B] outline-none focus:border-[#C9A24B] rounded-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-2 font-semibold">
              Mobile Number (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              maxLength={10}
              placeholder="e.g. 9876543210"
              className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 text-sm text-[#4A0E1B] outline-none focus:border-[#C9A24B] rounded-sm transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-2 font-semibold">
              Message or Inquiry Details *
            </label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please describe the jewellery piece, karat requirement, design concept, or question..."
              className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 text-sm text-[#4A0E1B] outline-none focus:border-[#C9A24B] rounded-sm transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#4A0E1B] text-[#F3E9D8] font-jost text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#3B0A14] transition-colors rounded-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Sending to Concierge...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Transmit Message</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
