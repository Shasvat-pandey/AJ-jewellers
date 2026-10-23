import React, { useState, useEffect } from "react";
import { X, MapPin, Save, Home, Building, Map } from "lucide-react";
import { User } from "../../../../Common/context/AuthContext";
import { useToast } from "../../../../Common/context/ToastContext";
import { API_URL, getAuthToken } from "../../../../../utils/api";

export interface AddressItem {
  _id?: string;
  tag: string;
  isDefault: boolean;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}

interface AddressModalProps {
  user: User;
  isOpen: boolean;
  editingAddress?: AddressItem | null;
  onClose: () => void;
  onSuccess: (updatedAddresses: AddressItem[]) => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  user,
  isOpen,
  editingAddress,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<AddressItem>({
    tag: "Home",
    isDefault: false,
    name: user.name || "",
    phone: user.phone || "",
    addressLine: "",
    city: user.city || "Bengaluru",
    state: user.state || "Karnataka",
    pincode: user.pincode || "560001",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingAddress) {
      setFormData(editingAddress);
    } else {
      setFormData({
        tag: "Home",
        isDefault: !user.addresses || user.addresses.length === 0,
        name: user.name || "",
        phone: user.phone || "",
        addressLine: user.address || "",
        city: user.city || "Bengaluru",
        state: user.state || "Karnataka",
        pincode: user.pincode || "560001",
      });
    }
  }, [editingAddress, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const currentAddresses: AddressItem[] = Array.isArray(user.addresses) ? [...user.addresses] : [];
      let updatedAddresses: AddressItem[] = [];

      if (editingAddress && editingAddress._id) {
        // Edit existing
        updatedAddresses = currentAddresses.map((addr) => {
          if (addr._id === editingAddress._id) {
            return { ...formData, _id: addr._id };
          }
          return formData.isDefault ? { ...addr, isDefault: false } : addr;
        });
      } else {
        // Add new
        const newAddr = {
          ...formData,
          _id: "addr_" + Date.now(),
        };
        if (formData.isDefault) {
          updatedAddresses = currentAddresses.map((a) => ({ ...a, isDefault: false }));
        } else {
          updatedAddresses = [...currentAddresses];
        }
        updatedAddresses.push(newAddr);
      }

      // If this is set as default or is the first address, also update user top-level address
      const payload: any = { addresses: updatedAddresses };
      if (formData.isDefault || updatedAddresses.length === 1) {
        payload.address = formData.addressLine;
        payload.city = formData.city;
        payload.state = formData.state;
        payload.pincode = formData.pincode;
      }

      const token = getAuthToken();
      const res = await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Delivery address saved successfully", "success");
        onSuccess(updatedAddresses);
        onClose();
      } else {
        showToast(data.message || "Failed to save address", "error");
      }
    } catch (err) {
      console.error("Save address error:", err);
      showToast("Server error while saving address", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FDFBF7] w-full max-w-lg rounded-2xl shadow-2xl border border-[#E5D7B7] overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E5D7B7] flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">
              {editingAddress ? "Edit Delivery Address" : "Add Delivery Address"}
            </h3>
            <p className="font-jost text-xs text-[#7A6A5C]">
              Safe and insured delivery destination
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A6A5C] hover:text-[#4A0E1B] p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Tag selector */}
          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              Address Label
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { tag: "Home", icon: Home },
                { tag: "Work", icon: Building },
                { tag: "Other", icon: MapPin },
              ].map(({ tag, icon: Icon }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFormData({ ...formData, tag })}
                  className={`py-2 px-3 rounded-lg border font-jost text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    formData.tag === tag
                      ? "bg-[#4A0E1B] text-[#FDFBF7] border-[#4A0E1B] font-medium"
                      : "bg-white text-[#5A4A3C] border-[#E5D7B7] hover:bg-[#FAF6EE]"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
                Recipient Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border border-[#E5D7B7] px-3.5 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B]"
              />
            </div>
            <div>
              <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
                Contact Phone
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border border-[#E5D7B7] px-3.5 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B]"
              />
            </div>
          </div>

          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              Flat, House No., Building, Street
            </label>
            <textarea
              required
              rows={2}
              value={formData.addressLine}
              onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
              placeholder="e.g. C-12, Sunrise Apartments, 4th Floor, MG Road"
              className="w-full bg-white border border-[#E5D7B7] p-3 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
                City
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-white border border-[#E5D7B7] px-3 py-2 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B]"
              />
            </div>
            <div>
              <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
                State
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full bg-white border border-[#E5D7B7] px-3 py-2 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B]"
              />
            </div>
            <div>
              <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
                Pincode
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full bg-white border border-[#E5D7B7] px-3 py-2 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefaultAddr"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="accent-[#4A0E1B] w-4 h-4 cursor-pointer rounded"
            />
            <label htmlFor="isDefaultAddr" className="text-xs font-jost text-[#5A4A3C] cursor-pointer">
              Set as primary / default delivery address
            </label>
          </div>

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
              {isSaving ? "Saving..." : <><Save size={15} /> Save Address</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
