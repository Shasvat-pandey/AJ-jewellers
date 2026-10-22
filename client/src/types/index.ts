// ==========================================
// 1. PRODUCT INTERFACE
// ==========================================
/** Responsive variant object (new pipeline). Legacy rows may be plain strings. */
export interface ProductImage {
  original: string;
  thumbnail?: string;
  medium?: string;
  large?: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  size?: number | null;
}
export interface Product {
  _id?: string; // Optional because it doesn't exist until saved in MongoDB
  name: string;
  sku: string;
  category: string;
  subcategory?: string;
  productCollection: string; // e.g., "Bridal Vault", "Everyday Wear"
  
  // Pricing Engine Data
  purity: "24K Gold" | "22K Gold" | "18K Gold" | "Silver (925)";
  weight: number; // in grams
  makingCharges: number; // percentage (e.g., 15)
  gst?: number; // percentage (e.g., 3)
  
  // Diamond Data
  diamondCarat?: number; // Optional
  diamondValue?: number; // Optional manual price
  hasMetalBase: boolean; 
  
  // Inventory & UI
  stock: number;
  description: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  images: (string | ProductImage)[]; // Variant objects (new) or legacy URL strings
  videoUrl?: string; // Optional
  
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 2. USER/CUSTOMER INTERFACE
// ==========================================
export interface User {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string; // Handled by backend securely
  role: "customer" | "admin";
  addresses: Address[];
  createdAt?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// ==========================================
// 3. ORDER INTERFACE
// ==========================================
export interface Order {
  _id?: string;
  orderNumber: string; // e.g., "AJ31784"
  user: string; // The User's ID
  items: OrderItem[];
  
  // Financials
  subTotal: number;
  tax: number; // 3% GST
  shippingCost: number;
  totalAmount: number;
  
  // Status
  paymentStatus: "Pending" | "Paid" | "Failed";
  orderStatus: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  
  shippingAddress: Address;
  createdAt?: string;
}

export interface OrderItem {
  product: string; // The Product's ID
  name: string;
  priceAtPurchase: number; // CRITICAL: Locks in the dynamic price at the moment they bought it!
  quantity: number;
}

// ==========================================
// 4. SETTINGS / MARKET RATES INTERFACE
// ==========================================
export interface MarketRates {
  _id?: string;
  rate24k: number;
  rate22k: number;
  rate18k: number;
  silver: number;
  lastUpdated: string;
}