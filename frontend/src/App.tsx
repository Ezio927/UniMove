import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { App as AntApp, ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { store } from './store';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ActivityList = lazy(() => import('./pages/ActivityList'));
const ActivityDetail = lazy(() => import('./pages/ActivityDetail'));
const CreateActivity = lazy(() => import('./pages/CreateActivity'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider locale={zhCN} theme={{
        token: {
          colorPrimary: '#1677ff',
          colorText: '#1f2937',
          colorTextSecondary: '#667085',
          colorBgLayout: '#f6f8fb',
          borderRadius: 10,
          borderRadiusLG: 14,
          fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif'
        },
        components: {
          Button: { controlHeightLG: 44, fontWeight: 600 },
          Card: { headerFontSize: 17 },
          Input: { controlHeightLG: 44 }
        }
      }}>
        <AntApp><Router>
          <Suspense fallback={<div className="app-loading"><Spin size="large" /></div>}>
          <Routes>
            {/* 认证页面不使用布局 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 使用布局的页面 */}
            <Route path="/*" element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/activities" element={<ActivityList />} />
                  <Route path="/activities/create" element={<ProtectedRoute><CreateActivity /></ProtectedRoute>} />
                  <Route path="/activities/:id" element={<ActivityDetail />} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            } />
          </Routes>
          </Suspense>
        </Router></AntApp>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
