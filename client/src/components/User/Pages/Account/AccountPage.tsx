import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaUser, FaBoxOpen, FaSignOutAlt } from "react-icons/fa";
import { Edit2, Save, X, Clock, Truck, CheckCircle, Eye, MapPin, CreditCard, User as UserIcon, Package, ArrowRight, Circle } from "lucide-react"; 
import { useAuth } from "../../../../components/Common/context/AuthContext";
import { useToast } from "../../../Common/context/ToastContext";
import { API_URL, getAuthToken } from "../../../../utils/api";

type Tab = "overview" | "orders";

const tabs: { id: Tab; label: string; icon: typeof FaUser }[] = [
  { id: "overview", label: "Overview", icon: FaUser },
  { id: "orders", label: "Orders", icon: FaBoxOpen },
];

// Order status timeline configuration
const ORDER_STATUS_STEPS = [
  { key: 'Pending', label: 'Order Placed', icon: Circle, color: '#F59E0B', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-700' },
  { key: 'Processing', label: 'Processing', icon: Package, color: '#F97316', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700' },
  { key: 'Shipped', label: 'Shipped', icon: Truck, color: '#3B82F6', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  { key: 'Delivered', label: 'Delivered', icon: CheckCircle, color: '#22C55E', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' },
] as const;

type OrderStatus = typeof ORDER_STATUS_STEPS[number]['key'];

// Order Timeline Component
const formatTimestamp = (dateString?: string) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const OrderTimeline = ({ order }: { order: any }) => {
  const currentStatus = order.orderStatus;
  const returnRequest = order.returnRequest;
  const currentIndex = ORDER_STATUS_STEPS.findIndex(s => s.key === currentStatus);
  
  const steps: any[] = ORDER_STATUS_STEPS.map((s, i) => ({
    ...s,
    timestamp: i === 0 ? (order.placedAt || order.createdAt) :
               i === 1 ? order.processingAt :
               i === 2 ? order.shippedAt :
               i === 3 ? order.deliveredAt : undefined
  }));
  
  if (returnRequest && returnRequest.type !== 'None') {
    steps.push({
      key: 'ReturnInitiated',
      label: `${returnRequest.type} Initiated`,
      icon: Package,
      color: '#F59E0B',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      timestamp: returnRequest.requestedAt
    });
    
    if (returnRequest.status !== 'Pending') {
      const isRejected = returnRequest.status === 'Rejected';
      const isCompleted = returnRequest.status === 'Completed';
      const isApproved = returnRequest.status === 'Approved';
      
      steps.push({
        key: 'Return',
        label: `${returnRequest.type} ${returnRequest.status}`,
        icon: Package,
        color: isRejected ? '#EF4444' : (isCompleted ? '#22C55E' : (isApproved ? '#F97316' : '#F59E0B')),
        bgColor: isRejected ? 'bg-red-50' : (isCompleted ? 'bg-green-50' : (isApproved ? 'bg-orange-50' : 'bg-yellow-50')),
        borderColor: isRejected ? 'border-red-200' : (isCompleted ? 'border-green-200' : (isApproved ? 'border-orange-200' : 'border-yellow-200')),
        textColor: isRejected ? 'text-red-700' : (isCompleted ? 'text-green-700' : (isApproved ? 'text-orange-700' : 'text-yellow-700')),
        timestamp: order.updatedAt
      });
    }
  }

  const finalCurrentIndex = steps.length > ORDER_STATUS_STEPS.length ? steps.length - 1 : currentIndex;
  
  return (
    <div className="relative pl-4 border-l-2 border-[#EAE3D5]">
      {steps.map((step, index) => {
        const isCompleted = index < finalCurrentIndex;
        const isCurrent = index === finalCurrentIndex;
        const isFuture = index > finalCurrentIndex;
        
        const Icon = step.icon;
        const timeStr = formatTimestamp(step.timestamp);
        
        return (
          <div key={step.key} className="relative pb-6 last:pb-0">
            {/* Timeline dot and connector */}
            <div className="absolute left-[-10px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300"
              style={{ 
                background: isCompleted ? step.color : (isCurrent ? step.color : '#FDFBF4'), 
                borderColor: isCompleted ? step.color : (isCurrent ? step.color : '#C9A24B') 
              }}>
              {isCompleted && <CheckCircle size={8} className="text-white" />}
              {isCurrent && !isCompleted && <Circle size={6} className="text-white" />}
              {isFuture && <Circle size={6} className="text-[#C9A24B]/30" />}
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div 
                className="absolute left-[-2px] top-6 w-0.5 h-full" 
                style={{ background: index < finalCurrentIndex ? step.color : '#EAE3D5' }} 
              />
            )}
            
            {/* Step content */}
            <div className="ml-2 min-h-[50px]">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-[10px] tracking-wider uppercase font-semibold border rounded-sm ${isCompleted || isCurrent ? step.bgColor + ' ' + step.textColor + ' ' + step.borderColor : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="font-jost text-[10px] text-[#C9A24B] font-medium">Current</span>
                )}
              </div>
              {timeStr ? (
                <p className="font-jost text-[11px] text-[#7A6A5C] mt-1 ml-8">{timeStr}</p>
              ) : isCompleted ? (
                <p className="font-jost text-[11px] text-[#7A6A5C] mt-1 ml-8">Completed</p>
              ) : null}
              {step.key === 'Return' && returnRequest?.adminResponse && (
                 <div className="mt-2 ml-8 p-3 bg-red-50/50 border border-red-100 rounded-sm">
                   <p className="font-jost text-xs text-red-800"><span className="font-semibold block mb-1">Reason for Rejection:</span> {returnRequest.adminResponse}</p>
                 </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function AccountPage() {
  const { user, logout, openAuthModal, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get("tab") as Tab) || "overview";
  const setTab = (tab: Tab) => setSearchParams({ tab });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ name: "", email: "", phone: "" });

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Return / Exchange states
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState<any | null>(null);
  const [returnType, setReturnType] = useState("Return");
  const [returnReason, setReturnReason] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Security check
  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal({ mode: 'login', message: 'Sign in to access your luxury account, orders & invoices' });
    } else if (user?.role === 'admin') {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [user, authLoading, navigate, openAuthModal]);

  useEffect(() => {
    const fetchMyOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/orders`, { 
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await response.json();
        
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchMyOrders();
  }, []); 

  const handleReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrder) return;
    setIsSubmittingReturn(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/orders/${returnOrder._id}/return`, {
        method: "POST",
        credentials: 'include',
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ type: returnType, reason: returnReason })
      });
      const data = await response.json();
      if (data.success) {
        showToast("Request submitted successfully.", "success");
        setIsReturnModalOpen(false);
        setReturnOrder(null);
        setReturnReason("");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast(data.message || "Failed to submit request.", "error");
      }
    } catch (error) {
      console.error("Error submitting return request:", error);
      showToast("Server error.", "error");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/users/${user?._id}`, {
        credentials: 'include',
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("aj_jewellers_user", JSON.stringify(data.data));
        showToast("Profile updated successfully.", "success");
        setIsEditing(false);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast(data.message || "Failed to update profile.", "error");
      }
    } catch (error) {
      console.error("Update error:", error);
      showToast("Server error while saving.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { dateStr: "N/A", timeStr: "" };
    const date = new Date(dateString);
    return { 
      dateStr: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      timeStr: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (!user) {
    return (
      <div className="bg-[#FDFBF4] min-h-screen pt-36 pb-24 px-6 flex flex-col items-center justify-center text-center">
        <p className="font-jost text-xs tracking-[0.24em] text-[#C9A24B] uppercase mb-3">AJ JEWELLERS CLIENT PRIVILEGE</p>
        <h1 className="font-cormorant text-4xl md:text-5xl text-[#4A0E1B] mb-4">Client Sign In Required</h1>
        <p className="font-jost text-sm text-[#7A6A5C] max-w-md mb-8">
          Please sign in to view your jewellery order status, certificates of authenticity, and account details.
        </p>
        <button
          onClick={() => openAuthModal({ mode: 'login', message: 'Sign in to access your orders, invoices & profile' })}
          className="bg-[#3B0E17] text-[#F3E9D8] font-jost text-xs tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#4A0E1B] transition-colors cursor-pointer shadow-md"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <section className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-4 sm:px-6 md:px-12 lg:px-20 animate-in fade-in duration-500 relative">
      <div className="max-w-5xl mx-auto">
        
        <h1 className="font-cormorant text-4xl md:text-5xl text-[#4A0E1B] mb-2 md:mb-1">Hello, {user.name?.split(" ")[0] || "User"}</h1>
        <p className="font-jost text-xs md:text-sm text-[#7A6A5C] mb-8 md:mb-12">{user.email}</p>

        <div className="flex flex-col md:flex-row gap-6 md:gap-12">
          
          <nav className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-visible md:w-48 shrink-0 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 scrollbar-hide pb-2 md:pb-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 md:gap-3 font-jost text-[13px] md:text-sm px-4 py-2.5 md:py-3 whitespace-nowrap transition-colors shrink-0 cursor-pointer ${activeTab === id ? "bg-[#4A0E1B] text-[#FDFBF4]" : "text-[#4A0E1B] hover:bg-[#4A0E1B]/5"}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-2 md:gap-3 font-jost text-[13px] md:text-sm px-4 py-2.5 md:py-3 whitespace-nowrap text-red-700 hover:bg-red-50 transition-colors shrink-0 md:mt-4 cursor-pointer">
              <FaSignOutAlt size={14} /> Log Out
            </button>
          </nav>

          <div className="flex-1 min-w-0">
            
            {activeTab === "overview" && (
              <div className="bg-white border border-[#4A0E1B]/10 p-5 sm:p-6 md:p-8 w-full max-w-full md:max-w-md shadow-sm">
                <div className="flex justify-between items-center mb-5 md:mb-6 border-b border-[#4A0E1B]/10 pb-4">
                  <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B]">Your Details</h2>
                  {!isEditing ? (
                    <button onClick={() => { setEditData({ name: user.name || "", email: user.email || "", phone: user.phone || "" }); setIsEditing(true); }} className="text-[#C9A24B] hover:text-[#4A0E1B] transition-colors flex items-center gap-1.5 font-jost text-xs uppercase tracking-wider font-semibold cursor-pointer"><Edit2 size={14} /> Edit</button>
                  ) : (
                    <button onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1.5 font-jost text-xs uppercase tracking-wider font-semibold cursor-pointer"><X size={14} /> Cancel</button>
                  )}
                </div>

                {!isEditing ? (
                  <dl className="space-y-4 md:space-y-4 font-jost text-[13px] md:text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0"><dt className="text-[#7A6A5C] text-[11px] sm:text-[13px] md:text-sm uppercase tracking-wider sm:normal-case sm:tracking-normal">Name</dt><dd className="text-[#4A0E1B] font-medium sm:font-normal">{user.name}</dd></div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0"><dt className="text-[#7A6A5C] text-[11px] sm:text-[13px] md:text-sm uppercase tracking-wider sm:normal-case sm:tracking-normal">Email</dt><dd className="text-[#4A0E1B] font-medium sm:font-normal break-all">{user.email}</dd></div>
                    <div className="flex flex-col sm:flex-row sm:justify-between pb-1 gap-1 sm:gap-0"><dt className="text-[#7A6A5C] text-[11px] sm:text-[13px] md:text-sm uppercase tracking-wider sm:normal-case sm:tracking-normal">Phone</dt><dd className="text-[#4A0E1B] font-medium sm:font-normal">{user.phone || "—"}</dd></div>
                  </dl>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-300">
                    <div><label className="block font-jost text-[10px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-1">Name</label><input type="text" required value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-2.5 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm" /></div>
                    <div><label className="block font-jost text-[10px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-1">Email</label><input type="email" required value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-2.5 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm" /></div>
                    <div><label className="block font-jost text-[10px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-1">Phone</label><input type="tel" value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-2.5 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm" /></div>
                    <button type="submit" disabled={isSaving} className="w-full bg-[#4A0E1B] text-[#F3E9D8] font-jost text-[11px] sm:text-xs tracking-[0.15em] uppercase py-3.5 flex items-center justify-center gap-2 hover:bg-[#3B0A14] transition-colors shadow-sm rounded-sm mt-6 cursor-pointer disabled:opacity-70"><Save size={16} /> {isSaving ? "Saving..." : "Save Changes"}</button>
                  </form>
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="w-full">
                <h2 className="font-cormorant text-3xl text-[#4A0E1B] mb-6 hidden md:block">Order History</h2>
                {isLoadingOrders ? (
                  <div className="text-center py-16 text-[#7A6A5C] font-jost animate-pulse">Loading your orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 md:py-16 px-4 bg-white border border-[#4A0E1B]/10 shadow-sm w-full">
                    <FaBoxOpen size={28} className="text-[#C9A24B]/60 mx-auto mb-4" />
                    <p className="font-jost text-[13px] md:text-sm text-[#7A6A5C]">You haven't placed any orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => {
                      const shortId = `AJ-${order._id.slice(-6).toUpperCase()}`;
                      const totalItems = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
                      const { dateStr } = formatDateTime(order.createdAt);
                      return (
                        <div key={order._id} className="bg-white border border-[#C9A24B]/30 shadow-sm rounded-sm overflow-hidden">
                          <div className="bg-[#FDFBF4] border-b border-[#C9A24B]/20 p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <p className="font-jost text-[10px] md:text-xs tracking-[0.15em] text-[#7A6A5C] uppercase mb-1">Order Placed &middot; {dateStr}</p>
                              <p className="font-medium text-[#4A0E1B] text-sm md:text-base">Order ID: {shortId}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* --- YELLOW PENDING LOGIC ADDED HERE --- */}
                              {order.orderStatus === 'Pending' && <Clock size={16} className="text-yellow-600" />}
                              {order.orderStatus === 'Processing' && <Clock size={16} className="text-orange-600" />}
                              {order.orderStatus === 'Shipped' && <Truck size={16} className="text-blue-600" />}
                              {order.orderStatus === 'Delivered' && <CheckCircle size={16} className="text-green-600" />}
                              <span className={`px-3 py-1 text-[10px] md:text-xs tracking-wider uppercase font-semibold border rounded-sm ${
                                order.orderStatus === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                order.orderStatus === 'Processing' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                order.orderStatus === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'
                              }`}>{order.orderStatus}</span>
                              <span className={`px-2.5 py-1 text-[10px] md:text-xs tracking-wider uppercase font-semibold border rounded-sm ${
                                order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>{order.paymentStatus === 'Paid' ? 'PAID' : 'PAYMENT PENDING'}</span>
                            </div>
                          </div>
                          <div className="p-4 md:p-5 space-y-4 border-b border-[#EAE3D5]/50">
                            {order.items.slice(0, 2).map((item: any, idx: number) => (
                              <div key={idx} className="flex gap-4 items-center">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#FDFBF4] border border-[#C9A24B]/20 rounded-sm overflow-hidden shrink-0 flex items-center justify-center p-2">
                                  <img src={item.image || "/placeholder.jpg"} alt={item.name} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-cormorant text-lg md:text-xl text-[#4A0E1B] truncate">{item.name}</h4>
                                  <p className="font-jost text-[11px] md:text-xs text-[#7A6A5C] uppercase tracking-wider mt-1">Qty: {item.quantity} &middot; {item.specs}</p>
                                </div>
                              </div>
                            ))}
                            {order.items.length > 2 && <p className="font-jost text-xs text-[#7A6A5C] italic">+ {order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}...</p>}
                          </div>
                          <div className="bg-gray-50 p-4 md:p-5 flex flex-wrap justify-between items-center gap-4">
                            <div>
                              <span className="font-jost text-xs md:text-sm text-[#7A6A5C] block mb-0.5">{totalItems} item{totalItems > 1 ? 's' : ''} total</span>
                              <span className="font-cormorant text-xl md:text-2xl text-[#4A0E1B] font-semibold">{formatINR(order.totalAmount)}</span>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap justify-end">
                              {order.orderStatus === 'Delivered' && (!order.returnRequest || order.returnRequest.type === 'None') && (
                                <button onClick={() => { setReturnOrder(order); setIsReturnModalOpen(true); }} className="text-[#4A0E1B] transition-colors flex items-center gap-2 font-jost text-[11px] sm:text-xs tracking-[0.15em] uppercase font-semibold border border-[#4A0E1B]/30 hover:bg-[#4A0E1B]/5 px-4 py-2 bg-white rounded-sm cursor-pointer shadow-sm">
                                  Request Return/Resize
                                </button>
                              )}
                              {order.returnRequest && order.returnRequest.type !== 'None' && (
                                <div className="flex flex-col items-end">
                                  <span className={`font-jost text-[11px] sm:text-xs tracking-[0.15em] uppercase font-semibold px-4 py-2 border rounded-sm ${order.returnRequest.status === 'Approved' || order.returnRequest.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : order.returnRequest.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                    {order.returnRequest.type}: {order.returnRequest.status}
                                  </span>

                                </div>
                              )}
                              <button onClick={() => setSelectedOrder(order)} className="text-[#C9A24B] hover:text-[#4A0E1B] transition-colors flex items-center gap-2 font-jost text-[11px] sm:text-xs tracking-[0.15em] uppercase font-semibold border border-[#C9A24B]/30 hover:border-[#C9A24B] px-4 py-2 bg-white rounded-sm cursor-pointer shadow-sm">
                              <Eye size={14} /> View Details
                            </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FDFBF4] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border border-[#C9A24B]/30 relative">
            <div className="sticky top-0 bg-[#FDFBF4] border-b border-[#C9A24B]/20 p-5 md:p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B]">Order Details</h2>
                <p className="font-jost text-xs text-[#7A6A5C] mt-1 tracking-widest uppercase">ID: AJ-{selectedOrder._id.slice(-6).toUpperCase()} &middot; {formatDateTime(selectedOrder.createdAt).dateStr}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-[#7A6A5C] hover:text-red-700 transition-colors p-2 bg-white rounded-full border border-transparent hover:border-red-200 cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 md:p-6 space-y-6 md:space-y-8">
              {selectedOrder.orderStatus === 'Delivered' && selectedOrder.paymentStatus === 'Paid' && (
                <div className="bg-green-50 border border-green-200 p-3.5 rounded-sm flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <div className="text-xs font-jost text-green-900">
                    <span className="font-semibold uppercase tracking-wider block">Order Completed &amp; Verified</span>
                    <span className="text-green-700">This order has been successfully delivered and marked as Paid. Your official tax invoice is available for download below.</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 border border-[#C9A24B]/20 shadow-sm rounded-sm space-y-3">
                  <div className="flex items-center gap-2 text-[#C9A24B] mb-2 border-b border-[#EAE3D5] pb-2"><MapPin size={16} /><h3 className="font-jost text-xs tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">Shipped To</h3></div>
                  <p className="font-jost text-sm text-[#4A0E1B] font-medium">{selectedOrder.customerName}</p>
                  <p className="font-jost text-sm text-[#4A0E1B]">{selectedOrder.city} ({selectedOrder.pincode})</p>
                  <div className="font-jost text-sm text-[#4A0E1B] flex items-start gap-1"><span className="whitespace-pre-wrap">{selectedOrder.address}</span></div>
                  <p className="font-jost text-sm text-[#7A6A5C] pt-2 border-t border-[#EAE3D5]/50">Phone: {selectedOrder.phone}</p>
                  {selectedOrder.orderStatus === 'Delivered' && (
                    <p className="font-jost text-[11px] text-green-700 font-medium">
                      ✓ Delivered {selectedOrder.deliveredAt ? `on ${formatDateTime(selectedOrder.deliveredAt).dateStr}` : 'Successfully'}
                    </p>
                  )}
                </div>
                <div className="bg-white p-5 border border-[#C9A24B]/20 shadow-sm rounded-sm space-y-3">
                  <div className="flex items-center gap-2 text-[#C9A24B] mb-2 border-b border-[#EAE3D5] pb-2"><CreditCard size={16} /><h3 className="font-jost text-xs tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">Payment Details</h3></div>
                  <p className="font-jost text-sm text-[#4A0E1B] capitalize"><span className="text-[#7A6A5C]">Method:</span> {selectedOrder.paymentMethod === 'boutique' ? 'Pay at Boutique' : selectedOrder.paymentMethod}</p>
                  <div className="pt-2 flex flex-col gap-1.5">
                    <span className={`inline-block px-3 py-1 text-[10px] tracking-wider uppercase font-semibold border rounded-sm w-fit ${selectedOrder.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>Status: {selectedOrder.paymentStatus === 'Paid' ? 'PAID' : 'PENDING'}</span>
                    {selectedOrder.paidAt && (
                      <p className="font-jost text-[11px] text-green-700">Paid on {formatDateTime(selectedOrder.paidAt).dateStr} at {formatDateTime(selectedOrder.paidAt).timeStr}</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-[#C9A24B] mb-4"><Package size={18} /><h3 className="font-jost text-sm tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">Order Tracking</h3></div>
                <OrderTimeline order={selectedOrder} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[#C9A24B] mb-4"><Package size={18} /><h3 className="font-jost text-sm tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">Items in this Order</h3></div>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 border border-[#EAE3D5] rounded-sm flex gap-4 items-center">
                      <div className="w-16 h-16 bg-[#FDFBF4] border border-[#C9A24B]/20 rounded-sm overflow-hidden shrink-0 flex justify-center items-center"><img src={item.image || "/placeholder.jpg"} alt={item.name} className="w-full h-full object-contain p-1" /></div>
                      <div className="flex-1 min-w-0"><h4 className="font-cormorant text-lg text-[#4A0E1B] truncate">{item.name}</h4><p className="font-jost text-[11px] text-[#7A6A5C] uppercase tracking-wider mt-0.5">{item.specs}</p></div>
                      <div className="text-right shrink-0"><p className="font-medium text-[#4A0E1B]">{formatINR(item.price)}</p><p className="font-jost text-[10px] text-[#7A6A5C] mt-1">Qty: {item.quantity}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#C9A24B]/30 pt-6 flex justify-between items-end">
                <span className="font-jost text-sm text-[#7A6A5C] uppercase tracking-wider">Grand Total</span>
                <span className="font-cormorant text-3xl md:text-4xl text-[#4A0E1B] font-semibold">{formatINR(selectedOrder.totalAmount)}</span>
              </div>
              
              {/* Download Invoice Button */}
              <div className="pt-6 border-t border-[#EAE3D5]/50">
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `${API_URL}/orders/${selectedOrder._id}/invoice`;
                    link.download = `Invoice-AJ-${selectedOrder._id.slice(-6).toUpperCase()}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full md:w-auto bg-[#4A0E1B] text-[#F3E9D8] font-jost text-[11px] sm:text-xs tracking-[0.15em] uppercase py-3 px-6 flex items-center justify-center gap-2 hover:bg-[#3B0A14] transition-colors shadow-sm rounded-sm cursor-pointer"
                >
                  <Package size={14} /> Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Return / Resize Modal */}
      {isReturnModalOpen && returnOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FDFBF4] w-full max-w-lg rounded-sm shadow-2xl border border-[#C9A24B]/30 relative p-6">
            <button onClick={() => { setIsReturnModalOpen(false); setReturnOrder(null); }} className="absolute top-4 right-4 text-[#7A6A5C] hover:text-red-700 transition-colors p-2 bg-white rounded-full border border-transparent hover:border-red-200 cursor-pointer"><X size={20} /></button>
            <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B] mb-2">Request Return / Resize</h2>
            <p className="font-jost text-xs text-[#7A6A5C] mb-6">For Order: AJ-{returnOrder._id.slice(-6).toUpperCase()}</p>
            <form onSubmit={handleReturnRequest} className="space-y-4">
              <div>
                <label className="block font-jost text-[10px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-1">Request Type</label>
                <select value={returnType} onChange={(e) => setReturnType(e.target.value)} className="w-full bg-white border border-[#C9A24B]/40 p-2.5 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm cursor-pointer">
                  <option value="Return">Return</option>
                  <option value="Resizing">Resizing</option>
                </select>
              </div>
              <div>
                <label className="block font-jost text-[10px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-1">Reason / Details</label>
                <textarea required value={returnReason} onChange={(e) => setReturnReason(e.target.value)} rows={4} placeholder="Please provide details about your request..." className="w-full bg-white border border-[#C9A24B]/40 p-2.5 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsReturnModalOpen(false); setReturnOrder(null); }} className="flex-1 bg-white border border-[#4A0E1B]/30 text-[#4A0E1B] font-jost text-[11px] sm:text-xs tracking-[0.15em] uppercase py-3 hover:bg-[#4A0E1B]/5 transition-colors shadow-sm rounded-sm cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmittingReturn} className="flex-1 bg-[#4A0E1B] text-[#F3E9D8] font-jost text-[11px] sm:text-xs tracking-[0.15em] uppercase py-3 hover:bg-[#3B0A14] transition-colors shadow-sm rounded-sm cursor-pointer disabled:opacity-70">{isSubmittingReturn ? "Submitting..." : "Submit Request"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}