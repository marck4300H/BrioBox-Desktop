import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute, PrivateRoute } from './Guards';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/user/ProfilePage';
import LandingPage from '../pages/LandingPage';
import RegisterClientPage from '../pages/RegisterClientPage';
import ClientsPage from '../pages/ClientsPage';
import MembershipsPage from '../pages/MembershipsPage';
import ProductsPage from '../pages/ProductsPage';
import RegisterProductPage from '../pages/RegisterProductPage';
import CashRegisterPage from '../pages/CashRegisterPage';
import SuppliersPage from '../pages/SuppliersPage';
import RegisterSupplierPage from '../pages/RegisterSupplierPage';
import KioskScreen from '../screens/KiosScreen';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
        <Route path="/kiosk" element={<KioskScreen />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<LandingPage />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-client" element={<RegisterClientPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/memberships" element={<MembershipsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/register-product" element={<RegisterProductPage />} />
          <Route path="/cash" element={<CashRegisterPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/register-supplier" element={<RegisterSupplierPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}