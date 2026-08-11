import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/index.css";
import { registerServiceWorker } from "@/lib/pwa";

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
