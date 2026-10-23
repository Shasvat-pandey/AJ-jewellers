import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Download, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  Mail, 
  CreditCard, 
  Sparkles, 
  ArrowLeft,
  Headphones,
  Check,
  Edit2,
  ExternalLink
} from "lucide-react";
import { User } from "../../../../Common/context/AuthContext";
import { API_URL, getAuthToken } from "../../../../../utils/api";
import { getImageUrl } from "../../../../../utils/imageUrl";
import { useToast } from "../../../../Common/context/ToastContext";

interface OrderTrackingTabProps {
  user: User;
  orders: any[];
  selectedOrder: any | null;
  onSelectOrder: (order: any | null) => void;
  onRequestReturn: (order: any) => void;
  onOpenAddressModal: () => void;
}

export const OrderTrackingTab: React.FC<OrderTrackingTabProps> = ({
  user,
  orders,
  selectedOrder,
  onSelectOrder,
  onRequestReturn,
  onOpenAddressModal,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Provide high-fidelity demo order if user has no orders yet
  const activeOrder = selectedOrder || (orders.length > 0 ? orders[0] : {
    _id: "661f001234567890abcdef01",
    orderIdDisplay: "AJ20250478",
    createdAt: "2025-04-15T11:24:00.000Z",
    orderStatus: "Processing",
    paymentStatus: "Pending",
    paymentMethod: "Bank Transfer (UPI/IMPS/NEFT)",
    customerName: user.name || "Priya Sharma",
    phone: user.phone || "+91 98765 43210",
    address: user.address || "C-12, Sunrise Apartments, 4th Floor, MG Road",
    city: user.city || "Bengaluru",
    state: user.state || "Karnataka",
    pincode: user.pincode || "560001",
    items: [
      {
        product: "6ad90aa0b06f728e321519a2",
        name: "Classic Solitaire Diamond Ring",
        image: "/src/assets/products/solitaire-ring.jpg",
        specs: "Gold 18K | Weight: 3.5 g | Size: 6",
        quantity: 1,
        price: 68500
      }
    ],
    pricingSummary: {
      subtotal: 58000,
      makingCharges: 8500,
      gst: 1995,
      shipping: 150,
      total: 68645
    }
  });

  const orderShortId = activeOrder.orderIdDisplay || `AJ-${activeOrder._id.slice(-6).toUpperCase()}`;

  // 6 Stepper Milestones
  const currentStep = 
    activeOrder.orderStatus === "Delivered" ? 6 :
    activeOrder.orderStatus === "Shipped" ? 4 :
    activeOrder.orderStatus === "Processing" ? 3 :
    activeOrder.paymentStatus === "Paid" ? 3 : 2;

  const steps = [
    {
      num: 1,
      title: "Order Placed",
      time: "15 Apr 2025\n11:24 AM",
      icon: CheckCircle2,
      isCompleted: currentStep >= 1,
      isCurrent: currentStep === 1,
    },
    {
      num: 2,
      title: "Payment Pending",
      time: "15 Apr 2025\n11:25 AM",
      icon: CreditCard,
      isCompleted: currentStep >= 2,
      isCurrent: currentStep === 2,
    },
    {
      num: 3,
      title: "Processing",
      time: "16 Apr 2025\n09:30 AM",
      icon: Package,
      isCompleted: currentStep >= 3,
      isCurrent: currentStep === 3,
    },
    {
      num: 4,
      title: "Shipped",
      time: "Not yet shipped",
      icon: Truck,
      isCompleted: currentStep >= 4,
      isCurrent: currentStep === 4,
    },
    {
      num: 5,
      title: "Out for Delivery",
      time: "Not yet dispatched",
      icon: MapPin,
      isCompleted: currentStep >= 5,
      isCurrent: currentStep === 5,
    },
    {
      num: 6,
      title: "Delivered",
      time: "Awaiting delivery",
      icon: Check,
      isCompleted: currentStep >= 6,
      isCurrent: currentStep === 6,
    },
  ];

  const handleDownloadInvoice = () => {
    const token = getAuthToken();
    const link = document.createElement("a");
    link.href = `${API_URL}/orders/${activeOrder._id}/invoice${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    link.download = `Invoice-${orderShortId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloading tax invoice...", "success");
  };

  const subtotal = activeOrder.pricingSummary?.subtotal || 58000;
  const makingCharges = activeOrder.pricingSummary?.makingCharges || 8500;
  const gst = activeOrder.pricingSummary?.gst || 1995;
  const shippingFee = activeOrder.pricingSummary?.shipping ?? 150;
  const grandTotal = activeOrder.pricingSummary?.total || activeOrder.totalAmount || 68645;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Multiple Orders Selector Bar if user has orders */}
      {orders.length > 1 && (
        <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-4 flex items-center justify-between overflow-x-auto gap-4">
          <span className="font-jost text-xs uppercase tracking-wider text-[#7A6A5C] shrink-0 font-semibold">
            Your Orders ({orders.length}):
          </span>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {orders.map((ord: any) => (
              <button
                key={ord._id}
                onClick={() => onSelectOrder(ord)}
                className={`px-3 py-1.5 rounded-lg font-jost text-xs transition-colors shrink-0 cursor-pointer ${
                  activeOrder._id === ord._id
                    ? "bg-[#4A0E1B] text-white font-medium"
                    : "bg-[#FAF6EE] text-[#5A4A3C] hover:bg-[#E5D7B7]/40"
                }`}
              >
                Order #{ord.orderIdDisplay || ord._id.slice(-6).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Order Tracking Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT / MAIN COLUMN (8 cols): Order header, 6-stage Stepper, Prep Callout, Items, Address */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* ORDER HEADER CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5D7B7]/50">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#4A0E1B]">
                    Order #{orderShortId}
                  </h2>
                  <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-jost font-semibold capitalize">
                    {activeOrder.orderStatus || "Processing"}
                  </span>
                </div>
                <p className="font-jost text-xs text-[#7A6A5C] mt-1">
                  Placed on {new Date(activeOrder.createdAt || Date.now()).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}, 11:24 AM
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <button
                  onClick={handleDownloadInvoice}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#4A0E1B]/30 hover:border-[#4A0E1B] text-[#4A0E1B] rounded-lg font-jost text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer shadow-xs bg-white"
                >
                  <Download size={14} />
                  <span>Download Invoice</span>
                </button>
              </div>
            </div>

            {/* 6-STAGE PROGRESS STEPPER (Horizontal on desktop, scrollable on mobile) */}
            <div className="pt-8 pb-4 overflow-x-auto scrollbar-hide">
              <div className="min-w-[620px] flex items-start justify-between relative px-2">
                {/* Connecting track line */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E5D7B7] -z-0" />
                <div 
                  className="absolute top-4 left-6 h-0.5 bg-emerald-600 transition-all duration-700 -z-0"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 92}%` }}
                />

                {steps.map((st) => {
                  const StepIcon = st.icon;
                  const isDone = st.isCompleted;
                  const isCurrent = st.isCurrent;

                  return (
                    <div key={st.num} className="flex flex-col items-center text-center relative z-10 w-24">
                      {/* Circle dot */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-emerald-600 text-white shadow-xs"
                            : isCurrent
                            ? "bg-[#4A0E1B] text-white ring-4 ring-[#4A0E1B]/20"
                            : "bg-[#FAF6EE] text-[#9A8A7C] border border-[#E5D7B7]"
                        }`}
                      >
                        <StepIcon size={14} />
                      </div>

                      {/* Title */}
                      <p className={`font-jost text-xs mt-2.5 font-semibold ${isDone || isCurrent ? "text-[#4A0E1B]" : "text-[#9A8A7C]"}`}>
                        {st.title}
                      </p>

                      {/* Timestamp / Status subtitle */}
                      <p className="font-jost text-[10px] text-[#7A6A5C] mt-0.5 whitespace-pre-line leading-tight">
                        {st.time}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ORDER PREPARATION CALLOUT BANNER */}
            <div className="mt-6 bg-[#FAF6EE] border border-[#E5D7B7] rounded-xl p-4 sm:p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FFF8E7] border border-[#E5D7B7] flex items-center justify-center text-[#4A0E1B] shrink-0">
                <Truck size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-cormorant text-lg font-bold text-[#4A0E1B]">Your order is being prepared</h4>
                <p className="font-jost text-xs text-[#7A6A5C] mt-0.5 leading-relaxed">
                  We're carefully processing your jewellery order and will notify you once it has been shipped.
                </p>
                <p className="font-jost text-xs font-semibold text-[#8C6514] mt-1.5">
                  Estimated dispatch: 2–4 business days
                </p>
              </div>
            </div>
          </div>

          {/* ORDER ITEMS CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 sm:p-7 shadow-sm">
            <h3 className="font-cormorant text-2xl font-bold text-[#4A0E1B] mb-5">Order Items</h3>
            
            <div className="space-y-4">
              {activeOrder.items?.map((item: any, idx: number) => {
                const productId = item.product?._id || item.product || item.productId || item._id;
                const itemImg = getImageUrl(item.image) || "/src/assets/products/solitaire-ring.jpg";
                const isNavigable = Boolean(productId);

                return (
                  <div 
                    key={idx}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#E5D7B7]/50 bg-[#FAF6EE]/30 gap-4 transition-all ${
                      isNavigable ? "hover:border-[#C9A24B] hover:bg-[#FAF6EE]/60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div 
                        onClick={() => isNavigable && navigate(`/products/${productId}`)}
                        className={`w-20 h-20 rounded-xl bg-white border border-[#E5D7B7] overflow-hidden shrink-0 flex items-center justify-center p-2 shadow-xs transition-all ${
                          isNavigable ? "cursor-pointer group/img hover:border-[#C9A24B]" : ""
                        }`}
                        title={isNavigable ? "View product details" : undefined}
                      >
                        <img 
                          src={itemImg} 
                          alt={item.name} 
                          className={`w-full h-full object-contain ${isNavigable ? "group-hover/img:scale-105 transition-transform duration-300" : ""}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 
                          onClick={() => isNavigable && navigate(`/products/${productId}`)}
                          className={`font-cormorant text-xl font-bold text-[#4A0E1B] truncate transition-colors ${
                            isNavigable ? "cursor-pointer hover:text-[#8C6514] hover:underline underline-offset-2" : ""
                          }`}
                          title={isNavigable ? "View product details" : undefined}
                        >
                          {item.name}
                        </h4>
                        <p className="font-jost text-xs text-[#7A6A5C] mt-1">
                          {item.specs || "Gold 18K | Weight: 3.5 g | Size: 6"}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="font-jost text-xs font-semibold text-[#5A4A3C]">
                            Qty: {item.quantity || 1}
                          </p>
                          {isNavigable && (
                            <button
                              onClick={() => navigate(`/products/${productId}`)}
                              className="inline-flex items-center gap-1 font-jost text-[11px] font-semibold text-[#8C6514] hover:text-[#4A0E1B] transition-colors cursor-pointer"
                            >
                              <span>View Product</span>
                              <ChevronRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right sm:self-center shrink-0">
                      <p className="font-cormorant text-2xl font-bold text-[#4A0E1B]">
                        {formatINR(item.price || 68500)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SHIPPING ADDRESS CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#FAF6EE] border border-[#E5D7B7] flex items-center justify-center text-[#C9A24B] shrink-0 mt-0.5">
                <MapPin size={18} />
              </div>
              <div>
                <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B]">Shipping Address</h4>
                <p className="font-jost text-sm font-semibold text-[#4A0E1B] mt-1">
                  {activeOrder.customerName}
                </p>
                <p className="font-jost text-xs text-[#5A4A3C] leading-relaxed mt-0.5 max-w-md">
                  {activeOrder.address}, {activeOrder.city}, {activeOrder.state} - {activeOrder.pincode}
                </p>
                <p className="font-jost text-xs text-[#7A6A5C] mt-1">
                  Mobile: {activeOrder.phone}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenAddressModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E5D7B7] text-[#8C6514] hover:bg-[#FAF6EE] text-xs font-jost font-medium transition-colors cursor-pointer self-start shrink-0"
            >
              <Edit2 size={13} />
              <span>Change Address</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN (4 cols): Order Summary, Payment Box, Need Help, Thank you card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* ORDER SUMMARY */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 shadow-sm">
            <h4 className="font-cormorant text-2xl font-bold text-[#4A0E1B] pb-3 border-b border-[#E5D7B7]/60">
              Order Summary
            </h4>

            <div className="py-4 space-y-3 font-jost text-xs text-[#5A4A3C] border-b border-[#E5D7B7]/50">
              <div className="flex justify-between">
                <span className="text-[#7A6A5C]">Subtotal ({activeOrder.items?.length || 1} item)</span>
                <span className="font-medium text-[#4A0E1B]">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5C]">Making Charges</span>
                <span className="font-medium text-[#4A0E1B]">{formatINR(makingCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5C]">GST (3%)</span>
                <span className="font-medium text-[#4A0E1B]">{formatINR(gst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5C]">Shipping Fee</span>
                <span className="font-medium text-[#4A0E1B]">
                  {shippingFee === 0 ? "FREE" : formatINR(shippingFee)}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-baseline">
              <span className="font-jost text-sm font-semibold uppercase tracking-wider text-[#4A0E1B]">
                Total
              </span>
              <span className="font-cormorant text-3xl font-bold text-[#4A0E1B]">
                {formatINR(grandTotal)}
              </span>
            </div>

            {/* Payment Method & Status box */}
            <div className="mt-5 p-4 rounded-xl bg-[#FAF6EE] border border-[#E5D7B7] space-y-3">
              <div className="flex items-center gap-2 text-xs font-jost text-[#5A4A3C]">
                <CreditCard size={15} className="text-[#C9A24B]" />
                <span className="font-semibold">Payment Method</span>
              </div>
              <p className="font-jost text-xs text-[#4A0E1B] font-medium pl-6">
                {activeOrder.paymentMethod || "Bank Transfer (UPI/IMPS/NEFT)"}
              </p>

              <div className="pt-2 border-t border-[#E5D7B7]/60 flex items-center justify-between">
                <span className="font-jost text-xs text-[#7A6A5C]">Payment Status</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-jost font-semibold uppercase">
                  {activeOrder.paymentStatus || "Pending"}
                </span>
              </div>

              <p className="font-jost text-[11px] text-[#7A6A5C] leading-relaxed pt-1">
                Your payment is pending. Please transfer the amount using the details provided in your order confirmation email. We will verify your payment once received.
              </p>
            </div>
          </div>

          {/* NEED HELP CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={20} className="text-[#C9A24B]" />
              <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B]">Need Help?</h4>
            </div>
            <p className="font-jost text-xs text-[#7A6A5C] leading-relaxed mb-4">
              If you have any questions about your order, feel free to contact us.
            </p>

            <div className="space-y-2.5">
              <a
                href="tel:+919876543210"
                className="w-full bg-[#4A0E1B] text-[#FDFBF7] font-jost text-xs tracking-wider uppercase font-semibold py-3 px-4 rounded-lg hover:bg-[#3B0A14] transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Phone size={14} />
                <span>Call Us: +91 98765 43210</span>
              </a>
              <a
                href="mailto:care@ajjewellers.in"
                className="w-full bg-white border border-[#E5D7B7] text-[#4A0E1B] hover:bg-[#FAF6EE] font-jost text-xs tracking-wider uppercase font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={14} />
                <span>Email Support</span>
              </a>
            </div>
          </div>

          {/* THANK YOU CARD */}
          <div className="bg-[#FAF6EE] border border-[#E5D7B7] rounded-xl p-6 text-center shadow-xs relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-[#FFF8E7] border border-[#E5D7B7] flex items-center justify-center text-[#C9A24B] mx-auto mb-3">
              <Sparkles size={22} />
            </div>
            <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B]">
              Thank you for choosing AJ Jewellers
            </h4>
            <p className="font-jost text-xs text-[#7A6A5C] mt-1.5 leading-relaxed max-w-xs mx-auto">
              We look forward to being a part of your special moments.
            </p>
          </div>

        </div>

      </div>

      {/* 4-PILLAR TRUST REASSURANCE STRIP */}
      <div className="pt-6 border-t border-[#E5D7B7]/60">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 px-6 bg-white border border-[#E5D7B7]/70 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FAF6EE] flex items-center justify-center text-[#C9A24B] shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-jost text-xs font-semibold text-[#4A0E1B]">100% Authentic Jewellery</p>
              <p className="font-jost text-[10px] text-[#7A6A5C]">Certified &amp; Hallmarked</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FAF6EE] flex items-center justify-center text-[#C9A24B] shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="font-jost text-xs font-semibold text-[#4A0E1B]">Secure Shopping</p>
              <p className="font-jost text-[10px] text-[#7A6A5C]">Your data is safe with us</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FAF6EE] flex items-center justify-center text-[#C9A24B] shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <p className="font-jost text-xs font-semibold text-[#4A0E1B]">Free Shipping</p>
              <p className="font-jost text-[10px] text-[#7A6A5C]">On orders above ₹50,000</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FAF6EE] flex items-center justify-center text-[#C9A24B] shrink-0">
              <Headphones size={18} />
            </div>
            <div>
              <p className="font-jost text-xs font-semibold text-[#4A0E1B]">Dedicated Support</p>
              <p className="font-jost text-[10px] text-[#7A6A5C]">We're here to help</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
