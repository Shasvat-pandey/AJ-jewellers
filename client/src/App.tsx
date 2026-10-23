// src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Navbar from "./components/Common/Navbar";
import IntroSplash from "./components/User/Components/Home/IntroSplash";
import Footer from "./components/Common/Footer";
import AuthModal from "./components/Common/AuthModal";
import AdminRoute from "./components/Common/AdminRoute";
import "./App.css";

// Immediate loading for landing page
import Home from "./components/User/Pages/Home";

// FT-01: Route-level code splitting via React.lazy
const OurCollectionsPage = lazy(() => import("./components/User/Pages/Collections/Ourcollectionspage"));
const CategoryDetailPage = lazy(() => import("./components/User/Pages/Collections/CategoryDetailPage"));
const BridalPage = lazy(() => import("./components/User/Pages/Bridal/Bridalvaultpage"));
const GoldRatePage = lazy(() => import("./components/User/Pages/Gold/GoldRatePage"));
const AboutPage = lazy(() => import("./components/User/Pages/About/AboutPage"));
const AppointmentsPage = lazy(() => import("./components/User/Pages/Account/AppointmentsPage"));
const WishlistPage = lazy(() => import("./components/User/Pages/Wishlist/WishlistPage"));
const EverydayGoldPage = lazy(() => import("./components/User/Pages/Products/EverydayGoldPage"));
const ProductDetailPage = lazy(() => import("./components/User/Pages/Products/ProductDetailPage"));
const OrderConfirmedPage = lazy(() => import("./components/User/Pages/Shopping/OrderConfirmedPage"));
const CheckoutPage = lazy(() => import("./components/User/Pages/Shopping/CheckoutPage"));
const SearchPage = lazy(() => import("./components/User/Pages/Shopping/SearchPage"));
const BagPage = lazy(() => import("./components/User/Pages/Shopping/BagPage"));
const SignupPage = lazy(() => import("./components/User/Pages/Account/SignupPage"));
const LoginPage = lazy(() => import("./components/User/Pages/Account/LoginPage"));
const AccountPage = lazy(() => import("./components/User/Pages/Account/AccountPage"));
const CareGuidePage = lazy(() => import("./components/User/Pages/CareGuidePage/CareGuidePage"));

// Admin routes (heavy chunks split)
const AdminLogin = lazy(() => import("./components/Admin/Pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./components/Admin/Dashboard/AdminDashboard"));

// Legal & Policy pages (FT-10)
const PrivacyPolicy = lazy(() => import("./components/User/Pages/Legal/PrivacyPolicy"));
const TermsPage = lazy(() => import("./components/User/Pages/Legal/TermsPage"));
const ShippingPolicy = lazy(() => import("./components/User/Pages/Legal/ShippingPolicy"));
const RefundPolicy = lazy(() => import("./components/User/Pages/Legal/RefundPolicy"));
const FaqPage = lazy(() => import("./components/User/Pages/Legal/FaqPage"));
const ContactPage = lazy(() => import("./components/User/Pages/Legal/ContactPage"));
const NotFoundPage = lazy(() => import("./components/User/Pages/NotFoundPage"));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center bg-[#FDFBF4]">
    <div className="w-10 h-10 border-2 border-[#C9A24B] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Customer layout wrapping navigation and footer
const CustomerLayout = () => {
  return (
    <div className="bg-maroon min-h-screen relative">
      <IntroSplash />
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
      <Footer />
      <AuthModal />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* --- SECRET ADMIN ROUTES (No Navbar/Footer) --- */}
          <Route path="/admin-loginxyz" element={<AdminLogin />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>

          {/* --- CUSTOMER ROUTES (Uses CustomerLayout) --- */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/collections" element={<OurCollectionsPage />} />
            <Route path="/collections/:categoryId" element={<CategoryDetailPage />} />
            <Route path="/bridal-vault" element={<BridalPage />} />
            <Route path="/gold-rate" element={<GoldRatePage />} />
            <Route path="/about" element={<AboutPage />} />
            
            {/* Appointment Routing */}
            <Route path="/visit-us" element={<AppointmentsPage />} />
            <Route path="/appointments" element={<Navigate to="/visit-us?book=1" replace />} />
            
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/everyday-silver-gold" element={<EverydayGoldPage />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />
            <Route path="/bag" element={<BagPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmed" element={<OrderConfirmedPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/profile" element={<Navigate to="/account" replace />} />
            <Route path="/care-guide" element={<CareGuidePage />} />

            {/* FT-10: Policy & Legal Routes */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
            <Route path="/shipping" element={<ShippingPolicy />} />
            <Route path="/help/shipping" element={<ShippingPolicy />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/returns" element={<RefundPolicy />} />
            <Route path="/help/returns" element={<RefundPolicy />} />
            <Route path="/faqs" element={<FaqPage />} />
            <Route path="/help/faqs" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help/contact" element={<ContactPage />} />

            {/* Legacy & Footer Aliases */}
            <Route path="/craftsmanship" element={<Navigate to="/about" replace />} />
            <Route path="/about/craftsmanship" element={<Navigate to="/about" replace />} />
            <Route path="/about/sustainability" element={<Navigate to="/about" replace />} />
            <Route path="/about/press" element={<Navigate to="/about" replace />} />
            <Route path="/careers" element={<Navigate to="/visit-us?book=1" replace />} />
            <Route path="/blog" element={<Navigate to="/care-guide" replace />} />

            {/* 404 Not Found Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;