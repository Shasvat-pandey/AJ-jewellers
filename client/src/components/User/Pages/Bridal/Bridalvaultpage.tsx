import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, BadgeCheck, ArrowLeftRight, ShieldCheck, Gem } from "lucide-react";
import { FaArrowRight } from "react-icons/fa";
import { useToast } from "../../../Common/context/ToastContext";
import ProductImage from "../../Components/Product/ProductImage";
import { getImageUrl as resolveImageUrl } from "../../../../utils/imageUrl";
import { getWishlistItems, saveWishlistItems } from "../../../../utils/wishlist";
import { API_URL } from "../../../../utils/api";

const badges = [
  {
    icon: BadgeCheck,
    title: "BIS Hallmarked",
    description: "Certified 916 purity on every piece",
  },
  {
    icon: ArrowLeftRight,
    title: "Lifetime Exchange",
    description: "100% value on gold exchange",
  },
  {
    icon: ShieldCheck,
    title: "Insured Delivery",
    description: "Free & fully insured shipping",
  },
  {
    icon: Gem,
    title: "In-House Karigars",
    description: "Hand-finished by master artisans",
  },
];

export default function BridalVaultPage() {
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  
  // --- LIVE DATA STATES ---
  const [products, setProducts] = useState<any[]>([]);
  const [marketRates, setMarketRates] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH REAL BRIDAL VAULT PRODUCTS & MARKET RATES ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // --- FIX 1: LOAD WISHLIST FROM LOCAL STORAGE ON PAGE LOAD ---
        const savedIds = getWishlistItems();
        setWishlisted(new Set(savedIds));

        // 1. Fetch Live Market Rates for dynamic pricing
        const settingsRes = await fetch(`${API_URL}/settings`, { credentials: 'include' });
        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          setMarketRates(settingsData.data.marketRates);
        }

        // 2. Fetch All Products
        const productsRes = await fetch(`${API_URL}/products`, { credentials: 'include' });
        const productsData = await productsRes.json();
        
        if (productsData.success) {
          // Filter ONLY products where the collection was set to "Bridal Vault" in the Admin panel
          const bridalProducts = productsData.data.filter(
            (p: any) => p.productCollection === "Bridal Vault" || p.category.toLowerCase().includes("bridal")
          );
          setProducts(bridalProducts);
        }
      } catch (error) {
        console.error("Error fetching Bridal Vault products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- DYNAMIC PRICING ENGINE ---
  const calculatePrice = (item: any) => {
    if (!marketRates || !item) return 0;

    let metalRate = 0;
    if (item.purity === "24K Gold") metalRate = marketRates.rate24k;
    else if (item.purity === "22K Gold") metalRate = marketRates.rate22k;
    else if (item.purity === "18K Gold") metalRate = marketRates.rate18k;
    else if (item.purity === "Silver (925)") metalRate = marketRates.silver;

    const metalValue = metalRate * (Number(item.weight) || 0);
    const diamondValue = Number(item.diamondValue) || 0;
    const makingChargesAmt = metalValue * ((Number(item.makingCharges) || 0) / 100);
    
    const preGstTotal = metalValue + diamondValue + makingChargesAmt;
    const gstPercent = item.gst !== undefined && item.gst !== null ? Number(item.gst) : 3;
    const gstAmount = preGstTotal * (gstPercent / 100);
    
    return preGstTotal + gstAmount;
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Centralised resolver: handles legacy string URLs + new variant objects
  const getImageUrl = (entry: any) => resolveImageUrl(entry);

  // --- FIX 2: SAVE WISHLIST TO LOCAL STORAGE WHEN CLICKED ---
  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation();

    // Grab existing wishlist from local storage
    const savedIds = getWishlistItems();
    let updatedIds;

    // Check if we are adding or removing
    if (savedIds.includes(id)) {
      // It's already saved, so remove it!
      updatedIds = savedIds.filter((savedId: string) => savedId !== id);
      showToast("Removed from wishlist", "success");
    } else {
      // It's not saved yet, so add it!
      updatedIds = [...savedIds, id];
      showToast("Added to wishlist!", "success");
    }

    // Save the new list to browser storage and update the UI
    saveWishlistItems(updatedIds);
    setWishlisted(new Set(updatedIds));
  };

  // --- ADD TO CART FUNCTION ---
  const handleAddToCart = (e: React.MouseEvent, product: any, finalPrice: number) => {
    e.preventDefault(); 
    e.stopPropagation();

    const cartItem = {
      _id: product._id,
      name: product.name,
      specs: `${product.purity} / ${product.weight}g`,
      price: finalPrice, 
      image: getImageUrl(product.images[0]),
      quantity: 1,
    };

    const existingCart = JSON.parse(localStorage.getItem("aj_cart") || "[]");
    
    const existingItemIndex = existingCart.findIndex((item: any) => item._id === cartItem._id);
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1;
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem("aj_cart", JSON.stringify(existingCart));
    showToast(`${product.name} added to bag!`, "success");
  };

  if (isLoading) {
    return (
      <div className="bg-[#FDFBF4] min-h-screen pt-36 pb-12 flex justify-center text-[#7A6A5C] font-jost animate-pulse">
        Loading the Bridal Vault...
      </div>
    );
  }

  return (
    <div className="bg-[#FDFBF4]">
      {/* --- GRID LAYOUT SECTION --- */}
      <section className="pt-28 md:pt-36 pb-8 md:pb-12 px-4 sm:px-6 md:px-12 lg:px-20">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <p className="font-jost text-[9px] md:text-[10px] tracking-[0.24em] text-[#C9A24B] uppercase mb-3">
            Collection
          </p>
          <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#4A0E1B] mb-4">
            Bridal Vault
          </h1>
          <div className="w-12 md:w-16 h-[1px] bg-[#C9A24B] mx-auto mb-5" />
          <p className="font-jost text-sm md:text-base text-[#7A6A5C] leading-relaxed px-4">
            Complete wedding sets — haar, jhumka, maang tikka and kada together.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between border-b border-[#C9A24B]/20 pb-4 mb-8 md:mb-10 max-w-5xl mx-auto">
          <span className="font-jost text-[10px] md:text-xs tracking-[0.16em] text-[#7A6A5C] uppercase">
            {products.length} Pieces
          </span>

          <div className="flex items-center gap-2 md:gap-4">
            <span className="font-jost text-[10px] md:text-xs tracking-[0.16em] text-[#7A6A5C] uppercase">
              Sort
            </span>
            <select className="bg-transparent border border-[#C9A24B]/30 font-jost text-[11px] md:text-sm text-[#4A0E1B] py-1.5 px-3 md:py-2 md:px-4 focus:outline-none focus:border-[#C9A24B] cursor-pointer rounded-none outline-none">
              <option value="featured">Featured</option>
              <option value="new">New Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16 text-[#7A6A5C] font-jost border border-dashed border-[#C9A24B]/40 max-w-5xl mx-auto">
            No pieces have been added to the Bridal Vault yet. Add some from the Admin Dashboard!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-10 md:gap-x-8 md:gap-y-14 max-w-5xl mx-auto">
            {products.map((product) => {
              const isWishlisted = wishlisted.has(product._id);
              const finalPrice = calculatePrice(product);

              return (
                <Link
                  to={`/products/${product._id}`}
                  key={product._id}
                  onClick={() => window.scrollTo(0, 0)}
                  className="group cursor-pointer flex flex-col"
                >
                  <div className="relative mb-4 md:mb-5">
                    <ProductImage
                      image={product.images[0]}
                      alt={product.name}
                      ratio="square"
                      imgClassName="transition-transform duration-700 group-hover:scale-105"
                    />
                    {product.isNew && (
                      <div className="absolute top-0 left-0 bg-[#4A0E1B] text-[#C9A24B] font-jost text-[8px] md:text-[10px] tracking-[0.2em] px-2 py-1 md:px-3 md:py-1.5 uppercase z-10">
                        NEW
                      </div>
                    )}
                    <button
                      onClick={(e) => toggleWishlist(e, product._id)}
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      className="absolute top-2 right-2 md:top-3 md:right-3 bg-white/90 p-1.5 md:p-2 rounded-full text-[#4A0E1B] hover:text-[#C9A24B] hover:bg-white transition-colors z-10 shadow-sm"
                    >
                      <Heart 
                        size={16} 
                        strokeWidth={1.5} 
                        fill={isWishlisted ? "currentColor" : "none"} 
                        className={isWishlisted ? "text-[#4A0E1B]" : "md:w-5 md:h-5"} 
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col">
                      <h3 className="font-cormorant text-base md:text-xl text-[#4A0E1B] mb-1 leading-tight pr-2 truncate">
                        {product.name}
                      </h3>
                      <p className="font-jost text-[11px] md:text-sm text-[#7A6A5C]">
                        ₹{formatINR(finalPrice)}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => handleAddToCart(e, product, finalPrice)}
                      className="flex items-center gap-1.5 text-[#4A0E1B] hover:text-[#C9A24B] transition-colors mt-0.5 md:mt-1 shrink-0 bg-[#C9A24B]/10 px-3 py-1.5 rounded-sm"
                    >
                      <ShoppingBag size={14} strokeWidth={1.5} className="md:w-4 md:h-4" />
                      <span className="font-jost text-[9px] md:text-xs tracking-[0.15em] uppercase font-medium">
                        Add
                      </span>
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* --- CLOSING CTA SECTION --- */}
      <section
        className="py-16 md:py-24 px-6 text-center"
        style={{
          background:
            "radial-gradient(ellipse at center, #5A0F1D 0%, #3B0A14 70%, #2A0710 100%)",
        }}
      >
        <h2 className="font-cormorant text-3xl md:text-5xl text-[#F3E9D8] mb-4 md:mb-5">
          See the full set in person
        </h2>
        <p className="font-jost text-sm md:text-base text-[#E7C9B8]/85 max-w-[46ch] mx-auto mb-8 md:mb-10 leading-relaxed">
          Book a private viewing at our boutique to try the complete Bridal Vault
          before your big day.
        </p>
        <Link
          to="/visit-us?book=1"
          className="inline-flex items-center gap-3 font-jost text-xs md:text-sm tracking-[0.16em] text-[#F3E9D8] border border-[#C9A24B] px-8 py-4 hover:bg-[#C9A24B] hover:text-[#2A0A10] transition-colors"
        >
          BOOK AN APPOINTMENT
          <FaArrowRight size={13} />
        </Link>
      </section>

      {/* --- TRUST BADGES SECTION --- */}
      <section className="py-12 md:py-20 px-6 md:px-12 lg:px-20 bg-[#FDFBF4]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 max-w-5xl mx-auto text-center">
          {badges.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-[#C9A24B] flex items-center justify-center mb-4 md:mb-5">
                <Icon size={24} strokeWidth={1.2} className="text-[#C9A24B]" />
              </div>
              <h3 className="font-jost text-[11px] md:text-xs tracking-[0.16em] text-[#4A0E1B] font-medium mb-2 uppercase">
                {title}
              </h3>
              <p className="font-jost text-[13px] md:text-sm text-[#7A6A5C] leading-snug max-w-[20ch]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
}
