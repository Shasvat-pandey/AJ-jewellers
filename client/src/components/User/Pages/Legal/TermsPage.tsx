import React from "react";
import { Scale, CheckCircle, AlertTriangle, Shield } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-6 md:px-16 max-w-4xl mx-auto font-jost text-[#4A0E1B]">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A24B] font-semibold mb-2">AJ JEWELLERS LEGAL</p>
        <h1 className="font-cormorant text-4xl md:text-5xl font-bold mb-4">Terms &amp; Conditions of Sale</h1>
        <div className="w-16 h-0.5 bg-[#C9A24B] mx-auto"></div>
        <p className="text-xs text-[#7A6A5C] mt-3">Effective Date: October 2026</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-[#2A0A10]">
        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <Scale size={20} className="text-[#C9A24B]" />
            1. Preamble &amp; Agreement to Terms
          </h2>
          <p>
            Welcome to AJ Jewellers. By accessing our services, creating an account, or placing an order, you agree to abide by these Terms and Conditions. All pieces created and offered by AJ Jewellers adhere to BIS Hallmarking standards (IS 1417:2019).
          </p>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <CheckCircle size={20} className="text-[#C9A24B]" />
            2. Payment Terms (Cash &amp; External Bank Settlement)
          </h2>
          <p>
            In accordance with our bespoke retail framework, AJ Jewellers does not process transactions via automated third-party payment gateways. Supported payment arrangements are strictly:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#7A6A5C]">
            <li><strong>Cash Settlement:</strong> Cash on delivery or cash paid in-store upon boutique collection. An order is recorded as <em>Pending</em> and confirmed as <em>Paid</em> only when physically received and certified by an authorized store officer.</li>
            <li><strong>Bank Transfer / External UPI:</strong> Direct IMPS/NEFT/RTGS transfer to the official bank account of AJ Jewellers or via official merchant UPI ID. The customer must remit funds independently, and our administrator confirms payment after verifying credit in the bank statement.</li>
          </ul>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <AlertTriangle size={20} className="text-[#C9A24B]" />
            3. Dynamic Gold Rates &amp; Rate Lock Protocol
          </h2>
          <p>
            Gold, silver, and diamond market prices fluctuate continuously. AJ Jewellers provides a 15-minute Gold Rate Lock feature. If an order is submitted after the lock expires, the order total will be recalculated based on the server-authoritative prevailing market rate.
          </p>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <Shield size={20} className="text-[#C9A24B]" />
            4. Invoicing &amp; Proof of Authenticity
          </h2>
          <p>
            Every completed transaction is accompanied by an official Tax Invoice and Certificate of Authenticity. An invoice marked <em>Payment Pending</em> serves strictly as an order acknowledgement and does not constitute proof of payment.
          </p>
        </section>
      </div>
    </div>
  );
}
