import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from 'virtual:pwa-register';
import "./index.css";
import App from "./App";

// Register Service Worker for offline support
try {
  registerSW({ immediate: true });
} catch (e) {
  console.warn('SW registration skipped:', e);
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

