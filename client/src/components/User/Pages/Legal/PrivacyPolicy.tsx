import React from "react";
import { Shield, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-6 md:px-16 max-w-4xl mx-auto font-jost text-[#4A0E1B]">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A24B] font-semibold mb-2">AJ JEWELLERS LEGAL</p>
        <h1 className="font-cormorant text-4xl md:text-5xl font-bold mb-4">Privacy &amp; Data Protection Policy</h1>
        <div className="w-16 h-0.5 bg-[#C9A24B] mx-auto"></div>
        <p className="text-xs text-[#7A6A5C] mt-3">Last Updated: October 2026</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-[#2A0A10]">
        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <Shield size={20} className="text-[#C9A24B]" />
            1. Commitment to Client Confidentiality
          </h2>
          <p>
            At AJ Jewellers, we hold the privacy and discretion of our patrons in the highest esteem. This Privacy Policy delineates how we collect, safeguard, and utilize personal information gathered through our boutique interactions, bespoke appointments, and digital portal.
          </p>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <Lock size={20} className="text-[#C9A24B]" />
            2. Information We Collect
          </h2>
          <p>We only collect information strictly requisite for fulfilling artisanal orders, scheduling private boutique viewings, and statutory compliance under Indian jewellery regulations:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#7A6A5C]">
            <li><strong>Identity &amp; Contact:</strong> Full name, telephone number, and email address for order receipts and certificate dispatches.</li>
            <li><strong>Delivery Particulars:</strong> Delivery address, city, state, pincode, and optional geospatial coordinates for armored courier delivery.</li>
            <li><strong>Payment Information:</strong> For Bank Transfers and UPI transactions, we collect external reference IDs (UTR numbers) and administrator-verified receipts. We do <strong>not</strong> collect or store credit card numbers, CVVs, or net banking passwords.</li>
            <li><strong>Statutory PAN/GSTIN:</strong> As mandated by the Government of India for high-value precious metals transactions exceeding ₹2,00,000.</li>
          </ul>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <Eye size={20} className="text-[#C9A24B]" />
            3. Storage &amp; Security Controls
          </h2>
          <p>
            Your information is stored in hardened, encrypted databases with strict role-based access control. Payment evidence files are maintained in private, authenticated storage accessible exclusively by vetted administrative personnel for financial reconciliation.
          </p>
        </section>

        <section className="bg-white p-6 border border-[#C9A24B]/30 rounded-sm shadow-sm space-y-3">
          <h2 className="font-cormorant text-2xl font-bold text-[#4A0E1B] flex items-center gap-2">
            <FileText size={20} className="text-[#C9A24B]" />
            4. Contacting Our Data Privacy Officer
          </h2>
          <p>
            For privacy inquiries, data rectification, or access requests, reach our compliance desk at{" "}
            <a href="mailto:privacy@ajjewellers.in" className="text-[#C9A24B] underline font-medium">
              privacy@ajjewellers.in
            </a>{" "}
            or visit our Flagship Heritage Boutique.
          </p>
        </section>
      </div>
    </div>
  );
}
