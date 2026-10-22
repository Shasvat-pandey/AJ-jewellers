import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY, getAdminToken } from "../../utils/api";

interface AdminRouteProps {
  children?: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const adminToken = getAdminToken();
    const storedAdmin = localStorage.getItem(ADMIN_USER_KEY);
    
    if (adminToken && storedAdmin) {
      try {
        const parsed = JSON.parse(storedAdmin);
        if (parsed.role === "admin") {
          setIsAuthorized(true);
          setIsVerifying(false);
          return;
        }
      } catch {
        // ignore JSON parse error
      }
    }

    // Also fallback check if customer storage accidentally held an admin session
    const legacyToken = localStorage.getItem("aj_jewellers_token");
    const legacyUser = localStorage.getItem("aj_jewellers_user");
    if (legacyToken && legacyUser) {
      try {
        const parsed = JSON.parse(legacyUser);
        if (parsed.role === "admin") {
          // Promote into dedicated admin storage
          localStorage.setItem(ADMIN_TOKEN_KEY, legacyToken);
          localStorage.setItem(ADMIN_USER_KEY, legacyUser);
          setIsAuthorized(true);
          setIsVerifying(false);
          return;
        }
      } catch {
        // ignore
      }
    }

    setIsAuthorized(false);
    setIsVerifying(false);
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#FDFBF4] flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="text-[#C9A24B] animate-spin" />
        <p className="font-jost text-xs uppercase tracking-widest text-[#7A6A5C]">
          Verifying administrative authorization...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/admin-loginxyz" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
