import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import authReducer from '../store/authSlice';
import AppLayout from './AppLayout';

const user = {
  id: 'user-id',
  username: '测试用户',
  email: 'user@example.com',
  role: 'user' as const,
  createdAt: '2026-08-11T00:00:00.000Z',
  updatedAt: '2026-08-11T00:00:00.000Z',
};

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>;

const renderAuthenticatedLayout = () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify(user));
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user, token: 'test-token', loading: false, isAuthenticated: true },
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/activities']}>
        <AppLayout><LocationProbe /></AppLayout>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AppLayout user menu', () => {
  it('opens the existing profile and logout actions on click', async () => {
    renderAuthenticatedLayout();
    fireEvent.click(screen.getByRole('button', { name: '打开用户菜单' }));
    expect(document.querySelector('.ant-dropdown')).not.toHaveClass('ant-dropdown-hidden');
    expect(await screen.findByText('个人中心')).toBeInTheDocument();
    expect(screen.getByText('退出登录')).toBeInTheDocument();
  });

  it('logs out and returns to the home route', async () => {
    const store = renderAuthenticatedLayout();
    fireEvent.click(screen.getByRole('button', { name: '打开用户菜单' }));
    expect(document.querySelector('.ant-dropdown')).not.toHaveClass('ant-dropdown-hidden');
    fireEvent.click(await screen.findByText('退出登录'));
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });

  it('keeps login and registration actions for guests', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: { user: null, token: null, loading: false, isAuthenticated: false },
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter><AppLayout><div>guest</div></AppLayout></MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /注\s?册/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '打开用户菜单' })).not.toBeInTheDocument();
  });
});
