import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./assets/css/index.css";

import { AuthProvider } from "./app/providers/AuthProvider";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { SocketProvider } from "./app/providers/SocketProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
