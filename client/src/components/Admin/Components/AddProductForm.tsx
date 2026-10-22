import { useState } from "react";
import { ArrowLeft, Image as ImageIcon, Film, Info, X, Plus, Trash2 } from "lucide-react";
import { getImageUrl } from "../../../utils/imageUrl";
import ImageCropper from "./ImageCropper";

interface AddProductFormProps {
  onCancel: () => void;
  initialData?: any;
  allCategories?: string[];
  onSave: (product: any, imageFiles: File[], videoFiles: File[], existingImages?: any[]) => void;
}

export default function AddProductForm({
  onCancel,
  initialData,
  allCategories = [],
  onSave,
}: AddProductFormProps) {
  const defaultCategories = [
    "Necklaces",
    "Jhumkas",
    "Bangles",
    "Rings",
    "Mangalsutra",
    "Diamond",
  ];

  // Merge default categories with those from inventory and current product
  const existingCategories = Array.from(
    new Set([
      ...defaultCategories,
      ...allCategories,
      initialData?.category,
    ].filter(Boolean) as string[])
  );

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [hasMetalBase, setHasMetalBase] = useState(
    initialData ? Boolean(initialData.weight > 0 || initialData.hasMetalBase !== false) : true
  );

  // Clean, robust initialization
  const [formData, setFormData] = useState({
    id: initialData?.id || initialData?._id || "",
    name: initialData?.name || "",
    sku: initialData?.sku || "",
    category: initialData?.category || existingCategories[0] || "Necklaces",
    subcategory: initialData?.subcategory || "",
    productCollection: initialData?.productCollection || initialData?.collection || "Everyday Wear",
    purity: initialData?.purity || "22K Gold",
    weight: initialData?.weight !== undefined && initialData?.weight !== null ? String(initialData.weight) : "",
    makingCharges: initialData?.makingCharges !== undefined && initialData?.makingCharges !== null ? String(initialData.makingCharges) : "",
    gst: initialData?.gst !== undefined && initialData?.gst !== null ? String(initialData.gst) : "3",
    diamondCarat: initialData?.diamondCarat !== undefined && initialData?.diamondCarat !== null ? String(initialData.diamondCarat) : "",
    diamondValue: initialData?.diamondValue !== undefined && initialData?.diamondValue !== null ? String(initialData.diamondValue) : "",
    stock: initialData?.stock !== undefined && initialData?.stock !== null ? String(initialData.stock) : "1",
    description: initialData?.description || "",
    status: initialData?.status || "In Stock",
    isFavorite: Boolean(initialData?.isFavorite),
    variants: initialData?.variants || [],
  });

  // Media state: cleanly separated between preserved existing images and newly uploaded files
  const [existingImages, setExistingImages] = useState<any[]>(
    initialData?.images && Array.isArray(initialData.images)
      ? initialData.images
      : []
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>(
    initialData?.videoUrl ? [getImageUrl(initialData.videoUrl)] : [] // Handling existing single video for now
  );

  const [isDragging, setIsDragging] = useState(false);
  const [cropQueue, setCropQueue] = useState<{ url: string, file: File }[]>([]);

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // reset input so same file can be selected again
    e.target.value = '';
  };

  const handleFiles = (files: FileList) => {
    const newImageQueue: { url: string, file: File }[] = [];
    const newVideoFiles: File[] = [];
    const newVideoPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        newImageQueue.push({ url: URL.createObjectURL(file), file });
      } else if (file.type.startsWith("video/")) {
        newVideoFiles.push(file);
        newVideoPreviews.push(file.name);
      }
    });

    const totalImages = existingImages.length + imageFiles.length + cropQueue.length + newImageQueue.length;
    if (totalImages > 7) {
      alert("You can only have a maximum of 7 images in total.");
      return;
    }
    if (videoFiles.length + newVideoFiles.length > 2) {
      alert("You can only upload a maximum of 2 videos.");
      return;
    }

    setCropQueue((prev) => [...prev, ...newImageQueue]);
    setVideoFiles([...videoFiles, ...newVideoFiles]);
    setVideoPreviews([...videoPreviews, ...newVideoPreviews]);
  };

  const handleCropComplete = (croppedUrl: string, croppedFile: File) => {
    setImageFiles((prev) => [...prev, croppedFile]);
    setNewImagePreviews((prev) => [...prev, croppedUrl]);
    setCropQueue((prev) => prev.slice(1));
  };

  const handleCropCancel = () => {
    setCropQueue((prev) => prev.slice(1));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideoFiles(videoFiles.filter((_, i) => i !== index));
    setVideoPreviews(videoPreviews.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "ADD_NEW") {
      setIsAddingNewCategory(true);
      setFormData({ ...formData, category: "" });
    } else {
      setFormData({ ...formData, category: e.target.value });
    }
  };

  const cancelNewCategory = () => {
    setIsAddingNewCategory(false);
    setFormData({ ...formData, category: existingCategories[0] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Product name is required.");
      return;
    }
    if (!formData.sku.trim()) {
      alert("Reference / SKU is required.");
      return;
    }
    if (!formData.category.trim()) {
      alert("Category is required.");
      return;
    }
    if (hasMetalBase && (!formData.weight || Number(formData.weight) <= 0)) {
      alert("Metal weight must be greater than 0g.");
      return;
    }
    if (formData.makingCharges === "" || Number(formData.makingCharges) < 0) {
      alert("Making charges cannot be negative.");
      return;
    }

    const payload = {
      ...formData,
      productCollection: formData.productCollection,
    };

    if (payload.variants.length > 0) {
      payload.stock = String(payload.variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0));
    }

    onSave(payload, imageFiles, videoFiles, existingImages);
  };

  const showDiamondFields =
    formData.category.toLowerCase().includes("diamond") ||
    formData.subcategory.toLowerCase().includes("diamond");

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        { size: "", color: "Same as Base", purity: "Same as Base", weight: "", stock: 1, makingCharges: "", gst: "" }
      ]
    });
  };

  const removeVariant = (index: number) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData({ ...formData, variants: newVariants });
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  return (
    <div className="animate-in fade-in duration-300">
      {cropQueue.length > 0 && (
        <ImageCropper
          imageSrc={cropQueue[0].url}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={onCancel}
            type="button"
            className="flex items-center gap-2 text-[#7A6A5C] hover:text-[#4A0E1B] transition-colors mb-2 text-sm font-semibold tracking-wider uppercase cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Inventory
          </button>
          <h2 className="font-cormorant text-3xl sm:text-4xl text-[#4A0E1B]">
            {initialData ? "Edit Product" : "Add New Piece"}
          </h2>
        </div>
        <button
          type="submit"
          form="product-form"
          className="bg-[#4A0E1B] text-[#F3E9D8] font-jost text-xs tracking-[0.15em] uppercase px-8 py-3 hover:bg-[#3B0A14] transition-colors shadow-sm cursor-pointer rounded-sm hidden sm:block"
        >
          {initialData ? "Update Product" : "Save Product"}
        </button>
      </header>

      <form
        id="product-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <div className="lg:col-span-2 space-y-6">
          {/* --- BASIC INFO CARD --- */}
          <div className="bg-white p-6 border border-[#C9A24B]/30 shadow-sm rounded-sm">
            <h3 className="font-cormorant text-2xl text-[#4A0E1B] mb-6 border-b border-[#C9A24B]/20 pb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                  Product Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Polki Diamond Ring"
                  className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm"
                />
              </div>

              <div>
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                  Reference / SKU
                </label>
                <input
                  required
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="e.g., AJ-RG-001"
                  className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm"
                />
              </div>

              <div>
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                  Stock Quantity
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm"
                />
              </div>

              {/* Organized Classification Row (3 columns) */}
              <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                    Category
                  </label>
                  {isAddingNewCategory ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        required
                        type="text"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        placeholder="Type new..."
                        className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm"
                      />
                      <button
                        type="button"
                        onClick={cancelNewCategory}
                        className="p-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors rounded-sm cursor-pointer"
                        title="Cancel"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.category}
                      onChange={handleCategoryChange}
                      className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost cursor-pointer rounded-sm"
                    >
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option disabled>──────────</option>
                      <option
                        value="ADD_NEW"
                        className="text-[#C9A24B] font-semibold"
                      >
                        + Add New
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                    Collection
                  </label>
                  <select
                    value={formData.productCollection}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productCollection: e.target.value,
                      })
                    }
                    className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost cursor-pointer rounded-sm"
                  >
                    <option value="Everyday Wear">Everyday Wear</option>
                    <option value="Bridal Vault">Bridal Vault</option>
                    <option value="Festive & Occasion">
                      Festive & Occasion
                    </option>
                    <option value="Gifting">Gifting</option>
                    <option value="Standard">Standard (None)</option>
                  </select>
                </div>

                {/* THE NEW FAVORITE CHECKBOX */}
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFavorite}
                      onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                      className="w-5 h-5 accent-[#C9A24B] cursor-pointer"
                    />
                    <span className="font-jost text-sm text-[#4A0E1B] font-semibold tracking-wide">
                      Show in Favourites
                    </span>
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the craftsmanship, style, and origin..."
                  className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost resize-none rounded-sm"
                ></textarea>
              </div>
            </div>
          </div>

          {/* --- VARIANTS CARD --- */}
          <div className="bg-white p-6 border border-[#C9A24B]/30 shadow-sm rounded-sm">
            <div className="flex items-center justify-between border-b border-[#C9A24B]/20 pb-3 mb-6">
              <h3 className="font-cormorant text-2xl text-[#4A0E1B]">
                Product Variants
              </h3>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1.5 text-[#C9A24B] bg-[#C9A24B]/10 hover:bg-[#C9A24B]/20 px-3 py-1.5 rounded-sm transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span className="font-jost text-[10px] uppercase tracking-wider font-semibold">
                  Add Variant
                </span>
              </button>
            </div>

            {formData.variants.length === 0 ? (
              <p className="font-jost text-sm text-[#7A6A5C] text-center py-4">No variants added. The base product details will be used.</p>
            ) : (
              <div className="space-y-4">
                {formData.variants.map((variant: any, index: number) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-3 p-4 bg-[#FDFBF4] border border-[#C9A24B]/20 rounded-sm relative group">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer z-10"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div>
                      <label className="block font-jost text-[10px] tracking-[0.1em] text-[#7A6A5C] uppercase mb-1">Size (Opt)</label>
                      <input type="text" value={variant.size || ""} onChange={(e) => updateVariant(index, 'size', e.target.value)} placeholder="e.g. 7" className="w-full bg-white border border-[#C9A24B]/30 p-2 text-xs outline-none focus:border-[#C9A24B]" />
                    </div>
                    <div>
                      <label className="block font-jost text-[10px] tracking-[0.1em] text-[#7A6A5C] uppercase mb-1">Color</label>
                      <select value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} className="w-full bg-white border border-[#C9A24B]/30 p-2 text-xs outline-none focus:border-[#C9A24B] cursor-pointer">
                        <option value="Same as Base">Same as Base</option>
                        <option value="Yellow Gold">Yellow Gold</option>
                        <option value="Rose Gold">Rose Gold</option>
                        <option value="White Gold">White Gold</option>
                        <option value="Platinum">Platinum</option>
                        <option value="Silver">Silver</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-jost text-[10px] tracking-[0.1em] text-[#7A6A5C] uppercase mb-1">Purity</label>
                      <select value={variant.purity} onChange={(e) => updateVariant(index, 'purity', e.target.value)} className="w-full bg-white border border-[#C9A24B]/30 p-2 text-xs outline-none focus:border-[#C9A24B] cursor-pointer">
                        <option value="Same as Base">Same as Base</option>
                        <option value="24K Gold">24K Gold</option>
                        <option value="22K Gold">22K Gold</option>
                        <option value="18K Gold">18K Gold</option>
                        <option value="14K Gold">14K Gold</option>
                        <option value="Silver (925)">Silver (925)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-jost text-[10px] tracking-[0.1em] text-[#7A6A5C] uppercase mb-1">Weight (g)</label>
                      <input type="number" step="0.01" value={variant.weight || ""} onChange={(e) => updateVariant(index, 'weight', e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="g" className="w-full bg-white border border-[#C9A24B]/30 p-2 text-xs outline-none focus:border-[#C9A24B]" />
                    </div>
                    <div>
                      <label className="block font-jost text-[10px] tracking-[0.1em] text-[#7A6A5C] uppercase mb-1">Stock</label>
                      <input type="number" value={variant.stock || ""} onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))} className="w-full bg-white border border-[#C9A24B]/30 p-2 text-xs outline-none focus:border-[#C9A24B]" />
                    </div>
                    <div>
                      <label className="block font-jost text-[10px] tracking-[0.1em] text-[#7A6A5C] uppercase mb-1">Making Chg(%)</label>
                      <input type="number" step="0.1" value={variant.makingCharges || ""} onChange={(e) => updateVariant(index, 'makingCharges', e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Opt" className="w-full bg-white border border-[#C9A24B]/30 p-2 text-xs outline-none focus:border-[#C9A24B]" />
                    </div>
                    <div>
                      <label className="block font-jost text-[10px] tracking-[0.1em] text-[#7A6A5C] uppercase mb-1">GST(%)</label>
                      <input type="number" step="0.1" value={variant.gst || ""} onChange={(e) => updateVariant(index, 'gst', e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="Opt" className="w-full bg-white border border-[#C9A24B]/30 p-2 text-xs outline-none focus:border-[#C9A24B]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- PRICING ENGINE CARD (Remains exactly the same) --- */}
          <div className="bg-white p-6 border border-[#C9A24B]/30 shadow-sm rounded-sm transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[#C9A24B]/20 pb-3 mb-6">
              <h3 className="font-cormorant text-2xl text-[#4A0E1B]">
                Dynamic Pricing Engine
              </h3>
              <div className="flex items-center gap-1.5 text-[#C9A24B] bg-[#C9A24B]/10 px-3 py-1 rounded-full">
                <Info size={14} />
                <span className="font-jost text-[10px] uppercase tracking-wider font-semibold">
                  Auto-Calculates Daily
                </span>
              </div>
            </div>

            {showDiamondFields && (
              <div className="mb-6 bg-[#FDFBF4] p-3 border border-[#C9A24B]/20 rounded-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMetalBase}
                    onChange={(e) => setHasMetalBase(e.target.checked)}
                    className="w-4 h-4 accent-[#C9A24B] cursor-pointer"
                  />
                  <span className="font-jost text-sm text-[#4A0E1B] font-medium">
                    This diamond piece includes a Gold/Silver base.
                  </span>
                </label>
              </div>
            )}

            <div
              className={`grid grid-cols-1 sm:grid-cols-4 gap-6 ${showDiamondFields ? "mb-6" : ""}`}
            >
              {(!showDiamondFields || hasMetalBase) && (
                <>
                  <div className="animate-in fade-in duration-300">
                    <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                      Metal Purity
                    </label>
                    <select
                      value={formData.purity}
                      onChange={(e) =>
                        setFormData({ ...formData, purity: e.target.value })
                      }
                      className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost cursor-pointer rounded-sm"
                    >
                      <option value="24K Gold">24K Gold</option>
                      <option value="22K Gold">22K Gold</option>
                      <option value="18K Gold">18K Gold</option>
                      <option value="Silver (925)">Silver (925)</option>
                    </select>
                  </div>
                  <div className="animate-in fade-in duration-300">
                    <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                      Metal Weight (g)
                    </label>
                    <input
                      required={hasMetalBase}
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      placeholder="e.g., 12.5"
                      className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                  Making Charges (%)
                </label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={formData.makingCharges}
                  onChange={(e) =>
                    setFormData({ ...formData, makingCharges: e.target.value })
                  }
                  placeholder="e.g., 15"
                  className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm"
                />
              </div>
              <div>
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                  GST (%)
                </label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={formData.gst}
                  onChange={(e) =>
                    setFormData({ ...formData, gst: e.target.value })
                  }
                  placeholder="e.g., 3"
                  className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm"
                />
              </div>
            </div>

            {showDiamondFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-[#C9A24B]/10 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                    Diamond Wt (ct)
                  </label>
                  <input
                    required={showDiamondFields}
                    type="number"
                    step="0.01"
                    value={formData.diamondCarat}
                    onChange={(e) =>
                      setFormData({ ...formData, diamondCarat: e.target.value })
                    }
                    placeholder="e.g., 1.5"
                    className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm"
                  />
                </div>
                <div>
                  <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
                    Manual Diamond Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A5C] font-jost">
                      ₹
                    </span>
                    <input
                      required={showDiamondFields}
                      type="number"
                      value={formData.diamondValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          diamondValue: e.target.value,
                        })
                      }
                      placeholder="e.g., 45000"
                      className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 pl-7 pr-4 py-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: MASSIVE MEDIA UPLOAD --- */}
        <div className="space-y-6">
          <div className="bg-white p-6 border border-[#C9A24B]/30 shadow-sm rounded-sm">
            <h3 className="font-cormorant text-2xl text-[#4A0E1B] mb-6 border-b border-[#C9A24B]/20 pb-3">
              Product Media
            </h3>

            {/* Multiple Image Upload */}
            <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
              Images (Up to 7)
            </label>
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed ${isDragging ? 'border-[#4A0E1B] bg-[#C9A24B]/10' : 'border-[#C9A24B]/40 bg-[#FDFBF4]'} p-6 text-center cursor-pointer hover:bg-[#C9A24B]/5 transition-colors mb-4 flex flex-col items-center justify-center rounded-sm overflow-hidden`}
            >
              <input type="file" multiple accept="image/png, image/jpeg" className="hidden" onChange={handleFileInput} />
              <ImageIcon size={28} className={`mb-2 transition-colors ${isDragging ? 'text-[#4A0E1B]' : 'text-[#C9A24B]'}`} />
              <p className="font-jost text-sm text-[#4A0E1B] font-medium">Click or Drag images here</p>
              <p className="font-jost text-xs text-[#7A6A5C] mt-1">{existingImages.length + newImagePreviews.length}/7 Selected</p>
            </label>

            {/* Thumbnail Grid for Images */}
            {(existingImages.length > 0 || newImagePreviews.length > 0) && (
              <div className="grid grid-cols-4 gap-2 mb-6">
                {/* Existing Stored Images */}
                {existingImages.map((img, idx) => {
                  const src = getImageUrl(img);
                  return (
                    <div key={`existing-${idx}`} className="relative aspect-square border border-[#C9A24B]/30 rounded-sm overflow-hidden group bg-[#FDFBF4]">
                      <img src={src} alt={`Saved image ${idx + 1}`} className="w-full h-full object-contain p-1" />
                      <span className="absolute bottom-1 left-1 bg-[#4A0E1B]/80 text-[9px] text-[#F3E9D8] px-1 rounded">Saved</span>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}

                {/* Newly Added Uploads */}
                {newImagePreviews.map((src, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square border border-emerald-500/40 rounded-sm overflow-hidden group bg-[#FDFBF4]">
                    <img src={src} alt={`New upload ${idx + 1}`} className="w-full h-full object-contain p-1" />
                    <span className="absolute bottom-1 left-1 bg-emerald-700/80 text-[9px] text-white px-1 rounded">New</span>
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-[#C9A24B]/10 pt-6 mb-2" />

            {/* Multiple Video Upload */}
            <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">
              Videos (Up to 2)
            </label>
            <label className="border-2 border-dashed border-[#C9A24B]/40 bg-[#FDFBF4] p-6 text-center cursor-pointer hover:bg-[#C9A24B]/5 transition-colors flex flex-col items-center justify-center rounded-sm mb-4">
              <input
                type="file"
                multiple
                accept="video/mp4"
                className="hidden"
                onChange={handleFileInput}
              />
              <Film size={28} className="text-[#C9A24B] mb-2" />
              <p className="font-jost text-sm text-[#4A0E1B] font-medium">
                Upload up to 2 videos
              </p>
              <p className="font-jost text-xs text-[#7A6A5C] mt-1">{videoPreviews.length}/2 Selected</p>
            </label>

            {/* Video List */}
            {videoPreviews.length > 0 && (
              <div className="space-y-2">
                {videoPreviews.map((vidName, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 p-2 rounded-sm">
                    <span className="font-jost text-xs text-[#4A0E1B] truncate max-w-[200px]">{vidName}</span>
                    <button type="button" onClick={() => removeVideo(idx)} className="text-red-500 hover:text-red-700">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sm:hidden col-span-1 pt-4 pb-10">
          <button
            type="submit"
            className="w-full bg-[#4A0E1B] text-[#F3E9D8] font-jost text-xs tracking-[0.15em] uppercase px-8 py-4 hover:bg-[#3B0A14] transition-colors shadow-sm cursor-pointer rounded-sm"
          >
            {initialData ? "Update Product" : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}