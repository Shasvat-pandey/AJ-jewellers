import React, { useState } from "react";
import { HelpCircle, ChevronDown, ShieldCheck, CreditCard, Sparkles } from "lucide-react";

const FAQS = [
  {
    q: "How do I pay for my order if there are no online gateways like Razorpay?",
    a: "AJ Jewellers supports two transparent, secure payment methods: (1) Cash settlement upon in-store pickup or cash on delivery where available, or (2) Direct Bank Transfer (NEFT/IMPS) or UPI via your preferred banking app (Google Pay, PhonePe, Paytm). After placing your order, remit the payable total to our official bank account and an administrator will verify the receipt and confirm your payment."
  },
  {
    q: "Is all your jewellery certified and hallmarked?",
    a: "Yes. Every single gold and silver ornament crafted at AJ Jewellers carries the official BIS Hallmarking emblem with unique 6-digit HUID (Hallmark Unique Identification). Diamond pieces are independently certified by IGI or GIA."
  },
  {
    q: "How does the 15-Minute Gold Rate Lock work?",
    a: "When you browse our catalogue, you can lock the live bullion market rate for 15 minutes. If you complete checkout within this window, your order price is preserved regardless of market spikes."
  },
  {
    q: "How can I book a private viewing or bridal consultation?",
    a: "Navigate to our 'Visit Us' page or click 'Book Appointment' to request a private viewing slot with our master design consultants. Our concierge will contact you to curate a bespoke viewing experience."
  },
  {
    q: "How do I download my official tax invoice?",
    a: "Once your order is placed, an automated order confirmation email with your PDF invoice is sent to your registered address. You can also download high-resolution invoices directly from your client account dashboard under 'Order History'."
  }
];

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-6 md:px-16 max-w-4xl mx-auto font-jost text-[#4A0E1B]">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A24B] font-semibold mb-2">CLIENT CONCIERGE</p>
        <h1 className="font-cormorant text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
        <div className="w-16 h-0.5 bg-[#C9A24B] mx-auto"></div>
        <p className="text-xs text-[#7A6A5C] mt-3">Essential insights on bespoke crafting, payments, hallmarking, and delivery</p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="bg-white border border-[#C9A24B]/30 rounded-sm shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-[#FDFBF4] transition-colors cursor-pointer"
              >
                <span className="font-cormorant text-lg md:text-xl font-bold text-[#4A0E1B]">{faq.q}</span>
                <ChevronDown size={18} className={`text-[#C9A24B] transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-[#7A6A5C] leading-relaxed border-t border-gray-100 animate-in fade-in duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
