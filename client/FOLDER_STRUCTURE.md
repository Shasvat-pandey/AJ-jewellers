# AJ Jewellers Frontend - Folder Structure

## Project Organization

This project follows a professional frontend architecture with clear separation of concerns between User and Admin features.

```
client/
├── src/
│   ├── components/
│   │   ├── Common/
│   │   │   ├── context/
│   │   │   │   └── AuthContext.tsx          # Global auth state management
│   │   │   ├── Navbar.tsx                   # Main navigation bar
│   │   │   ├── Footer.tsx                   # Footer component
│   │   │   ├── Hero.tsx                     # Hero section
│   │   │   ├── Goldratebanner.tsx          # Gold rate banner
│   │   │   └── Trustbadges.tsx              # Trust badges component
│   │   │
│   │   ├── User/                           # User-facing features
│   │   │   ├── Components/
│   │   │   │   ├── IntroSplash.tsx          # Splash screen
│   │   │   │   └── Instagramfeed.tsx        # Instagram feed
│   │   │   │
│   │   │   └── Pages/
│   │   │       ├── Home.tsx                 # Home page
│   │   │       │
│   │   │       ├── Collections/             # Collections browsing
│   │   │       │   ├── Ourcollectionspage.tsx
│   │   │       │   ├── CategoryDetailPage.tsx
│   │   │       │   ├── CategoryScroll.tsx
│   │   │       │   └── Collectionsplit.tsx
│   │   │       │
│   │   │       ├── Bridal/                  # Bridal collection
│   │   │       │   └── Bridalvaultpage.tsx
│   │   │       │
│   │   │       ├── Products/                # Product pages
│   │   │       │   ├── ProductDetailPage.tsx
│   │   │       │   └── EverydayGoldPage.tsx
│   │   │       │
│   │   │       ├── Shopping/                # Shopping features
│   │   │       │   ├── BagPage.tsx
│   │   │       │   ├── CheckoutPage.tsx
│   │   │       │   └── OrderConfirmedPage.tsx
│   │   │       │
│   │   │       ├── Account/                 # User account
│   │   │       │   ├── LoginPage.tsx
│   │   │       │   ├── SignupPage.tsx
│   │   │       │   ├── AccountPage.tsx
│   │   │       │   └── AppointmentsPage.tsx
│   │   │       │
│   │   │       ├── Wishlist/               # Wishlist features
│   │   │       │   ├── WishlistPage.tsx
│   │   │       │   └── FavouritesGrid.tsx
│   │   │       │
│   │   │       ├── Gold/                   # Gold rate info
│   │   │       │   └── GoldRatePage.tsx
│   │   │       │
│   │   │       └── About/                  # About section
│   │   │           ├── AboutPage.tsx
│   │   │           └── Privateviewing.tsx
│   │   │
│   │   └── Admin/                          # Admin features (future)
│   │       ├── Pages/
│   │       │   └── (Admin pages will go here)
│   │       │
│   │       ├── Components/
│   │       │   └── (Admin components will go here)
│   │       │
│   │       └── Dashboard/
│   │           └── AdminDashboard.tsx      # Admin dashboard home
│   │
│   ├── hooks/
│   │   └── useLocalAuth.ts                 # Local auth management hook
│   │
│   ├── assets/
│   │   ├── categories/
│   │   ├── instagram/
│   │   ├── products/
│   │   ├── promos/
│   │   └── videos/
│   │
│   ├── App.tsx                             # Main app component
│   ├── App.css
│   ├── main.tsx                            # Entry point
│   ├── index.css
│   └── vite-env.d.ts
│
├── package.json
├── vite.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Folder Descriptions

### Common/
Shared components used across the entire application:
- **context/**: Global state management (Auth, etc.)
- **Navbar**: Navigation bar for all pages
- **Footer**: Footer displayed on all pages
- **Hero**: Hero section component
- **Goldratebanner**: Live gold rate display
- **Trustbadges**: Trust and security badges

### User/
All user-facing features and pages:

#### Components/
Reusable UI components for the user interface:
- IntroSplash: Welcome/splash screen
- Instagramfeed: Instagram feed integration

#### Pages/
Organized by feature/domain:
- **Home**: Landing page
- **Collections**: Browse and filter collections
- **Bridal**: Bridal collection features
- **Products**: Individual product details
- **Shopping**: Cart, checkout, order confirmation
- **Account**: Login, signup, profile, appointments
- **Wishlist**: Favorites and wishlist features
- **Gold**: Gold rate information and tracking
- **About**: Company info and private viewing requests

### Admin/
Reserved for future admin features:
- **Pages**: Admin page components
- **Components**: Admin UI components
- **Dashboard**: Admin dashboard and management

### hooks/
Custom React hooks for reusable logic:
- `useLocalAuth`: Handle user authentication state

### assets/
Static assets organized by type:
- categories: Category images
- instagram: Instagram content
- products: Product images
- promos: Promotional images
- videos: Video content

## Import Guidelines

When importing components, use the full path from the src directory:

```typescript
// Common components
import Navbar from "./components/Common/Navbar";
import { useAuth } from "./components/Common/context/AuthContext";

// User components
import Home from "./components/User/Pages/Home";
import ProductDetail from "./components/User/Pages/Products/ProductDetailPage";
import LoginPage from "./components/User/Pages/Account/LoginPage";

// Admin components (future)
import AdminDashboard from "./components/Admin/Dashboard/AdminDashboard";
```

## Adding New Features

When adding new features:

1. **User Features**: Create in appropriate User/Pages subfolder
2. **Shared Components**: Add to Common/ folder
3. **Admin Features**: Create in Admin/ folder with same structure
4. **Custom Logic**: Add hooks to hooks/ folder
5. **Static Assets**: Add to assets/ with appropriate subfolder

## Naming Conventions

- **Components**: PascalCase (e.g., `LoginPage.tsx`, `ProductCard.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useLocalAuth.ts`)
- **Folders**: camelCase (e.g., `Collections/`, `Account/`)
- **Types/Interfaces**: PascalCase (e.g., `AuthContextType`, `User`)

## Future Expansion

This structure is designed to scale:
- Add more user feature folders under User/Pages as needed
- Expand Admin section with multiple subsystems
- Create shared component library in Common if needed
- Organize utilities and constants as project grows
