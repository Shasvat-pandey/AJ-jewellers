import React, { useEffect, useState, useCallback } from "react";
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWishlistItems, saveWishlistItems } from "../../../../../utils/wishlist";
import { API_URL } from "../../../../../utils/api";
import { getImageUrl } from "../../../../../utils/imageUrl";
import { calculatePrice, formatINR } from "../../../../../utils/price";
import { useToast } from "../../../../Common/context/ToastContext";

export const WishlistTab: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [items, setItems] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [marketRates, setMarketRates] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Central image resolver
  const resolveItemImage = (item: any) => {
    if (item.images && item.images.length > 0) {
      const resolved = getImageUrl(item.images[0]);
      if (resolved) return resolved;
    }
    if (item.image) {
      const resolved = getImageUrl(item.image);
      if (resolved) return resolved;
    }
    return "/src/assets/products/solitaire-ring.jpg";
  };

  // Fetch live market rates and products
  const fetchWishlistProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedIds = getWishlistItems();

      // Fetch live market rates and product catalog concurrently
      const [settingsRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/settings`, { credentials: "include" }),
        fetch(`${API_URL}/products`, { credentials: "include" })
      ]);

      let rates = null;
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.data?.marketRates) {
          rates = settingsData.data.marketRates;
          setMarketRates(rates);
        }
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        if (productsData.success && Array.isArray(productsData.data)) {
          const allProducts = productsData.data;

          // Match saved wishlist items
          const matched = allProducts.filter((p: any) => savedIds.includes(p._id));
          setItems(matched);

          // Prepare recommended items (top 3 popular pieces)
          const recs = allProducts
            .filter((p: any) => !savedIds.includes(p._id))
            .slice(0, 3);
          setRecommended(recs.length > 0 ? recs : allProducts.slice(0, 3));
        }
      }
    } catch (err) {
      console.error("Wishlist fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlistProducts();

    // Listen to localStorage changes across browser tabs or modal actions
    const handleStorageChange = () => {
      fetchWishlistProducts();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchWishlistProducts]);

  // Remove single item from Wishlist
  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const savedIds = getWishlistItems();
    const updated = savedIds.filter(itemId => itemId !== id);
    saveWishlistItems(updated);
    setItems(prev => prev.filter(p => p._id !== id));
    window.dispatchEvent(new Event("storage"));
    showToast("Removed from wishlist", "success");
  };

  // Add item to shopping bag
  const handleAddToBag = (e: React.MouseEvent, product: any, finalPrice: number) => {
    e.stopPropagation();
    try {
      const currentBag = JSON.parse(localStorage.getItem("aj_cart") || "[]");
      const existingIndex = currentBag.findIndex((i: any) => i._id === product._id);
      
      const itemImage = resolveItemImage(product);
      const itemSpecs = product.specs || (product.purity ? `${product.purity} · ${product.weight || 0}g` : "BIS Hallmarked Gold");

      if (existingIndex >= 0) {
        currentBag[existingIndex].quantity = (currentBag[existingIndex].quantity || 1) + 1;
      } else {
        currentBag.push({
          _id: product._id,
          name: product.name,
          price: finalPrice,
          image: itemImage,
          specs: itemSpecs,
          quantity: 1,
        });
      }

      localStorage.setItem("aj_cart", JSON.stringify(currentBag));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("cart_updated"));
      showToast(`${product.name} added to shopping bag!`, "success");
    } catch {
      showToast("Failed to add to bag", "error");
    }
  };

  // Navigate to product detail page
  const handleNavigateToProduct = (productId: string) => {
    if (!productId) return;
    navigate(`/products/${productId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER BANNER CARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5D7B7]/70 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#4A0E1B]">Saved Wishlist</h3>
            {items.length > 0 && (
              <span className="px-3 py-0.5 rounded-full bg-[#FAF6EE] text-[#8C6514] border border-[#E5D7B7] text-xs font-jost font-semibold">
                {items.length} {items.length === 1 ? "Item" : "Items"}
              </span>
            )}
          </div>
          <p className="font-jost text-xs text-[#7A6A5C] mt-1">
            Your curated collection of fine gold ornaments and certified diamond jewellery
          </p>
        </div>
        <button
          onClick={() => navigate("/collections")}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#4A0E1B]/30 text-[#4A0E1B] hover:bg-[#4A0E1B]/5 rounded-xl font-jost text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <span>Explore Collections</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      {isLoading ? (
        <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-16 text-center shadow-sm">
          <div className="w-10 h-10 border-2 border-[#C9A24B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-jost text-sm text-[#7A6A5C] animate-pulse">
            Retrieving your saved treasures &amp; calculating live pricing...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="space-y-8">
          {/* EMPTY STATE CARD */}
          <div className="bg-white border border-[#E5D7B7]/70 rounded-xl p-10 sm:p-14 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#FAF6EE] border border-[#E5D7B7] flex items-center justify-center text-[#C9A24B] mx-auto mb-4">
              <Heart size={32} />
            </div>
            <h4 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#4A0E1B]">Your Wishlist is Empty</h4>
            <p className="font-jost text-xs sm:text-sm text-[#7A6A5C] mt-2 max-w-md mx-auto leading-relaxed">
              You haven't saved any heirloom treasures yet. Browse our artisanal jewellery collections and tap the heart icon to save your favourites.
            </p>
            <button
              onClick={() => navigate("/collections")}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#4A0E1B] hover:bg-[#3B0A14] text-[#FDFBF7] font-jost text-xs tracking-wider uppercase font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <span>Discover Collections</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* CURATED RECOMMENDATIONS SECTION */}
          {recommended.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-cormorant text-2xl font-bold text-[#4A0E1B]">Recommended For You</h4>
                  <p className="font-jost text-xs text-[#7A6A5C] mt-0.5">Explore our most coveted artisanal jewellery pieces</p>
                </div>
                <button
                  onClick={() => navigate("/collections")}
                  className="text-xs font-jost font-semibold text-[#8C6514] hover:text-[#4A0E1B] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommended.map((item) => {
                  const finalPrice = calculatePrice(item, marketRates);
                  const imageUrl = resolveItemImage(item);
                  const specs = item.specs || (item.purity ? `${item.purity} · ${item.weight || 0}g` : "BIS Hallmarked");

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleNavigateToProduct(item._id)}
                      className="bg-white border border-[#E5D7B7]/70 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#C9A24B] transition-all flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="p-4">
                        <div className="relative w-full h-48 bg-[#FAF6EE] rounded-lg overflow-hidden flex items-center justify-center p-3 mb-4">
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-white/90 border border-[#E5D7B7] text-[10px] font-jost text-[#8C6514] font-semibold flex items-center gap-1">
                            <Sparkles size={11} className="text-[#C9A24B]" />
                            <span>Featured</span>
                          </div>
                        </div>

                        <p className="font-jost text-[10px] uppercase tracking-widest text-[#C9A24B] font-semibold">
                          {item.category || "Fine Jewellery"}
                        </p>
                        <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B] mt-1 truncate group-hover:text-[#8C6514] transition-colors">
                          {item.name}
                        </h4>
                        <p className="font-jost text-xs text-[#7A6A5C] mt-0.5 truncate">
                          {specs}
                        </p>
                        <p className="font-cormorant text-2xl font-bold text-[#4A0E1B] mt-2">
                          ₹{formatINR(finalPrice)}
                        </p>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          onClick={(e) => handleAddToBag(e, item, finalPrice)}
                          className="w-full py-2.5 px-4 bg-[#4A0E1B] text-[#FDFBF7] font-jost text-xs tracking-wider uppercase font-semibold rounded-lg hover:bg-[#3B0A14] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          <ShoppingBag size={14} />
                          <span>Add To Bag</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SAVED WISHLIST GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const finalPrice = calculatePrice(item, marketRates);
            const imageUrl = resolveItemImage(item);
            const specs = item.specs || (item.purity ? `${item.purity} · ${item.weight || 0}g` : "BIS Hallmarked");

            return (
              <div
                key={item._id}
                onClick={() => handleNavigateToProduct(item._id)}
                className="bg-white border border-[#E5D7B7]/70 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#C9A24B] transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="p-4">
                  <div className="relative w-full h-48 bg-[#FAF6EE] rounded-lg overflow-hidden flex items-center justify-center p-3 mb-4">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Remove from Wishlist button */}
                    <button
                      onClick={(e) => handleRemove(e, item._id)}
                      title="Remove from wishlist"
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 text-red-600 flex items-center justify-center hover:bg-red-50 hover:text-red-700 transition-colors shadow-xs cursor-pointer z-10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="font-jost text-[10px] uppercase tracking-widest text-[#C9A24B] font-semibold">
                    {item.category || "Fine Jewellery"}
                  </p>
                  
                  <h4 className="font-cormorant text-xl font-bold text-[#4A0E1B] mt-1 truncate group-hover:text-[#8C6514] transition-colors">
                    {item.name}
                  </h4>
                  
                  <p className="font-jost text-xs text-[#7A6A5C] mt-0.5 truncate">
                    {specs}
                  </p>
                  
                  <div className="flex items-baseline justify-between mt-2">
                    <p className="font-cormorant text-2xl font-bold text-[#4A0E1B]">
                      ₹{formatINR(finalPrice)}
                    </p>
                    <span className="font-jost text-[11px] font-semibold text-[#8C6514] group-hover:text-[#4A0E1B] flex items-center gap-1 transition-colors">
                      <span>View Piece</span>
                      <ExternalLink size={12} />
                    </span>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={(e) => handleAddToBag(e, item, finalPrice)}
                    className="w-full py-2.5 px-4 bg-[#4A0E1B] text-[#FDFBF7] font-jost text-xs tracking-wider uppercase font-semibold rounded-lg hover:bg-[#3B0A14] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <ShoppingBag size={14} />
                    <span>Add To Bag</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
