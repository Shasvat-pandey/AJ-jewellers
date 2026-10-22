import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom'; // <-- NEW: Import createPortal
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* NEW: Use createPortal to teleport the UI directly to the body! */}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none">
          {toasts.map((toast) => (
            <div 
              key={toast.id} 
              className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-sm shadow-2xl transition-all duration-300 translate-y-0 opacity-100 ${
                toast.type === "success" 
                  ? "bg-[#FDFBF4] border-l-4 border-green-600 text-[#4A0E1B]" 
                  : "bg-[#3F0106] border-l-4 border-red-500 text-[#F3E9D8]"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle size={20} className="text-green-600 shrink-0" />
              ) : (
                <AlertTriangle size={20} className="text-red-400 shrink-0" />
              )}
              <span className="font-jost text-sm font-medium tracking-wide">{toast.message}</span>
              <button 
                onClick={() => removeToast(toast.id)} 
                className="ml-4 opacity-70 hover:opacity-100 cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>,
        document.body // <-- Attaches directly to the HTML body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}