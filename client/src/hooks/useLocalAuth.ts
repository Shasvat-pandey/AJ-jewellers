// src/hooks/useLocalAuth.ts
import { API_URL } from "../utils/api";

export const useLocalAuth = () => {
  
  const getUser = () => {
    const storedUser = localStorage.getItem("aj_customer");
    return storedUser ? JSON.parse(storedUser) : null;
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        credentials: 'include',
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();

      if (data.success) {
        if (data.data.role === "admin") {
          await fetch(`${API_URL}/users/logout`, { method: "POST", credentials: "include" });
          return { success: false, error: "Admin accounts cannot be used on the customer portal." };
        }
        // Save the real MongoDB user and JWT token to the browser
        localStorage.setItem("aj_customer", JSON.stringify(data.data));
        return { success: true };
      } else {
        return { success: false, error: data.message || "Invalid credentials." };
      }
    } catch (error) {
      console.error("Login Error:", error);
      return { success: false, error: "Failed to connect to the server." };
    }
  };

  const signup = async (name: string, email: string, password: string, phone: string) => {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        credentials: 'include',
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      
      const data = await response.json();

      if (data.success) {
        // Save the newly created MongoDB user to the browser
        localStorage.setItem("aj_customer", JSON.stringify(data.data));
        return { success: true };
      } else {
        return { success: false, error: data.message || "Signup failed." };
      }
    } catch (error) {
      console.error("Signup Error:", error);
      return { success: false, error: "Failed to connect to the server." };
    }
  };

  const logout = async () => {
    try { await fetch(`${API_URL}/users/logout`, { method: "POST", credentials: "include" }); } catch (e) { console.error(e); }
    localStorage.removeItem("aj_customer");
    // Also clear the old dummy token if it's lingering
    localStorage.removeItem("aj_dummy_user"); 
  };

  return { user: getUser(), login, signup, logout };
};