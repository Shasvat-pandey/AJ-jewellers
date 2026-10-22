// src/components/Admin/Pages/AdminLogin.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { API_URL, ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from "../../../utils/api";

export default function AdminLogin() {
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  useEffect(() => {
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    const adminStored = localStorage.getItem(ADMIN_USER_KEY);
    if (adminToken && adminStored) {
      try {
        const parsed = JSON.parse(adminStored);
        if (parsed.role === 'admin') {
          navigate("/admin-dashboard", { replace: true });
        }
      } catch {
        // ignore parse error
      }
    }
  }, [navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include'
      });

      const data = await response.json();
      setSubmitting(false);

      if (data.success && data.data?.token) {
        if (data.data.role !== 'admin') {
          setError("Access denied. Only authorized administrator accounts can enter this portal.");
          return;
        }

        // Store dedicated Admin credentials (does not pollute customer storefront sessions)
        localStorage.setItem(ADMIN_TOKEN_KEY, data.data.token);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.data));

        navigate("/admin-dashboard", { replace: true });
      } else {
        setError(data.message || "Invalid administrator credentials.");
      }
    } catch (err: any) {
      setSubmitting(false);
      setError("Network or server connection error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#2A0A10] flex items-center justify-center px-4">
      <div className="bg-[#FDFBF4] p-8 md:p-12 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#4A0E1B] rounded-full flex items-center justify-center">
            <Lock size={28} className="text-[#C9A24B]" />
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="font-cormorant text-3xl text-[#4A0E1B] font-bold">AJ Jewellers</h1>
          <p className="font-jost text-xs tracking-[0.2em] text-[#7A6A5C] mt-2 uppercase">Secure Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2 uppercase">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors"
              placeholder="admin@aj.com"
            />
          </div>

          <div>
            <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2 uppercase">Passkey</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-jost text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#C9A24B] text-[#2A0A10] font-jost text-sm tracking-[0.16em] font-semibold px-6 py-4 mt-4 hover:bg-[#b58e39] transition-colors disabled:opacity-60"
          >
            {submitting ? "AUTHENTICATING..." : "AUTHORIZE ACCESS"}
          </button>
        </form>
      </div>
    </div>
  );
}