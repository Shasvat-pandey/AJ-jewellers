import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../../components/Common/context/AuthContext";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/account";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, from]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    
    if (result.success) {
      navigate(from, { replace: true });
      window.scrollTo(0, 0);
    } else {
      setError(result.error || "Something went wrong.");
    }
  };

  return (
    <section className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-6 flex justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 md:mb-10">
          <p className="font-jost text-[10px] md:text-xs tracking-[0.24em] text-[#C9A24B] mb-3">
            WELCOME BACK
          </p>
          <h1 className="font-cormorant text-4xl md:text-5xl text-[#4A0E1B]">
            Sign In
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2">
              EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2">
              PASSWORD
            </label>
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
            <p className="font-jost text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#3B0E17] text-[#F3E9D8] font-jost text-xs md:text-sm tracking-[0.16em] px-6 py-4 hover:bg-[#4A0E1B] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <p className="text-center font-jost text-sm text-[#7A6A5C] mt-8">
          New here?{" "}
          <Link to="/signup" className="text-[#4A0E1B] underline hover:text-[#C9A24B]">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}