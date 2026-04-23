import React from 'react';
import { Layout, Button, Dropdown, Avatar, Tag } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Header: AntHeader } = Layout;

const Header = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else if (key === 'profile') {
      navigate('/profile');
    }
  };

  const items = [
    {
      key: 'profile',
      label: 'Hồ sơ',
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      danger: true,
      icon: <LogoutOutlined />,
    },
  ];

  return (
    <AntHeader className="flex items-center justify-between bg-slate-950/35 backdrop-blur-2xl px-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] border-b border-slate-700/30 z-10 sticky top-0 h-16 transition-all duration-300">
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        className="text-lg w-10 h-10 flex items-center justify-center text-slate-200 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-300"
      />
      
      <Dropdown menu={{ items, onClick: handleMenuClick }} placement="bottomRight" arrow={{ pointAtCenter: true }}>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1.5 rounded-full transition-all duration-300 border border-transparent hover:border-slate-700/40">
          <Avatar 
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
            size={38}
            className="ring-2 ring-white/10 shadow-sm transition-all duration-300"
          />
          <div className="flex flex-col items-start justify-center hidden sm:flex pr-2">
            <span className="text-[14px] font-bold text-slate-100 leading-none mb-1">
              {user?.name || 'Người dùng'}
            </span>
            <span className="text-[11px] text-cyan-300 font-bold uppercase tracking-wider leading-none">
              {user?.username || user?.role || 'User'}
            </span>
          </div>
        </div>
      </Dropdown>
    </AntHeader>
  );
};

export default Header;
