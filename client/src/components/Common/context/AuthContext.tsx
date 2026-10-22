import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from "react";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
}

export interface AuthModalOptions {
  mode?: 'login' | 'signup';
  message?: string;
  onSuccess?: () => void;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, portal?: 'customer' | 'admin') => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  authModalMessage: string | null;
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
  requireAuth: (action: () => void, message?: string) => void;
}

import { API_URL, getAuthToken } from "../../../utils/api";
const TOKEN_KEY = "aj_jewellers_token";
const USER_KEY = "aj_jewellers_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [authModalMessage, setAuthModalMessage] = useState<string | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      // Clear old auth data from previous system
      localStorage.removeItem("aj_dummy_user");
      localStorage.removeItem("aj_customer");
      
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      
      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.role === 'admin') {
            // Migrate legacy admin session to dedicated admin storage
            localStorage.setItem("aj_admin_token", token);
            localStorage.setItem("aj_admin_user", storedUser);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
          } else {
            setUser(parsedUser);
            
            // Verify token is still valid by fetching user profile
            const response = await fetch(`${API_URL}/users/me`, {
              headers: { Authorization: `Bearer ${token}` },
              credentials: 'include'
            });
            
            if (!response.ok) {
              // Token expired or invalid
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
              setUser(null);
            }
          }
        } catch (err) {
          console.error("Auth init error:", err);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const openAuthModal = useCallback((options?: AuthModalOptions) => {
    setAuthModalMode(options?.mode || 'login');
    setAuthModalMessage(options?.message || null);
    if (options?.onSuccess) {
      pendingActionRef.current = options.onSuccess;
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthModalMessage(null);
    pendingActionRef.current = null;
  }, []);

  const requireAuth = useCallback((action: () => void, message?: string) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (user || (token && storedUser)) {
      action();
      return;
    }
    pendingActionRef.current = action;
    setAuthModalMode('login');
    setAuthModalMessage(message || "Please sign in to proceed.");
    setIsAuthModalOpen(true);
  }, [user]);

  const handleAuthSuccess = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthModalMessage(null);
    if (pendingActionRef.current) {
      const actionToExecute = pendingActionRef.current;
      pendingActionRef.current = null;
      setTimeout(() => {
        try {
          actionToExecute();
        } catch (e) {
          console.error("Error executing pending action post-auth:", e);
        }
      }, 100);
    }
  }, []);

  const login = useCallback(async (email: string, password: string, portal: 'customer' | 'admin' = 'customer') => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        // Prevent admin from logging into customer portal
        if (portal === 'customer' && data.data.role === "admin") {
          await fetch(`${API_URL}/users/logout`, { method: "POST", credentials: "include" });
          return { success: false, error: "Admin accounts cannot be used on the customer portal. Please use Admin Login." };
        }

        // Prevent regular customers from logging into admin portal
        if (portal === 'admin' && data.data.role !== "admin") {
          await fetch(`${API_URL}/users/logout`, { method: "POST", credentials: "include" });
          return { success: false, error: "Access denied. Only admin accounts can log in here." };
        }

        localStorage.setItem(TOKEN_KEY, data.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify({
          _id: data.data._id,
          name: data.data.name,
          email: data.data.email,
          phone: data.data.phone,
          role: data.data.role
        }));
        setUser({
          _id: data.data._id,
          name: data.data.name,
          email: data.data.email,
          phone: data.data.phone,
          role: data.data.role
        });

        // Trigger pending action if any and close modal
        handleAuthSuccess();

        return { success: true };
      }
      return { success: false, error: data.message || "Login failed" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSuccess]);

  const signup = useCallback(async (name: string, email: string, password: string, phone: string, otp: string) => {
    setIsLoading(true);
    try {
      if (!otp || !otp.trim()) {
        return { success: false, error: "OTP verification code is required" };
      }
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, otp: otp.trim() }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        localStorage.setItem(TOKEN_KEY, data.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify({
          _id: data.data._id,
          name: data.data.name,
          email: data.data.email,
          phone: data.data.phone,
          role: data.data.role
        }));
        setUser({
          _id: data.data._id,
          name: data.data.name,
          email: data.data.email,
          phone: data.data.phone,
          role: data.data.role
        });

        // Trigger pending action if any and close modal
        handleAuthSuccess();

        return { success: true };
      }
      return { success: false, error: data.message || "Registration failed" };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSuccess]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
    isAuthenticated: !!user,
    isAuthModalOpen,
    authModalMode,
    authModalMessage,
    openAuthModal,
    closeAuthModal,
    requireAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper to get auth headers for API calls
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}