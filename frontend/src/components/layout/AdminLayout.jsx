import React, { useEffect, useState } from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;
const { darkAlgorithm } = theme;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.body.classList.add('dark-minimal-body');
    return () => {
      document.body.classList.remove('dark-minimal-body');
    };
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: darkAlgorithm,
        token: {
          colorPrimary: '#a78bfa',
          colorInfo: '#22d3ee',
          colorLink: '#22d3ee',
          colorBgLayout: '#070a12',
          colorBgContainer: '#0b1220',
          colorBgElevated: '#0b1220',
          colorBorder: 'rgba(148, 163, 184, 0.16)',
          colorText: 'rgba(241, 245, 249, 0.92)',
          colorTextSecondary: 'rgba(226, 232, 240, 0.72)',
          borderRadius: 14,
          boxShadow: '0 18px 70px rgba(0, 0, 0, 0.35)',
        },
        components: {
          Card: { borderRadiusLG: 18 },
          Modal: { borderRadiusLG: 18 },
        },
      }}
    >
      <Layout className="admin-shell admin-dark min-h-screen has-sider bg-[#070a12] text-slate-100">
        <Sidebar collapsed={collapsed} />
        <Layout
          className="min-h-screen bg-[#070a12] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ marginLeft: collapsed ? 80 : 250 }}
        >
          <Header collapsed={collapsed} setCollapsed={setCollapsed} />
          <Content className="m-6 p-8 min-h-[280px] bg-slate-950/15 backdrop-blur-2xl rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.5)] border border-slate-700/25 overflow-hidden relative isolate before:content-[''] before:absolute before:-top-48 before:-left-48 before:h-[34rem] before:w-[34rem] before:bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.14),transparent_60%)] before:blur-2xl after:content-[''] after:absolute after:-bottom-56 after:-right-56 after:h-[36rem] after:w-[36rem] after:bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1),transparent_62%)] after:blur-2xl">
            <div className="relative z-10">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AdminLayout;
