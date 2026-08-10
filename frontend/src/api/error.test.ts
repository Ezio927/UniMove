import { describe, expect, it } from 'vitest';
import { ApiError, getErrorMessage } from './error';

describe('API errors', () => {
  it('preserves status and server details', () => {
    const error = new ApiError('请求失败', 422, { field: 'email' });
    expect(error).toMatchObject({ message: '请求失败', status: 422, details: { field: 'email' } });
  });

  it('provides a fallback for unknown failures', () => {
    expect(getErrorMessage('network failed', '网络异常')).toBe('网络异常');
  });
});
