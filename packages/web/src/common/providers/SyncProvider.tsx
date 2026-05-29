import { JSX, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Document, SyncStatus } from '@talent-finder/shared';

/**
 * Represents the state of the KB sync context.
 * Tracks whether a sync operation is needed.
 */
interface SyncContextValue {
  syncNeeded: boolean;
  setSyncNeeded: (value: boolean) => void;
  updateSyncState: (documents: Document[]) => void;
}

/**
 * Context for tracking KB sync state.
 * Provides methods to check if a sync is needed and to update sync state based on document changes.
 */
const SyncContext = createContext<SyncContextValue | undefined>(undefined);

const SYNC_CONTEXT_STORAGE_KEY = 'sync-context';

/**
 * Determines if sync is needed based on the current documents.
 * Sync is needed if any document is in PENDING status.
 *
 * @param documents - The list of current documents
 * @returns true if sync is needed, false otherwise
 */
const isSyncNeeded = (documents: Document[]): boolean => {
  return documents.some((doc) => doc.syncStatus === SyncStatus.PENDING);
};

/**
 * Loads sync context from localStorage.
 * Returns default value of `true` if localStorage is unavailable or corrupted.
 *
 * @returns boolean indicating if sync is needed
 */
const loadSyncContextFromStorage = (): boolean => {
  try {
    const stored = localStorage.getItem(SYNC_CONTEXT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return typeof parsed.syncNeeded === 'boolean' ? parsed.syncNeeded : true;
    }
  } catch {
    // If localStorage is unavailable or corrupted, fall through to default
  }
  // Default: assume sync is needed
  return true;
};

/**
 * Persists sync context to localStorage.
 * If localStorage is unavailable, silently fails.
 *
 * @param syncNeeded - Whether a sync operation is needed
 */
const saveSyncContextToStorage = (syncNeeded: boolean): void => {
  try {
    localStorage.setItem(SYNC_CONTEXT_STORAGE_KEY, JSON.stringify({ syncNeeded }));
  } catch {
    // If localStorage is unavailable, silently fail
  }
};

interface SyncProviderProps {
  children: React.ReactNode;
}

/**
 * SyncProvider component manages the global KB sync state.
 * Provides context for determining if a sync operation is needed based on document status.
 * Persists sync state to localStorage across sessions.
 *
 * @param children - Child components to provide context to
 * @returns JSX.Element
 */
export const SyncProvider = ({ children }: SyncProviderProps): JSX.Element => {
  const [syncNeeded, setSyncNeededState] = useState<boolean>(() => {
    return loadSyncContextFromStorage();
  });

  // Persist sync state to localStorage whenever it changes
  useEffect(() => {
    saveSyncContextToStorage(syncNeeded);
  }, [syncNeeded]);

  const setSyncNeeded = useCallback((value: boolean): void => {
    setSyncNeededState(value);
  }, []);

  const updateSyncState = useCallback(
    (documents: Document[]): void => {
      const needed = isSyncNeeded(documents);
      setSyncNeeded(needed);
    },
    [setSyncNeeded],
  );

  const value: SyncContextValue = {
    syncNeeded,
    setSyncNeeded,
    updateSyncState,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

/**
 * Hook to access the sync context.
 * Provides access to the global KB sync state.
 * Must be used within a SyncProvider.
 *
 * @returns SyncContextValue with syncNeeded state and setter methods
 * @throws Error if used outside of SyncProvider
 */
export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};
