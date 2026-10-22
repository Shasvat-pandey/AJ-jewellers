import { useState, useEffect } from "react";
import {
  Search, Mail, Phone, ExternalLink, ShieldAlert, ShieldCheck, Loader2,
  X, User as UserIcon, Calendar, ShoppingBag, CreditCard
} from "lucide-react";
import { useAuth } from "../../Common/context/AuthContext";
import { useToast } from "../../Common/context/ToastContext";
import { API_URL, getAdminToken, getAuthToken } from "../../../utils/api";

export default function CustomersView() {
  const { user: adminUser } = useAuth();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Newest");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);

  // --- NEW: STATE FOR PROFILE MODAL ---
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  useEffect(() => {
    const fetchCustomersAndStats = async () => {
      setIsLoading(true);
      try {
        const token = getAdminToken() || getAuthToken();
        const headers = {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
        const [usersRes, ordersRes] = await Promise.all([
          fetch(`${API_URL}/users`, { credentials: 'include', headers }).catch(() => null),
          fetch(`${API_URL}/orders`, { credentials: 'include', headers }).catch(() => null)
        ]);

        let usersList = [];
        let ordersList = [];

        if (usersRes && usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.success) usersList = usersData.data;
        }

        if (ordersRes && ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData.success) ordersList = ordersData.data;
        }

        const formattedCustomers = usersList.map((user: any) => {
          const userOrders = ordersList.filter(
            (order: any) =>
              (order.userId && order.userId === user._id) ||
              (order.email && order.email.toLowerCase() === user.email?.toLowerCase())
          );

          const totalOrders = userOrders.length;
          const totalSpent = userOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);

          return {
            id: user._id || Math.random().toString(),
            name: user.name || "Unnamed User",
            email: user.email || "No Email",
            phone: user.phone || "—",
            role: user.role || "customer",
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "Recent",
            orders: totalOrders,
            spent: totalSpent,
            status: user.status || "Active",
          };
        });

        setCustomers(formattedCustomers);
      } catch (error) {
        console.error("Failed to load customer directory:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomersAndStats();
  }, []);

  let processedCustomers = customers.filter(customer => 
    (customer.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (customer.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortBy === "Top Spenders") {
    processedCustomers.sort((a, b) => b.spent - a.spent);
  } else if (sortBy === "Most Orders") {
    processedCustomers.sort((a, b) => b.orders - a.orders);
  } else {
    processedCustomers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper to get initials for the Avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const statusBadgeClass = (status: string) =>
    status === "Suspended"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-green-50 text-green-700 border-green-200";

  const canModerate = (customer: any) =>
    customer.role !== "admin" && customer.id !== adminUser?._id;

  // Suspend / reactivate a customer account (confirmed via styled modal, results via toast)
  const handleToggleStatus = async () => {
    const customer = confirmTarget;
    if (!customer) return;
    const nextStatus = customer.status === "Suspended" ? "Active" : "Suspended";
    setConfirmTarget(null);
    setPendingId(customer.id);
    try {
      const response = await fetch(`${API_URL}/users/${customer.id}/status`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          ...((getAdminToken() || getAuthToken()) ? { Authorization: `Bearer ${getAdminToken() || getAuthToken()}` } : {})
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update account status");
      }
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, status: nextStatus } : c));
      setSelectedCustomer((prev: any) => prev && prev.id === customer.id ? { ...prev, status: nextStatus } : prev);
      showToast(
        nextStatus === "Suspended"
          ? `Account suspended for ${customer.name}.`
          : `Account reactivated for ${customer.name}.`,
        "success"
      );
    } catch (error: any) {
      showToast(error.message || "Failed to update account status", "error");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-6 md:mb-8 mt-2 md:mt-0">
        <h1 className="font-cormorant text-3xl sm:text-4xl text-[#4A0E1B] mb-1">
          Customer Directory
        </h1>
        <p className="text-[#7A6A5C] text-xs sm:text-sm">Manage user accounts, view purchase history, and identify top clients.</p>
      </header>

      {/* Controls */}
      <div className="bg-white p-4 border border-[#C9A24B]/30 shadow-sm rounded-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A5C]" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..." 
            className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 pl-9 pr-4 py-2 text-sm font-jost outline-none focus:border-[#C9A24B] transition-colors rounded-sm text-[#4A0E1B]"
          />
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto bg-[#FDFBF4] border border-[#C9A24B]/40 px-3 py-2 text-sm font-jost outline-none focus:border-[#C9A24B] cursor-pointer rounded-sm text-[#4A0E1B]"
          >
            <option value="Newest">Sort by: Newest</option>
            <option value="Top Spenders">Sort by: Top Spenders</option>
            <option value="Most Orders">Sort by: Most Orders</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-[#C9A24B]/30 shadow-sm rounded-sm w-full overflow-hidden">
        <div className="overflow-x-auto w-full">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-[#7A6A5C] font-jost gap-3">
              <Loader2 className="animate-spin text-[#C9A24B]" size={28} />
              <p>Fetching user database...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="bg-[#FDFBF4] text-[10px] sm:text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase border-b border-[#C9A24B]/20">
                  <th className="p-3 sm:p-4 font-semibold">Customer Name</th>
                  <th className="p-3 sm:p-4 font-semibold">Contact Info</th>
                  <th className="p-3 sm:p-4 font-semibold">Joined Date</th>
                  <th className="p-3 sm:p-4 font-semibold">Total Spent</th>
                  <th className="p-3 sm:p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {processedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#7A6A5C] font-jost">
                      No registered customers found in database.
                    </td>
                  </tr>
                ) : (
                  processedCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-[#C9A24B]/10 hover:bg-[#FDFBF4]/50 transition-colors">
                      <td className="p-3 sm:p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-medium text-[#4A0E1B] text-[13px]">{customer.name}</span>
                          <span className={`px-2 py-0.5 text-[8px] tracking-wider uppercase font-semibold border rounded-sm ${statusBadgeClass(customer.status)}`}>
                            {customer.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-[#7A6A5C]">
                            <Mail size={12} />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#7A6A5C]">
                            <Phone size={12} />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-[#7A6A5C]">{customer.joined}</td>
                      <td className="p-3 sm:p-4">
                        <div className="flex flex-col">
                          <span className="text-[#4A0E1B] font-medium">{formatINR(customer.spent)}</span>
                          <span className="text-[10px] text-[#7A6A5C]">{customer.orders} Order{customer.orders !== 1 && 's'}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center justify-end gap-3">
                          {/* --- PROFILE BUTTON TRIGGERS MODAL --- */}
                          <button 
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-[#C9A24B] hover:text-[#4A0E1B] transition-colors p-1.5 cursor-pointer border border-transparent hover:border-[#C9A24B]/30 rounded-sm bg-white flex items-center gap-1" 
                            title="View Profile"
                          >
                            <span className="text-[10px] tracking-wider uppercase font-semibold hidden sm:inline">Profile</span>
                            <ExternalLink size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmTarget(customer)}
                            disabled={!canModerate(customer) || pendingId === customer.id}
                            className={`transition-colors p-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${customer.status === "Suspended" ? "text-green-500 hover:text-green-700" : "text-red-400 hover:text-red-600"}`}
                            title={customer.status === "Suspended" ? "Reactivate Account" : "Suspend Account"}
                          >
                            {pendingId === customer.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : customer.status === "Suspended" ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- CUSTOMER PROFILE MODAL --- */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FDFBF4] w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border border-[#C9A24B]/30 relative text-left">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#FDFBF4] border-b border-[#C9A24B]/20 p-5 flex justify-between items-center z-10">
              <div>
                <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B]">Customer Profile</h2>
                <p className="font-jost text-xs text-[#7A6A5C] mt-1 tracking-widest uppercase">
                  ID: AJ-{selectedCustomer.id.slice(-6).toUpperCase()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)} 
                className="text-[#7A6A5C] hover:text-red-700 transition-colors p-2 bg-white rounded-full border border-transparent hover:border-red-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Profile Header (Avatar & Name) */}
              <div className="flex items-center gap-5 pb-6 border-b border-[#EAE3D5]">
                <div className="w-16 h-16 rounded-full bg-[#4A0E1B] text-[#F3E9D8] flex items-center justify-center font-cormorant text-2xl font-medium shadow-inner shrink-0">
                  {getInitials(selectedCustomer.name)}
                </div>
                <div>
                  <h3 className="font-cormorant text-2xl text-[#4A0E1B] leading-tight">{selectedCustomer.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] tracking-widest uppercase font-semibold border rounded-sm ${statusBadgeClass(selectedCustomer.status)}`}>
                    {selectedCustomer.status} Account
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white p-5 border border-[#C9A24B]/20 shadow-sm rounded-sm space-y-4">
                <div className="flex items-center gap-2 text-[#C9A24B] mb-2 border-b border-[#EAE3D5] pb-2">
                  <UserIcon size={16} />
                  <h4 className="font-jost text-xs tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">Contact Details</h4>
                </div>
                <div className="flex items-center gap-3 text-[#4A0E1B] font-jost text-sm">
                  <Mail size={16} className="text-[#7A6A5C]" />
                  <a href={`mailto:${selectedCustomer.email}`} className="hover:text-[#C9A24B] transition-colors">{selectedCustomer.email}</a>
                </div>
                <div className="flex items-center gap-3 text-[#4A0E1B] font-jost text-sm">
                  <Phone size={16} className="text-[#7A6A5C]" />
                  <a href={`tel:${selectedCustomer.phone}`} className="hover:text-[#C9A24B] transition-colors">{selectedCustomer.phone}</a>
                </div>
              </div>

              {/* Activity & Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 border border-[#C9A24B]/20 shadow-sm rounded-sm">
                  <div className="flex items-center gap-2 text-[#C9A24B] mb-3">
                    <Calendar size={16} />
                    <h4 className="font-jost text-[10px] tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">Member Since</h4>
                  </div>
                  <p className="font-jost text-lg text-[#4A0E1B] font-medium">{selectedCustomer.joined}</p>
                </div>
                
                <div className="bg-white p-5 border border-[#C9A24B]/20 shadow-sm rounded-sm">
                  <div className="flex items-center gap-2 text-[#C9A24B] mb-3">
                    <ShoppingBag size={16} />
                    <h4 className="font-jost text-[10px] tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">Total Orders</h4>
                  </div>
                  <p className="font-jost text-lg text-[#4A0E1B] font-medium">{selectedCustomer.orders}</p>
                </div>
              </div>

              {/* Lifetime Spending Highlight */}
              <div className="bg-[#FDFBF4] p-5 border border-[#C9A24B]/40 shadow-inner rounded-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={24} className="text-[#C9A24B]" />
                  <h4 className="font-jost text-sm tracking-[0.15em] uppercase font-semibold text-[#7A6A5C]">Lifetime Value</h4>
                </div>
                <p className="font-cormorant text-3xl text-[#4A0E1B] font-semibold">
                  {formatINR(selectedCustomer.spent)}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- SUSPEND / REACTIVATE CONFIRM MODAL --- */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FDFBF4] w-full max-w-md rounded-sm shadow-2xl border border-[#C9A24B]/30 p-6 md:p-8 text-center">
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${confirmTarget.status === "Suspended" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              {confirmTarget.status === "Suspended"
                ? <ShieldCheck size={26} className="text-green-600" />
                : <ShieldAlert size={26} className="text-red-500" />}
            </div>
            <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B] mb-2">
              {confirmTarget.status === "Suspended" ? "Reactivate Account?" : "Suspend Account?"}
            </h2>
            <p className="font-jost text-sm text-[#7A6A5C] mb-1">{confirmTarget.name}</p>
            <p className="font-jost text-xs text-[#7A6A5C] mb-6">{confirmTarget.email}</p>
            <p className="font-jost text-sm text-[#4A0E1B] mb-6">
              {confirmTarget.status === "Suspended"
                ? "This customer will be able to log in and place orders again."
                : "This customer will be logged out and blocked from logging in or ordering."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-6 py-2.5 font-jost text-xs tracking-[0.15em] uppercase border border-[#4A0E1B]/30 text-[#4A0E1B] hover:bg-[#4A0E1B]/5 transition-colors rounded-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                className={`px-6 py-2.5 font-jost text-xs tracking-[0.15em] uppercase text-[#FDFBF4] transition-colors rounded-sm cursor-pointer ${confirmTarget.status === "Suspended" ? "bg-green-700 hover:bg-green-800" : "bg-[#4A0E1B] hover:bg-red-800"}`}
              >
                {confirmTarget.status === "Suspended" ? "Reactivate" : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}