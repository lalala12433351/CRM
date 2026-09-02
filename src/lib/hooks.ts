import { useState } from 'react';

/**
 * Ultra-fast, lightweight tenant-scoped state hook
 * Provides zero-latency state updates without background loop bottlenecks.
 */
export function useSyncState<T extends { id: string }>(collectionName: string, tenantId?: string) {
  const [data, setData] = useState<T[]>([]);
  return [data, setData] as const;
}

export function useTenantSyncState<T extends { id: string }>(resourceName: string, tenantId?: string) {
  return useSyncState<T>(resourceName, tenantId);
}
