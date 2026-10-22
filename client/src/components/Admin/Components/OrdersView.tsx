import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  Truck,
  Clock,
  X,
  MapPin,
  CreditCard,
  User,
  Package,
  Mail,
  Upload,
  FileText,
  ShieldCheck,
  DollarSign,
  ExternalLink,
  AlertTriangle,
  FileCheck,
  Navigation,
} from "lucide-react";
import { useToast } from "../../../components/Common/context/ToastContext";
import { API_URL, getAdminToken, getAuthToken } from "../../../utils/api";
import GoogleDeliveryMap from "../../Common/GoogleDeliveryMap";

export default function OrdersView() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Orders");

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSendingDeliveryEmail, setIsSendingDeliveryEmail] = useState(false);

  // --- PAYMENT EVIDENCE & VERIFICATION STATES ---
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceRef, setEvidenceRef] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    paymentStatus: "Paid",
    paymentReference: "",
    amountPaid: 0,
    internalAdminNote: ""
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/orders`, {
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      } else {
        showToast("Failed to fetch orders from database.", "error");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      showToast("Server connection error.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === id ? { ...order, orderStatus: newStatus } : order,
      ),
    );

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/orders/${id}`, {
        credentials: 'include',
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await response.json();
      if (!data.success) {
        showToast("Failed to update status: " + data.message, "error");
        fetchOrders();
      } else {
        if (data.deliveryEmailSent) {
          showToast(`Order Delivered & final invoice emailed to customer!`, "success");
        } else {
          showToast(`Order marked as ${newStatus}`, "success");
        }
        if (data.data) {
          setOrders((prev) => prev.map((o) => (o._id === id ? data.data : o)));
          if (selectedOrder && selectedOrder._id === id) {
            setSelectedOrder(data.data);
          }
        }
      }
    } catch (error) {
      console.error("Error updating order:", error);
      showToast("Network error while updating.", "error");
      fetchOrders();
    }
  };

  const updateReturnStatus = async (id: string, newStatus: string, adminResponse?: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/orders/${id}/return-status`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus, adminResponse }),
      });
      const data = await response.json();
      if (!data.success) {
        showToast("Failed to update return status: " + data.message, "error");
      } else {
        showToast(`Return request marked as ${newStatus}`, "success");
        if (newStatus === 'Rejected') {
           setRejectingOrderId(null);
           setRejectReason("");
        }
        fetchOrders();
        if (selectedOrder && selectedOrder._id === id) {
          setSelectedOrder({
            ...selectedOrder,
            returnRequest: { ...selectedOrder.returnRequest, status: newStatus, adminResponse }
          });
        }
      }
    } catch (error) {
      console.error("Error updating return status:", error);
      showToast("Network error while updating.", "error");
    }
  };

  const updatePaymentStatus = async (id: string, newPaymentStatus: string) => {
    setOrders((prev) =>
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
      const response = await fetch(`${API_URL}/orders/${id}/payment-status`, {
        credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      const data = await response.json();
      if (!data.success) {
        showToast("Failed to update payment status: " + data.message, "error");
        fetchOrders();
      } else {
        if (data.deliveryEmailSent) {
          showToast(`Payment marked as Paid & final delivery invoice emailed!`, "success");
        } else {
          showToast(`Payment marked as ${newPaymentStatus}`, "success");
        }
        if (data.data) {
          setOrders((prev) => prev.map((o) => (o._id === id ? data.data : o)));
          if (selectedOrder && selectedOrder._id === id) {
            setSelectedOrder(data.data);
          }
        }
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      showToast("Network error while updating payment status.", "error");
      fetchOrders();
    }
  };

  const resendDeliveryEmail = async (id: string) => {
    setIsSendingDeliveryEmail(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/orders/${id}/resend-delivery-email`, {
        method: "POST",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (data.success) {
        showToast(data.message || "Final delivery invoice emailed to customer!", "success");
        fetchOrders();
        if (selectedOrder && selectedOrder._id === id) {
          setSelectedOrder((prev: any) => ({
            ...prev,
            deliveredEmailSent: true,
            deliveredEmailSentAt: new Date().toISOString()
          }));
        }
      } else {
        showToast("Failed to send email: " + data.message, "error");
      }
    } catch (err) {
      showToast("Server error while sending email", "error");
    } finally {
      setIsSendingDeliveryEmail(false);
    }
  };

  const handleUploadEvidence = async (orderId: string) => {
    if (!evidenceFile) {
      showToast("Please choose an evidence file (Image or PDF).", "error");
      return;
    }
    setIsUploadingEvidence(true);
    try {
      const formData = new FormData();
      formData.append("evidence", evidenceFile);
      if (evidenceRef) formData.append("transactionReference", evidenceRef);

      const token = getAdminToken() || getAuthToken();
      const res = await fetch(`${API_URL}/orders/${orderId}/payment-evidence`, {
        method: "POST",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        showToast("Payment evidence attached! Status set to Awaiting Verification.", "success");
        setEvidenceFile(null);
        setEvidenceRef("");
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data);
        }
      } else {
        showToast(data.message || "Upload failed.", "error");
      }
    } catch (err: any) {
      console.error("Evidence upload error:", err);
      showToast("Server error during upload.", "error");
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    try {
      const token = getAdminToken() || getAuthToken();
      const res = await fetch(`${API_URL}/orders/${orderId}/verify-payment`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(verifyForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Payment status updated successfully!", "success");
        setShowVerifyModal(false);
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data);
        }
      } else {
        showToast(data.message || "Verification failed.", "error");
      }
    } catch (err: any) {
      console.error("Verify payment error:", err);
      showToast("Server error during verification.", "error");
    }
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { dateStr: "N/A", timeStr: "" };
    const date = new Date(dateString);
    return {
      dateStr: date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      timeStr: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const filteredOrders = orders.filter((order) => {
    const shortId = order._id.slice(-6).toUpperCase();
    const matchesSearch =
      (order.customerName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      shortId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All Orders" || (statusFilter === "Returns/Resizes" ? (order.returnRequest && order.returnRequest.type !== 'None') : order.orderStatus === statusFilter);
    return matchesSearch && matchesStatus;
  });

  // Orders KPI Metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "Pending" || o.paymentStatus !== "Paid"
  ).length;
  const inProgressOrders = orders.filter(
    (o) => o.orderStatus === "Processing" || o.orderStatus === "Shipped"
  ).length;
  const deliveredOrders = orders.filter(
    (o) => o.orderStatus === "Delivered"
  ).length;

  return (
    <div className="animate-in fade-in duration-500 relative">
      <header className="mb-6 md:mb-8 mt-2 md:mt-0">
        <h1 className="font-cormorant text-3xl sm:text-4xl text-[#4A0E1B] mb-1">
          Order Management
        </h1>
        <p className="text-[#7A6A5C] text-xs sm:text-sm">
          Process pending orders, update shipping statuses, and view history.
        </p>
      </header>

      {/* METRICS ROW (Matching Boutique Reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Total Orders</h3>
            <div className="bg-[#4A0E1B]/10 p-2 text-[#4A0E1B] rounded-full">
              <Package size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-[#4A0E1B]">{totalOrders}</p>
          <p className="text-xs text-[#7A6A5C] mt-1">All recorded boutique orders</p>
        </div>

        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Pending Action</h3>
            <div className="bg-amber-100 p-2 text-amber-800 rounded-full">
              <Clock size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-amber-700">{pendingOrders}</p>
          <p className="text-xs text-amber-700 mt-1 font-medium">Requires review or payment</p>
        </div>

        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">In Progress</h3>
            <div className="bg-blue-100 p-2 text-blue-800 rounded-full">
              <Truck size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-blue-700">{inProgressOrders}</p>
          <p className="text-xs text-blue-700 mt-1 font-medium">Workshop or in transit</p>
        </div>

        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Delivered</h3>
            <div className="bg-green-100 p-2 text-green-800 rounded-full">
              <CheckCircle size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-green-700">{deliveredOrders}</p>
          <p className="text-xs text-green-700 mt-1 font-medium">Concluded and fulfilled</p>
        </div>
      </div>

      {/* --- CONTROLS --- */}
      <div className="bg-white p-4 border border-[#C9A24B]/30 shadow-sm rounded-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A5C]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or Customer..."
            className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 pl-9 pr-4 py-2 text-sm font-jost outline-none focus:border-[#C9A24B] transition-colors rounded-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto bg-[#FDFBF4] border border-[#C9A24B]/40 px-3 py-2 text-sm font-jost outline-none focus:border-[#C9A24B] cursor-pointer rounded-sm text-[#4A0E1B]"
        >
          <option value="All Orders">All Orders</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Returns/Resizes">Returns/Resizes</option>
        </select>
      </div>

      {/* --- ORDERS TABLE --- */}
      <div className="bg-white border border-[#C9A24B]/30 shadow-sm rounded-sm w-full overflow-hidden">
        <div className="overflow-x-auto w-full">
          {isLoading ? (
            <div className="p-10 text-center text-[#7A6A5C] font-jost animate-pulse">
              Loading orders from database...
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="bg-[#FDFBF4] text-[10px] sm:text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase border-b border-[#C9A24B]/20">
                  <th className="p-3 sm:p-4 font-semibold">Order Details</th>
                  <th className="p-3 sm:p-4 font-semibold">Customer</th>
                  <th className="p-3 sm:p-4 font-semibold">Total</th>
                  <th className="p-3 sm:p-4 font-semibold">Status</th>
                  <th className="p-3 sm:p-4 font-semibold">Return / Exchange</th>
                  <th className="p-3 sm:p-4 font-semibold">Payment</th>
                  <th className="p-3 sm:p-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#7A6A5C] font-jost">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const shortId = `AJ-${order._id.slice(-6).toUpperCase()}`;
                    const totalItems = order.items.reduce(
                      (sum: number, item: any) => sum + item.quantity,
                      0,
                    );
                    const { dateStr, timeStr } = formatDateTime(order.createdAt);

                    return (
                      <tr
                        key={order._id}
                        className="border-b border-[#C9A24B]/10 hover:bg-[#FDFBF4]/50 transition-colors"
                      >
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-[#4A0E1B] text-[13px]">
                              {shortId}
                            </span>
                            <span className="text-[10px] text-[#7A6A5C] mt-0.5">
                              {dateStr} • {totalItems} Item
                              {totalItems !== 1 ? "s" : ""}
                            </span>
                            <span className="text-[9px] text-[#C9A24B] font-medium mt-0.5">
                              {timeStr}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col">
                            <span className="text-[#4A0E1B]">
                              {order.customerName}
                            </span>
                            <span className="text-[10px] text-[#7A6A5C] mt-0.5">
                              {order.email}
                            </span>
                            {order.deliveryLocation?.lat && order.deliveryLocation?.lng && (
                              <a
                                href={order.deliveryLocation.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-[#4A0E1B] font-medium mt-1 w-fit bg-[#C9A24B]/15 hover:bg-[#C9A24B]/30 px-1.5 py-0.5 rounded border border-[#C9A24B]/30 transition-colors"
                                title="Open GPS Turn-by-Turn Navigation in Google Maps"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Navigation size={10} className="text-[#C9A24B]" />
                                GPS Nav ({order.deliveryLocation.lat.toFixed(4)}, {order.deliveryLocation.lng.toFixed(4)})
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-[#4A0E1B] font-medium">
                          {formatINR(order.totalAmount)}
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-1.5">
                            {order.orderStatus === "Pending" && (
                              <Clock size={14} className="text-yellow-600" />
                            )}
                            {order.orderStatus === "Processing" && (
                              <Clock size={14} className="text-orange-600" />
                            )}
                            {order.orderStatus === "Shipped" && (
                              <Truck size={14} className="text-blue-600" />
                            )}
                            {order.orderStatus === "Delivered" && (
                              <CheckCircle size={14} className="text-green-600" />
                            )}
                            <span
                              className={`px-2 py-0.5 text-[9px] tracking-wider uppercase font-semibold border rounded-sm ${
                                order.orderStatus === "Pending"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : order.orderStatus === "Processing"
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : order.orderStatus === "Shipped"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-green-50 text-green-700 border-green-200"
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                            </div>
                            </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          {order.returnRequest && order.returnRequest.type !== 'None' ? (
                            <span className="px-2 py-0.5 text-[9px] tracking-wider uppercase font-semibold border rounded-sm bg-purple-50 text-purple-700 border-purple-200 text-center">
                              {order.returnRequest.type}: {order.returnRequest.status}
                            </span>
                          ) : (
                            <span className="text-[#C9A24B]/50 font-bold">-</span>
                          )}
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-2 py-0.5 text-[9px] tracking-wider uppercase font-semibold border rounded-sm ${
                                  order.paymentStatus === "Paid"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {order.paymentStatus === "Paid" ? "PAID" : "PENDING"}
                              </span>
                              <span
                                className="text-[10px] text-[#7A6A5C] truncate max-w-[85px]"
                                title={order.paymentMethod}
                              >
                                {order.paymentMethod === "boutique" ? "Boutique" : order.paymentMethod}
                              </span>
                            </div>
                            <select
                              value={order.paymentStatus || "Pending"}
                              onChange={(e) =>
                                updatePaymentStatus(order._id, e.target.value)
                              }
                              className="bg-transparent border border-[#C9A24B]/40 px-2 py-1 text-[11px] font-jost outline-none focus:border-[#C9A24B] cursor-pointer rounded-sm text-[#4A0E1B]"
                            >
                              <option value="Paid">Mark Paid</option>
                              <option value="Pending">Mark Pending</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={order.orderStatus}
                              onChange={(e) =>
                                updateOrderStatus(order._id, e.target.value)
                              }
                              className="bg-transparent border border-[#C9A24B]/40 px-2 py-1.5 text-[11px] font-jost outline-none focus:border-[#C9A24B] cursor-pointer rounded-sm text-[#4A0E1B]"
                            >
                              <option value="Pending">Mark Pending</option>
                              <option value="Processing">Mark Processing</option>
                              <option value="Shipped">Mark Shipped</option>
                              <option value="Delivered">Mark Delivered</option>
                            </select>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-[#C9A24B] hover:text-[#4A0E1B] transition-colors p-1.5 cursor-pointer border border-transparent hover:border-[#C9A24B]/30 rounded-sm bg-white"
                              title="View Full Order Details"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- FULL SCREEN ORDER DETAIL MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FDFBF4] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border border-[#C9A24B]/30 relative">
            <div className="sticky top-0 bg-[#FDFBF4] border-b border-[#C9A24B]/20 p-5 md:p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B]">
                  Order Details
                </h2>
                <p className="font-jost text-xs text-[#7A6A5C] mt-1 tracking-widest uppercase">
                  ID: AJ-{selectedOrder._id.slice(-6).toUpperCase()} &middot;{" "}
                  {formatDateTime(selectedOrder.createdAt).dateStr}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#7A6A5C] hover:text-red-700 transition-colors p-2 bg-white rounded-full border border-transparent hover:border-red-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 border border-[#C9A24B]/20 shadow-sm rounded-sm space-y-3">
                  <div className="flex items-center gap-2 text-[#C9A24B] mb-2 border-b border-[#EAE3D5] pb-2">
                    <User size={16} />
                    <h3 className="font-jost text-xs tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">
                      Customer
                    </h3>
                  </div>
                  <p className="font-jost text-sm text-[#4A0E1B]">
                    <span className="text-[#7A6A5C]">Name:</span>{" "}
                    {selectedOrder.customerName}
                  </p>
                  <p className="font-jost text-sm text-[#4A0E1B]">
                    <span className="text-[#7A6A5C]">Email:</span>{" "}
                    {selectedOrder.email}
                  </p>
                  <p className="font-jost text-sm text-[#4A0E1B]">
                    <span className="text-[#7A6A5C]">Phone:</span>{" "}
                    {selectedOrder.phone}
                  </p>
                </div>

                <div className="bg-white p-5 border border-[#C9A24B]/20 shadow-sm rounded-sm space-y-3">
                  <div className="flex items-center gap-2 text-[#C9A24B] mb-2 border-b border-[#EAE3D5] pb-2">
                    <MapPin size={16} />
                    <h3 className="font-jost text-xs tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">
                      Delivery
                    </h3>
                  </div>
                  <p className="font-jost text-sm text-[#4A0E1B]">
                    <span className="text-[#7A6A5C]">City:</span>{" "}
                    {selectedOrder.city} ({selectedOrder.pincode})
                  </p>
                  <div className="font-jost text-sm text-[#4A0E1B] flex items-start gap-1">
                    <span className="text-[#7A6A5C] shrink-0">Address:</span>
                    <span className="whitespace-pre-wrap">
                      {selectedOrder.address}
                    </span>
                  </div>
                  {selectedOrder.deliveryLocation?.landmark && (
                    <div className="font-jost text-xs text-[#4A0E1B] flex items-start gap-1 bg-[#FDFBF4] p-2 border border-[#C9A24B]/20 rounded-sm mt-1">
                      <span className="text-[#C9A24B] font-semibold shrink-0">Landmark / Gate:</span>
                      <span>{selectedOrder.deliveryLocation.landmark}</span>
                    </div>
                  )}
                  {selectedOrder.deliveredAt && (
                    <p className="font-jost text-xs text-green-700 font-medium pt-1 border-t border-[#EAE3D5]/50">
                      Delivered on: {formatDateTime(selectedOrder.deliveredAt).dateStr} &middot; {formatDateTime(selectedOrder.deliveredAt).timeStr}
                    </p>
                  )}
                </div>
              </div>

              {/* --- DOORSTEP GPS PINPOINT & GOOGLE MAPS NAVIGATION CARD --- */}
              {selectedOrder.deliveryLocation?.lat && selectedOrder.deliveryLocation?.lng ? (
                <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3D5] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#C9A24B]/10 border border-[#C9A24B]/30 flex items-center justify-center shrink-0">
                        <Navigation size={15} className="text-[#C9A24B]" />
                      </div>
                      <div>
                        <h4 className="font-jost text-xs tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">
                          Doorstep Pinpoint &amp; Courier Navigation
                        </h4>
                        <p className="font-jost text-[11px] text-[#7A6A5C]">
                          Exact coordinates: {selectedOrder.deliveryLocation.lat.toFixed(5)}, {selectedOrder.deliveryLocation.lng.toFixed(5)}
                        </p>
                      </div>
                    </div>

                    <a
                      href={selectedOrder.deliveryLocation.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.deliveryLocation.lat},${selectedOrder.deliveryLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 bg-[#4A0E1B] text-[#FDFBF4] hover:bg-[#C9A24B] px-3.5 py-2 text-xs font-jost uppercase tracking-wider rounded-sm transition-colors shadow-sm shrink-0"
                    >
                      <Navigation size={13} />
                      Start Google Maps Navigation
                    </a>
                  </div>

                  <div className="rounded-sm overflow-hidden border border-[#C9A24B]/20">
                    <GoogleDeliveryMap
                      lat={selectedOrder.deliveryLocation.lat}
                      lng={selectedOrder.deliveryLocation.lng}
                      landmark={selectedOrder.deliveryLocation.landmark}
                      readOnly={true}
                      height="240px"
                      zoom={16}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 border border-dashed border-[#C9A24B]/30 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-jost">
                  <div className="flex items-center gap-2 text-[#7A6A5C]">
                    <MapPin size={16} className="text-[#C9A24B] shrink-0" />
                    <span>Order placed without GPS coordinates. You can still navigate via street address in Google Maps.</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedOrder.address}, ${selectedOrder.city} ${selectedOrder.pincode}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#C9A24B] hover:text-[#4A0E1B] font-semibold underline underline-offset-2 shrink-0"
                  >
                    Open Street Address in Maps
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Return Request Section */}
              {selectedOrder.returnRequest && selectedOrder.returnRequest.type !== 'None' && (
                <div className="bg-purple-50 p-5 border border-purple-200 shadow-sm rounded-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                    <h3 className="font-jost text-sm tracking-[0.15em] uppercase font-semibold text-purple-900">
                      {selectedOrder.returnRequest.type} Request
                    </h3>
                    <span className={`px-3 py-1 text-[10px] tracking-wider uppercase font-semibold rounded-sm border ${selectedOrder.returnRequest.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : selectedOrder.returnRequest.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                      {selectedOrder.returnRequest.status}
                    </span>
                  </div>
                  <div className="font-jost text-sm text-purple-900">
                    <p><span className="font-semibold">User Reason:</span> {selectedOrder.returnRequest.reason}</p>
                    {selectedOrder.returnRequest.adminResponse && (
                      <p className="mt-2 p-2 bg-purple-100 rounded-sm border border-purple-200">
                        <span className="font-semibold text-purple-950">Admin Response:</span> {selectedOrder.returnRequest.adminResponse}
                      </p>
                    )}
                    <p className="mt-2 text-xs opacity-80">Requested on: {formatDateTime(selectedOrder.returnRequest.requestDate).dateStr}</p>
                  </div>
                  <div className="flex gap-2 pt-2 flex-col">
                    {rejectingOrderId === selectedOrder._id ? (
                      <div className="space-y-2">
                        <textarea
                          placeholder="Please provide a reason for rejection..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full text-sm font-jost border border-purple-200 p-2 rounded-sm outline-none focus:border-purple-400 min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => updateReturnStatus(selectedOrder._id, 'Rejected', rejectReason)} className="bg-red-600 text-white px-4 py-2 text-xs uppercase tracking-wider rounded-sm hover:bg-red-700 transition-colors cursor-pointer shadow-sm">Confirm Reject</button>
                          <button onClick={() => { setRejectingOrderId(null); setRejectReason(""); }} className="bg-gray-200 text-gray-700 px-4 py-2 text-xs uppercase tracking-wider rounded-sm hover:bg-gray-300 transition-colors cursor-pointer shadow-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {selectedOrder.returnRequest.status === 'Pending' && (
                          <>
                            <button onClick={() => updateReturnStatus(selectedOrder._id, 'Approved')} className="bg-green-600 text-white px-4 py-2 text-xs uppercase tracking-wider rounded-sm hover:bg-green-700 transition-colors cursor-pointer shadow-sm">Approve</button>
                            <button onClick={() => setRejectingOrderId(selectedOrder._id)} className="bg-red-600 text-white px-4 py-2 text-xs uppercase tracking-wider rounded-sm hover:bg-red-700 transition-colors cursor-pointer shadow-sm">Reject</button>
                          </>
                        )}
                        {selectedOrder.returnRequest.status === 'Approved' && (
                          <button onClick={() => updateReturnStatus(selectedOrder._id, 'Completed')} className="bg-purple-700 text-white px-4 py-2 text-xs uppercase tracking-wider rounded-sm hover:bg-purple-800 transition-colors cursor-pointer shadow-sm">Mark as Completed</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* COMPREHENSIVE PAYMENT MANAGEMENT & VERIFICATION (Section 4.A & Section 10) */}
              <div className="bg-[#FDFBF4] border border-[#C9A24B]/30 p-5 rounded-sm shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-[#C9A24B]/20">
                  <div className="flex items-center gap-2">
                    <CreditCard size={20} className="text-[#C9A24B]" />
                    <div>
                      <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B]">Payment Verification &amp; Evidence</h4>
                      <p className="font-jost text-[11px] text-[#7A6A5C]">
                        Cash settlements &amp; external bank/UPI receipts verified by administrator
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-xs tracking-wider uppercase font-semibold border rounded-sm ${
                        selectedOrder.paymentStatus === "Paid"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : selectedOrder.paymentStatus === "Awaiting Verification"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      }`}
                    >
                      {selectedOrder.paymentStatus || "PENDING"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyForm({
                          paymentStatus: selectedOrder.paymentStatus === "Paid" ? "Paid" : "Paid",
                          paymentReference: selectedOrder.paymentReference || "",
                          amountPaid: selectedOrder.amountPaid || selectedOrder.totalAmount,
                          internalAdminNote: ""
                        });
                        setShowVerifyModal(true);
                      }}
                      className="bg-[#4A0E1B] text-[#FDFBF4] hover:bg-[#380A14] px-3.5 py-1.5 text-xs font-jost uppercase tracking-wider transition-colors rounded-sm shadow-sm flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      <ShieldCheck size={14} className="text-[#C9A24B]" />
                      Verify Payment
                    </button>
                  </div>
                </div>

                {/* Payment Overview Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-jost bg-white p-3.5 border border-[#EAE3D5] rounded-sm">
                  <div>
                    <span className="text-[#7A6A5C] text-[10px] uppercase block tracking-wider">Method</span>
                    <span className="font-semibold text-[#4A0E1B]">
                      {selectedOrder.paymentMethod === 'bank_transfer'
                        ? 'Bank Transfer / UPI'
                        : selectedOrder.paymentMethod === 'boutique'
                        ? 'Pay at Boutique'
                        : 'Cash on Delivery'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7A6A5C] text-[10px] uppercase block tracking-wider">Payable Total</span>
                    <span className="font-semibold text-[#4A0E1B]">{formatINR(selectedOrder.totalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[#7A6A5C] text-[10px] uppercase block tracking-wider">Amount Confirmed</span>
                    <span className="font-semibold text-green-800">
                      {selectedOrder.amountPaid ? formatINR(selectedOrder.amountPaid) : '₹0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7A6A5C] text-[10px] uppercase block tracking-wider">Reference / UTR</span>
                    <span className="font-mono text-[#4A0E1B] truncate block">
                      {selectedOrder.paymentReference || 'None'}
                    </span>
                  </div>
                  {selectedOrder.paidAt && (
                    <div className="col-span-2 sm:col-span-4 pt-2 border-t border-gray-100 flex items-center gap-2 text-green-700 text-[11px]">
                      <CheckCircle size={13} className="shrink-0" />
                      <span>
                        Verified on {formatDateTime(selectedOrder.paidAt).dateStr} at {formatDateTime(selectedOrder.paidAt).timeStr}
                      </span>
                    </div>
                  )}
                </div>

                {/* Evidence Upload & Attachments */}
                <div className="bg-white p-4 border border-[#EAE3D5] rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-jost text-xs uppercase tracking-wider font-semibold text-[#4A0E1B] flex items-center gap-1.5">
                      <FileText size={15} className="text-[#C9A24B]" />
                      Payment Evidence &amp; Receipts ({selectedOrder.evidence?.length || 0})
                    </span>
                  </div>

                  {/* Upload Form */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => setEvidenceFile(e.target.files ? e.target.files[0] : null)}
                      className="text-xs font-jost text-[#7A6A5C] file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-jost file:bg-[#4A0E1B] file:text-[#FDFBF4] file:rounded-sm file:cursor-pointer cursor-pointer border border-[#C9A24B]/30 p-1 rounded-sm w-full sm:w-auto flex-1"
                    />
                    <input
                      type="text"
                      placeholder="Transaction Ref / UTR / Cheque #"
                      value={evidenceRef}
                      onChange={(e) => setEvidenceRef(e.target.value)}
                      className="border border-[#C9A24B]/30 px-3 py-1.5 text-xs font-jost outline-none focus:border-[#C9A24B] rounded-sm w-full sm:w-48 text-[#4A0E1B]"
                    />
                    <button
                      type="button"
                      disabled={isUploadingEvidence || !evidenceFile}
                      onClick={() => handleUploadEvidence(selectedOrder._id)}
                      className="bg-[#C9A24B] text-[#2A0A10] hover:bg-[#b08d40] px-4 py-1.5 text-xs font-jost uppercase tracking-wider font-semibold transition-colors rounded-sm shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      <Upload size={13} />
                      {isUploadingEvidence ? "Uploading..." : "Attach Proof"}
                    </button>
                  </div>

                  {/* List of Attached Evidence */}
                  {selectedOrder.evidence && selectedOrder.evidence.length > 0 ? (
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-sm mt-2">
                      {selectedOrder.evidence.map((ev: any, idx: number) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs font-jost hover:bg-[#FDFBF4]">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileCheck size={16} className="text-[#C9A24B] shrink-0" />
                            <div className="truncate">
                              <p className="font-medium text-[#4A0E1B] truncate">{ev.originalName}</p>
                              <p className="text-[10px] text-[#7A6A5C]">
                                {formatDateTime(ev.uploadedAt).dateStr} &middot; {(ev.size / 1024).toFixed(0)} KB {ev.transactionReference ? `&middot; Ref: ${ev.transactionReference}` : ''}
                              </p>
                            </div>
                          </div>
                          <a
                            href={`${API_URL}/orders/${selectedOrder._id}/payment-evidence/${ev.filename}${getAuthToken() ? `?token=${getAuthToken()}` : ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#C9A24B] hover:text-[#4A0E1B] font-jost text-[11px] uppercase tracking-wider flex items-center gap-1 font-semibold ml-2 shrink-0"
                          >
                            <ExternalLink size={12} />
                            View Proof
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] font-jost text-[#7A6A5C] italic pt-1">
                      No payment receipt or screenshot uploaded yet. Upload evidence before confirming payment.
                    </p>
                  )}
                </div>

                {/* Audit Trail / Payment History */}
                {selectedOrder.history && selectedOrder.history.length > 0 && (
                  <div className="bg-white p-3.5 border border-[#EAE3D5] rounded-sm">
                    <p className="font-jost text-[10px] uppercase tracking-widest text-[#7A6A5C] font-semibold mb-2">
                      Verification Audit Trail
                    </p>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {selectedOrder.history.map((h: any, i: number) => (
                        <div key={i} className="text-[11px] font-jost flex items-start justify-between border-b border-gray-50 pb-1 last:border-0">
                          <div>
                            <span className="font-medium text-[#4A0E1B]">{h.status}:</span>{" "}
                            <span className="text-[#7A6A5C]">{h.note || 'Status updated'}</span>
                            <span className="text-[10px] text-gray-400 block">by {h.actor}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                            {formatDateTime(h.timestamp).dateStr} {formatDateTime(h.timestamp).timeStr}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* VERIFICATION MODAL DIALOG */}
              {showVerifyModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                  <div className="bg-[#FDFBF4] border border-[#C9A24B] p-6 rounded-md shadow-2xl max-w-lg w-full space-y-4 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center border-b border-[#C9A24B]/30 pb-3">
                      <h3 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">
                        Confirm Payment Verification
                      </h3>
                      <button
                        onClick={() => setShowVerifyModal(false)}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 text-xs font-jost text-amber-900 flex items-start gap-2">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Administrator Certification:</strong> Confirming as <strong>PAID</strong> requires that you have verified actual receipt of funds in the business bank account or physical cash in hand.
                      </span>
                    </div>

                    <div className="space-y-3 font-jost text-xs">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#7A6A5C] mb-1 font-semibold">
                          Payment Status *
                        </label>
                        <select
                          value={verifyForm.paymentStatus}
                          onChange={(e) => setVerifyForm({ ...verifyForm, paymentStatus: e.target.value })}
                          className="w-full bg-white border border-[#C9A24B]/40 p-2 rounded-sm text-[#4A0E1B] outline-none"
                        >
                          <option value="Paid">Paid (Funds Verified &amp; Received)</option>
                          <option value="Awaiting Verification">Awaiting Verification (Proof Attached, Pending Audit)</option>
                          <option value="Pending">Pending (Unpaid)</option>
                          <option value="Failed">Failed (Transfer Rejected / Bounced)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-[#7A6A5C] mb-1 font-semibold">
                            Amount Confirmed (₹)
                          </label>
                          <input
                            type="number"
                            value={verifyForm.amountPaid}
                            onChange={(e) => setVerifyForm({ ...verifyForm, amountPaid: Number(e.target.value) })}
                            className="w-full bg-white border border-[#C9A24B]/40 p-2 rounded-sm text-[#4A0E1B] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-[#7A6A5C] mb-1 font-semibold">
                            Transaction Ref / UTR
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. UTR12345678"
                            value={verifyForm.paymentReference}
                            onChange={(e) => setVerifyForm({ ...verifyForm, paymentReference: e.target.value })}
                            className="w-full bg-white border border-[#C9A24B]/40 p-2 rounded-sm text-[#4A0E1B] outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#7A6A5C] mb-1 font-semibold">
                          Internal Audit Note
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Verified against HDFC statement credit on Oct 20..."
                          value={verifyForm.internalAdminNote}
                          onChange={(e) => setVerifyForm({ ...verifyForm, internalAdminNote: e.target.value })}
                          className="w-full bg-white border border-[#C9A24B]/40 p-2 rounded-sm text-[#4A0E1B] outline-none resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#C9A24B]/20">
                      <button
                        type="button"
                        onClick={() => setShowVerifyModal(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-jost uppercase tracking-wider rounded-sm hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVerifyPayment(selectedOrder._id)}
                        className="px-5 py-2 bg-[#4A0E1B] text-[#FDFBF4] text-xs font-jost uppercase tracking-wider font-semibold rounded-sm hover:bg-[#380A14] transition-colors"
                      >
                        Save Verification Record
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.orderStatus === "Delivered" && selectedOrder.paymentStatus === "Paid" && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-jost text-xs uppercase tracking-wider font-semibold text-green-900">
                        Order Delivered &amp; Payment Completed
                      </p>
                      <p className="font-jost text-xs text-green-700 mt-0.5">
                        {selectedOrder.deliveredEmailSent ? (
                          <>
                            ✓ Final invoice email sent to customer ({selectedOrder.email})
                            {selectedOrder.deliveredEmailSentAt && (
                              <span> &middot; {formatDateTime(selectedOrder.deliveredEmailSentAt).dateStr}</span>
                            )}
                          </>
                        ) : (
                          "Customer delivery email with invoice ready to send."
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => resendDeliveryEmail(selectedOrder._id)}
                    disabled={isSendingDeliveryEmail}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-sm text-xs font-jost uppercase tracking-wider transition-colors shrink-0 disabled:opacity-60 cursor-pointer shadow-sm"
                  >
                    <Mail size={13} />
                    {isSendingDeliveryEmail ? "Sending..." : "Resend Delivery Invoice"}
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 text-[#C9A24B] mb-4">
                  <Package size={18} />
                  <h3 className="font-jost text-sm tracking-[0.15em] uppercase font-semibold text-[#4A0E1B]">
                    Purchased Items
                  </h3>
                </div>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white p-3 border border-[#EAE3D5] rounded-sm flex gap-4 items-center"
                    >
                      <div className="w-16 h-16 bg-[#FDFBF4] border border-[#C9A24B]/20 rounded-sm overflow-hidden shrink-0 flex justify-center items-center">
                        <img
                          src={item.image || "/placeholder.jpg"}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-cormorant text-lg text-[#4A0E1B] truncate">
                          {item.name}
                        </h4>
                        <p className="font-jost text-[11px] text-[#7A6A5C] uppercase tracking-wider mt-0.5">
                          {item.specs}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium text-[#4A0E1B]">
                          {formatINR(item.price)}
                        </p>
                        <p className="font-jost text-[10px] text-[#7A6A5C] mt-1">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#C9A24B]/30 pt-6 flex justify-between items-end">
                <span className="font-jost text-sm text-[#7A6A5C] uppercase tracking-wider">
                  Grand Total
                </span>
                <span className="font-cormorant text-3xl md:text-4xl text-[#4A0E1B] font-semibold">
                  {formatINR(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}