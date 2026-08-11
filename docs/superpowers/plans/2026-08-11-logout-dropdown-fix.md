# Logout Dropdown Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the authenticated header menu visibly expandable and reliably open on click so users can reach profile and logout.

**Architecture:** Keep `AppLayout` as the single production owner of the user menu and reuse its existing logout reducer/navigation flow. Add a focused component test around the Redux/router boundary, then make the Ant Design Dropdown trigger explicit and add a visual affordance.

**Tech Stack:** React 19, TypeScript, Ant Design 5, Redux Toolkit, React Router, Vitest, Testing Library

## Global Constraints

- Do not change backend, API, database, authorization, or deployment configuration.
- Keep the compact avatar-and-username menu; do not add a second permanent logout action.
- Open the existing user menu with an explicit click trigger.
- Add a downward indicator that communicates expandability.
- Preserve the existing profile and logout behavior.
- Follow TDD and do not weaken assertions to accommodate the current defect.

---

### Task 1: Make the authenticated user menu click-expandable

**Files:**
- Create: `frontend/src/components/AppLayout.test.tsx`
- Modify: `frontend/src/components/AppLayout.tsx`
- Modify: `frontend/src/components/AppLayout.css`

**Interfaces:**
- Consumes: `logout()` from `frontend/src/store/authSlice.ts`, `useNavigate`, `useLocation`, and Ant Design `Dropdown`.
- Produces: an accessible button named `打开用户菜单` whose click reveals the existing `个人中心` and `退出登录` menu items.

- [ ] **Step 1: Write the failing component tests**

Create `frontend/src/components/AppLayout.test.tsx` with an authenticated Redux store, `MemoryRouter`, and a location probe. The core assertions are:

```tsx
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
  updatedAt: '2026-08-11T00:00:00.000Z'
};

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>;

const renderAuthenticatedLayout = () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify(user));
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user, token: 'test-token', loading: false, isAuthenticated: true }
    }
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/activities']}>
        <AppLayout><LocationProbe /></AppLayout>
      </MemoryRouter>
    </Provider>
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
    expect(await screen.findByText('个人中心')).toBeVisible();
    expect(screen.getByText('退出登录')).toBeVisible();
  });

  it('logs out and returns to the home route', async () => {
    const store = renderAuthenticatedLayout();
    fireEvent.click(screen.getByRole('button', { name: '打开用户菜单' }));
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
        auth: { user: null, token: null, loading: false, isAuthenticated: false }
      }
    });
    render(
      <Provider store={store}>
        <MemoryRouter><AppLayout><div>guest</div></AppLayout></MemoryRouter>
      </Provider>
    );
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '注册' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '打开用户菜单' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
npm test --prefix frontend -- src/components/AppLayout.test.tsx
```

Expected: FAIL because the current trigger has no `打开用户菜单` accessible name and clicking is not configured to open the Dropdown.

- [ ] **Step 3: Implement the minimal explicit trigger**

In `AppLayout.tsx`, import `DownOutlined`, configure the Dropdown with `trigger={['click']}`, add `aria-label="打开用户菜单"` and `aria-haspopup="menu"` to the existing button, and render:

```tsx
<DownOutlined className="user-menu-indicator" aria-hidden="true" />
```

after the username. In `AppLayout.css`, give `.user-menu-indicator` a small muted style without changing layout ownership:

```css
.user-menu-indicator { color: #98a2b3; font-size: 11px; }
```

- [ ] **Step 4: Run the focused test to verify GREEN**

Run:

```bash
npm test --prefix frontend -- src/components/AppLayout.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Run the quality gates**

Run:

```bash
npm run lint --prefix frontend
npm run type-check --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm run verify
git diff --check
```

Expected: all commands exit 0; the known jsdom pseudo-element notices may remain unchanged.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/AppLayout.test.tsx frontend/src/components/AppLayout.tsx frontend/src/components/AppLayout.css
git commit -m "fix: make user menu click-expandable"
```
