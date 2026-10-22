// src/hooks/useAdminAuth.ts
import { API_URL, ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from "../utils/api";

export const useAdminAuth = () => {
  const getAdmin = () => {
    const storedAdmin = localStorage.getItem(ADMIN_USER_KEY);
    return storedAdmin ? JSON.parse(storedAdmin) : null;
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        credentials: 'include',
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      
      const data = await response.json();

      if (data.success && data.data?.role === "admin") {
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.data));
        if (data.data.token) {
          localStorage.setItem(ADMIN_TOKEN_KEY, data.data.token);
        }
        return { success: true };
      } else if (data.success) {
        return { success: false, error: "Access denied. Not authorized as an administrator." };
      } else {
        return { success: false, error: data.message || "Invalid credentials." };
      }
    } catch (error) {
      console.error("Admin Login Error:", error);
      return { success: false, error: "Failed to connect to the server." };
    }
  };

  const logout = async () => {
    try { await fetch(`${API_URL}/users/logout`, { method: "POST", credentials: "include" }); } catch (e) { console.error(e); }
    localStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  };

  return { admin: getAdmin(), login, logout };
};