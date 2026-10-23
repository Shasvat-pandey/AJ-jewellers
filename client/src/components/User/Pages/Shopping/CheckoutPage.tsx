import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Truck, AlertCircle, Building2, Wallet, CheckCircle2, Map } from "lucide-react";
import GoogleDeliveryMap from "../../../Common/GoogleDeliveryMap";
import { useAuth } from "../../../../components/Common/context/AuthContext";
import { useToast } from "../../../../components/Common/context/ToastContext";
import { API_URL, getAuthToken } from "../../../../utils/api";

interface CartItem {
  _id: string;
  name: string;
  specs?: string;
  price: number;
  image?: string;
  variantId?: string;
  quantity: number;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, requireAuth } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    payment: "cash", // 'cash' or 'bank_transfer'
    paymentReference: "",
    notes: ""
  });
  const [mapPosition, setMapPosition] = useState({ lat: 22.5726, lng: 88.3639 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [pinManual, setPinManual] = useState(false);
  const [locateNonce, setLocateNonce] = useState(0);
  const [cartValidationWarning, setCartValidationWarning] = useState<string | null>(null);

  const [bankDetails, setBankDetails] = useState({
    accountName: "AJ JEWELLERS PRIVATE LIMITED",
    accountNumber: "50200084729103",
    bankName: "HDFC Bank (Heritage Branch)",
    ifscCode: "HDFC0001234",
    upiId: "ajjewellers@okhdfcbank"
  });

  const cart: CartItem[] = JSON.parse(localStorage.getItem("aj_cart") || "[]");

  // Empty bag -> send user back to bag instead of showing a blank page
  useEffect(() => {
    if (cart.length === 0) navigate("/bag");
  }, [cart.length, navigate]);

  // Pre-checkout stock and pricing validation
  useEffect(() => {
    if (cart.length === 0) return;
    const token = getAuthToken();
    fetch(`${API_URL}/orders/validate-cart`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        items: cart.map(item => ({
          product: item._id,
          variant: item.variantId,
          quantity: item.quantity,
          price: item.price
        }))
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && !data.valid && data.issues?.length > 0) {
          setCartValidationWarning(data.issues.map((i: any) => i.issue).join(" • "));
        }
      })
      .catch(() => { });
  }, [cart.length]);

  // Safe prefill of all logged-in customer details including address
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
        city: user.city || prev.city,
        state: user.state || prev.state,
        pincode: user.pincode || prev.pincode
      }));
    }
  }, [user]);

  // Fetch store bank details
  useEffect(() => {
    fetch(`${API_URL}/settings`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.bankDetails) {
          setBankDetails(prev => ({ ...prev, ...data.data.bankDetails }));
        }
      })
      .catch(() => { });
  }, []);

  const cartTotal = cart.reduce((sum: number, item: CartItem) => sum + (Number(item.price) * item.quantity), 0);
  const gstAmount = cart.reduce((sum: number, item: CartItem) => {
    // @ts-ignore
    const itemGstPercent = item.gstPercent !== undefined && item.gstPercent !== null ? Number(item.gstPercent) : 3;
    const itemTotal = Number(item.price) * item.quantity;
    return sum + (itemTotal - (itemTotal / (1 + itemGstPercent / 100)));
  }, 0);
  const subtotalBeforeGst = cartTotal - gstAmount;
  const shipping = cartTotal > 50000 ? 0 : 150;
  const total = cartTotal + shipping;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMapPosition({ lat, lng });
    setPinManual(true);
    setLocationLabel("Custom pinned location — click elsewhere to move the pin");
  };

  // Auto-pin the map from the typed address
  useEffect(() => {
    if (pinManual) return;
    const query = [formData.address, formData.city, formData.state, formData.pincode]
      .map(s => s.trim()).filter(Boolean).join(", ");
    const hasPincode = /^\d{6}$/.test(formData.pincode.trim());
    const hasCityState = formData.city.trim().length >= 3 && formData.state.trim().length >= 2;
    if (!hasPincode && !hasCityState) return;

    setIsLocating(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query + ", India")}`
        );
        const data = await res.json();
        if (!pinManual && Array.isArray(data) && data.length > 0) {
          setMapPosition({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          setLocationLabel(data[0].display_name.split(",").slice(0, 3).join(","));
        }
      } catch {
        // Geocoding fallback
      } finally {
        setIsLocating(false);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [formData.address, formData.city, formData.state, formData.pincode, locateNonce, pinManual]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      requireAuth(() => { }, "Please sign in to place and confirm your order");
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      showToast("Please fill in all required delivery fields.", "error");
      return;
    }

    // Strict 10-digit phone sanitization
    const cleanPhone = formData.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      showToast("Please enter a valid 10-digit mobile number (e.g. 9876543210).", "error");
      return;
    }

    // Strict 6-digit PIN code validation
    const cleanPincode = formData.pincode.replace(/\D/g, '').slice(0, 6);
    if (cleanPincode.length !== 6) {
      showToast("Please enter a valid 6-digit Indian PIN code.", "error");
      return;
    }

    setIsProcessing(true);

    try {
      const formattedItems = cart.map((item: CartItem) => ({
        product: item._id,
        name: item.name,
        specs: item.specs,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        variant: item.variantId
      }));

      const orderPayload = {
        userId: user?._id || "",
        customerName: formData.name.trim(),
        phone: cleanPhone,
        email: formData.email.trim(),
        city: `${formData.city.trim()}, ${formData.state.trim()}`,
        pincode: cleanPincode,
        address: formData.address.trim(),
        notes: formData.notes.trim(),
        deliveryLocation: {
          lat: mapPosition.lat,
          lng: mapPosition.lng,
          landmark: formData.landmark || "",
          formattedAddress: `${formData.address}, ${formData.city}, ${formData.state} - ${cleanPincode}`,
          mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${mapPosition.lat},${mapPosition.lng}`
        },
        paymentMethod: formData.payment,
        paymentReference: formData.paymentReference.trim(),
        items: formattedItems
      };

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/orders`, {
        credentials: 'include',
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.removeItem("aj_cart");
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("cart_updated"));

        showToast("Order placed successfully! Initial status: Pending Verification.", "success");
        const orderRef = `AJ-${data.data._id.toString().slice(-6).toUpperCase()}`;
        navigate("/order-confirmed", {
          state: {
            orderId: data.data._id,
            orderRef,
            paymentMethod: formData.payment,
            paymentStatus: data.data.paymentStatus || 'Pending'
          }
        });
        window.scrollTo(0, 0);
      } else {
        showToast("Failed to place order: " + data.message, "error");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      showToast("Server error. Please try again later.", "error");
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-24 px-6 md:px-12 lg:px-20 animate-in fade-in duration-500">

      <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
        <p className="font-jost text-[10px] md:text-xs tracking-[0.24em] text-[#C9A24B] uppercase mb-4 font-semibold">SECURE CHECKOUT</p>
        <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#4A0E1B] mb-5">Order Placement</h1>
        <div className="w-12 md:w-16 h-px bg-[#C9A24B] mx-auto" />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

        <div className="lg:col-span-7">
          <form onSubmit={handleCheckout} className="space-y-6 md:space-y-8">
            {/* Pre-checkout Cart Validation Alert */}
            {cartValidationWarning && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-sm flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs font-jost text-amber-900">
                  <span className="font-semibold uppercase tracking-wider block text-[10px] text-amber-800">
                    Important Order Notice
                  </span>
                  <span>{cartValidationWarning}</span>
                </div>
              </div>
            )}

            {!user && (
              <div className="bg-[#C9A24B]/10 border border-[#C9A24B]/30 px-5 py-3.5 rounded-sm flex items-center justify-between">
                <span className="font-jost text-xs text-[#4A0E1B]">Already have an account with us?</span>
                <button
                  type="button"
                  onClick={() => requireAuth(() => { }, "Sign in for a faster checkout")}
                  className="font-jost text-xs tracking-wider uppercase text-[#C9A24B] font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Contact & Shipping Details */}
            <div className="bg-white border border-[#4A0E1B]/10 p-6 md:p-8 shadow-sm">
              <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B] mb-6 flex items-center gap-3">
                <MapPin size={24} className="text-[#C9A24B]" />
                Delivery Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="checkout-name" className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2 uppercase">Full Name *</label>
                  <input id="checkout-name" type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors" placeholder="Ananya Sharma" />
                </div>
                <div>
                  <label htmlFor="checkout-email" className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2 uppercase">Email *</label>
                  <input id="checkout-email" type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors" placeholder="ananya@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="checkout-phone" className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2 uppercase">Phone Number (10 digits) *</label>
                  <input id="checkout-phone" type="tel" name="phone" required maxLength={10} value={formData.phone} onChange={handleChange} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors" placeholder="9876543210" />
                </div>
                <div>
                  <label htmlFor="checkout-pincode" className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2 uppercase">Pincode (6 digits) *</label>
                  <input id="checkout-pincode" type="text" name="pincode" required value={formData.pincode} onChange={handleChange} maxLength={6} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors" placeholder="700001" />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="checkout-address" className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2 uppercase">Street Address *</label>
                <textarea id="checkout-address" name="address" required rows={3} value={formData.address} onChange={handleChange} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors resize-none" placeholder="Flat No, Wing, Street, Landmark"></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkout-city" className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2 uppercase">City *</label>
                  <input id="checkout-city" type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors" placeholder="Kolkata" />
                </div>
                <div>
                  <label htmlFor="checkout-state" className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2 uppercase">State *</label>
                  <input id="checkout-state" type="text" name="state" required value={formData.state} onChange={handleChange} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors" placeholder="West Bengal" />
                </div>
              </div>
            </div>

            {/* GOOGLE MAPS PRECISION PINPOINT & DELIVERY COORDINATES */}
            <div className="bg-[#FFFDF9] border border-[#E5D7B7] rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <h2 className="font-cormorant text-3xl md:text-4xl text-[#4A0E1B] flex items-center gap-3">
                  <MapPin size={28} className="text-[#9B783E]" />
                  Delivery Location
                </h2>
                <div className="flex items-center gap-2 border border-[#C9A24B]/50 bg-[#FDFBF4] text-[#9B783E] px-3.5 py-1.5 rounded-md font-jost text-[10px] tracking-[0.15em] uppercase font-semibold w-fit shadow-xs">
                  <Map size={14} className="text-[#C9A24B]" />
                  <span>GOOGLE MAPS PINPOINT</span>
                </div>
              </div>
              <p className="font-jost text-xs sm:text-sm text-[#7A6A5C] mb-6 leading-relaxed">
                Pin your exact doorstep, building gate, or landmark on Google Maps. These precise coordinates and instructions are routed directly to our secure courier team.
              </p>

              <GoogleDeliveryMap
                lat={mapPosition.lat}
                lng={mapPosition.lng}
                onChange={(newLat, newLng) => {
                  setMapPosition({ lat: newLat, lng: newLng });
                  setPinManual(true);
                }}
                landmark={formData.landmark}
                onLandmarkChange={(newLandmark) => {
                  setFormData(prev => ({ ...prev, landmark: newLandmark }));
                }}
                addressDetails={[formData.address, formData.city, formData.state, formData.pincode].filter(Boolean).join(", ")}
                height="400px"
              />
            </div>

            {/* PAYMENT METHOD SELECTION - CASH & BANK TRANSFER ONLY */}
            <div className="bg-white border border-[#4A0E1B]/10 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B] flex items-center gap-3">
                  <Wallet size={24} className="text-[#C9A24B]" />
                  Select Payment Method
                </h2>
              </div>
              <p className="font-jost text-xs text-[#7A6A5C] mb-6">
                All online third-party payment gateways have been decommissioned. Choose between in-person cash settlement or direct verified bank transfer/UPI.
              </p>

              <fieldset className="border-0 p-0 m-0">
                <legend className="sr-only">Choose Payment Method</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Method A: Cash */}
                  <label className={`relative flex flex-col p-5 border-2 rounded-lg cursor-pointer transition-all focus-within:ring-2 focus-within:ring-[#C9A24B] ${formData.payment === "cash"
                      ? "border-[#C9A24B] bg-[#FDFBF4] shadow-sm"
                      : "border-gray-200 bg-white hover:border-[#C9A24B]/60"
                    }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={formData.payment === "cash"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">💵</span>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.payment === "cash" ? "border-[#C9A24B] bg-[#C9A24B]" : "border-gray-300"}`}>
                        {formData.payment === "cash" && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                      </span>
                    </div>
                    <span className="font-jost text-sm font-semibold text-[#4A0E1B]">Cash / Pay at Boutique</span>
                    <span className="font-jost text-xs text-[#7A6A5C] mt-1">
                      Pay in cash upon in-store collection or cash on delivery where supported.
                    </span>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-amber-700 font-jost">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>Payment verified by admin upon receipt.</span>
                    </div>
                  </label>

                  {/* Method B: Bank Transfer / UPI */}
                  <label className={`relative flex flex-col p-5 border-2 rounded-lg cursor-pointer transition-all focus-within:ring-2 focus-within:ring-[#C9A24B] ${formData.payment === "bank_transfer"
                      ? "border-[#C9A24B] bg-[#FDFBF4] shadow-sm"
                      : "border-gray-200 bg-white hover:border-[#C9A24B]/60"
                    }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="bank_transfer"
                      checked={formData.payment === "bank_transfer"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🏦</span>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.payment === "bank_transfer" ? "border-[#C9A24B] bg-[#C9A24B]" : "border-gray-300"}`}>
                        {formData.payment === "bank_transfer" && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                      </span>
                    </div>
                    <span className="font-jost text-sm font-semibold text-[#4A0E1B]">Bank Transfer / External UPI</span>
                    <span className="font-jost text-xs text-[#7A6A5C] mt-1">
                      Direct transfer via NEFT, RTGS, IMPS, or UPI (GPay, PhonePe, Paytm).
                    </span>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-amber-700 font-jost">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>Admin uploads evidence &amp; confirms funds.</span>
                    </div>
                  </label>
                </div>
              </fieldset>

              {/* Bank Details Display when Bank Transfer is selected */}
              {formData.payment === "bank_transfer" && (
                <div className="bg-[#FAF6EC] border border-[#C9A24B]/40 p-5 rounded-md mt-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#C9A24B]/20">
                    <Building2 size={18} className="text-[#C9A24B]" />
                    <h4 className="font-cormorant text-lg text-[#4A0E1B] font-semibold">
                      AJ Jewellers Official Settlement Account
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-jost text-[#4A0E1B]">
                    <div>
                      <span className="text-[#7A6A5C] uppercase text-[10px] tracking-wider block">Account Name</span>
                      <span className="font-medium">{bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-[#7A6A5C] uppercase text-[10px] tracking-wider block">Account Number</span>
                      <span className="font-mono font-medium">{bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-[#7A6A5C] uppercase text-[10px] tracking-wider block">Bank &amp; Branch</span>
                      <span className="font-medium">{bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-[#7A6A5C] uppercase text-[10px] tracking-wider block">IFSC Code</span>
                      <span className="font-mono font-medium">{bankDetails.ifscCode}</span>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-[#C9A24B]/20 flex items-center justify-between">
                      <div>
                        <span className="text-[#7A6A5C] uppercase text-[10px] tracking-wider block">Official UPI ID</span>
                        <span className="font-mono font-semibold text-[#4A0E1B]">{bankDetails.upiId}</span>
                      </div>
                      <span className="text-[10px] bg-[#C9A24B]/20 text-[#4A0E1B] px-2 py-1 rounded">
                        GPay / PhonePe / Paytm
                      </span>
                    </div>
                  </div>

                  {/* Customer Payment Reference / UTR Input */}
                  <div className="mt-4 pt-3 border-t border-[#C9A24B]/30">
                    <label htmlFor="checkout-payment-ref" className="block font-jost text-[10px] uppercase tracking-wider text-[#7A6A5C] mb-1 font-semibold">
                      Transaction Reference / UTR Number (Optional)
                    </label>
                    <input
                      type="text"
                      id="checkout-payment-ref"
                      name="paymentReference"
                      value={formData.paymentReference}
                      onChange={handleChange}
                      placeholder="e.g. UTR / UPI Ref: 329849201928"
                      className="w-full bg-white border border-[#C9A24B]/40 focus:border-[#C9A24B] px-3 py-2 font-mono text-xs text-[#4A0E1B] outline-none rounded-sm"
                    />
                    <p className="mt-1 text-[10px] text-[#7A6A5C] font-jost">
                      If you have already initiated the transfer via Bank/UPI app, paste your transaction reference or UTR here to accelerate verification.
                    </p>
                  </div>

                  <p className="mt-3 text-[11px] text-[#7A6A5C] font-jost italic">
                    💡 Please include your phone number in the transaction remarks. Once placed, an administrator will verify the credit in our account and update your payment status.
                  </p>
                </div>
              )}
            </div>

            {/* Delivery Notes */}
            <div className="bg-white border border-[#4A0E1B]/10 p-6 md:p-8 shadow-sm">
              <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B] mb-6 flex items-center gap-3">
                <Truck size={24} className="text-[#C9A24B]" />
                Special Delivery Notes
              </h2>
              <label htmlFor="checkout-notes" className="sr-only">Special Delivery Notes</label>
              <textarea
                id="checkout-notes"
                name="notes"
                rows={2}
                value={formData.notes}
                onChange={handleChange}
                className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors resize-none"
                placeholder="Any special timing, gifting message, or delivery instructions..."
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-[#4A0E1B] text-[#FDFBF4] py-4 md:py-5 font-jost text-xs md:text-sm tracking-[0.2em] uppercase font-semibold hover:bg-[#380A14] transition-colors disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isProcessing ? "PROCESSING ORDER..." : `PLACE ORDER (₹${total.toLocaleString('en-IN')})`}
            </button>

            {/* Policy & Trust Links under Submit Button */}
            <div className="pt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] font-jost text-[#7A6A5C]">
              <Link to="/shipping" target="_blank" className="hover:text-[#C9A24B] underline underline-offset-2">Shipping Policy</Link>
              <span>&middot;</span>
              <Link to="/refund" target="_blank" className="hover:text-[#C9A24B] underline underline-offset-2">Return &amp; Refund Policy</Link>
              <span>&middot;</span>
              <Link to="/privacy" target="_blank" className="hover:text-[#C9A24B] underline underline-offset-2">Privacy Policy</Link>
              <span>&middot;</span>
              <Link to="/terms" target="_blank" className="hover:text-[#C9A24B] underline underline-offset-2">Terms of Service</Link>
            </div>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5 bg-white border border-[#4A0E1B]/10 p-6 md:p-8 shadow-sm sticky top-36">
          <h2 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B] mb-6 border-b border-[#4A0E1B]/10 pb-4">
            Order Summary ({cart.length} {cart.length === 1 ? 'Item' : 'Items'})
          </h2>

          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 mb-6">
            {cart.map((item: CartItem, idx: number) => (
              <div key={`${item._id}-${idx}`} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-14 h-14 object-cover border border-[#C9A24B]/30" />
                ) : (
                  <div className="w-14 h-14 bg-[#FDFBF4] border border-[#C9A24B]/30 flex items-center justify-center text-xs text-[#7A6A5C]">
                    Jewel
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-jost text-sm text-[#4A0E1B] font-medium truncate">{item.name}</p>
                  {item.specs && <p className="font-jost text-[11px] text-[#7A6A5C] truncate">{item.specs}</p>}
                  <p className="font-jost text-xs text-[#7A6A5C]">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-jost text-sm font-medium text-[#4A0E1B]">
                    ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 font-jost text-xs md:text-sm text-[#7A6A5C] border-t border-[#4A0E1B]/10 pt-4">
            <div className="flex justify-between">
              <span>Subtotal (excl. GST)</span>
              <span>₹{Math.round(subtotalBeforeGst).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated GST (3%)</span>
              <span>₹{Math.round(gstAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Insured Shipping</span>
              <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
            </div>
            <div className="flex justify-between font-bold text-[#4A0E1B] text-base md:text-lg border-t border-[#4A0E1B]/10 pt-3">
              <span>Authoritative Payable Total</span>
              <span className="text-[#C9A24B]">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-[#FDFBF4] border border-[#C9A24B]/30 rounded-sm text-[11px] text-[#7A6A5C] font-jost space-y-1">
            <p className="font-semibold text-[#4A0E1B]">Authenticity &amp; Security Guarantee</p>
            <p>• 100% BIS Hallmarked Jewellery</p>
            <p>• Server-authoritative gold rate validation</p>
            <p>• Tamper-proof tax invoice issued with every order</p>
          </div>
        </div>

      </div>

    </div>
  );
}