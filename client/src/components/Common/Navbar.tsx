import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Search, ShoppingBag, User, X, Phone, Heart, ChevronDown, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { useAuth } from "./context/AuthContext";

import logo from "../../assets/logo.png"; // Adjust the path as necessary

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, openAuthModal } = useAuth();

  // --- CHANGED: cartCount can now be updated ---
  const [cartCount, setCartCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("aj_search_history") || "[]");
    setSearchHistory(history);
  }, []);

  // Dropdown state for the Golden Oval
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Live Tracker for Shopping Bag ---
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("aj_cart") || "[]");
        const totalItems = cart.reduce((total: number, item: any) => total + (Number(item.quantity) || 0), 0);
        setCartCount(totalItems);
      } catch {
        setCartCount(0);
      }
    };

    // Run once on load
    updateCartCount();

    // Listen for cross-tab storage changes, in-tab custom events, and window focus
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cart_updated", updateCartCount);
    window.addEventListener("focus", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cart_updated", updateCartCount);
      window.removeEventListener("focus", updateCartCount);
    };
  }, []);

  // Effect to handle clicking outside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const navLinks = [
    { name: "HOME", id: "home" },
    { name: "COLLECTIONS", id: "collections" },
    { name: "BRIDAL", id: "bridal" },
    { name: "GOLD & SILVER RATE", id: "gold-rate" },
    { name: "ABOUT US", id: "about" },
    { name: "VISIT US", id: "visit-us" },
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMenuOpen(false); 

    if (targetId === "collections") { navigate("/collections"); window.scrollTo(0, 0); return; }
    if (targetId === "bridal") { navigate("/bridal-vault"); window.scrollTo(0, 0); return; }
    if (targetId === "gold-rate") { navigate("/gold-rate"); window.scrollTo(0, 0); return; }
    if (targetId === "about") { navigate("/about"); window.scrollTo(0, 0); return; }
    if (targetId === "visit-us") { navigate("/visit-us"); window.scrollTo(0, 0); return; }
    if (location.pathname !== "/") { navigate("/"); return; }
    if (targetId === "home") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }

    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 110;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const searchSuggestions = [
    "Bridal Sets", "Kundan Necklaces", "Diamond Rings", "Gold Bangles",
    "Traditional Jhumkas", "Polki Chokers", "Platinum Bands", "Temple Jewellery", "Mangalsutra",
  ];

  const queryTokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);

  const filteredSuggestions = searchSuggestions.filter((item) => {
    if (queryTokens.length === 0) return true;
    const lowerItem = item.toLowerCase();
    let matchCount = 0;
    for (const token of queryTokens) {
      if (lowerItem.includes(token)) {
        matchCount++;
      }
    }
    return (matchCount / queryTokens.length) >= 0.5;
  });

  const formatTitleCase = (text: string) => {
    return text.split(" ").map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      const newQuery = query.trim();
      
      const history = JSON.parse(localStorage.getItem("aj_search_history") || "[]");
      const updatedHistory = [newQuery, ...history.filter((q: string) => q.toLowerCase() !== newQuery.toLowerCase())].slice(0, 5);
      localStorage.setItem("aj_search_history", JSON.stringify(updatedHistory));
      setSearchHistory(updatedHistory);

      setIsSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(newQuery)}`);
      setSearchQuery("");
      window.scrollTo(0, 0);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-[#3F0106] text-[#F2DBB6] text-[10px] md:text-xs tracking-[0.10em] text-center py-1.5 md:py-2 font-jost font-semibold relative z-20">
          HALLMARKED 916 GOLD &nbsp;·&nbsp; LIFETIME EXCHANGE
        </div>

        {/* --- MAIN NAVBAR --- */}
        <div className="bg-[#4A0C16] flex items-center justify-between px-3 sm:px-6 md:px-10 lg:px-16 py-2 border-b border-[#C9A24B]/20 relative z-20">
          
          {/* Left: Hamburger & Logo */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              aria-label="Open menu"
              className="text-[#C9A24B] p-1 hover:text-[#F3E9D8] transition-colors lg:hidden"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={24} strokeWidth={1.5} />
            </button>
            <a href="#home" onClick={(e) => handleScroll(e, "home")} className="flex items-center cursor-pointer">
              <img src={logo} alt="AJ Jewellers" className="h-9 md:h-12 lg:h-16 w-auto object-contain" />
            </a>
          </div>

          {/* Center: Desktop Links */}
          <div className="hidden lg:flex flex-1 justify-center items-center gap-6 xl:gap-10 px-10">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleScroll(e, link.id)}
                className="text-[#C9A24B] hover:text-[#F3E9D8] text-sm tracking-[0.15em] font-jost transition-colors whitespace-nowrap"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right: Actions (Search, Wishlist, Golden Oval, Cart) */}
          <div className="flex items-center justify-end gap-2 sm:gap-4 md:gap-5">
            
            <button
              aria-label="Search"
              className="text-[#C9A24B] p-1 hover:text-[#F3E9D8] transition-colors"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? <X size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={1.5} /> : <Search size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={1.5} />}
            </button>

            {/* --- STANDALONE WISHLIST (Desktop Only) --- */}
            <button
              onClick={() => { navigate("/wishlist"); window.scrollTo(0, 0); }}
              aria-label="Wishlist"
              className="hidden lg:block text-[#C9A24B] p-1 hover:text-[#F3E9D8] transition-colors"
            >
              <Heart size={22} strokeWidth={1.5} />
            </button>

            {/* --- GOLDEN OVAL DROPDOWN (Visible on BOTH Laptop and Mobile) --- */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  if (!user) {
                    openAuthModal({ mode: 'login' });
                  } else {
                    setIsDropdownOpen(!isDropdownOpen);
                  }
                }}
                className="flex items-center gap-1 md:gap-2 text-[#C9A24B] border border-[#C9A24B] rounded-full px-3 py-1.5 md:px-4 md:py-1.5 hover:bg-[#C9A24B] hover:text-[#4A0C16] transition-colors font-jost text-[10px] md:text-[11px] tracking-[0.15em] font-semibold cursor-pointer"
              >
                <User size={16} strokeWidth={1.5} className="md:w-[18px] md:h-[18px]" />
                <span>{user ? user.name.split(" ")[0].toUpperCase() : "LOGIN"}</span>
                {user && (
                  <ChevronDown 
                    size={14} 
                    strokeWidth={2} 
                    className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} 
                  />
                )}
              </button>

              {/* The Dropdown Menu List with Golden Borders and Icons */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-4 w-[210px] bg-[#FDFBF4] border border-[#C9A24B] shadow-2xl flex flex-col z-50 rounded-md overflow-hidden">
                  
                  {user ? (
                    <>
                      <button onClick={() => { navigate("/account"); window.scrollTo(0, 0); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-5 py-4 text-left text-[#4A0E1B] font-jost text-sm hover:bg-[#C9A24B]/10 transition-colors w-full border-b border-[#C9A24B] cursor-pointer">
                        <User size={16} strokeWidth={1.5} className="text-[#C9A24B]" /> Profile 
                      </button>
                      
                      {/* Mobile Only: Wishlist and Cart inside the dropdown */}
                      <button onClick={() => { navigate("/wishlist"); window.scrollTo(0, 0); setIsDropdownOpen(false); }} className="lg:hidden flex items-center gap-3 px-5 py-4 text-left text-[#4A0E1B] font-jost text-sm hover:bg-[#C9A24B]/10 transition-colors w-full border-b border-[#C9A24B] cursor-pointer">
                        <Heart size={16} strokeWidth={1.5} className="text-[#C9A24B]" /> Your Wishlist
                      </button>
                      
                      <button onClick={() => { navigate("/bag"); window.scrollTo(0, 0); setIsDropdownOpen(false); }} className="lg:hidden flex items-center justify-between px-5 py-4 text-left text-[#4A0E1B] font-jost text-sm hover:bg-[#C9A24B]/10 transition-colors w-full border-b border-[#C9A24B] cursor-pointer">
                        <div className="flex items-center gap-3">
                          <ShoppingBag size={16} strokeWidth={1.5} className="text-[#C9A24B]" /> Your Bag
                        </div>
                        {cartCount > 0 && (
                          <span className="bg-[#4A0E1B] text-[#FDFBF4] text-[10px] px-2 py-0.5 rounded-full">{cartCount}</span>
                        )}
                      </button>

                      <button onClick={() => { logout(); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-5 py-4 text-left text-red-700 font-jost text-sm hover:bg-red-50 transition-colors w-full cursor-pointer">
                        <LogOut size={16} strokeWidth={1.5} className="text-red-500" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { openAuthModal({ mode: 'login' }); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-5 py-4 text-left text-[#4A0E1B] font-jost text-sm hover:bg-[#C9A24B]/10 transition-colors w-full border-b border-[#C9A24B] cursor-pointer">
                        <User size={16} strokeWidth={1.5} className="text-[#C9A24B]" /> Sign In
                      </button>
                      
                      {/* Mobile Only: Wishlist and Cart inside the dropdown */}
                      <button onClick={() => { navigate("/wishlist"); window.scrollTo(0, 0); setIsDropdownOpen(false); }} className="lg:hidden flex items-center gap-3 px-5 py-4 text-left text-[#4A0E1B] font-jost text-sm hover:bg-[#C9A24B]/10 transition-colors w-full border-b border-[#C9A24B] cursor-pointer">
                        <Heart size={16} strokeWidth={1.5} className="text-[#C9A24B]" /> Your Wishlist
                      </button>
                      
                      <button onClick={() => { navigate("/bag"); window.scrollTo(0, 0); setIsDropdownOpen(false); }} className="lg:hidden flex items-center justify-between px-5 py-4 text-left text-[#4A0E1B] font-jost text-sm hover:bg-[#C9A24B]/10 transition-colors w-full cursor-pointer">
                        <div className="flex items-center gap-3">
                          <ShoppingBag size={16} strokeWidth={1.5} className="text-[#C9A24B]" /> Your Bag
                        </div>
                        {cartCount > 0 && (
                          <span className="bg-[#4A0E1B] text-[#FDFBF4] text-[10px] px-2 py-0.5 rounded-full">{cartCount}</span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* --- STANDALONE CART (Desktop Only) --- */}
            <button
              onClick={() => { navigate("/bag"); window.scrollTo(0, 0); setIsMenuOpen(false); }}
              aria-label="Cart"
              className="relative hidden lg:block text-[#C9A24B] p-1 hover:text-[#F3E9D8] transition-colors"
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {/* Only show the red bubble if there is actually something in the cart */}
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C9A24B] text-[#2A0A10] text-[10px] font-jost font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            
          </div>
        </div>

        {/* --- SEARCH DROPDOWN OVERLAY --- */}
        <div
          className={`absolute left-0 right-0 bg-[#4A0C16] border-b border-[#C9A24B]/30 shadow-2xl transition-all duration-300 ease-in-out z-10 overflow-hidden ${
            isSearchOpen ? "max-h-[500px] opacity-100 py-6" : "max-h-0 opacity-0 py-0 border-transparent"
          }`}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10">
            <div className="relative mb-6">
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A24B]/60 cursor-pointer hover:text-[#C9A24B] transition-colors" 
                size={20} 
                onClick={() => handleSearch(searchQuery)}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for jewellery..."
                className="w-full bg-[#3F0106] text-[#F3E9D8] border border-[#C9A24B]/40 focus:border-[#C9A24B] rounded-none py-3.5 pl-12 pr-4 outline-none font-jost placeholder:text-[#C9A24B]/50 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C9A24B]/70 hover:text-[#C9A24B]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div>
              {searchQuery ? (
                <>
                  <h3 className="text-[#C9A24B]/70 text-xs font-jost tracking-[0.2em] uppercase mb-4">
                    Search Results
                  </h3>
                  <ul className="flex flex-wrap gap-2.5">
                    {filteredSuggestions.map((item, idx) => (
                      <li key={idx}>
                        <button 
                          onClick={() => handleSearch(item)}
                          className="bg-[#3F0106] text-[#C9A24B] hover:text-[#3F0106] hover:bg-[#C9A24B] text-xs sm:text-sm font-jost px-4 py-2 border border-[#C9A24B]/20 transition-all duration-300 cursor-pointer"
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                    {filteredSuggestions.length === 0 && (
                      <span className="text-[#F3E9D8] text-sm font-jost">No suggestions found</span>
                    )}
                  </ul>
                </>
              ) : (
                <>
                  {searchHistory.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[#C9A24B]/70 text-xs font-jost tracking-[0.2em] uppercase">
                          Recent Searches
                        </h3>
                        <button 
                          onClick={() => {
                            localStorage.removeItem("aj_search_history");
                            setSearchHistory([]);
                          }}
                          className="text-[#C9A24B]/70 hover:text-[#C9A24B] text-xs font-jost underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <ul className="flex flex-wrap gap-2.5">
                        {searchHistory.map((item, idx) => (
                          <li key={`history-${idx}`}>
                            <button 
                              onClick={() => handleSearch(item)}
                              className="bg-[#3F0106] text-[#C9A24B] hover:text-[#3F0106] hover:bg-[#C9A24B] text-xs sm:text-sm font-jost px-4 py-2 border border-[#C9A24B]/20 transition-all duration-300 cursor-pointer"
                            >
                              {item}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <h3 className="text-[#C9A24B]/70 text-xs font-jost tracking-[0.2em] uppercase mb-4">
                    Trending Searches
                  </h3>
                  <ul className="flex flex-wrap gap-2.5">
                    {searchSuggestions.slice(0, 6).map((item, idx) => (
                      <li key={`trending-${idx}`}>
                        <button 
                          onClick={() => handleSearch(item)}
                          className="bg-[#3F0106] text-[#C9A24B] hover:text-[#3F0106] hover:bg-[#C9A24B] text-xs sm:text-sm font-jost px-4 py-2 border border-[#C9A24B]/20 transition-all duration-300 cursor-pointer"
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* --- MOBILE DRAWER MENU --- */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-[80%] max-w-sm bg-[#4A0C16] z-[70] transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C9A24B]/40 shrink-0">
          <a href="#home" onClick={(e) => handleScroll(e, "home")} className="cursor-pointer">
            <img src={logo} alt="AJ Jewellers" className="h-10 w-auto object-contain" />
          </a>
          <button onClick={() => setIsMenuOpen(false)} className="text-[#F3E9D8] hover:text-[#C9A24B] transition-colors cursor-pointer">
            <X size={26} strokeWidth={1.2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleScroll(e, link.id)}
                className="text-[#F3E9D8] text-[22px] font-serif tracking-wide hover:text-[#C9A24B] transition-colors"
              >
                {formatTitleCase(link.name)}
              </a>
            ))}

            <div className="pt-4 border-t border-[#C9A24B]/20">
              {!user ? (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openAuthModal({ mode: 'login' });
                  }}
                  className="flex items-center gap-3 text-[#C9A24B] text-[20px] font-serif tracking-wide hover:text-[#F3E9D8] transition-colors text-left cursor-pointer"
                >
                  <User size={20} strokeWidth={1.5} />
                  <span>Sign In / Register</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/account");
                    window.scrollTo(0, 0);
                  }}
                  className="flex items-center gap-3 text-[#C9A24B] text-[20px] font-serif tracking-wide hover:text-[#F3E9D8] transition-colors text-left cursor-pointer"
                >
                  <User size={20} strokeWidth={1.5} />
                  <span>My Account ({user.name.split(" ")[0]})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 pb-10 shrink-0 border-t border-[#C9A24B]/30 pt-6">
          <a href="tel:+910000000000" className="inline-flex items-center gap-3 text-[#C9A24B] hover:text-[#F3E9D8] transition-colors cursor-pointer">
            <Phone size={18} strokeWidth={1.5} />
            <span className="text-[11px] font-jost font-semibold tracking-[0.15em] uppercase">
              Call the Boutique
            </span>
          </a>
        </div>
      </div>
    </>
  );
}