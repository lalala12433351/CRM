import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { clearLocalStorageAuth } from './lib/auth';
import { installApiFetch } from './lib/platform';
import { initNativeShell, installKeyboardInsets } from './lib/nativeShell';
import './index.css';

installApiFetch();
initNativeShell();
installKeyboardInsets();

// Purge any stored login credentials from localStorage
clearLocalStorageAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
      <ToastContainer />
    </ToastProvider>
  </StrictMode>,
);
