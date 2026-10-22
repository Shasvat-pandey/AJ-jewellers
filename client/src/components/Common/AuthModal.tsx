import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, ShieldCheck, Mail, Lock, Phone, User as UserIcon } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { API_URL } from "../../utils/api";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    authModalMessage,
    closeAuthModal,
    login
  } = useAuth();

  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup states
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP flow
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Shared status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Sync mode with context
  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode || 'login');
      setError(null);
      setInfoMessage(null);
    }
  }, [isAuthModalOpen, authModalMode]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // OTP Cooldown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  if (!isAuthModalOpen) return null;

  // Switch tabs
  const handleSwitchTab = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError(null);
    setInfoMessage(null);
    setOtpSent(false);
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await login(loginEmail, loginPassword, 'customer');
      if (!result.success) {
        setError(result.error || "Invalid email or password.");
      }
      // On success, AuthContext triggers handleAuthSuccess() which closes modal and executes pending action
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Send OTP (Signup Step 1)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (phone.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/users/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupEmail }),
        credentials: "include"
      });
      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setOtpCooldown(60);
        setInfoMessage("Verification code sent to your email!");
      } else {
        setError(data.message || "Failed to send OTP code.");
      }
    } catch {
      setError("Server connection failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Verify OTP and Register (Signup Step 2)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
          phone: phone.trim(),
          otp: otp.trim()
        }),
        credentials: "include"
      });
      const data = await response.json();

      if (data.success) {
        // Automatically sign in the user
        const loginRes = await login(signupEmail, signupPassword, 'customer');
        if (!loginRes.success) {
          setError(loginRes.error || "Account created, but sign-in failed. Please sign in manually.");
          setMode('login');
          setLoginEmail(signupEmail);
        }
      } else {
        setError(data.message || "Invalid or expired verification code.");
      }
    } catch {
      setError("Server connection failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={closeAuthModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#FDFBF4] border border-[#C9A24B]/40 shadow-2xl rounded-sm max-w-md w-full overflow-hidden relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luxury Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#4A0E1B] via-[#C9A24B] to-[#4A0E1B]" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-[#7A6A5C] hover:text-[#4A0E1B] transition-colors p-1.5 rounded-full hover:bg-[#4A0E1B]/5 z-10 cursor-pointer"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="p-6 md:p-8 overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <p className="font-jost text-[10px] tracking-[0.26em] text-[#C9A24B] uppercase mb-1">
              AJ JEWELLERS • LUXURY ATELIER
            </p>
            <h2 className="font-cormorant text-3xl md:text-4xl text-[#4A0E1B] font-light">
              {mode === 'login' ? "Welcome Back" : "Join AJ Jewellers"}
            </h2>
          </div>

          {/* Contextual Action Message Badge (e.g. Checkout / Review / Visit) */}
          {authModalMessage && (
            <div className="mb-5 bg-[#C9A24B]/10 border border-[#C9A24B]/30 px-3.5 py-2.5 rounded-sm flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#C9A24B] shrink-0" />
              <p className="font-jost text-xs text-[#4A0E1B] leading-relaxed">
                {authModalMessage}
              </p>
            </div>
          )}

          {/* Mode Switch Tabs */}
          <div className="flex border-b border-[#4A0E1B]/15 mb-6">
            <button
              type="button"
              onClick={() => handleSwitchTab('login')}
              className={`flex-1 py-2.5 font-jost text-xs tracking-[0.16em] uppercase text-center transition-all cursor-pointer ${
                mode === 'login'
                  ? "text-[#4A0E1B] font-semibold border-b-2 border-[#C9A24B] -mb-[1px]"
                  : "text-[#7A6A5C] hover:text-[#4A0E1B]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('signup')}
              className={`flex-1 py-2.5 font-jost text-xs tracking-[0.16em] uppercase text-center transition-all cursor-pointer ${
                mode === 'signup'
                  ? "text-[#4A0E1B] font-semibold border-b-2 border-[#C9A24B] -mb-[1px]"
                  : "text-[#7A6A5C] hover:text-[#4A0E1B]"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Global Alert Messages */}
          {error && (
            <div className="mb-5 font-jost text-xs text-red-700 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-sm">
              {error}
            </div>
          )}
          {infoMessage && (
            <div className="mb-5 font-jost text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-sm">
              {infoMessage}
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-1.5 uppercase">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7A6A5C]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] pl-10 pr-4 py-2.5 font-jost text-sm text-[#4A0E1B] outline-none transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-1.5 uppercase">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7A6A5C]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] pl-10 pr-10 py-2.5 font-jost text-sm text-[#4A0E1B] outline-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6A5C] hover:text-[#4A0E1B] p-1"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 bg-[#3B0E17] text-[#F3E9D8] font-jost text-xs md:text-sm tracking-[0.16em] uppercase py-3.5 px-6 hover:bg-[#4A0E1B] transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
              >
                {submitting ? "Signing In..." : "Sign In"}
              </button>

              <div className="text-center mt-3">
                <p className="font-jost text-xs text-[#7A6A5C]">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('signup')}
                    className="text-[#4A0E1B] font-medium underline hover:text-[#C9A24B] cursor-pointer"
                  >
                    Create one here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* SIGN UP FORM (TWO STEPS) */}
          {mode === 'signup' && (
            <div>
              {!otpSent ? (
                /* Step 1: User Details */
                <form onSubmit={handleSendOtp} className="flex flex-col gap-3.5">
                  <div>
                    <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-1 uppercase">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#7A6A5C]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] pl-10 pr-4 py-2 font-jost text-sm text-[#4A0E1B] outline-none transition-colors"
                        placeholder="Ansh Gupta"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-1 uppercase">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#7A6A5C]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] pl-10 pr-4 py-2 font-jost text-sm text-[#4A0E1B] outline-none transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-1 uppercase">
                      Phone Number (10 digits)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#7A6A5C]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] pl-10 pr-4 py-2 font-jost text-sm text-[#4A0E1B] outline-none transition-colors"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-1 uppercase">
                      Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#7A6A5C]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] pl-10 pr-10 py-2 font-jost text-sm text-[#4A0E1B] outline-none transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6A5C] hover:text-[#4A0E1B] p-1"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-jost text-[11px] tracking-[0.12em] text-[#7A6A5C] mb-1 uppercase">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#7A6A5C]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white border border-[#4A0E1B]/20 focus:border-[#C9A24B] pl-10 pr-10 py-2 font-jost text-sm text-[#4A0E1B] outline-none transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6A5C] hover:text-[#4A0E1B] p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 bg-[#3B0E17] text-[#F3E9D8] font-jost text-xs md:text-sm tracking-[0.16em] uppercase py-3 px-6 hover:bg-[#4A0E1B] transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
                  >
                    {submitting ? "Sending Verification Code..." : "Send Verification OTP"}
                  </button>

                  <div className="text-center mt-2">
                    <p className="font-jost text-xs text-[#7A6A5C]">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => handleSwitchTab('login')}
                        className="text-[#4A0E1B] font-medium underline hover:text-[#C9A24B] cursor-pointer"
                      >
                        Sign in here
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* Step 2: OTP Verification */
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                  <div className="bg-white border border-[#C9A24B]/30 p-4 text-center rounded-sm">
                    <p className="font-jost text-xs text-[#4A0E1B]">
                      We sent a 6-digit verification code to
                    </p>
                    <p className="font-jost text-sm font-semibold text-[#C9A24B] mt-0.5">
                      {signupEmail}
                    </p>
                  </div>

                  <div>
                    <label className="block font-jost text-[11px] tracking-[0.14em] text-[#7A6A5C] mb-2 text-center uppercase">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-white border border-[#C9A24B] px-4 py-3.5 font-jost text-2xl text-center tracking-[0.45em] text-[#4A0E1B] outline-none transition-colors"
                      placeholder="000000"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || otp.length < 6}
                    className="bg-[#C9A24B] text-white font-jost text-xs md:text-sm tracking-[0.16em] uppercase py-3.5 px-6 hover:bg-[#b08d40] transition-colors disabled:opacity-60 cursor-pointer shadow-sm mt-1"
                  >
                    {submitting ? "Verifying..." : "Verify & Complete Registration"}
                  </button>

                  <div className="flex justify-between items-center text-xs font-jost pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setError(null);
                        setInfoMessage(null);
                      }}
                      className="text-[#7A6A5C] hover:text-[#4A0E1B] underline cursor-pointer"
                    >
                      ← Back to Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={submitting || otpCooldown > 0}
                      className="text-[#C9A24B] hover:text-[#4A0E1B] underline disabled:opacity-50 cursor-pointer"
                    >
                      {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend OTP"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
