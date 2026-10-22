import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, CheckCircle, XCircle } from "lucide-react";
import AddProductForm from "./AddProductForm";
import { useToast } from "../../../components/Common/context/ToastContext"; // <-- Import the hook
import { API_URL, getAuthToken } from "../../../utils/api";

export default function InventoryView() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // --- CALL THE GLOBAL HOOK ---
  const { showToast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setInventory(data.data || []); 
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast("Failed to load inventory from server.", "error"); // Use global toast!
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/products/${deleteConfirmId}`, {
        credentials: 'include',
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      const data = await response.json();

      if (data.success) {
        setInventory(inventory.filter(item => item._id !== deleteConfirmId));
        showToast("Product permanently deleted.", "success"); // Use global toast!
      } else {
        showToast("Error: " + data.message, "error"); // Use global toast!
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("Failed to connect to server.", "error"); // Use global toast!
    } finally {
      setDeleteConfirmId(null); 
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product); 
    setIsAddingProduct(true);
  };

  const handleSaveProduct = async (
    savedProduct: any, 
    imageFiles: File[], 
    videoFiles: File[],
    existingImages?: any[]
  ) => {
    try {
      // 1. Create the FormData envelope
      const uploadData = new FormData();
      
      uploadData.append("name", savedProduct.name || "Unnamed Product"); 
      uploadData.append("sku", savedProduct.sku || "NO-SKU"); 
      uploadData.append("category", savedProduct.category);
      uploadData.append("subcategory", savedProduct.subcategory || "");
      uploadData.append("productCollection", savedProduct.productCollection || savedProduct.collection || "Standard");
      uploadData.append("purity", savedProduct.purity);
      uploadData.append("weight", savedProduct.weight);
      uploadData.append("makingCharges", savedProduct.makingCharges);
      uploadData.append("diamondCarat", savedProduct.diamondCarat || 0);
      uploadData.append("diamondValue", savedProduct.diamondValue || 0);
      uploadData.append("stock", savedProduct.stock);
      uploadData.append("description", savedProduct.description || "");

      // Send the favorite flag to MongoDB
      uploadData.append("isFavorite", String(savedProduct.isFavorite));

      // Always send variants array, even if empty, so the backend can delete them
      uploadData.append("variants", JSON.stringify(savedProduct.variants || []));

      // Pass keepImages so backend cleanly preserves retained gallery images
      if (editingProduct && existingImages !== undefined) {
        uploadData.append("keepImages", JSON.stringify(existingImages));
      }

      // Loop and send newly uploaded images
      if (imageFiles && imageFiles.length > 0) {
        imageFiles.forEach(file => {
          uploadData.append("images", file);
        });
      }

      // Loop and send videos
      if (videoFiles && videoFiles.length > 0) {
        videoFiles.forEach(file => {
          uploadData.append("videos", file);
        });
      }

      // 2. Check if we are EDITING or ADDING
      if (editingProduct) {
        // --- UPDATE EXISTING PRODUCT (PUT) ---
        const token = getAuthToken();
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`${API_URL}/products/${editingProduct._id}`, {
          credentials: 'include',
          method: "PUT",
          headers: authHeaders,
          body: uploadData,
        });

        const data = await response.json();

        if (data.success) {
          // Replace the old product with the newly updated one in the table
          setInventory(inventory.map(item => item._id === editingProduct._id ? data.data : item)); 
          setIsAddingProduct(false);
          setEditingProduct(null);
          showToast("Product updated successfully!", "success");
        } else {
          const errorDetails = data.errors?.length
            ? data.errors.map((e: any) => e.message).join(" • ")
            : data.message;
          showToast("Database Error: " + errorDetails, "error");
        }

      } else {
        // --- CREATE NEW PRODUCT (POST) ---
        const token = getAuthToken();
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`${API_URL}/products`, {
          credentials: 'include',
          method: "POST",
          headers: authHeaders,
          body: uploadData,
        });

        const data = await response.json();

        if (data.success) {
          setInventory([data.data, ...inventory]); 
          setIsAddingProduct(false);
          setEditingProduct(null);
          showToast("Product saved successfully!", "success"); 
        } else {
          const errorDetails = data.errors?.length
            ? data.errors.map((e: any) => e.message).join(" • ")
            : data.message;
          showToast("Database Error: " + errorDetails, "error"); 
        }
      }
    } catch (error) {
      console.error("Network error saving product:", error);
      showToast("Failed to connect to the backend server.", "error"); 
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (!item) return false; 

    const searchStr = searchQuery.toLowerCase();
    const itemName = item.name ? item.name.toLowerCase() : "";
    const itemSku = item.sku ? item.sku.toLowerCase() : "";

    const matchesSearch = itemName.includes(searchStr) || itemSku.includes(searchStr);
    const matchesCategory = categoryFilter === "All Categories" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Extract all unique categories present in the current inventory
  const allCategories = Array.from(
    new Set(inventory.map((item) => item.category).filter(Boolean) as string[])
  );

  // Inventory KPI Metrics
  const totalPieces = inventory.length;
  const inStockCount = inventory.filter((p) => p.status === "In Stock" && (p.stock > 5 || p.stock === undefined)).length;
  const lowStockCount = inventory.filter((p) => p.status === "Low Stock" || (p.stock > 0 && p.stock <= 5)).length;
  const outOfStockCount = inventory.filter((p) => p.status === "Out of Stock" || p.stock === 0).length;

  if (isAddingProduct || editingProduct) {
    return (
      <AddProductForm 
        initialData={editingProduct}
        allCategories={allCategories}
        onCancel={() => {
          setIsAddingProduct(false);
          setEditingProduct(null);
        }} 
        onSave={handleSaveProduct}
      />
    );
  }

  return (
    <div className="animate-in fade-in duration-500 relative h-full">
      
      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 px-4">
          <div className="bg-[#FDFBF4] p-8 max-w-sm w-full rounded-sm shadow-2xl border border-[#C9A24B]/30 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={28} className="text-red-600" />
            </div>
            <h3 className="font-cormorant text-3xl text-[#4A0E1B] mb-2">Delete Product?</h3>
            <p className="font-jost text-sm text-[#7A6A5C] mb-8 leading-relaxed">
              This action cannot be undone. This product will be permanently removed from your database.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                className="flex-1 border border-[#4A0E1B]/30 text-[#4A0E1B] font-jost text-xs tracking-wider uppercase py-3 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 bg-[#4A0E1B] text-[#F3E9D8] font-jost text-xs tracking-wider uppercase py-3 hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-6 md:mb-8 mt-2 md:mt-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-cormorant text-3xl sm:text-4xl text-[#4A0E1B] mb-1">
            Inventory
          </h1>
          <p className="text-[#7A6A5C] text-xs sm:text-sm">Manage your products, pricing, and stock levels.</p>
        </div>
        
        <button 
          onClick={() => { setIsAddingProduct(true); setEditingProduct(null); }} 
          className="bg-[#4A0E1B] text-[#F3E9D8] font-jost text-[11px] sm:text-xs tracking-[0.15em] uppercase px-5 py-3 flex items-center justify-center gap-2 hover:bg-[#3B0A14] transition-colors shadow-sm cursor-pointer whitespace-nowrap rounded-sm"
        >
          <Plus size={16} />
          Add New Product
        </button>
      </header>

      {/* METRICS ROW (Matching Boutique Reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Total Pieces</h3>
            <div className="bg-[#4A0E1B]/10 p-2 text-[#4A0E1B] rounded-full">
              <Package size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-[#4A0E1B]">{totalPieces}</p>
          <p className="text-xs text-[#7A6A5C] mt-1">All catalogued pieces</p>
        </div>

        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">In Stock</h3>
            <div className="bg-green-100 p-2 text-green-800 rounded-full">
              <CheckCircle size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-green-700">{inStockCount}</p>
          <p className="text-xs text-green-700 mt-1 font-medium">Ready for immediate dispatch</p>
        </div>

        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Low Stock Alert</h3>
            <div className="bg-amber-100 p-2 text-amber-800 rounded-full">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-amber-700">{lowStockCount}</p>
          <p className="text-xs text-amber-700 mt-1 font-medium">Requires workshop restocking</p>
        </div>

        <div className="bg-white p-5 border border-[#C9A24B]/30 shadow-sm rounded-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase font-semibold">Out Of Stock</h3>
            <div className="bg-red-100 p-2 text-red-800 rounded-full">
              <XCircle size={16} />
            </div>
          </div>
          <p className="font-cormorant text-3xl text-red-700">{outOfStockCount}</p>
          <p className="text-xs text-red-700 mt-1 font-medium">Pieces currently unavailable</p>
        </div>
      </div>

      {/* Inventory Controls */}
      <div className="bg-white p-4 border border-[#C9A24B]/30 shadow-sm rounded-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A5C]" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products or SKUs..." 
            className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 pl-9 pr-4 py-2 text-sm font-jost outline-none focus:border-[#C9A24B] transition-colors rounded-sm"
          />
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#FDFBF4] border border-[#C9A24B]/40 px-3 py-2 text-sm font-jost outline-none focus:border-[#C9A24B] cursor-pointer rounded-sm flex-1 sm:flex-none"
          >
            <option value="All Categories">All Categories</option>
            <option value="Necklaces">Necklaces</option>
            <option value="Rings">Rings</option>
            <option value="Bangles">Bangles</option>
            <option value="Jhumkas">Jhumkas</option>
            <option value="Diamond">Diamond</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-[#C9A24B]/30 shadow-sm rounded-sm w-full overflow-hidden">
        <div className="overflow-x-auto w-full">
          {isLoading ? (
            <div className="p-10 text-center text-[#7A6A5C] font-jost animate-pulse">
              Loading inventory from database...
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
              <thead>
                <tr className="bg-[#FDFBF4] text-[10px] sm:text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase border-b border-[#C9A24B]/20">
                  <th className="p-3 sm:p-4 font-semibold">Product Name</th>
                  <th className="p-3 sm:p-4 font-semibold">Category</th>
                  <th className="p-3 sm:p-4 font-semibold">Stock</th>
                  <th className="p-3 sm:p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#7A6A5C] font-jost">
                      No products found in the database.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item._id} className="border-b border-[#C9A24B]/10 hover:bg-[#FDFBF4]/50 transition-colors">
                      <td className="p-3 sm:p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#4A0E1B]">{item.name || "Unnamed"}</span>
                          <span className="text-[10px] text-[#7A6A5C]">{item.sku || "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-[#7A6A5C]">{item.category}</td>
                      <td className="p-3 sm:p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span>{item.stock} units</span>
                          <span className={`px-2 py-0.5 text-[9px] tracking-wider uppercase font-semibold border rounded-sm ${
                            item.status === 'In Stock' ? 'bg-green-50 text-green-700 border-green-200' :
                            item.status === 'Low Stock' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="text-[#C9A24B] hover:text-[#4A0E1B] transition-colors p-1 cursor-pointer" 
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(item._id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1 cursor-pointer" 
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}