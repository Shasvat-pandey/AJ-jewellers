import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Gem, 
  Users, 
  Settings, 
  LogOut, 
  TrendingUp, 
  Clock,
  Eye,
  X,
  MapPin,
  CreditCard,
  User as UserIcon,
  Package,
  CheckCircle,
  Truck,
  Star,
  Calendar
} from "lucide-react";
import { API_URL, getAdminToken, getAuthToken, ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from "../../../utils/api";

// IMPORT YOUR COMPONENTS
import InventoryView from "../Components/InventoryView";
import OrdersView from "../Components/OrdersView";
import AppointmentsView from "../Components/AppointmentsView";
import CustomersView from "../Components/CustomersView";
import SettingsView from "../Components/SettingsView";
import ReviewsView from "../Components/ReviewsView";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<any>(() => {
    try {
      const stored = localStorage.getItem(ADMIN_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState("dashboard");

  // --- NEW: FULLY DYNAMIC STATS STATE ---
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: "...",
    activeUsers: "...",
    newUsersThisWeek: 0,
    totalRevenue: 0,
    pendingOrdersCount: 0
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Protect route
  useEffect(() => {
    if (!admin || admin.role !== 'admin') {
      const stored = localStorage.getItem(ADMIN_USER_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.role === 'admin') {
            setAdmin(parsed);
            return;
          }
        } catch {}
      }
      navigate("/admin-loginxyz", { replace: true });
    }
  }, [admin, navigate]);

  // --- NEW: FETCH LIVE STATS & RECENT ORDERS FROM MONGODB ---
  useEffect(() => {
    const fetchStats = async () => {
      if (!admin) return;

      try {
        const token = getAuthToken();
        const headers = {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        // Fetch all data at once to make it lightning fast
        const [productsRes, usersRes, ordersRes] = await Promise.all([
          fetch(`${API_URL}/products`, { credentials: 'include', headers }),
          fetch(`${API_URL}/users`, { credentials: 'include', headers }),
          fetch(`${API_URL}/orders`, { credentials: 'include', headers })
        ]);

        const productsData = await productsRes.json();
        const usersData = await usersRes.json();
        const ordersData = await ordersRes.json();

        // 1. Calculate Recent Users
        let recentUsersCount = 0;
        if (usersData.success) {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          recentUsersCount = usersData.data.filter((user: any) => new Date(user.createdAt) >= oneWeekAgo).length;
        }

        // 2. Calculate Revenue & Pending Orders
        let calculatedRevenue = 0;
        let pendingCount = 0;
        let latestOrders: any[] = [];

        if (ordersData.success) {
          const allOrders = ordersData.data;
          
          // Calculate total money made (ignoring cancelled orders if you add them later)
          calculatedRevenue = allOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
          
          // Count exact number of "Pending" and "Processing" orders
          pendingCount = allOrders.filter((order: any) => order.orderStatus === 'Pending' || order.orderStatus === 'Processing').length;
          
          // Grab the 5 most recent orders for the dashboard table
          latestOrders = allOrders.slice(0, 5);
        }

        setDashboardStats({
          totalProducts: productsData.success ? productsData.count.toLocaleString() : "0",
          activeUsers: usersData.success ? usersData.count.toLocaleString() : "0",
          newUsersThisWeek: recentUsersCount,
          totalRevenue: calculatedRevenue,
          pendingOrdersCount: pendingCount
        });

        setRecentOrders(latestOrders);

      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, [admin]);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    navigate("/admin-loginxyz", { replace: true });
  };

  const updatePaymentStatus = async (id: string, newPaymentStatus: string) => {
    setRecentOrders((prev) =>
      prev.map((order) =>
        order._id === id
          ? {
              ...order,
              paymentStatus: newPaymentStatus,
              paidAt: newPaymentStatus === "Paid" ? new Date().toISOString() : null,
            }
          : order,
      ),
    );

    if (selectedOrder && selectedOrder._id === id) {
      setSelectedOrder((prev: any) => ({
        ...prev,
        paymentStatus: newPaymentStatus,
        paidAt: newPaymentStatus === "Paid" ? new Date().toISOString() : null,
      }));
    }

    try {
      const token = getAuthToken();
      await fetch(`${API_URL}/orders/${id}/payment-status`, {
        credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  // Helpers
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

  if (!admin) return null; 

  const sidebarLinks = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
    { id: "orders", name: "Orders", icon: ShoppingBag },
    { id: "inventory", name: "Inventory", icon: Gem },
    { id: "appointments", name: "Appointments", icon: Calendar },
    { id: "customers", name: "Customers", icon: Users },
    { id: "reviews", name: "Reviews", icon: Star },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF4] flex flex-col md:flex-row font-jost">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-full md:w-64 bg-[#2A0A10] text-[#F3E9D8] flex flex-col md:min-h-screen shrink-0 sticky top-0 z-40 md:z-auto md:relative shadow-md md:shadow-none">
        <div className="p-4 sm:p-6 border-b border-[#C9A24B]/20 flex items-center justify-between md:justify-center shrink-0">
          <div>
            <h2 className="font-cormorant text-xl sm:text-2xl font-bold text-[#C9A24B]">AJ Jewellers</h2>
            <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase opacity-70">Admin Portal</p>
          </div>
          <button onClick={handleLogout} className="md:hidden text-[#C9A24B] hover:text-red-400 transition-colors p-2 cursor-pointer">
            <LogOut size={20} />
          </button>
        </div>

        <nav className="flex-1 p-2 md:p-4 flex flex-row md:flex-col gap-1 md:gap-2 overflow-x-auto md:overflow-y-auto scrollbar-hide bg-[#2A0A10]">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm tracking-wide transition-colors shrink-0 md:shrink rounded-md md:rounded-none border border-transparent cursor-pointer ${
                  isActive 
                    ? "bg-[#4A0E1B] text-[#C9A24B] border-[#C9A24B]/30" 
                    : "hover:bg-[#4A0E1B]/50 hover:text-[#C9A24B]"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} className="sm:w-[18px] sm:h-[18px]" />
                <span className={`${isActive ? "font-semibold" : "font-normal"} whitespace-nowrap`}>{link.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden md:block p-4 border-t border-[#C9A24B]/20">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm tracking-wide text-red-400 hover:bg-red-400/10 hover:text-red-300 w-full transition-colors rounded-md cursor-pointer"
          >
            <LogOut size={18} />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto w-full max-w-[100vw] md:max-w-none">
        
        {/* VIEW 1: DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <div className="animate-in fade-in duration-500 relative">
            <header className="mb-6 md:mb-10 mt-2 md:mt-0">
              <h1 className="font-cormorant text-3xl sm:text-4xl text-[#4A0E1B] mb-1 sm:mb-2">
                Welcome back, {admin.name}
              </h1>
              <p className="text-[#7A6A5C] text-xs sm:text-sm">Here is your live boutique overview.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
              {/* --- LIVE: REVENUE --- */}
              <div className="bg-white p-5 sm:p-6 border border-[#C9A24B]/30 shadow-sm rounded-sm">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Total Revenue</h3>
                  <div className="bg-[#4A0E1B]/10 p-1.5 sm:p-2 text-[#4A0E1B] rounded-full"><TrendingUp size={14} className="sm:w-4 sm:h-4" /></div>
                </div>
                <p className="font-cormorant text-2xl sm:text-3xl text-[#4A0E1B]">{formatINR(dashboardStats.totalRevenue)}</p>
                <p className="text-[10px] sm:text-xs text-green-700 mt-1 sm:mt-2 font-medium">Verified by database</p>
              </div>

              {/* --- LIVE: PENDING ORDERS --- */}
              <div className="bg-white p-5 sm:p-6 border border-[#C9A24B]/30 shadow-sm rounded-sm">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Pending Orders</h3>
                  <div className="bg-[#C9A24B]/10 p-1.5 sm:p-2 text-[#C9A24B] rounded-full"><Clock size={14} className="sm:w-4 sm:h-4" /></div>
                </div>
                <p className="font-cormorant text-2xl sm:text-3xl text-[#4A0E1B]">{dashboardStats.pendingOrdersCount}</p>
                <p className="text-[10px] sm:text-xs text-[#7A6A5C] mt-1 sm:mt-2">Require immediate action</p>
              </div>

              {/* --- LIVE: TOTAL PRODUCTS --- */}
              <div className="bg-white p-5 sm:p-6 border border-[#C9A24B]/30 shadow-sm rounded-sm">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Total Products</h3>
                  <div className="bg-[#4A0E1B]/10 p-1.5 sm:p-2 text-[#4A0E1B] rounded-full"><Gem size={14} className="sm:w-4 sm:h-4" /></div>
                </div>
                <p className="font-cormorant text-2xl sm:text-3xl text-[#4A0E1B]">{dashboardStats.totalProducts}</p>
                <p className="text-[10px] sm:text-xs text-[#7A6A5C] mt-1 sm:mt-2">Active in catalogue</p>
              </div>

              {/* --- LIVE: ACTIVE USERS --- */}
              <div className="bg-white p-5 sm:p-6 border border-[#C9A24B]/30 shadow-sm rounded-sm">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <h3 className="text-[10px] sm:text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Active Users</h3>
                  <div className="bg-[#4A0E1B]/10 p-1.5 sm:p-2 text-[#4A0E1B] rounded-full"><Users size={14} className="sm:w-4 sm:h-4" /></div>
                </div>
                <p className="font-cormorant text-2xl sm:text-3xl text-[#4A0E1B]">{dashboardStats.activeUsers}</p>
                <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium ${dashboardStats.newUsersThisWeek > 0 ? 'text-green-700' : 'text-[#7A6A5C]'}`}>
                  +{dashboardStats.newUsersThisWeek} new this week
                </p>
              </div>
            </div>

            {/* --- LIVE: RECENT ORDERS TABLE --- */}
            <div className="bg-white border border-[#C9A24B]/30 shadow-sm rounded-sm w-full">
              <div className="p-4 sm:p-6 border-b border-[#C9A24B]/20 flex justify-between items-center">
                <h2 className="font-cormorant text-xl sm:text-2xl text-[#4A0E1B]">Recent Orders</h2>
                <button onClick={() => setActiveTab("orders")} className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-[#C9A24B] hover:text-[#4A0E1B] font-semibold transition-colors cursor-pointer">
                  View All Orders
                </button>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                  <thead>
                    <tr className="bg-[#FDFBF4] text-[10px] sm:text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase border-b border-[#C9A24B]/20">
                      <th className="p-3 sm:p-4 font-semibold">Order ID</th>
                      <th className="p-3 sm:p-4 font-semibold">Customer</th>
                      <th className="p-3 sm:p-4 font-semibold">Date</th>
                      <th className="p-3 sm:p-4 font-semibold">Total</th>
                      <th className="p-3 sm:p-4 font-semibold">Status</th>
                      <th className="p-3 sm:p-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs sm:text-sm">
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#7A6A5C] font-jost">
                          No recent orders found.
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => {
                        const shortId = `AJ-${order._id.slice(-6).toUpperCase()}`;
                        const { dateStr } = formatDateTime(order.createdAt);
                        return (
                          <tr key={order._id} className="border-b border-[#C9A24B]/10 hover:bg-[#FDFBF4]/50 transition-colors">
                            <td className="p-3 sm:p-4 font-medium text-[#4A0E1B]">{shortId}</td>
                            <td className="p-3 sm:p-4 text-[#4A0E1B]">{order.customerName}</td>
                            <td className="p-3 sm:p-4 text-[#7A6A5C]">{dateStr}</td>
                            <td className="p-3 sm:p-4 text-[#4A0E1B] font-medium">{formatINR(order.totalAmount)}</td>
                            <td className="p-3 sm:p-4">
                              <span className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] tracking-wider uppercase font-semibold border rounded-sm ${
                                order.orderStatus === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                order.orderStatus === 'Processing' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                order.orderStatus === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-green-50 text-green-700 border-green-200'
                              }`}>
                                {order.orderStatus}
                              </span>
                              <span className={`ml-1.5 px-2 py-0.5 text-[9px] tracking-wider uppercase font-semibold border rounded-sm ${
                                order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {order.paymentStatus === 'Paid' ? 'PAID' : 'PENDING'}
                              </span>
                            </td>
                            <td className="p-3 sm:p-4 text-right">
                              <button 
                                onClick={() => setSelectedOrder(order)} 
                                className="text-[#C9A24B] hover:text-[#4A0E1B] transition-colors p-1.5 cursor-pointer border border-transparent hover:border-[#C9A24B]/30 rounded-sm bg-white inline-flex"
                                title="View Full Order Details"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- THE ORDER DETAIL MODAL (BUILT INTO DASHBOARD) --- */}
            {selectedOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-[#FDFBF4] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border border-[#C9A24B]/30 relative text-left">
                  <div className="sticky top-0 bg-[#FDFBF4] border-b border-[#C9A24B]/20 p-5 md:p-6 flex justify-between items-center z-10">
                    <div>
                      <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B]">Order Details</h2>
                      <p className="font-jost text-xs text-[#7A6A5C] mt-1 tracking-widest uppercase">
                        ID: AJ-{selectedOrder._id.slice(-6).toUpperCase()} &middot; {formatDateTime(selectedOrder.createdAt).dateStr}
                      </p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="text-[#7A6A5C] hover:text-red-700 transition-colors p-2 bg-white rounded-full border border-transparent hover:border-red-200 cursor-pointer">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-5 md:p-6 space-y-6 md:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-5 border border-[#C9A24B]/20 shadow-sm rounded-sm space-y-3">
                        <div className="flex items-center gap-2 text-[#C9A24B] mb-2 border-b border-[#EAE3D5] pb-2"><UserIcon size={16} /><h3 className="font-jost text-xs tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">Customer</h3></div>
                        <p className="font-jost text-sm text-[#4A0E1B]"><span className="text-[#7A6A5C]">Name:</span> {selectedOrder.customerName}</p>
                        <p className="font-jost text-sm text-[#4A0E1B]"><span className="text-[#7A6A5C]">Email:</span> {selectedOrder.email}</p>
                        <p className="font-jost text-sm text-[#4A0E1B]"><span className="text-[#7A6A5C]">Phone:</span> {selectedOrder.phone}</p>
                      </div>
                      <div className="bg-white p-5 border border-[#C9A24B]/20 shadow-sm rounded-sm space-y-3">
                        <div className="flex items-center gap-2 text-[#C9A24B] mb-2 border-b border-[#EAE3D5] pb-2"><MapPin size={16} /><h3 className="font-jost text-xs tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">Delivery</h3></div>
                        <p className="font-jost text-sm text-[#4A0E1B]"><span className="text-[#7A6A5C]">City:</span> {selectedOrder.city} ({selectedOrder.pincode})</p>
                        <div className="font-jost text-sm text-[#4A0E1B] flex items-start gap-1"><span className="text-[#7A6A5C] shrink-0">Address:</span><span className="whitespace-pre-wrap">{selectedOrder.address}</span></div>
                      </div>
                    </div>
                    <div className="bg-white p-5 border border-[#C9A24B]/20 shadow-sm rounded-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CreditCard size={20} className="text-[#C9A24B]" />
                        <div>
                          <p className="font-jost text-[10px] tracking-widest text-[#7A6A5C] uppercase">Payment Method</p>
                          <p className="font-medium text-[#4A0E1B] capitalize">{selectedOrder.paymentMethod === 'boutique' ? 'Pay at Boutique' : selectedOrder.paymentMethod}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 text-xs tracking-wider uppercase font-semibold border rounded-sm text-center ${selectedOrder.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                        {selectedOrder.paymentStatus === 'Paid' ? 'PAID' : 'PENDING'}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedOrder.paymentStatus || 'Pending'}
                          onChange={(e) => updatePaymentStatus(selectedOrder._id, e.target.value)}
                          className="bg-white border border-[#C9A24B]/40 px-2.5 py-1.5 text-xs font-jost outline-none focus:border-[#C9A24B] cursor-pointer rounded-sm text-[#4A0E1B]"
                        >
                          <option value="Paid">Mark Paid</option>
                          <option value="Pending">Mark Pending</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-[#C9A24B] mb-4"><Package size={18} /><h3 className="font-jost text-sm tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">Purchased Items</h3></div>
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
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: INVENTORY */}
        {activeTab === "inventory" && <InventoryView />}
        {/* VIEW 3: ORDERS */}
        {activeTab === "orders" && <OrdersView />}
        {/* VIEW 4: APPOINTMENTS */}
        {activeTab === "appointments" && <AppointmentsView />}
        {/* VIEW 5: CUSTOMERS */}
        {activeTab === "customers" && <CustomersView />}
        {/* VIEW 6: REVIEWS */}
        {activeTab === "reviews" && <ReviewsView />}
        {/* VIEW 7: SETTINGS */}
        {activeTab === "settings" && <SettingsView />}

      </main>
    </div>
  );
}