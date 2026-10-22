import React from "react";
import { RefreshCw, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-6 md:px-16 max-w-4xl mx-auto font-jost text-[#4A0E1B]">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A24B] font-semibold mb-2">AJ JEWELLERS ASSURANCE</p>
        <h1 className="font-cormorant text-4xl md:text-5xl font-bold mb-4">Refund, Exchange &amp; Cancellation Policy</h1>
        <div className="w-16 h-0.5 bg-[#C9A24B] mx-auto"></div>
        <p className="text-xs text-[#7A6A5C] mt-3">Transparent guidelines for artisanal returns, lifetime exchanges, and order cancellations</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-[#2A0A10]">
        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <RefreshCw size={20} className="text-[#C9A24B]" />
            1. 7-Day Return &amp; Resizing Guarantee
          </h2>
          <p>
            We take immense pride in every jewel we craft. If you are not entirely delighted with your ready-to-wear piece, you may request a return or complimentary resizing within 7 days of delivery through your client dashboard or by contacting our concierge.
          </p>
          <p className="text-[#7A6A5C] text-xs">
            * Items must be in un-worn, pristine condition with original security tags, tamper-evident seals intact, and accompanied by the original Tax Invoice and BIS Hallmarking certificate.
          </p>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <AlertCircle size={20} className="text-[#C9A24B]" />
            2. Cancellation Policy &amp; Inventory Handling
          </h2>
          <p>
            Orders can be cancelled prior to dispatch. When an unpaid or pending order is cancelled:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#7A6A5C]">
            <li>Stock allocation is automatically restored to the catalogue inventory.</li>
            <li>No cancellation fee applies for standard collections.</li>
            <li>For customized or engraved items, cancellations requested after metal casting commences are subject to making charges incurred.</li>
          </ul>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <CheckCircle size={20} className="text-[#C9A24B]" />
            3. Refund Settlement Process
          </h2>
          <p>
            Because online gateway payments have been decommissioned, verified refunds for returned pieces are executed via direct bank wire transfer (NEFT/RTGS) to the customer’s verified bank account after physical laboratory inspection and quality assessment. Cash refunds above ₹10,000 are not permitted under Indian income tax regulations.
          </p>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <Sparkles size={20} className="text-[#C9A24B]" />
            4. Lifetime Buyback &amp; Exchange
          </h2>
          <p>
            All AJ Jewellers gold and diamond pieces carry a lifetime exchange promise based on the prevailing benchmark gold rate at the date of presentation, minus nominal melting/refining charges.
          </p>
        </section>
      </div>
    </div>
  );
}
