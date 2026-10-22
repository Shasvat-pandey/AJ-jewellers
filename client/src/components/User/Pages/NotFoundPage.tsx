import React from "react";
import { Link } from "react-router-dom";
import { Gem, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="bg-[#FDFBF4] min-h-[75vh] flex flex-col items-center justify-center px-6 text-center font-jost text-[#4A0E1B]">
      <div className="w-16 h-16 rounded-full bg-[#4A0E1B] text-[#C9A24B] flex items-center justify-center mb-6 shadow-md">
        <Gem size={32} />
      </div>
      <p className="text-xs uppercase tracking-[0.25em] text-[#C9A24B] font-semibold mb-2">404 — PAGE NOT FOUND</p>
      <h1 className="font-cormorant text-4xl md:text-5xl font-bold mb-4">A Treasured Page Has Moved</h1>
      <p className="text-sm text-[#7A6A5C] max-w-md mx-auto mb-8 leading-relaxed">
        The destination you are seeking cannot be located in our archives. Perhaps it has been recrafted or relocated.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-[#4A0E1B] text-[#FDFBF4] px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold rounded-sm hover:bg-[#380A14] transition-colors shadow-sm"
      >
        <ArrowLeft size={14} />
        Return to Boutique
      </Link>
    </div>
  );
}
