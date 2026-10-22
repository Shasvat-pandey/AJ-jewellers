import { useState, useEffect } from "react";
import { Star, CheckCircle, XCircle, Trash2, X } from "lucide-react";
import { useAuth, getAuthHeaders } from "../../Common/context/AuthContext";
import { getImageUrl } from "../../../utils/imageUrl";
import { API_URL, API_BASE } from "../../../utils/api";

export default function ReviewsView() {
  const { user: adminUser } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/reviews`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchReviews();
    }
  }, [adminUser]);

  const handleUpdateStatus = async (reviewId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === reviewId ? data.data : r))
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      }
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        size={14}
        className={i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
      />
    ));
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-6 md:mb-10">
        <h1 className="font-cormorant text-3xl sm:text-4xl text-[#4A0E1B] mb-2">Customer Reviews</h1>
        <p className="text-[#7A6A5C] text-sm">Moderate product reviews and ratings.</p>
      </header>

      <div className="bg-white border border-[#C9A24B]/30 shadow-sm rounded-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-[#FDFBF4] text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase border-b border-[#C9A24B]/20">
                <th className="p-4 font-semibold">Product</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Rating</th>
                <th className="p-4 font-semibold">Comment</th>
                <th className="p-4 font-semibold">Photos</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#7A6A5C]">Loading reviews...</td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#7A6A5C]">No reviews found.</td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review._id} className="border-b border-[#C9A24B]/10 hover:bg-[#FDFBF4]/50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-[#4A0E1B]">{review.product?.name || "Unknown Product"}</p>
                      <p className="text-[10px] text-[#7A6A5C]">SKU: {review.product?.sku || "N/A"}</p>
                    </td>
                    <td className="p-4 text-[#4A0E1B]">
                      <p>{review.user?.name || "Unknown User"}</p>
                      <p className="text-[10px] text-[#7A6A5C]">{review.user?.email}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                    </td>
                    <td className="p-4 max-w-[200px]">
                      <p className="truncate text-[#4A0E1B]" title={review.comment}>{review.comment || "-"}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {review.images && review.images.length > 0 ? (
                          review.images.map((img: any, idx: number) => (
                            <div
                              key={idx}
                              className="w-10 h-10 border border-[#C9A24B]/20 rounded-sm overflow-hidden cursor-pointer hover:border-[#C9A24B]"
                              onClick={() => setSelectedImage(`${API_BASE}${img.original}`)}
                            >
                              <img
                                src={`${API_BASE}${img.thumbnail || img.original}`}
                                alt="Review"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-[#7A6A5C]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] tracking-wider uppercase font-semibold border rounded-sm ${review.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                        review.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {review.status !== 'Approved' && (
                          <button
                            onClick={() => handleUpdateStatus(review._id, 'Approved')}
                            className="text-green-600 hover:text-green-800 transition-colors p-1"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {review.status !== 'Rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(review._id, 'Rejected')}
                            className="text-orange-500 hover:text-orange-700 transition-colors p-1"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review._id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex justify-center">
            <button
              className="absolute -top-12 right-0 text-white hover:text-[#C9A24B] transition-colors bg-black/50 p-2 rounded-full"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt="Full size review"
              className="max-w-full max-h-[90vh] object-contain rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
