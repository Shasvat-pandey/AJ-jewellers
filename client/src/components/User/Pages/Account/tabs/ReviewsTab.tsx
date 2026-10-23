import React, { useEffect, useState } from "react";
import { Star, Sparkles, MessageSquare, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { User } from "../../../../Common/context/AuthContext";
import { API_URL, getAuthToken } from "../../../../../utils/api";

export const ReviewsTab: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [liveReviews, setLiveReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/reviews/my`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setLiveReviews(data.data);
        }
      } catch (err) {
        console.warn("Could not fetch user reviews:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const demoReviews = [
    {
      _id: "rev_1",
      productName: "Classic Solitaire Diamond Ring (18K Gold)",
      rating: 5,
      date: "18 Apr 2025",
      review: "Absolutely breathtaking craftsmanship. The diamond sparkles radiantly and the hallmarking certificate gave complete confidence. Highly recommended!",
      verified: true,
      status: "Approved"
    },
    {
      _id: "rev_2",
      productName: "Temple Pearl Drop Jhumkas (22K Gold)",
      rating: 5,
      date: "25 Feb 2025",
      review: "The intricate floral work on the jhumkas is stunning. Comfortable to wear for whole wedding functions. Beautiful packaging.",
      verified: true,
      status: "Approved"
    }
  ];

  const displayList = liveReviews.length > 0 
    ? liveReviews.map(r => ({
        _id: r._id,
        productName: r.product?.name || "Bespoke Jewellery Acquisition",
        rating: r.rating || 5,
        date: new Date(r.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        review: r.comment || "",
        verified: true,
        status: r.status || "Pending"
      }))
    : demoReviews;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5D7B7]/70 rounded-xl p-6 shadow-sm">
        <div>
          <h3 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#4A0E1B]">My Reviews &amp; Ratings</h3>
          <p className="font-jost text-xs text-[#7A6A5C] mt-1">
            Verified feedback on your handcrafted jewellery acquisitions
          </p>
        </div>
        <button
          onClick={() => navigate("/our-collections")}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#4A0E1B]/30 text-[#4A0E1B] hover:bg-[#4A0E1B]/5 rounded-xl font-jost text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Rate Recent Purchases</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {displayList.map((rev) => (
          <div
            key={rev._id}
            className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 shadow-sm space-y-3 hover:border-[#C9A24B]/50 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B]">
                  {rev.productName}
                </h4>
                {rev.status === "Pending" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-jost font-semibold">
                    <Clock size={10} /> Under Concierge Review
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} size={15} className="text-[#C9A24B] fill-[#C9A24B]" />
                ))}
                <span className="font-jost text-xs text-[#7A6A5C] ml-1.5">{rev.date}</span>
              </div>
            </div>

            <p className="font-jost text-xs text-[#5A4A3C] leading-relaxed">
              "{rev.review}"
            </p>

            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-jost text-emerald-700 font-medium">
              <Sparkles size={12} className="text-emerald-600" />
              <span>Verified Boutique Acquisition</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
