import { App } from "@/app/app";
import { createRoot } from "react-dom/client";
import React from "react";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);