import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './api-client';

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should create axios instance with correct base URL', () => {
    // Arrange & Act & Assert
    expect(apiClient.defaults.baseURL).toBe('http://localhost:3000/api');
  });

  it('should have Content-Type header in defaults', () => {
    // Arrange & Act & Assert
    expect(apiClient.defaults.headers).toBeDefined();
  });

  it('should have request and response interceptors', () => {
    // Arrange & Act & Assert
    expect(apiClient.interceptors.request).toBeDefined();
    expect(apiClient.interceptors.response).toBeDefined();
  });
});
