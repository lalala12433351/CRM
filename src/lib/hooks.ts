import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export function useSyncState<T extends { id: string }>(collectionName: string, tenantId?: string) {
  const [data, setData] = useState<T[]>([]);
  const initialized = useRef(false);

  const activeTenantId = tenantId || 'default_tenant';
  const getCollectionRef = () => {
    return collection(db, 'tenants', activeTenantId, collectionName);
  };

  useEffect(() => {
    const colRef = getCollectionRef();
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as T);
      });
      // Simple sort by timestamp if available, else id
      items.sort((a: any, b: any) => {
        if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (a.timestamp && b.timestamp) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return b.id.localeCompare(a.id);
      });
      
      setData(items);
      initialized.current = true;
    }, (error) => {
      console.warn(`Firestore sync notice for ${collectionName} (${activeTenantId}):`, error.message);
    });
    return () => unsubscribe();
  }, [collectionName, activeTenantId]);

  const setSyncData = (action: T[] | ((prev: T[]) => T[])) => {
    setData((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      
      // Compute diff and push to firestore asynchronously
      const nextMap = new Map(next.map((item: any) => [item.id, item]));
      const prevMap = new Map(prev.map((item: any) => [item.id, item]));
      
      next.forEach((item: any) => {
        const prevItem = prevMap.get(item.id);
        if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
          // Strip undefined values which cause Firestore to crash synchronously
          const cleanItem = JSON.parse(JSON.stringify(item));
          // Tag item with tenantId for safety
          cleanItem.tenantId = activeTenantId;
          // Perform side effect outside of React's render phase
          setTimeout(() => {
            setDoc(doc(db, 'tenants', activeTenantId, collectionName, cleanItem.id), cleanItem).catch(() => {});
          }, 0);
        }
      });
      
      prev.forEach((item: any) => {
        if (!nextMap.has(item.id)) {
          setTimeout(() => {
            deleteDoc(doc(db, 'tenants', activeTenantId, collectionName, item.id)).catch(() => {});
          }, 0);
        }
      });
      
      return next;
    });
  };

  return [data, setSyncData] as const;
}

export function useTenantSyncState<T extends { id: string }>(resourceName: string, tenantId?: string) {
  return useSyncState<T>(resourceName, tenantId);
}
