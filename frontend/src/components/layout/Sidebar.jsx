import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  AppstoreOutlined, 
  DashboardOutlined,
  ShoppingCartOutlined, 
  UserOutlined,
  UnorderedListOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Sider } = Layout;

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Xác định menu đang active
  let selectedKey = 'products';
  if (location.pathname.startsWith('/dashboard')) selectedKey = 'dashboard';
  if (location.pathname.startsWith('/categories')) selectedKey = 'categories';
  if (location.pathname.startsWith('/orders')) selectedKey = 'orders';
  if (location.pathname.startsWith('/accounts')) selectedKey = 'accounts';
  if (location.pathname.startsWith('/trash')) selectedKey = 'trash';
  if (location.pathname.startsWith('/customers')) selectedKey = 'customers';

  const items = [];

  // Chỉ Admin mới thấy Dashboard
  if (user?.role === 'admin') {
    items.push({
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    });
    items.push({
      key: 'customers',
      icon: <UserOutlined />,
      label: <Link to="/customers">Khách hàng</Link>,
    });
  }

  // Cả Admin và Staff đều thấy các mục này
  items.push(
    {
      key: 'products',
      icon: <AppstoreOutlined />,
      label: <Link to="/">Sản phẩm</Link>,
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/orders">Đơn hàng</Link>,
    }
  );

  if (user?.role === 'admin') {
    items.push({
      key: 'categories',
      icon: <UnorderedListOutlined />,
      label: <Link to="/categories">Danh mục</Link>,
    });
  }

  // Chỉ Admin mới thấy Quản lý tài khoản và Thùng rác
  if (user?.role === 'admin') {
    items.push(
      {
        key: 'trash',
        icon: <DeleteOutlined />,
        label: <Link to="/trash">Thùng rác</Link>,
      },
      {
        key: 'accounts',
        icon: <UserOutlined />,
        label: <Link to="/accounts">Tài khoản</Link>,
      }
    );
  }

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={collapsed} 
      theme="dark" 
      width={250}
      className="admin-sider"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div className="mx-4 mt-4 mb-2 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white font-extrabold tracking-wide flex items-center justify-center shadow-[0_18px_55px_rgba(34,211,238,0.18)] overflow-hidden whitespace-nowrap transition-all duration-300">
        {collapsed ? 'AP' : 'Admin Panel'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items}
        className="admin-menu"
      />
    </Sider>
  );
};

export default Sidebar;
