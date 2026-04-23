import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import AdminLayout from '../components/layout/AdminLayout';

// Pages
import ProductList from '../pages/products/ProductList';
import ProductAdd from '../pages/products/ProductAdd';
import ProductEdit from '../pages/products/ProductEdit';
import Dashboard from '../pages/admin/Dashboard';
import AccountManagement from '../pages/admin/AccountManagement';
import CustomerManagement from '../pages/admin/CustomerManagement';
import OrderManagement from '../pages/staff/OrderManagement';
import CategoryManagement from '../pages/admin/CategoryManagement';
import TrashPage from '../pages/products/TrashPage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Profile from '../pages/auth/Profile';

// Middleware bảo vệ route
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Đang tải...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />; // Hoặc trang 403
  }

  return children;
};

// Định nghĩa các luồng URL trên màn hình
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
        {/* Route chung */}
        <Route path="/" element={<ProductList />} />
        <Route path="/orders" element={<OrderManagement />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/categories" element={
          <PrivateRoute allowedRoles={['admin']}><CategoryManagement /></PrivateRoute>
        } />
        {/* Route chỉ Admin */}
        <Route path="/trash" element={
          <PrivateRoute allowedRoles={['admin']}><TrashPage /></PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute allowedRoles={['admin']}><Dashboard /></PrivateRoute>
        } />
        <Route path="/customers" element={
          <PrivateRoute allowedRoles={['admin']}><CustomerManagement /></PrivateRoute>
        } />
        <Route path="/accounts" element={
          <PrivateRoute allowedRoles={['admin']}><AccountManagement /></PrivateRoute>
        } />
        <Route path="/add" element={
          <PrivateRoute allowedRoles={['admin']}><ProductAdd /></PrivateRoute>
        } />
        <Route path="/edit/:id" element={
          <PrivateRoute allowedRoles={['admin']}><ProductEdit /></PrivateRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
