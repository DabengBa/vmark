import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import "./utils/startupMenuSync";
import { initSecureStorage } from "./utils/secureStorage";
import App from "./App";
import "./styles/index.css";
// KaTeX CSS must load AFTER Tailwind (so preflight runs first).
// KaTeX fixes must load AFTER KaTeX CSS to restore border-widths reset by Tailwind.
import "katex/dist/katex.min.css";
import "./styles/katexFixes.css";

// Pre-load secure storage cache before React renders.
// Zustand stores hydrate synchronously — the cache must be populated first.
const SECURE_KEYS = ["vmark-ai-providers"];

async function bootstrap() {
  await initSecureStorage(SECURE_KEYS);

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

bootstrap();
