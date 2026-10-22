import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Truck, CreditCard, MapPin, Phone, Mail, Navigation } from "lucide-react";
import { API_URL, getAuthToken } from "../../../../utils/api";

interface OrderItem {
  _id: string;
  name: string;
  specs: string;
  price: number;
  image: string;
  quantity: number;
}

interface Order {
  _id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  paymentMethod: string;
  paymentStatus?: string;
  paidAt?: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  orderStatus: string;
  deliveryLocation?: {
    lat: number;
    lng: number;
    landmark?: string;
    formattedAddress?: string;
    mapsUrl?: string;
  };
}

export default function OrderConfirmedPage() {
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const fetchOrder = async () => {
      // Get order ID from navigate state
      const state = location.state as { orderId?: string; orderRef?: string } | undefined;
      
      if (!state?.orderId) {
        setError("No order information found. Please check your email for the order reference.");
        setIsLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/orders/${state.orderId}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await response.json();

        if (data.success && data.data) {
          setOrder(data.data);
        } else {
          setError("Order not found. Please contact support with your reference number.");
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError("Unable to load order details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [location]);

  // Fallback to state data if API fails
  const orderRef = (location.state as { orderRef?: string })?.orderRef || "AJ-ORDER";

  if (isLoading) {
    return (
      <div className="bg-[#FDFBF4] min-h-screen pt-36 md:pt-48 pb-24 px-6 flex flex-col items-center justify-center text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#C9A24B] border-t-transparent mb-6" />
        <p className="font-jost text-[15px] text-[#7A6A5C]">Loading your order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-[#FDFBF4] min-h-screen pt-36 md:pt-48 pb-24 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border border-red-300 flex items-center justify-center mb-8 bg-red-50">
          <Check size={24} strokeWidth={1.5} className="text-red-500" />
        </div>
        <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#4A0E1B] mb-6">
          Order Reference: {orderRef}
        </h1>
        <p className="font-jost text-[15px] md:text-base text-[#7A6A5C] leading-relaxed max-w-[50ch] mx-auto mb-12">
          {error}
        </p>
        <Link
          to="/"
          onClick={() => window.scrollTo(0, 0)}
          className="inline-block border border-[#C9A24B]/50 text-[#4A0E1B] font-jost text-[10px] md:text-xs tracking-[0.2em] uppercase px-10 py-4 hover:bg-[#C9A24B] hover:text-[#FDFBF4] transition-colors shadow-sm"
        >
          CONTINUE SHOPPING
        </Link>
      </div>
    );
  }

  const shortId = `AJ-${order._id.slice(-6).toUpperCase()}`;

  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-36 md:pt-48 pb-24 px-6 animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto w-full">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-[#C9A24B] flex items-center justify-center mb-8 mx-auto bg-[#FDFBF4]">
            <Check size={32} strokeWidth={1.5} className="text-[#C9A24B]" />
          </div>
          <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#4A0E1B] mb-4">
            Order Confirmed
          </h1>
          <p className="font-jost text-[15px] md:text-base text-[#7A6A5C] leading-relaxed max-w-[50ch] mx-auto">
            Thank you for your order, <span className="text-[#4A0E1B] font-medium">{order.customerName}</span>! 
            Your jewellery is being prepared with care.
          </p>
        </div>

        {/* Order Reference Card */}
        <div className="bg-white border border-[#C9A24B]/30 rounded-sm p-6 md:p-8 mb-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-[#EAE3D5]">
            <div>
              <p className="font-jost text-[10px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-1">Order Reference</p>
              <p className="font-cormorant text-3xl md:text-4xl text-[#4A0E1B] font-semibold tracking-wide">{shortId}</p>
            </div>
            <div className="flex items-center gap-3 text-[#C9A24B]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-jost text-sm font-medium uppercase tracking-wider bg-green-50 text-green-700 px-3 py-1 border border-green-200 rounded-sm">
                {order.orderStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FDFBF4] border border-[#C9A24B]/30 flex items-center justify-center">
                <MapPin size={16} className="text-[#C9A24B]" />
              </div>
              <div>
                <p className="font-jost text-[10px] tracking-[0.1em] text-[#7A6A5C] uppercase">Delivery Address</p>
                <p className="font-jost text-[14px] text-[#4A0E1B]">{order.address}, {order.city} - {order.pincode}</p>
                {order.deliveryLocation?.landmark && (
                  <p className="font-jost text-xs text-[#7A6A5C] mt-0.5">
                    <span className="font-semibold text-[#4A0E1B]">Landmark:</span> {order.deliveryLocation.landmark}
                  </p>
                )}
                {order.deliveryLocation?.lat && order.deliveryLocation?.lng && (
                  <a
                    href={order.deliveryLocation.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#C9A24B] hover:text-[#4A0E1B] font-medium mt-1 underline underline-offset-2 transition-colors"
                  >
                    <Navigation size={12} />
                    View Pinned Location in Google Maps ({order.deliveryLocation.lat.toFixed(4)}, {order.deliveryLocation.lng.toFixed(4)})
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FDFBF4] border border-[#C9A24B]/30 flex items-center justify-center">
                <Phone size={16} className="text-[#C9A24B]" />
              </div>
              <div>
                <p className="font-jost text-[10px] tracking-[0.1em] text-[#7A6A5C] uppercase">Contact</p>
                <p className="font-jost text-[14px] text-[#4A0E1B]">{order.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FDFBF4] border border-[#C9A24B]/30 flex items-center justify-center">
                <Mail size={16} className="text-[#C9A24B]" />
              </div>
              <div>
                <p className="font-jost text-[10px] tracking-[0.1em] text-[#7A6A5C] uppercase">Email Receipt</p>
                <p className="font-jost text-[14px] text-[#4A0E1B]">{order.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FDFBF4] border border-[#C9A24B]/30 flex items-center justify-center">
                <CreditCard size={16} className="text-[#C9A24B]" />
              </div>
              <div>
                <p className="font-jost text-[10px] tracking-[0.1em] text-[#7A6A5C] uppercase">Payment Method</p>
                  <p className="font-jost text-[14px] text-[#4A0E1B]">
                    {order.paymentMethod === 'bank_transfer' ? 'Bank Transfer / External UPI' : order.paymentMethod === 'cash' || order.paymentMethod === 'boutique' ? 'Cash / Pay at Boutique' : order.paymentMethod}
                  </p>
                  <span className={`px-2 py-0.5 text-[9px] tracking-wider uppercase font-semibold border rounded-sm ${
                    order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {order.paymentStatus === 'Paid' ? 'PAID' : 'PENDING VERIFICATION'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        {/* Order Items */}
        <div className="bg-white border border-[#C9A24B]/30 rounded-sm overflow-hidden mb-10 shadow-sm">
          <div className="bg-[#FDFBF4] border-b border-[#C9A24B]/20 p-4 md:p-6">
            <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B]">Order Items</h2>
            <p className="font-jost text-xs text-[#7A6A5C] mt-1 tracking-widest uppercase">
              Placed on {formatDate(order.createdAt)} &middot; {order.items.length} item{order.items.length > 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="divide-y divide-[#EAE3D5]">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:items-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-[#FDFBF4] border border-[#C9A24B]/20 rounded-sm overflow-hidden shrink-0 flex items-center justify-center p-2">
                  <img 
                    src={item.image || "/placeholder.jpg"} 
                    alt={item.name} 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div className="flex-1 min-w-0 md:flex md:items-center md:justify-between">
                  <div>
                    <h3 className="font-cormorant text-lg md:text-xl text-[#4A0E1B] truncate">{item.name}</h3>
                    <p className="font-jost text-[11px] md:text-xs text-[#7A6A5C] uppercase tracking-wider mt-1">
                      {item.specs} &middot; Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right mt-2 md:mt-0 md:ml-4">
                    <p className="font-medium text-[#4A0E1B]">₹{formatINR(item.price * item.quantity)}</p>
                    <p className="font-jost text-[10px] text-[#7A6A5C] mt-0.5">₹{formatINR(item.price)} each</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Total */}
          <div className="bg-gray-50 p-4 md:p-6 border-t border-[#EAE3D5]/50">
            <div className="flex justify-between items-baseline">
              <span className="font-cormorant text-xl md:text-2xl text-[#4A0E1B]">Order Total</span>
              <span className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B] font-semibold">₹{formatINR(order.totalAmount)}</span>
            </div>
            <p className="font-jost text-[11px] text-[#7A6A5C] mt-2 text-right">Inclusive of all taxes</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white border border-[#C9A24B]/30 rounded-sm p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 text-[#C9A24B] mb-4">
            <Truck size={20} />
            <h3 className="font-cormorant text-xl md:text-2xl text-[#4A0E1B]">What happens next?</h3>
          </div>
          <ul className="space-y-3 font-jost text-[14px] text-[#7A6A5C]">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full border border-[#C9A24B] flex items-center justify-center text-[#C9A24B] font-medium text-[11px] shrink-0 mt-0.5">1</span>
              <span>Our jewellery consultant will call you within <strong>24 hours</strong> to confirm sizing, hallmark certificate, and the insured delivery slot.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full border border-[#C9A24B] flex items-center justify-center text-[#C9A24B] font-medium text-[11px] shrink-0 mt-0.5">2</span>
              <span>Once confirmed, your piece will be crafted/polished and prepared for <strong>insured shipping</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full border border-[#C9A24B] flex items-center justify-center text-[#C9A24B] font-medium text-[11px] shrink-0 mt-0.5">3</span>
              <span>You will receive tracking details via email and SMS when your order ships.</span>
            </li>
          </ul>
        </div>

        <Link
          to="/"
          onClick={() => window.scrollTo(0, 0)}
          className="inline-block border border-[#C9A24B]/50 text-[#4A0E1B] font-jost text-[10px] md:text-xs tracking-[0.2em] uppercase px-10 py-4 hover:bg-[#C9A24B] hover:text-[#FDFBF4] transition-colors shadow-sm mt-8 block text-center"
        >
          CONTINUE SHOPPING
        </Link>
      </div>
    </div>
  );
}