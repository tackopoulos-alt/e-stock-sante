import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "./index.css"
import App from "./App"
import { AuthProvider } from "@/context/AuthContext"
import { AccountProvider } from "@/context/AccountContext"
import { DataProvider } from "@/context/DataContext"
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AccountProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AccountProvider>
      </AuthProvider>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  </StrictMode>,
)