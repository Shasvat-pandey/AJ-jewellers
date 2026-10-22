import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { ShoppingBag } from "lucide-react";
import { useToast } from "../../../Common/context/ToastContext"; // Adjust path if needed
import ProductImage from "../../Components/Product/ProductImage";
import { getImageUrl as resolveImageUrl } from "../../../../utils/imageUrl";
import { getWishlistItems, saveWishlistItems } from "../../../../utils/wishlist";
import { API_URL } from "../../../../utils/api";

export default function FavouritesGrid() {
  const [wishlisted, setWishlisted] = useState<Set<string>>(() => {
    return new Set(getWishlistItems());
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const { showToast } = useToast();
  
  // --- LIVE DATA STATES ---
  const [products, setProducts] = useState<any[]>([]);
  const [marketRates, setMarketRates] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH REAL FAVORITE PRODUCTS & MARKET RATES ---
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
          // Filter ONLY products that are marked as favorites
          const favoriteProducts = productsData.data.filter((p: any) => p.isFavorite === true || p.isFavorite === "true" || p.subcategory === "Favorite");
          setProducts(favoriteProducts);
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
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

  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    const savedIds = getWishlistItems();

    if (wishlisted.has(id)) {
      showToast("Removed from wishlist", "success");
      const updatedIds = savedIds.filter((savedId: string) => savedId !== id);
      saveWishlistItems(updatedIds);
      
      setWishlisted((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      showToast("Added to wishlist", "success");
      savedIds.push(id);
      saveWishlistItems(savedIds);
      
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

  // Logic: Show all if expanded, otherwise limit to first 8 items
  const visibleProducts = isExpanded ? products : products.slice(0, 8);
  const hasMoreProducts = products.length > 8;

  if (isLoading) {
    return <div className="py-20 text-center text-[#7A6A5C] font-jost animate-pulse">Loading favorites...</div>;
  }

  return (
    <section className="bg-[#FDFBF4] py-14 md:py-20 px-6 md:px-12 lg:px-20">
      <div className="text-center mb-10 md:mb-14">
        <h2 className="font-cormorant text-3xl md:text-5xl text-[#4A0E1B]">
          Our Favourites
        </h2>
        <div className="w-16 md:w-24 h-px bg-[#C9A24B] mx-auto mt-4" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10 max-w-6xl mx-auto">
        
        {/* FALLBACK MESSAGE IF NO FAVORITES EXIST YET */}
        {products.length === 0 ? (
          <div className="col-span-full text-center py-12 text-[#7A6A5C] font-jost border border-dashed border-[#C9A24B]/40">
            No favourites marked yet. Go to the Admin Dashboard, edit a product, and check the "Show in Favourites" box!
          </div>
        ) : (
          /* ACTUAL PRODUCT RENDERER */
          visibleProducts.map((product) => {
            const isWishlisted = wishlisted.has(product._id);
            const finalPrice = calculatePrice(product);

            return (
              <Link
                to={`/products/${product._id}`}
                key={product._id}
                onClick={() => window.scrollTo(0, 0)}
                className="group block"
              >
                <div className="relative mb-3 md:mb-4">
                  {product.isNew && (
                    <span className="absolute top-2 left-2 md:top-3 md:left-3 z-10 bg-[#3F0106] text-[#F2DBB6] font-jost text-[9px] md:text-[10px] tracking-[0.12em] font-semibold px-2 py-1">
                      NEW
                    </span>
                  )}

                  <button
                    onClick={(e) => toggleWishlist(e, product._id)}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    aria-pressed={isWishlisted}
                    className="absolute top-2 right-2 md:top-3 md:right-3 z-10 w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-black/45"
                  >
                    {isWishlisted ? (
                      <FaHeart size={13} className="text-[#C9A24B]" />
                    ) : (
                      <FaRegHeart size={13} className="text-white" />
                    )}
                  </button>

                  <ProductImage
                    image={product.images[0]}
                    alt={product.name}
                    ratio="square"
                    imgClassName="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                
                {/* Product Details & Add to Bag */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <h3 className="font-cormorant text-lg md:text-xl text-[#4A0E1B] leading-tight truncate">
                      {product.name}
                    </h3>
                    <p className="font-jost text-sm md:text-base text-[#7A6A5C] mt-1">
                      ₹{formatINR(finalPrice)}
                    </p>
                  </div>
                  
                  {/* DIRECT CART ICON */}
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
          })
        )}
      </div>

      {/* --- BUTTONS SECTION --- */}
      {products.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-12 md:mt-16">
          {/* Toggle Button for Show More / Show Less */}
          {hasMoreProducts && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full sm:w-auto inline-block font-jost text-xs md:text-sm tracking-[0.14em] text-[#4A0E1B] border border-[#4A0E1B]/40 px-8 py-4 md:px-10 md:py-4 hover:bg-[#4A0E1B] hover:text-[#FDFBF4] hover:border-[#4A0E1B] transition-colors cursor-pointer"
            >
              {isExpanded ? "SHOW LESS" : "SHOW FULL CATALOGUE"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
