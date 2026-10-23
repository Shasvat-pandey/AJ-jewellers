import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { useToast } from "../../../Common/context/ToastContext";
import ProductImage from "../../Components/Product/ProductImage";
import { getImageUrl as resolveImageUrl } from "../../../../utils/imageUrl";
import { getWishlistItems, saveWishlistItems } from "../../../../utils/wishlist";
import { API_URL } from "../../../../utils/api";
import { calculatePrice as calcPrice, formatINR as formatCurrency } from "../../../../utils/price";

export default function WishlistPage() {
  const { showToast } = useToast();
  
  // --- LIVE DATA STATES ---
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [marketRates, setMarketRates] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH REAL PRODUCTS & FILTER BY SAVED IDs ---
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

        // 2. Fetch All Products
        const productsRes = await fetch(`${API_URL}/products`, { credentials: 'include' });
        const productsData = await productsRes.json();
        
        if (productsData.success) {
          // 3. Get saved IDs from local storage
          const savedIds = getWishlistItems();
          
          // 4. Keep only the products that the user has wishlisted
          const savedProducts = productsData.data.filter((p: any) => savedIds.includes(p._id));
          setWishlistProducts(savedProducts);
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- DYNAMIC PRICING ENGINE ---
  const calculatePrice = (item: any) => {
    return calcPrice(item, marketRates);
  };

  const formatINR = (amount: number | string | null | undefined) => {
    return formatCurrency(amount);
  };

  // Centralised resolver: handles legacy string URLs + new variant objects
  const getImageUrl = (entry: any) => resolveImageUrl(entry);

  // --- REMOVE FROM WISHLIST ---
  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation();

    // Remove from local storage
    const savedIds = getWishlistItems();
    const updatedIds = savedIds.filter((savedId: string) => savedId !== id);
    saveWishlistItems(updatedIds);

    // Remove from UI instantly
    setWishlistProducts(prev => prev.filter(p => p._id !== id));
    showToast("Removed from wishlist", "success");
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
    return <div className="min-h-screen pt-36 pb-12 flex justify-center text-[#7A6A5C] font-jost animate-pulse">Loading your wishlist...</div>;
  }

  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-24 px-4 sm:px-6 md:px-12 lg:px-20 animate-in fade-in duration-500">
      
      {/* --- HEADER SECTION --- */}
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
        <p className="font-jost text-[9px] md:text-[10px] tracking-[0.24em] text-[#C9A24B] uppercase mb-3 font-semibold">
          SAVED
        </p>
        <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#4A0E1B] mb-5">
          Your Wishlist
        </h1>
        <div className="w-12 md:w-16 h-[1px] bg-[#C9A24B] mx-auto mb-5" />
      </div>

      {/* --- WISHLIST GRID --- */}
      {wishlistProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-jost text-base text-[#7A6A5C] mb-6">Your wishlist is currently empty.</p>
          <Link
            to="/collections"
            className="inline-block font-jost text-xs tracking-[0.14em] text-[#4A0E1B] border border-[#4A0E1B]/40 px-8 py-3 hover:bg-[#4A0E1B] hover:text-[#FDFBF4] transition-colors shadow-sm"
          >
            DISCOVER COLLECTIONS
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-6 md:gap-y-14 max-w-6xl mx-auto">
          {wishlistProducts.map((item) => {
            const finalPrice = calculatePrice(item);

            return (
              <Link to={`/products/${item._id}`} key={item._id} onClick={() => window.scrollTo(0, 0)} className="group cursor-pointer flex flex-col">
                
                {/* Image Box — fixed square well, photo never stretched/cropped */}
                <div className="relative mb-3 md:mb-4">
                  <ProductImage
                    image={item.images[0]}
                    alt={item.name}
                    ratio="square"
                    imgClassName="transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {item.isNew && (
                    <div className="absolute top-0 left-0 bg-[#4A0E1B] text-[#C9A24B] font-jost text-[8px] md:text-[10px] tracking-[0.2em] px-2 py-1 md:px-3 md:py-1.5 uppercase z-10">
                      NEW
                    </div>
                  )}
                  
                  {/* Remove from Wishlist Button */}
                  <button 
                    onClick={(e) => handleRemove(e, item._id)}
                    aria-label="Remove from Wishlist" 
                    className="absolute top-2 right-2 md:top-3 md:right-3 bg-white/95 p-1.5 md:p-2.5 rounded-full text-[#4A0E1B] hover:text-red-500 hover:bg-white transition-colors z-10 shadow-sm"
                  >
                    <Heart size={16} fill="currentColor" strokeWidth={1.5} className="md:w-5 md:h-5" />
                  </button>
                </div>

                {/* Details Box */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <h3 className="font-cormorant text-base md:text-xl text-[#4A0E1B] mb-0.5 md:mb-1 leading-tight pr-2 truncate">
                      {item.name}
                    </h3>
                    <p className="font-jost text-lg md:text-base text-[#7A6A5C]">
                      ₹{formatINR(finalPrice)}
                    </p>
                  </div>
                  
                  {/* Add to Bag Button */}
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

    </div>
  );
}
