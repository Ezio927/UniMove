import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Space } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, LogoutOutlined, PlusOutlined, DownOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';
import './AppLayout.css';

const { Header, Content, Footer } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
        onClick: () => navigate('/profile'),
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  const menuItems = [
    {
      key: '/',
      label: <Link to="/">首页</Link>,
    },
    {
      key: '/activities',
      label: <Link to="/activities">活动列表</Link>,
    },
    {
      key: '/about',
      label: <Link to="/about">关于我们</Link>,
    },
  ];

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="app-header-content">
          <div className="app-logo">
            <Link to="/">
              <span className="logo-mark">U</span><span className="logo-text">UniMove</span>
            </Link>
          </div>
          
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            className="app-menu"
          />
          
          <div className="app-header-actions">
            {isAuthenticated && user?.role === 'admin' && (
              <Button icon={<PlusOutlined />} onClick={() => navigate('/activities/create')}>创建活动</Button>
            )}
            {isAuthenticated ? (
              <Dropdown
                menu={userMenu}
                placement="bottomRight"
                trigger={['click']}
                open={userMenuOpen}
                onOpenChange={setUserMenuOpen}
              >
                <Button
                  type="text"
                  className="user-button"
                  aria-label="打开用户菜单"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <Space>
                    <Avatar
                      size="small"
                      src={user?.avatar}
                      icon={!user?.avatar && <UserOutlined />}
                    />
                    <span className="username">{user?.username}</span>
                    <DownOutlined className="user-menu-indicator" aria-hidden="true" />
                  </Space>
                </Button>
              </Dropdown>
            ) : (
              <Space>
                <Button type="text" onClick={() => navigate('/login')}>
                  登录
                </Button>
                <Button type="primary" onClick={() => navigate('/register')}>
                  注册
                </Button>
              </Space>
            )}
          </div>
        </div>
      </Header>
      
      <Content className="app-content">
        <div className="app-content-wrapper">
          {children}
        </div>
      </Content>
      
      <Footer className="app-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} UniMove · 校园体育活动平台</p>
        </div>
      </Footer>
    </Layout>
  );
};

export default AppLayout;
