import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export function useSyncState<T extends { id: string }>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
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
    });
    return () => unsubscribe();
  }, [collectionName]);

  const setSyncData = (action: T[] | ((prev: T[]) => T[])) => {
    setData((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      
      if (!initialized.current) return next;

      // Compute diff and push to firestore asynchronously
      const nextMap = new Map(next.map((item: any) => [item.id, item]));
      const prevMap = new Map(prev.map((item: any) => [item.id, item]));
      
      next.forEach((item: any) => {
        const prevItem = prevMap.get(item.id);
        if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
          // Strip undefined values which cause Firestore to crash synchronously
          const cleanItem = JSON.parse(JSON.stringify(item));
          // Perform side effect outside of React's render phase
          setTimeout(() => {
            setDoc(doc(db, collectionName, cleanItem.id), cleanItem).catch(console.error);
          }, 0);
        }
      });
      
      prev.forEach((item: any) => {
        if (!nextMap.has(item.id)) {
          setTimeout(() => {
            deleteDoc(doc(db, collectionName, item.id)).catch(console.error);
          }, 0);
        }
      });
      
      return next;
    });
  };

  return [data, setSyncData] as const;
}
