import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../../../components/Common/context/AuthContext";

export default function BagPage() {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  // 1. LOCAL STATE: Read cart from browser storage on load
  const [bagItems, setBagItems] = useState<any[]>(() => {
    const savedCart = localStorage.getItem("aj_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 2. SYNC: Save to browser storage automatically whenever bagItems changes
  useEffect(() => {
    localStorage.setItem("aj_cart", JSON.stringify(bagItems));
    window.dispatchEvent(new Event("cart_updated"));
  }, [bagItems]);

  // 3. ACTIONS: Update quantity & Remove items
  const updateQuantity = (id: string, variantId: string | undefined, newQuantity: number) => {
    if (newQuantity < 1) return; // Don't allow 0 or negative quantities
    setBagItems((prev) =>
      prev.map((item) => (item._id === id && item.variantId === variantId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const removeItem = (id: string, variantId: string | undefined) => {
    setBagItems((prev) => prev.filter((item) => !(item._id === id && item.variantId === variantId)));
  };

  // 4. MATH: Dynamic calculations
  const cartTotal = bagItems.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
  const gstAmount = bagItems.reduce((total, item) => {
    const itemGstPercent = item.gstPercent !== undefined && item.gstPercent !== null ? Number(item.gstPercent) : 3;
    const itemTotal = Number(item.price) * item.quantity;
    return total + (itemTotal - (itemTotal / (1 + itemGstPercent / 100)));
  }, 0);
  const subtotalBeforeGst = cartTotal - gstAmount;
  const shipping = cartTotal > 50000 ? 0 : 150;
  const grandTotal = cartTotal + shipping;

  // Currency Formatter Helper
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="font-jost text-[10px] md:text-xs tracking-[0.24em] text-[#C9A24B] uppercase mb-4 font-semibold">
            CHECKOUT
          </p>
          <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#4A0E1B] mb-5">
            Your Bag
          </h1>
          <div className="w-12 md:w-16 h-px bg-[#C9A24B] mx-auto" />
        </div>

        {/* Conditional Rendering: Empty State vs Populated Cart */}
        {bagItems.length === 0 ? (
          
          <div className="text-center py-10 md:py-16">
            <p className="font-jost text-sm md:text-base text-[#7A6A5C] mb-8">
              Your bag is empty.
            </p>
            <Link
              to="/collections"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-block font-jost text-xs md:text-sm tracking-[0.14em] text-[#4A0E1B] border border-[#4A0E1B]/40 px-10 py-3.5 hover:bg-[#4A0E1B] hover:text-[#FDFBF4] transition-colors"
            >
              START SHOPPING
            </Link>
          </div>

        ) : (

          <>
            {/* Item List */}
            <div className="space-y-8 md:space-y-10">
              {bagItems.map((item) => (
                <div key={`${item._id}-${item.variantId || "base"}`} className="flex gap-6 md:gap-8 pb-8 md:pb-10 border-b border-[#EAE3D5]">
                  <Link 
                    to={`/products/${item._id}`}
                    className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-[#4A0E1B]/5 p-2 flex items-center justify-center group"
                  >
                    {/* Updated to use object-contain so it doesn't crop */}
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                  </Link>
                  
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <Link 
                        to={`/products/${item._id}`}
                        className="font-cormorant text-xl md:text-2xl text-[#4A0E1B] hover:text-[#8C6514] transition-colors"
                      >
                        {item.name}
                      </Link>
                      <span className="font-jost text-sm md:text-base text-[#4A0E1B] font-medium">
                        ₹{formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                    <p className="font-jost text-[11px] md:text-sm text-[#7A6A5C] mb-6">
                      {item.specs}
                    </p>
                    
                    <div className="flex items-center gap-6 mt-auto">
                      <div className="flex items-center justify-between border border-[#EAE3D5] bg-transparent w-24 md:w-28 px-3 md:px-4 py-2 md:py-2.5">
                        <button 
                          onClick={() => updateQuantity(item._id, item.variantId, item.quantity - 1)}
                          className="text-[#4A0E1B] hover:text-[#C9A24B] transition-colors cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-jost text-sm text-[#4A0E1B] font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item._id, item.variantId, item.quantity + 1)}
                          className="text-[#4A0E1B] hover:text-[#C9A24B] transition-colors cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item._id, item.variantId)}
                        className="text-[#7A6A5C] hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={18} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-10 md:mt-12 space-y-4 font-jost text-[15px]">
              <div className="flex justify-between text-[#7A6A5C]">
                <span>Subtotal ({bagItems.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                <span className="text-[#4A0E1B] font-medium">₹{formatINR(subtotalBeforeGst)}</span>
              </div>
              <div className="flex justify-between text-[#7A6A5C]">
                <span>Total GST</span>
                <span className="text-[#4A0E1B] font-medium">₹{formatINR(gstAmount)}</span>
              </div>
              <div className="flex justify-between text-[#7A6A5C]">
                <span>Insured delivery</span>
                <span className="text-[#4A0E1B] font-medium">
                  {shipping === 0 ? "FREE" : `₹${formatINR(shipping)}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-[11px] text-[#C9A24B] italic text-right">
                  Free insured delivery on orders above ₹50,000
                </p>
              )}
            </div>

            <div className="flex justify-between items-baseline mt-8 pt-8 border-t border-[#EAE3D5] mb-10">
              <span className="font-cormorant text-3xl md:text-4xl text-[#4A0E1B]">Total</span>
              <span className="font-cormorant text-3xl md:text-4xl text-[#4A0E1B]">₹{formatINR(grandTotal)}</span>
            </div>

            <button
              onClick={() => {
                requireAuth(() => {
                  navigate("/checkout");
                  window.scrollTo(0, 0);
                }, "Sign in to complete your insured order & checkout");
              }}
              className="block w-full text-center bg-[#4A0E1B] text-[#F3E9D8] font-jost text-[11px] md:text-xs tracking-[0.2em] uppercase py-4 md:py-5 hover:bg-[#3B0A14] transition-colors shadow-md cursor-pointer"
            >
              PROCEED TO CHECKOUT
            </button>
          </>
        )}

      </div>
    </div>
  );
}