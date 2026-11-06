import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AuthLayout from "./components/admin/AuthLayout";
import Login from "./pages/admin/auth/Login";
import ForgotPassword from "./pages/admin/auth/ForgotPassword";
import ResetPassword from "./pages/admin/auth/ResetPassword";
import Dashboard from "./pages/admin/Dashboard";
import AdminLayout from "./components/admin/AdminLayout";
import OrganizationsIndex from "./pages/admin/Organization/Index";
import OrganizationForm from "./pages/admin/Organization/Form";



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Web home</div>} />
        <Route
          path="/admin/*"
          element={
            <AdminAuthProvider>
              <Routes>
                <Route element={<AuthLayout />}>
                  <Route path="login" element={<Login />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="reset-password" element={<ResetPassword />} />
                </Route>
                <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="organizations" element={<OrganizationsIndex />} />
                  <Route path="organizations/add" element={<OrganizationForm />} />
                  <Route path="organizations/edit/:id" element={<OrganizationForm />} />
                </Route>
                <Route path="*" element={<Navigate to="login" replace />} />
              </Routes>
            </AdminAuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}