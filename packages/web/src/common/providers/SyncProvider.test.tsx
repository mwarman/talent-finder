import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { SyncStatus, Document } from '@talent-finder/shared';

import { SyncProvider, useSyncContext } from './SyncProvider';

describe('SyncProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should provide sync context', () => {
      // Arrange
      const wrapper = ({ children }: { children: React.ReactNode }) => <SyncProvider>{children}</SyncProvider>;

      // Act
      const { result } = renderHook(() => useSyncContext(), { wrapper });

      // Assert
      expect(result.current).toBeDefined();
      expect(result.current.syncNeeded).toBeDefined();
      expect(result.current.setSyncNeeded).toBeDefined();
      expect(result.current.updateSyncState).toBeDefined();
    });

    it('should initialize with default values (syncNeeded: true)', () => {
      // Arrange
      const wrapper = ({ children }: { children: React.ReactNode }) => <SyncProvider>{children}</SyncProvider>;

      // Act
      const { result } = renderHook(() => useSyncContext(), { wrapper });

      // Assert
      expect(result.current.syncNeeded).toBe(true);
    });

    it('should allow updating syncNeeded', () => {
      // Arrange
      const wrapper = ({ children }: { children: React.ReactNode }) => <SyncProvider>{children}</SyncProvider>;

      const { result } = renderHook(() => useSyncContext(), { wrapper });

      // Act
      act(() => {
        result.current.setSyncNeeded(false);
      });

      // Assert
      expect(result.current.syncNeeded).toBe(false);
    });

    it('should persist state to localStorage', () => {
      // Arrange
      const wrapper = ({ children }: { children: React.ReactNode }) => <SyncProvider>{children}</SyncProvider>;

      const { result } = renderHook(() => useSyncContext(), { wrapper });

      // Act
      act(() => {
        result.current.setSyncNeeded(false);
      });

      // Assert
      const stored = localStorage.getItem('sync-context');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.syncNeeded).toBe(false);
    });

    it('should restore state from localStorage on mount', () => {
      // Arrange
      localStorage.setItem('sync-context', JSON.stringify({ syncNeeded: false }));

      const wrapper = ({ children }: { children: React.ReactNode }) => <SyncProvider>{children}</SyncProvider>;

      // Act
      const { result } = renderHook(() => useSyncContext(), { wrapper });

      // Assert
      expect(result.current.syncNeeded).toBe(false);
    });

    it('should update syncNeeded when documents have pending status', () => {
      // Arrange
      const wrapper = ({ children }: { children: React.ReactNode }) => <SyncProvider>{children}</SyncProvider>;

      const { result } = renderHook(() => useSyncContext(), { wrapper });

      const documents: Document[] = [
        {
          documentId: '1',
          filename: 'test.pdf',
          uploadedAt: '2026-05-27T10:00:00Z',
          contentType: 'application/pdf',
          sizeBytes: 1024,
          syncStatus: SyncStatus.PENDING,
        },
      ];

      // Act
      act(() => {
        result.current.updateSyncState(documents);
      });

      // Assert
      expect(result.current.syncNeeded).toBe(true);
    });

    it('should update syncNeeded to false when no pending documents', () => {
      // Arrange
      const wrapper = ({ children }: { children: React.ReactNode }) => <SyncProvider>{children}</SyncProvider>;

      const { result } = renderHook(() => useSyncContext(), { wrapper });

      const documents: Document[] = [
        {
          documentId: '1',
          filename: 'test.pdf',
          uploadedAt: '2026-05-27T10:00:00Z',
          contentType: 'application/pdf',
          sizeBytes: 1024,
          syncStatus: SyncStatus.COMPLETED,
        },
      ];

      // Act
      act(() => {
        result.current.setSyncNeeded(true);
        result.current.updateSyncState(documents);
      });

      // Assert
      expect(result.current.syncNeeded).toBe(false);
    });

    it('should render children', () => {
      // Arrange & Act
      render(
        <SyncProvider>
          <div data-testid="test-child">Test Content</div>
        </SyncProvider>,
      );

      // Assert
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should default to syncNeeded: true if localStorage is corrupted', () => {
      // Arrange
      localStorage.setItem('sync-context', 'corrupted-json');

      const wrapper = ({ children }: { children: React.ReactNode }) => <SyncProvider>{children}</SyncProvider>;

      // Act
      const { result } = renderHook(() => useSyncContext(), { wrapper });

      // Assert
      expect(result.current.syncNeeded).toBe(true);
    });

    it('should throw error if useSyncContext is called outside SyncProvider', () => {
      // Arrange & Act & Assert
      expect(() => {
        renderHook(() => useSyncContext());
      }).toThrow('useSyncContext must be used within a SyncProvider');
    });

    it('should handle empty documents array', () => {
      // Arrange
      const wrapper = ({ children }: { children: React.ReactNode }) => <SyncProvider>{children}</SyncProvider>;

      const { result } = renderHook(() => useSyncContext(), { wrapper });

      const documents: Document[] = [];

      // Act
      act(() => {
        result.current.setSyncNeeded(true);
        result.current.updateSyncState(documents);
      });

      // Assert
      expect(result.current.syncNeeded).toBe(false);
    });

    it('should maintain syncNeeded: true when setting via setSyncNeeded', () => {
      // Arrange
      const wrapper = ({ children }: { children: React.ReactNode }) => <SyncProvider>{children}</SyncProvider>;

      const { result } = renderHook(() => useSyncContext(), { wrapper });

      // Act
      act(() => {
        result.current.setSyncNeeded(true);
      });

      // Assert
      expect(result.current.syncNeeded).toBe(true);
    });
  });
});
