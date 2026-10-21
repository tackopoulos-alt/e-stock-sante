import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "./index.css"
import App from "./App"
import { AuthProvider } from "@/context/AuthContext"
import { DataProvider } from "@/context/DataContext"
import { Toaster } from "@/components/ui/sonner"
import "@/lib/api" // TEMPORAIRE (étape F1) : active __api dans la console pendant le développement. Retiré à l'étape F2.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  </StrictMode>,
)