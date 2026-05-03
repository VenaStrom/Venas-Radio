import { App } from "@/app/app";
import { createRoot } from "react-dom/client";
import React from "react";
import { PlayContextProvider } from "@/app/context/play-context/play-context.provider";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <React.StrictMode>
    <PlayContextProvider>
      <App />
    </PlayContextProvider>
  </React.StrictMode>,
);