import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react"; // Removed FaHeart and FaRegHeart
import { useToast } from "../../../../components/Common/context/ToastContext";
import ProductImage from "../../Components/Product/ProductImage";
import { getImageUrl as resolveImageUrl } from "../../../../utils/imageUrl";
import { getWishlistItems, saveWishlistItems } from "../../../../utils/wishlist";
import { API_URL } from "../../../../utils/api";

export default function EverydayGoldPage() {
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  
  // --- LIVE DATA STATES ---
  const [products, setProducts] = useState<any[]>([]);
  const [marketRates, setMarketRates] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH REAL EVERYDAY GOLD PRODUCTS & MARKET RATES ---
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
          // Filter ONLY products where the collection was set to "Everyday Wear" in the Admin panel
          const everydayProducts = productsData.data.filter(
            (p: any) => p.productCollection === "Everyday Wear" || p.category.toLowerCase().includes("everyday")
          );
          setProducts(everydayProducts);
        }
      } catch (error) {
        console.error("Error fetching Everyday Gold products:", error);
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
        Loading Everyday Gold collection...
      </div>
    );
  }

  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-24 px-4 sm:px-6 md:px-12 lg:px-20">
      
      {/* --- HEADER SECTION --- */}
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
        <p className="font-jost text-[9px] md:text-[10px] tracking-[0.24em] text-[#C9A24B] uppercase mb-3 font-semibold">
          Collection
        </p>
        <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#4A0E1B] mb-4">
          Everyday Gold
        </h1>
        <div className="w-12 md:w-16 h-[1px] bg-[#C9A24B] mx-auto mb-5" />
        <p className="font-jost text-sm md:text-base text-[#7A6A5C] leading-relaxed px-4">
          Featherlight chains and studs made to never come off.
        </p>
      </div>

      {/* --- CONTROLS BAR --- */}
      <div className="flex items-center justify-between border-b border-[#C9A24B]/20 pb-4 mb-8 md:mb-10 max-w-7xl mx-auto">
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

      {/* --- PRODUCT GRID --- */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-[#7A6A5C] font-jost border border-dashed border-[#C9A24B]/40 max-w-7xl mx-auto">
          No pieces have been added to Everyday Gold yet. Add some from the Admin Dashboard!
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-6 lg:gap-x-8 md:gap-y-14 max-w-7xl mx-auto">
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
                {/* Image Box — fixed square well, photo never stretched/cropped */}
                <div className="relative mb-3 md:mb-4">
                  <ProductImage
                    image={product.images[0]}
                    alt={product.name}
                    ratio="square"
                    imgClassName="transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {product.isNew && (
                    <div className="absolute top-0 left-0 bg-[#3F0106] text-[#C9A24B] font-jost text-[8px] md:text-[10px] tracking-[0.2em] px-2 py-1 md:px-3 md:py-1.5 uppercase z-10">
                      NEW
                    </div>
                  )}
                  
                  {/* FIX 3: EXACT SAME HEART LOGIC/STYLES AS BRIDAL VAULT */}
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

                {/* Details Box */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <h3 className="font-cormorant text-base md:text-xl text-[#4A0E1B] mb-0.5 md:mb-1 leading-tight pr-2 truncate">
                      {product.name}
                    </h3>
                    <p className="font-jost text-[11px] md:text-sm text-[#7A6A5C]">
                      ₹{formatINR(finalPrice)}
                    </p>
                  </div>
                  
                  {/* Add to Bag Button */}
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
    </div>
  );
}
