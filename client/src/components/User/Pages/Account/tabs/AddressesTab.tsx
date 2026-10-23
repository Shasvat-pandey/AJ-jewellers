import React from "react";
import { Plus, Home, Building, MapPin, Edit2, Trash2, Check, ShieldCheck } from "lucide-react";
import { User } from "../../../../Common/context/AuthContext";
import { AddressItem } from "../modals/AddressModal";
import { useToast } from "../../../../Common/context/ToastContext";
import { API_URL, getAuthToken } from "../../../../../utils/api";

interface AddressesTabProps {
  user: User;
  onOpenAddModal: () => void;
  onOpenEditModal: (address: AddressItem) => void;
  onUpdateAddresses: (addresses: AddressItem[], topLevel?: Partial<User>) => void;
}

export const AddressesTab: React.FC<AddressesTabProps> = ({
  user,
  onOpenAddModal,
  onOpenEditModal,
  onUpdateAddresses,
}) => {
  const { showToast } = useToast();

  const addressList: AddressItem[] = (user.addresses && user.addresses.length > 0)
    ? user.addresses
    : [
        {
          _id: "addr_default",
          tag: "Home",
          isDefault: true,
          name: user.name || "Shasvat Pandey",
          phone: user.phone || "+91 98765 43210",
          addressLine: user.address || "C-12, Sunrise Apartments, 4th Floor, MG Road",
          city: user.city || "Bengaluru",
          state: user.state || "Karnataka",
          pincode: user.pincode || "560001",
        }
      ];

  const handleSetDefault = async (addrId?: string) => {
    if (!addrId) return;
    const updated = addressList.map(a => ({
      ...a,
      isDefault: a._id === addrId
    }));

    const def = updated.find(a => a.isDefault);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({
          addresses: updated,
          address: def?.addressLine,
          city: def?.city,
          state: def?.state,
          pincode: def?.pincode
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Primary delivery address updated", "success");
        onUpdateAddresses(updated, {
          address: def?.addressLine,
          city: def?.city,
          state: def?.state,
          pincode: def?.pincode
        });
      }
    } catch {
      showToast("Error updating default address", "error");
    }
  };

  const handleDelete = async (addrId?: string) => {
    if (!addrId) return;
    if (addressList.length <= 1) {
      showToast("You must maintain at least one delivery address", "error");
      return;
    }
    if (!window.confirm("Remove this delivery address?")) return;

    const updated = addressList.filter(a => a._id !== addrId);
    if (!updated.some(a => a.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }

    const remainingDef = updated.find(a => a.isDefault);

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({ 
          addresses: updated,
          address: remainingDef?.addressLine,
          city: remainingDef?.city,
          state: remainingDef?.state,
          pincode: remainingDef?.pincode
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Address deleted successfully", "success");
        onUpdateAddresses(updated, remainingDef ? {
          address: remainingDef.addressLine,
          city: remainingDef.city,
          state: remainingDef.state,
          pincode: remainingDef.pincode
        } : undefined);
      }
    } catch {
      showToast("Error removing address", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5D7B7]/70 rounded-xl p-6 shadow-sm">
        <div>
          <h3 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#4A0E1B]">Delivery Addresses</h3>
          <p className="font-jost text-xs text-[#7A6A5C] mt-1">
            Manage your insured delivery destinations and boutique pick-up points
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#4A0E1B] text-[#FDFBF7] rounded-xl font-jost text-xs uppercase tracking-wider font-semibold hover:bg-[#3B0A14] transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add New Address</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {addressList.map((addr, idx) => {
          const TagIcon = addr.tag === "Work" ? Building : addr.tag === "Home" ? Home : MapPin;

          return (
            <div
              key={addr._id || idx}
              className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all ${
                addr.isDefault ? "border-[#C9A24B] ring-1 ring-[#C9A24B]/30" : "border-[#E5D7B7]/70 hover:border-[#C9A24B]/60"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FAF6EE] border border-[#E5D7B7] flex items-center justify-center text-[#8C6514]">
                      <TagIcon size={14} />
                    </div>
                    <span className="font-jost text-xs font-bold uppercase tracking-wider text-[#4A0E1B]">
                      {addr.tag}
                    </span>
                  </div>

                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF8E7] text-[#8C6514] border border-[#E5D7B7] text-[10px] font-jost font-semibold">
                      <Check size={11} /> Default Address
                    </span>
                  )}
                </div>

                <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B] mt-2">
                  {addr.name}
                </h4>
                <p className="font-jost text-xs text-[#5A4A3C] leading-relaxed mt-1">
                  {addr.addressLine}
                </p>
                <p className="font-jost text-xs text-[#5A4A3C]">
                  {addr.city}, {addr.state} - {addr.pincode}, India
                </p>
                <p className="font-jost text-xs text-[#7A6A5C] mt-2 font-medium">
                  Mobile: {addr.phone}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-[#E5D7B7]/50 flex items-center justify-between">
                <div>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="text-xs font-jost text-[#8C6514] hover:text-[#4A0E1B] font-semibold cursor-pointer"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenEditModal(addr)}
                    className="p-2 rounded-lg border border-[#E5D7B7] text-[#7A6A5C] hover:text-[#4A0E1B] hover:bg-[#FAF6EE] transition-colors cursor-pointer"
                    title="Edit address"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete address"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
