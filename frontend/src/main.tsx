import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "sonner";
import { RoleProvider } from "./contexts/RoleContext";

createRoot(document.getElementById("root")!).render(
  <RoleProvider>
    <App />
    <Toaster position="top-right" />
  </RoleProvider>
);
  