import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './components/Common/context/AuthContext'
import { ToastProvider } from './components/Common/context/ToastContext' // <-- Import it

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider> {/* <-- Wrap your App in the ToastProvider */}
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)