import { Navigate, Route, Routes } from "react-router-dom"
import AppLayout from "@/components/layout/AppLayout"
import PublicOnly from "@/components/layout/PublicOnly"
import RequireAuth from "@/components/layout/RequireAuth"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import MotDePasseOublie from "@/pages/MotDePasseOublie"
import Dashboard from "@/pages/Dashboard"
import Medicaments from "@/pages/Medicaments"
import Stocks from "@/pages/Stocks"
import Alertes from "@/pages/Alertes"
import Historique from "@/pages/Historique"
import Utilisateurs from "@/pages/Utilisateurs"
import Profil from "@/pages/Profil"

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/medicaments" element={<Medicaments />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/alertes" element={<Alertes />} />
          <Route path="/historique" element={<Historique />} />
          <Route path="/utilisateurs" element={<Utilisateurs />} />
          <Route path="/profil" element={<Profil />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}