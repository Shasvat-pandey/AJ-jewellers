import { useState } from "react";
import { X, Star, Upload } from "lucide-react";
import { useAuth, getAuthHeaders } from "../../../../components/Common/context/AuthContext";
import { useToast } from "../../../../components/Common/context/ToastContext";
import { API_URL } from "../../../../utils/api";

interface ReviewModalProps {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ productId, onClose, onSuccess }: ReviewModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + selectedFiles.length > 3) {
        showToast("Maximum 3 photos allowed", "error");
        return;
      }
      setImages((prev) => [...prev, ...selectedFiles].slice(0, 3));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Please log in to leave a review.", "error");
      return;
    }

    if (!rating) {
      showToast("Please provide a rating.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("product", productId);
      formData.append("rating", rating.toString());
      formData.append("comment", comment);

      images.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        showToast("Review submitted successfully! It will appear after approval.", "success");
        onSuccess();
        onClose();
      } else {
        showToast(data.message || "Failed to submit review", "error");
      }
    } catch (error) {
      console.error("Submit review error:", error);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#FDFBF4] w-full max-w-lg rounded-sm shadow-2xl border border-[#C9A24B]/30 relative text-left">
        <div className="flex justify-between items-center p-5 border-b border-[#C9A24B]/20">
          <h2 className="font-cormorant text-2xl text-[#4A0E1B]">Write a Review</h2>
          <button onClick={onClose} className="text-[#7A6A5C] hover:text-red-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Rating */}
          <div>
            <label className="block font-jost text-xs uppercase tracking-widest text-[#7A6A5C] mb-2">Rating</label>
            <div className="flex gap-1 cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={28}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`transition-colors ${(hoverRating || rating) >= star ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                />
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block font-jost text-xs uppercase tracking-widest text-[#7A6A5C] mb-2">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={4}
              className="w-full border border-[#C9A24B]/30 rounded-sm p-3 focus:outline-none focus:border-[#C9A24B] bg-white text-sm text-[#4A0E1B]"
            ></textarea>
          </div>

          {/* Photos */}
          <div>
            <label className="block font-jost text-xs uppercase tracking-widest text-[#7A6A5C] mb-2">Photos (Max 3)</label>
            <div className="flex flex-wrap gap-3 mb-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 border border-[#C9A24B]/30 rounded-sm overflow-hidden">
                  <img src={URL.createObjectURL(img)} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full hover:bg-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="w-20 h-20 border border-dashed border-[#C9A24B] rounded-sm flex flex-col items-center justify-center text-[#C9A24B] cursor-pointer hover:bg-[#C9A24B]/5 transition-colors">
                  <Upload size={20} className="mb-1" />
                  <span className="text-[10px] tracking-wider uppercase">Upload</span>
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                    multiple
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#4A0E1B] text-[#C9A24B] py-3 uppercase tracking-[0.2em] text-xs font-semibold hover:bg-[#2A0A10] transition-colors rounded-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
