import React, { useState } from "react";
import { X, Save, User as UserIcon, Mail, Phone, Calendar, CheckCircle2 } from "lucide-react";
import { User } from "../../../../Common/context/AuthContext";
import { useToast } from "../../../../Common/context/ToastContext";
import { API_URL, getAuthToken } from "../../../../../utils/api";

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    dob: user.dob || "2004-01-12",
    gender: user.gender || "Male",
  });
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        dob: user.dob || "2004-01-12",
        gender: user.gender || "Male",
      });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success && data.data) {
        showToast("Profile details updated successfully", "success");
        onSuccess(data.data);
        onClose();
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      showToast("Error updating profile. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FDFBF7] w-full max-w-lg rounded-2xl shadow-2xl border border-[#E5D7B7] overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E5D7B7] flex justify-between items-center">
          <div>
            <h3 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">Edit Profile Details</h3>
            <p className="font-jost text-xs text-[#7A6A5C]">Update your personal information</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A6A5C] hover:text-[#4A0E1B] p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3.5 top-3.5 text-[#C9A24B]" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border border-[#E5D7B7] pl-10 pr-4 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B] focus:ring-1 focus:ring-[#C9A24B]"
              />
            </div>
          </div>

          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-[#7A6A5C]" />
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-gray-100 border border-gray-200 pl-10 pr-4 py-2.5 rounded-lg text-sm font-jost text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] font-jost text-[#7A6A5C] mt-1">Email address cannot be changed directly.</p>
          </div>

          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3.5 text-[#C9A24B]" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-white border border-[#E5D7B7] pl-10 pr-4 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B] focus:ring-1 focus:ring-[#C9A24B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-3.5 text-[#C9A24B]" />
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full bg-white border border-[#E5D7B7] pl-10 pr-3 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B] cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-white border border-[#E5D7B7] px-3.5 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B] cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary / Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-[#E5D7B7] text-[#5A4A3C] font-jost text-xs tracking-wider uppercase rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-[#4A0E1B] text-[#FDFBF7] font-jost text-xs tracking-wider uppercase font-semibold rounded-lg hover:bg-[#3B0A14] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
