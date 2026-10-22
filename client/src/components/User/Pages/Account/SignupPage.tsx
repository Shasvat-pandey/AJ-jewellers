import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../components/Common/context/AuthContext";
import { API_URL } from "../../../../utils/api";

export default function SignupPage() {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/account", { replace: true });
    }
  }, [user, navigate]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // New OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // STEP 1: Send OTP to Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setInfoMessage("");

    if (password !== confirmPassword) return setError("Passwords don't match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (phone.length !== 10) return setError("Please enter a valid 10-digit mobile number.");

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/users/send-otp`, {
        credentials: 'include',
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setInfoMessage("Verification code sent to your email!");
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Server connection failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 2: Verify OTP and Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/users/register`, {
      credentials: 'include',
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, otp })
      });
      const data = await response.json();

      if (data.success) {
        // Registration successful! Now instantly log them in using the new auth.
        const loginResult = await login(email, password);
        if (loginResult.success) {
          navigate("/account", { replace: true });
          window.scrollTo(0, 0);
        } else {
          setError(loginResult.error || "Login failed after registration.");
        }
      } else {
        setError(data.message || "Invalid OTP.");
      }
    } catch (err) {
      setError("Server connection failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-6 flex justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 md:mb-10">
          <p className="font-jost text-[10px] md:text-xs tracking-[0.24em] text-[#C9A24B] mb-3">JOIN AJ JEWELLERS</p>
          <h1 className="font-cormorant text-4xl md:text-5xl text-[#4A0E1B]">Create Account</h1>
        </div>

        {!otpSent ? (
          /* FORM STEP 1: Details Collection */
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5 animate-in fade-in">
            <div>
              <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2">FULL NAME</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors" placeholder="Ansh Gupta" />
            </div>
            <div>
              <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2">EMAIL</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2">PHONE</label>
              <input type="tel" maxLength={10} required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors" placeholder="10-digit mobile number" />
            </div>
            <div>
              <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2">PASSWORD</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors" placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2">CONFIRM PASSWORD</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] px-4 py-3 font-jost text-sm text-[#4A0E1B] outline-none transition-colors" placeholder="••••••••" />
            </div>

            {error && <p className="font-jost text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

            <button type="submit" disabled={submitting} className="bg-[#3B0E17] text-[#F3E9D8] font-jost text-xs md:text-sm tracking-[0.16em] px-6 py-4 hover:bg-[#4A0E1B] transition-colors disabled:opacity-60 cursor-pointer">
              {submitting ? "SENDING VERIFICATION..." : "SEND OTP TO EMAIL"}
            </button>
          </form>
        ) : (
          /* FORM STEP 2: OTP Verification */
          <form onSubmit={handleRegister} className="flex flex-col gap-5 animate-in slide-in-from-right-4">
            <div className="bg-white border border-[#C9A24B]/30 p-5 text-center mb-2">
              <p className="font-jost text-[13px] text-[#4A0E1B]">We sent a 6-digit code to</p>
              <p className="font-jost text-sm font-semibold text-[#C9A24B] mt-1">{email}</p>
            </div>
            
            <div>
              <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-2 text-center">ENTER OTP CODE</label>
              <input type="text" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full bg-white border border-[#C9A24B] px-4 py-4 font-jost text-2xl text-center tracking-[0.5em] text-[#4A0E1B] outline-none transition-colors" placeholder="000000" />
            </div>

            {error && <p className="font-jost text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 text-center">{error}</p>}
            {infoMessage && <p className="font-jost text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 text-center">{infoMessage}</p>}

            <button type="submit" disabled={submitting} className="bg-[#C9A24B] text-white font-jost text-xs md:text-sm tracking-[0.16em] px-6 py-4 hover:bg-[#b08d40] transition-colors disabled:opacity-60 cursor-pointer mt-2">
              {submitting ? "VERIFYING..." : "VERIFY & CREATE ACCOUNT"}
            </button>
            
            <div className="flex justify-between items-center mt-2 px-1">
              <button type="button" onClick={() => { setOtpSent(false); setInfoMessage(""); setError(""); }} className="text-[#7A6A5C] font-jost text-xs tracking-wider uppercase hover:text-[#4A0E1B] underline">
                Back to Edit
              </button>
              <button type="button" onClick={() => handleSendOtp()} disabled={submitting} className="text-[#C9A24B] font-jost text-xs tracking-wider uppercase hover:text-[#4A0E1B] underline disabled:opacity-50">
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <p className="text-center font-jost text-sm text-[#7A6A5C] mt-8">
          Already have an account? <Link to="/login" className="text-[#4A0E1B] underline hover:text-[#C9A24B]">Sign in</Link>
        </p>
      </div>
    </section>
  );
}