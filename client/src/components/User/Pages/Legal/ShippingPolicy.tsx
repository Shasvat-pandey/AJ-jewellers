import React from "react";
import { Truck, ShieldCheck, Clock, MapPin } from "lucide-react";

export default function ShippingPolicy() {
  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-6 md:px-16 max-w-4xl mx-auto font-jost text-[#4A0E1B]">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A24B] font-semibold mb-2">AJ JEWELLERS LOGISTICS</p>
        <h1 className="font-cormorant text-4xl md:text-5xl font-bold mb-4">Insured Shipping &amp; Delivery Policy</h1>
        <div className="w-16 h-0.5 bg-[#C9A24B] mx-auto"></div>
        <p className="text-xs text-[#7A6A5C] mt-3">Complimentary fully-insured express transit across India</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-[#2A0A10]">
        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <Truck size={20} className="text-[#C9A24B]" />
            1. Armored &amp; Insured Transit
          </h2>
          <p>
            Due to the exceptional value of our handcrafted fine jewellery, every shipment is dispatched through dedicated armored courier partners (including BVC Logistics and Sequel Logistics). Every package is 100% insured until the moment of handover.
          </p>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <Clock size={20} className="text-[#C9A24B]" />
            2. Dispatch &amp; Delivery Timelines
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-[#7A6A5C]">
            <li><strong>Ready-to-Ship Pieces:</strong> Dispatched within 24–48 hours of order confirmation or payment verification. Transit takes 2–4 business days across major metros.</li>
            <li><strong>Bespoke &amp; Custom Sized Creations:</strong> Crafted to individual perfection within 7–14 business days prior to armored transit.</li>
          </ul>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#C9A24B]" />
            3. Identity Verification at Handover
          </h2>
          <p>
            To guarantee security, high-value deliveries require government-issued photo identification (Aadhaar, Passport, or PAN) matching the name on the order, along with a secure OTP verification during physical delivery.
          </p>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <MapPin size={20} className="text-[#C9A24B]" />
            4. In-Boutique Pickup Option
          </h2>
          <p>
            Patrons may also elect to collect their orders directly at our Heritage Boutique in Kolkata, where our master jeweller provides personalized fitting and complimentary gemstone inspection.
          </p>
        </section>
      </div>
    </div>
  );
}
