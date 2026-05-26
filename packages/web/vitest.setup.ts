import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

// Set up environment variables for testing
process.env.VITE_API_BASE_URL = 'http://localhost:3000/api';

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
