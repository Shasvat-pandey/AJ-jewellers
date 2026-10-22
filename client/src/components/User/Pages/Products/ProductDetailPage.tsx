import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  Minus,
  Plus,
  BadgeCheck,
  ArrowLeftRight,
  Truck,
  ShieldCheck,
  ShoppingBag,
  Play,
  Star,
  MessageSquare
} from "lucide-react";
import { useToast } from "../../../../components/Common/context/ToastContext";
import { useAuth } from "../../../../components/Common/context/AuthContext";
import ReviewModal from "../../../User/Components/Product/ReviewModal";
import ReviewCarousel from "../../../User/Components/Product/ReviewCarousel";
import ProductGallery from "../../../User/Components/Product/ProductGallery";
import ProductImage from "../../../User/Components/Product/ProductImage";
import { getImageUrl as resolveImageUrl } from "../../../../utils/imageUrl";
import { getWishlistItems, saveWishlistItems } from "../../../../utils/wishlist";
import { API_URL } from "../../../../utils/api";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // --- LIVE DATA STATES ---
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [marketRates, setMarketRates] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, requireAuth } = useAuth();

  // --- WISHLIST STATE ---
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 1. Get saved Wishlist IDs from local storage
        const savedIds = getWishlistItems();
        setWishlisted(new Set(savedIds));

        // 2. Fetch Live Market Rates
        const settingsRes = await fetch(`${API_URL}/settings`, { credentials: 'include' });
        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          setMarketRates(settingsData.data.marketRates);
        }

        // 3. FT-12: Fetch Specific Product and Reviews concurrently
        const [productRes, reviewsRes] = await Promise.all([
          fetch(`${API_URL}/products/${productId}`, { credentials: 'include' }),
          fetch(`${API_URL}/reviews/product/${productId}`)
        ]);

        const productData = await productRes.json();
        const reviewsData = await reviewsRes.json();

        if (reviewsData.success) {
          setReviews(reviewsData.data);
        }

        if (productData.success && productData.data) {
          const currentProduct = productData.data;
          setProduct(currentProduct);
          if (currentProduct?.variants?.length > 0) {
            setSelectedVariantId(currentProduct.variants[0]._id);
          }

          // Fetch related products for the same category
          try {
            const relatedRes = await fetch(`${API_URL}/products?category=${encodeURIComponent(currentProduct.category)}`, { credentials: 'include' });
            const relatedData = await relatedRes.json();
            if (relatedData.success && Array.isArray(relatedData.data)) {
              setRelatedProducts(relatedData.data.filter((p: any) => p._id !== productId).slice(0, 4));
            }
          } catch (relErr) {
            console.warn("Could not load related products:", relErr);
          }
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        showToast("Failed to load product details.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId, isReviewModalOpen]); // Re-run if modal closes to get fresh reviews

  // --- DYNAMIC PRICING ENGINE ---
  const calculatePrice = (item: any, variant: any = null) => {
    if (!marketRates || !item) return 0;

    let metalRate = 0;
    const purity = variant?.purity && variant.purity !== "Same as Base" ? variant.purity : item.purity;
    const weight = variant?.weight || item.weight || 0;

    if (purity === "24K Gold") metalRate = marketRates.rate24k;
    else if (purity === "22K Gold") metalRate = marketRates.rate22k;
    else if (purity === "18K Gold") metalRate = marketRates.rate18k;
    else if (purity === "14K Gold") metalRate = marketRates.rate24k ? (marketRates.rate24k * 14 / 24) : 0;
    else if (purity === "Silver (925)") metalRate = marketRates.silver;

    const metalValue = metalRate * Number(weight);
    const diamondValue = Number(item.diamondValue) || 0;

    const makingChargesPercent = variant?.makingCharges ? Number(variant.makingCharges) : (Number(item.makingCharges) || 0);
    const makingChargesAmt = metalValue * (makingChargesPercent / 100);
    const preGstTotal = metalValue + diamondValue + makingChargesAmt;
    const gstPercent = variant?.gst ? Number(variant.gst) : (item.gst !== undefined && item.gst !== null ? Number(item.gst) : 3);
    const gstAmount = preGstTotal * (gstPercent / 100);

    return preGstTotal + gstAmount;
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount);
  };


  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  // --- WISHLIST TOGGLE LOGIC ---
  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    const savedIds = getWishlistItems();
    let updatedIds;

    if (savedIds.includes(id)) {
      updatedIds = savedIds.filter((savedId: string) => savedId !== id);
      showToast("Removed from wishlist", "success");
    } else {
      updatedIds = [...savedIds, id];
      showToast("Added to wishlist!", "success");
    }

    saveWishlistItems(updatedIds);
    setWishlisted(new Set(updatedIds));
  };

  // --- ADD TO CART FUNCTION ---
  const handleAddToCart = (e: React.MouseEvent, itemToCart: any, finalPrice: number, qty: number = 1, variantId: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();

    const selectedVar = itemToCart?.variants?.find((v: any) => v._id === variantId) || null;
    const isItemOutOfStock = Boolean(
      (selectedVar ? (selectedVar.stock !== undefined && selectedVar.stock <= 0) : (itemToCart.stock <= 0)) ||
      itemToCart.status === 'Out of Stock'
    );

    if (isItemOutOfStock) {
      showToast("Sorry, this item is currently out of stock.", "error");
      return;
    }

    const cartItem = {
      _id: itemToCart._id,
      name: itemToCart.name,
      specs: variantId
        ? (() => {
          const v = itemToCart.variants.find((v: any) => v._id === variantId);
          return `${v.purity} / ${v.color} / Size ${v.size} / ${v.weight}g`;
        })()
        : `${itemToCart.purity} / ${itemToCart.weight}g`,
      variantId: variantId,
      price: finalPrice, gstPercent: (() => { if (variantId) { const v = itemToCart.variants?.find((v: any) => v._id === variantId); if (v && v.gst) return Number(v.gst); } return itemToCart.gst !== undefined && itemToCart.gst !== null ? Number(itemToCart.gst) : 3; })(),
      image: resolveImageUrl(itemToCart.images[0]),
      quantity: qty,
    };

    const existingCart = JSON.parse(localStorage.getItem("aj_cart") || "[]");
    const existingItemIndex = existingCart.findIndex((item: any) => item._id === cartItem._id && item.variantId === cartItem.variantId);

    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += qty;
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem("aj_cart", JSON.stringify(existingCart));
    showToast(`${qty}x ${itemToCart.name} added to bag!`, "success");
  };

  if (isLoading || !product) {
    return <div className="min-h-screen pt-36 text-center text-[#7A6A5C] font-jost animate-pulse">Loading masterpiece...</div>;
  }

  const activeVariant = product?.variants?.find((v: any) => v._id === selectedVariantId) || null;
  const finalPrice = calculatePrice(product, activeVariant);
  const isCurrentSaved = wishlisted.has(product._id);
  const isOutOfStock = Boolean(
    (activeVariant ? (activeVariant.stock !== undefined && activeVariant.stock <= 0) : (product.stock <= 0)) ||
    product.status === 'Out of Stock'
  );

  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-6 md:px-12 lg:px-20">

      {/* BREADCRUMBS */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-10">
        <p className="font-jost text-[9px] md:text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase">
          <Link to="/collections" className="hover:text-[#C9A24B] transition-colors">Collections</Link>
          <span className="mx-2">&middot;</span>
          <Link to={`/collections/${product.category.toLowerCase()}`} className="hover:text-[#C9A24B] transition-colors">{product.category}</Link>
        </p>
      </div>

      {/* MAIN PRODUCT SECTION */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

        {/* --- LEFT: MEDIA GALLERY --- */}
        <div className="lg:col-span-5 flex flex-col gap-4 md:gap-5">
          <ProductGallery images={product.images} videoUrl={product.videoUrl} productName={product.name} />
        </div>

        {/* --- RIGHT: PRODUCT DETAILS --- */}
        <div className="lg:col-span-7 flex flex-col pt-2 lg:pt-0">
          <h1 className="font-cormorant text-4xl md:text-5xl text-[#4A0E1B] mb-3">
            {product.name}
          </h1>
          <p className="font-jost text-2xl md:text-3xl text-[#4A0E1B] mb-2">
            ₹{formatINR(finalPrice)}
          </p>
          <p className="font-jost text-[8px] md:text-[9px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-8">
            INCLUSIVE OF MAKING CHARGES &middot; GST EXTRA &middot; SKU: {product.sku}
          </p>

          <p className="font-jost text-[15px] md:text-base text-[#7A6A5C] leading-relaxed mb-8 max-w-[48ch]">
            {product.description || "A masterfully handcrafted piece from our exclusive collection."}
          </p>

          {/* Specs Grid */}
          <div className="border-t border-[#EAE3D5] py-6">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="font-jost text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-1">Purity</p>
                <p className="font-jost text-sm text-[#4A0E1B] font-medium">{activeVariant ? activeVariant.purity : product.purity}</p>
              </div>
              <div>
                <p className="font-jost text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-1">Gross Weight</p>
                <p className="font-jost text-sm text-[#4A0E1B] font-medium">{activeVariant ? activeVariant.weight : product.weight} g</p>
              </div>
              <div className="col-span-2">
                <p className="font-jost text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-1">Collection</p>
                <p className="font-jost text-sm text-[#4A0E1B] font-medium">{product.productCollection}</p>
              </div>
            </div>
          </div>


          {/* VARIANTS SELECTOR */}
          {product.variants && product.variants.length > 0 && (
            <div className="border-t border-[#EAE3D5] py-6">
              <p className="font-jost text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-3">Select Variant (Size / Color / Purity)</p>
              <div className="flex flex-col gap-3">
                {product.variants.map((v: any) => (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVariantId(v._id)}
                    className={`text-left p-3 border ${selectedVariantId === v._id ? 'border-[#C9A24B] bg-[#C9A24B]/5' : 'border-[#EAE3D5] bg-transparent hover:border-[#C9A24B]/50'} transition-colors`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-jost text-sm text-[#4A0E1B] font-medium">
                        Size: {v.size} &middot; {v.color} &middot; {v.purity}
                      </span>
                      <span className="font-jost text-xs text-[#7A6A5C]">
                        {v.weight}g
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-[#EAE3D5] pt-8 mb-8" />

          {/* Actions: Quantity & Wishlist */}
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center justify-between border border-[#EAE3D5] bg-transparent w-28 px-4 py-3">
              <button onClick={handleDecrease} className="text-[#4A0E1B] hover:text-[#C9A24B] transition-colors">
                <Minus size={14} />
              </button>
              <span className="font-jost text-sm text-[#4A0E1B] font-medium">{quantity}</span>
              <button onClick={handleIncrease} className="text-[#4A0E1B] hover:text-[#C9A24B] transition-colors">
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={(e) => toggleWishlist(e, product._id)}
              className="flex items-center gap-2 text-[#4A0E1B] hover:text-[#C9A24B] transition-colors cursor-pointer"
            >
              <Heart
                size={18}
                fill={isCurrentSaved ? "#4A0E1B" : "none"}
                className={isCurrentSaved ? "text-[#4A0E1B]" : ""}
              />
              <span className="font-jost text-[11px] tracking-[0.2em] uppercase font-medium">
                {isCurrentSaved ? "Saved" : "Save"}
              </span>
            </button>
          </div>

          {isOutOfStock && (
            <div className="mb-4 p-3 bg-red-50/80 border border-red-200 text-red-700 text-xs font-jost rounded-sm">
              This piece is currently out of stock. Book a boutique viewing or reserve with our concierge.
            </div>
          )}

          {/* Buttons */}
          <button
            onClick={(e) => handleAddToCart(e, product, finalPrice, quantity, selectedVariantId)}
            disabled={isOutOfStock}
            className={`w-full font-jost text-[11px] md:text-xs tracking-[0.2em] uppercase py-4 mb-4 transition-colors shadow-sm ${
              isOutOfStock
                ? "bg-[#EAE3D5] text-[#7A6A5C] cursor-not-allowed border border-[#D5CCA8]"
                : "bg-[#4A0E1B] text-[#F3E9D8] hover:bg-[#3B0A14] cursor-pointer"
            }`}
          >
            {isOutOfStock ? "Out of Stock" : "Add To Bag"}
          </button>

          <Link to="/visit-us?book=1" className="block w-full text-center border border-[#4A0E1B]/30 text-[#4A0E1B] font-jost text-[11px] md:text-xs tracking-[0.2em] uppercase py-4 mb-8 hover:bg-[#4A0E1B] hover:text-[#F3E9D8] transition-colors">
            Book a viewing for this piece
          </Link>

          {/* Perks List */}
          <div className="space-y-3.5">
            <div className="flex items-start gap-3 text-[#C9A24B]">
              <BadgeCheck size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              <span className="font-jost text-[13px] md:text-sm text-[#7A6A5C]">BIS hallmarked 916 purity</span>
            </div>
            <div className="flex items-start gap-3 text-[#C9A24B]">
              <ArrowLeftRight size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              <span className="font-jost text-[13px] md:text-sm text-[#7A6A5C]">Lifetime exchange at full gold value</span>
            </div>
            <div className="flex items-start gap-3 text-[#C9A24B]">
              <Truck size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              <span className="font-jost text-[13px] md:text-sm text-[#7A6A5C]">Free, fully insured delivery in 5–7 days</span>
            </div>
            <div className="flex items-start gap-3 text-[#C9A24B]">
              <ShieldCheck size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              <span className="font-jost text-[13px] md:text-sm text-[#7A6A5C]">15-day no-questions returns</span>
            </div>
          </div>

        </div>
      </div>

      {/* --- REVIEWS SECTION --- */}
      <div className="max-w-7xl mx-auto mt-16 md:mt-24 border-t border-[#EAE3D5] pt-12 md:pt-16 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="font-cormorant text-[32px] md:text-[40px] text-[#4A0E1B] mb-3">Customer Reviews</h2>
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={
                      reviews.length > 0 && star <= Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length)
                        ? "text-[#C9A24B] fill-[#C9A24B]"
                        : "text-gray-200"
                    }
                  />
                ))}
              </div>
              <span className="font-jost text-[13px] md:text-sm text-[#7A6A5C]">
                {reviews.length > 0 ? `${(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} out of 5 based on ${reviews.length} reviews` : "No reviews yet"}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => {
              requireAuth(() => {
                setIsReviewModalOpen(true);
              }, "Sign in to share your review on this jewellery piece");
            }}
            className="bg-[#F5F2EA] text-[#7A6A5C] border border-[#EAE3D5] font-jost text-[11px] md:text-xs tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-[#EAE3D5]/50 transition-colors rounded-sm w-full md:w-auto cursor-pointer"
          >
            Write a Review
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#EAE3D5] rounded-xl mt-10 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
            <MessageSquare size={36} strokeWidth={1.5} className="mx-auto text-[#EAE3D5] mb-4" />
            <p className="font-jost text-[#7A6A5C]">Be the first to review this product!</p>
          </div>
        ) : (
          <ReviewCarousel reviews={reviews} />
        )}
      </div>

      {isReviewModalOpen && (
        <ReviewModal
          productId={product._id}
          onClose={() => setIsReviewModalOpen(false)}
          onSuccess={() => setIsReviewModalOpen(false)}
        />
      )}

      {/* --- YOU MAY ALSO LIKE SECTION --- */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto mt-24 md:mt-32">
          <h2 className="font-cormorant text-3xl md:text-4xl text-[#4A0E1B] mb-8">
            You may also like
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-6">
            {relatedProducts.map((item) => {
              const isRelatedSaved = wishlisted.has(item._id);
              const relatedPrice = calculatePrice(item);

              return (
                <Link
                  to={`/products/${item._id}`}
                  key={item._id}
                  onClick={() => window.scrollTo(0, 0)}
                  className="group cursor-pointer flex flex-col"
                >
                  {/* Image Box */}
                  <div className="relative aspect-[4/5] overflow-hidden mb-3 md:mb-4 bg-[#4A0E1B]/5 flex items-center justify-center">
                    <img
                      src={resolveImageUrl(item.images[0])}
                      alt={item.name}
                      className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                    />

                    {item.status === "Low Stock" && (
                      <div className="absolute top-0 left-0 bg-orange-100 text-orange-800 font-jost text-[8px] md:text-[10px] tracking-[0.2em] px-2 py-1 md:px-3 md:py-1.5 uppercase z-10">
                        Low Stock
                      </div>
                    )}

                    <button
                      aria-label="Add to Wishlist"
                      onClick={(e) => toggleWishlist(e, item._id)}
                      className="absolute top-2 right-2 md:top-3 md:right-3 bg-white/95 p-1.5 md:p-2.5 rounded-full text-[#4A0E1B] hover:text-[#C9A24B] hover:bg-white transition-colors z-10 shadow-sm"
                    >
                      <Heart
                        size={16}
                        strokeWidth={1.5}
                        fill={isRelatedSaved ? "currentColor" : "none"}
                        className={isRelatedSaved ? "text-[#4A0E1B]" : "md:w-5 md:h-5"}
                      />
                    </button>
                  </div>

                  {/* Details Box */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col">
                      <h3 className="font-cormorant text-base md:text-xl text-[#4A0E1B] mb-0.5 md:mb-1 leading-tight pr-2 truncate">
                        {item.name}
                      </h3>
                      <p className="font-jost text-[11px] md:text-sm text-[#7A6A5C]">
                        ₹{formatINR(relatedPrice)}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(e, item, relatedPrice, 1)}
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
        </div>
      )}

    </div>
  );
}
