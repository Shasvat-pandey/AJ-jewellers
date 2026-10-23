import React, { useState } from "react";
import { Lock, Bell, Shield, Save, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { User, useAuth } from "../../../../Common/context/AuthContext";
import { useToast } from "../../../../Common/context/ToastContext";
import { API_URL, getAuthToken } from "../../../../../utils/api";

export const SettingsTab: React.FC<{ user: User }> = ({ user }) => {
  const { updateUser } = useAuth();
  const { showToast } = useToast();
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [notifications, setNotifications] = useState({
    orderUpdates: user.notifications?.orderUpdates ?? true,
    whatsappAlerts: user.notifications?.whatsappAlerts ?? true,
    privilegeOffers: user.notifications?.privilegeOffers ?? true,
    newsletter: user.notifications?.newsletter ?? false,
  });
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      showToast("Please enter your current password", "error");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (passwords.newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setIsChangingPass(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ 
          currentPassword: passwords.currentPassword,
          password: passwords.newPassword 
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Password updated successfully in database", "success");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showToast(data.message || "Failed to update password", "error");
      }
    } catch {
      showToast("Error updating password", "error");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifs(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ notifications }),
      });
      const data = await res.json();
      if (data.success) {
        updateUser({ notifications });
        showToast("Notification preferences saved to your account", "success");
      } else {
        showToast(data.message || "Failed to save preferences", "error");
      }
    } catch {
      showToast("Error saving preferences", "error");
    } finally {
      setIsSavingNotifs(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Password Security Card */}
      <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 sm:p-7 shadow-sm">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#E5D7B7]/60">
          <div className="w-9 h-9 rounded-full bg-[#FAF6EE] border border-[#E5D7B7] flex items-center justify-center text-[#8C6514]">
            <Lock size={17} />
          </div>
          <div>
            <h3 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">Security &amp; Password</h3>
            <p className="font-jost text-xs text-[#7A6A5C]">Ensure your client account remains secure</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              Current Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full bg-white border border-[#E5D7B7] px-3.5 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B]"
            />
          </div>

          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full bg-white border border-[#E5D7B7] px-3.5 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B]"
            />
          </div>

          <div>
            <label className="block font-jost text-[11px] tracking-wider uppercase font-semibold text-[#5A4A3C] mb-1.5">
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full bg-white border border-[#E5D7B7] px-3.5 py-2.5 rounded-lg text-sm font-jost text-[#4A0E1B] outline-none focus:border-[#C9A24B]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="showPass"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="accent-[#4A0E1B] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="showPass" className="text-xs font-jost text-[#5A4A3C] cursor-pointer">
              Show password text
            </label>
          </div>

          <button
            type="submit"
            disabled={isChangingPass}
            className="mt-3 px-6 py-3 bg-[#4A0E1B] text-[#FDFBF7] font-jost text-xs tracking-wider uppercase font-semibold rounded-lg hover:bg-[#3B0A14] transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
          >
            <Save size={14} />
            <span>{isChangingPass ? "Updating..." : "Update Password"}</span>
          </button>
        </form>
      </div>

      {/* Communication Preferences */}
      <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 sm:p-7 shadow-sm">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#E5D7B7]/60">
          <div className="w-9 h-9 rounded-full bg-[#FAF6EE] border border-[#E5D7B7] flex items-center justify-center text-[#8C6514]">
            <Bell size={17} />
          </div>
          <div>
            <h3 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">Notifications &amp; Alerts</h3>
            <p className="font-jost text-xs text-[#7A6A5C]">Control how AJ Jewellers keeps in touch with you</p>
          </div>
        </div>

        <div className="space-y-4 font-jost text-xs text-[#5A4A3C] max-w-lg">
          <label className="flex items-center justify-between p-3 rounded-lg border border-[#E5D7B7]/50 hover:bg-[#FAF6EE]/50 cursor-pointer">
            <div>
              <p className="font-semibold text-[#4A0E1B]">Order Milestones &amp; Dispatch Updates</p>
              <p className="text-[11px] text-[#7A6A5C]">Receive real-time notifications when your jewellery is packed and shipped.</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.orderUpdates}
              onChange={(e) => setNotifications({ ...notifications, orderUpdates: e.target.checked })}
              className="accent-[#4A0E1B] w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-[#E5D7B7]/50 hover:bg-[#FAF6EE]/50 cursor-pointer">
            <div>
              <p className="font-semibold text-[#4A0E1B]">WhatsApp Concierge Alerts</p>
              <p className="text-[11px] text-[#7A6A5C]">Receive boutique booking confirmations and invoice PDFs via WhatsApp.</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.whatsappAlerts}
              onChange={(e) => setNotifications({ ...notifications, whatsappAlerts: e.target.checked })}
              className="accent-[#4A0E1B] w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-[#E5D7B7]/50 hover:bg-[#FAF6EE]/50 cursor-pointer">
            <div>
              <p className="font-semibold text-[#4A0E1B]">Privilege Invitations &amp; Gold Rate Alerts</p>
              <p className="text-[11px] text-[#7A6A5C]">Early access invitations to festive collections and special gold locks.</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.privilegeOffers}
              onChange={(e) => setNotifications({ ...notifications, privilegeOffers: e.target.checked })}
              className="accent-[#4A0E1B] w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-[#E5D7B7]/50 hover:bg-[#FAF6EE]/50 cursor-pointer">
            <div>
              <p className="font-semibold text-[#4A0E1B]">Monthly Gazette &amp; Heritage Digest</p>
              <p className="text-[11px] text-[#7A6A5C]">Quarterly fine jewellery curation, jewellery care guides and trends.</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.newsletter}
              onChange={(e) => setNotifications({ ...notifications, newsletter: e.target.checked })}
              className="accent-[#4A0E1B] w-4 h-4 cursor-pointer"
            />
          </label>

          <button
            type="button"
            disabled={isSavingNotifs}
            onClick={handleSaveNotifications}
            className="mt-4 px-6 py-3 bg-[#4A0E1B] text-[#FDFBF7] font-jost text-xs tracking-wider uppercase font-semibold rounded-lg hover:bg-[#3B0A14] transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
          >
            <Save size={14} />
            <span>{isSavingNotifs ? "Saving Preferences..." : "Save Preferences"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
