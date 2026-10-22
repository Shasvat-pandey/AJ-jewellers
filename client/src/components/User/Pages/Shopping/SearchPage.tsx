import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { useToast } from "../../../../components/Common/context/ToastContext";
import ProductImage from "../../Components/Product/ProductImage";
import { getImageUrl as resolveImageUrl } from "../../../../utils/imageUrl";
import { getWishlistItems, saveWishlistItems } from "../../../../utils/wishlist";
import { API_URL } from "../../../../utils/api";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { showToast } = useToast();
  
  const [items, setItems] = useState<any[]>([]);
  const [marketRates, setMarketRates] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- WISHLIST STATE ---
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  // --- FETCH REAL PRODUCTS & MARKET RATES ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch Live Market Rates for dynamic pricing
        const settingsRes = await fetch(`${API_URL}/settings`, { credentials: 'include' });
        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          setMarketRates(settingsData.data.marketRates);
        }

        // 2. Fetch Products
        const response = await fetch(`${API_URL}/products`, { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
          const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
          let filteredProducts = data.data;

          if (queryTokens.length > 0) {
            filteredProducts = data.data.filter((p: any) => {
              const textToSearch = [
                p.name,
                p.category,
                p.description,
                p.productCollection
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              let matchCount = 0;
              for (const token of queryTokens) {
                if (textToSearch.includes(token)) {
                  matchCount++;
                }
              }
              return (matchCount / queryTokens.length) >= 0.5;
            });
          }
          setItems(filteredProducts);
        }

        // 3. Load Wishlist from Local Storage
        const savedIds = getWishlistItems();
        setWishlisted(new Set(savedIds));

      } catch (error) {
        console.error("Error fetching products:", error);
        showToast("Failed to load products.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [query]);

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

  // --- WISHLIST TOGGLE (Syncs to Local Storage) ---
  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    const savedIds = getWishlistItems();
    
    if (wishlisted.has(id)) {
      const updatedIds = savedIds.filter((savedId: string) => savedId !== id);
      saveWishlistItems(updatedIds);
      showToast("Removed from wishlist", "success");
      
      setWishlisted((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      savedIds.push(id);
      saveWishlistItems(savedIds);
      showToast("Added to wishlist!", "success");
      
      setWishlisted((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }
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
      image: resolveImageUrl(product.images[0]),
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

  const title = query ? `Search Results for "${query}"` : "All Products";

  if (isLoading) {
    return <div className="min-h-screen pt-36 text-center text-[#7A6A5C] font-jost animate-pulse">Searching...</div>;
  }

  return (
    <section className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-24 px-4 sm:px-6 md:px-12 lg:px-20">
      
      {/* --- HEADER SECTION --- */}
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
        <p className="font-jost text-[9px] md:text-[10px] tracking-[0.24em] text-[#C9A24B] uppercase mb-3">
          Search
        </p>
        <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#4A0E1B] mb-4">
          {title}
        </h1>
      </div>

      <div className="flex items-center justify-between border-b border-[#C9A24B]/20 pb-4 mb-8 md:mb-10 max-w-5xl mx-auto">
        <span className="font-jost text-[10px] md:text-xs tracking-[0.16em] text-[#7A6A5C] uppercase">
          {items.length} Pieces
        </span>
      </div>

      {/* --- PRODUCT GRID --- */}
      {items.length === 0 ? (
        <div className="text-center py-10 text-[#7A6A5C] font-jost">
          No items match your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-10 md:gap-x-8 md:gap-y-14 max-w-5xl mx-auto">
          {items.map((item) => {
            const isWishlisted = wishlisted.has(item._id);
            const finalPrice = calculatePrice(item);

            return (
              <Link to={`/products/${item._id}`} key={item._id} onClick={() => window.scrollTo(0, 0)} className="group cursor-pointer flex flex-col">
                
                {/* Image Box — fixed square well, photo never stretched/cropped */}
                <div className="relative mb-4 md:mb-5">
                  <ProductImage
                    image={item.images[0]}
                    alt={item.name}
                    ratio="square"
                    imgClassName="transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {item.status === "Low Stock" && (
                    <div className="absolute top-0 left-0 bg-orange-100 text-orange-800 font-jost text-[8px] md:text-[10px] tracking-[0.2em] px-2 py-1 md:px-3 md:py-1.5 uppercase z-10">
                      Low Stock
                    </div>
                  )}
                  
                  <button 
                    onClick={(e) => toggleWishlist(e, item._id)}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    className="absolute top-2 right-2 md:top-3 md:right-3 bg-white/90 p-1.5 md:p-2 rounded-full text-[#4A0E1B] hover:text-[#C9A24B] hover:bg-white transition-colors z-10 shadow-sm"
                  >
                    <Heart size={16} strokeWidth={1.5} fill={isWishlisted ? "currentColor" : "none"} className={isWishlisted ? "text-[#4A0E1B]" : "md:w-5 md:h-5"} />
                  </button>
                </div>

                {/* Details Box */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <h3 className="font-cormorant text-base md:text-xl text-[#4A0E1B] mb-1 leading-tight pr-2 truncate">
                      {item.name}
                    </h3>
                    <p className="font-jost text-[11px] md:text-sm text-[#7A6A5C]">
                      ₹{formatINR(finalPrice)}
                    </p>
                  </div>
                  
                  {/* ADD TO BAG BUTTON */}
                  <button 
                    onClick={(e) => handleAddToCart(e, item, finalPrice)}
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
  );
}
