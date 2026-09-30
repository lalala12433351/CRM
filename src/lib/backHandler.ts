import { useEffect, useLayoutEffect, useRef } from 'react';

interface BackEntry {
  run: () => void;
}

const stack: BackEntry[] = [];

/** Runs the most recently opened overlay's close handler. Returns false when nothing is open. */
export function dismissTopOverlay(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.run();
  return true;
}

/**
 * While `active`, the Android back button / gesture calls `onBack` instead of navigating.
 * Overlays opened later sit on top, so nested modals close innermost-first.
 */
export function useBackHandler(active: boolean, onBack: () => void): void {
  const onBackRef = useRef(onBack);
  useLayoutEffect(() => {
    onBackRef.current = onBack;
  });

  useEffect(() => {
    if (!active) return;
    const entry: BackEntry = { run: () => onBackRef.current() };
    stack.push(entry);
    return () => {
      const index = stack.indexOf(entry);
      if (index !== -1) stack.splice(index, 1);
    };
  }, [active]);
}
