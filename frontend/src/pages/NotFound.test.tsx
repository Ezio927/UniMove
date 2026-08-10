import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NotFound from './NotFound';

describe('NotFound', () => {
  it('returns the user to the home page', () => {
    render(
      <MemoryRouter initialEntries={['/missing']}>
        <Routes>
          <Route path="/" element={<h1>首页</h1>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('抱歉，您访问的页面不存在。')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /返回首页/ }));
    expect(screen.getByRole('heading', { name: '首页' })).toBeInTheDocument();
  });
});
