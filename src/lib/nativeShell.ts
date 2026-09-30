import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { dismissTopOverlay } from './backHandler';
import { isNative, nativePlatform } from './platform';

export const DEEP_LINK_EVENT = 'pixbe:deeplink';

/** Native-only wiring: back button, status bar, splash, deep links. No-op on the web. */
export function initNativeShell(): void {
  if (!isNative) return;

  document.documentElement.classList.add('native-app');
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  if (nativePlatform === 'android') {
    StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
  }
  SplashScreen.hide().catch(() => {});

  // Open overlays close first, then view history unwinds, and at the root the app is
  // backgrounded (not killed) so returning to it keeps session and scroll state.
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (dismissTopOverlay()) return;
    if (canGoBack) window.history.back();
    else CapApp.minimizeApp();
  });

  CapApp.addListener('appUrlOpen', ({ url }) => {
    Browser.close().catch(() => {});
    window.dispatchEvent(new CustomEvent(DEEP_LINK_EVENT, { detail: { url } }));
  });

  // WebViews ignore window.open; send external links (wa.me, downloads, docs) to the system browser.
  const nativeOpen = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    const href = url ? String(url) : '';
    if (/^https?:\/\//i.test(href)) {
      Browser.open({ url: href }).catch(() => {});
      return null;
    }
    return nativeOpen(url, target, features);
  }) as typeof window.open;
}

const KEYBOARD_THRESHOLD_PX = 120;

/**
 * Publishes the on-screen keyboard as `--keyboard-inset` (px of layout viewport it covers)
 * and toggles `html.keyboard-open`. iOS overlays the keyboard (visual viewport shrinks);
 * Android with adjustResize shrinks the layout viewport instead, so both are checked.
 */
export function installKeyboardInsets(): void {
  const vv = window.visualViewport;
  if (!vv) return;

  const root = document.documentElement;
  let baseWidth = window.innerWidth;
  let baseHeight = window.innerHeight;
  let nativeKeyboardOpen = false;
  let frame = 0;

  const update = () => {
    frame = 0;
    if (window.innerWidth !== baseWidth) {
      baseWidth = window.innerWidth;
      baseHeight = window.innerHeight;
    }
    baseHeight = Math.max(baseHeight, window.innerHeight);

    const overlay = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    const resized = baseHeight - window.innerHeight;

    root.style.setProperty('--keyboard-inset', `${overlay}px`);
    root.classList.toggle(
      'keyboard-open',
      nativeKeyboardOpen || overlay > KEYBOARD_THRESHOLD_PX || resized > KEYBOARD_THRESHOLD_PX,
    );
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  vv.addEventListener('resize', schedule);
  vv.addEventListener('scroll', schedule);
  window.addEventListener('resize', schedule);

  // Native "will" events fire as the keyboard starts animating, ahead of any viewport resize,
  // so keyboard-aware UI (bottom nav, footers) moves with the keyboard instead of after it.
  if (isNative) {
    Keyboard.addListener('keyboardWillShow', () => {
      nativeKeyboardOpen = true;
      update();
    }).catch(() => {});
    Keyboard.addListener('keyboardWillHide', () => {
      nativeKeyboardOpen = false;
      update();
    }).catch(() => {});
    Keyboard.addListener('keyboardDidShow', () => {
      const field = document.activeElement;
      if (field instanceof HTMLElement && field.matches('input, textarea, [contenteditable]')) {
        field.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }).catch(() => {});
  }

  update();
}

/** Open an external URL (OAuth, wa.me, docs) in the system browser on native, new tab on web. */
export async function openExternal(url: string): Promise<void> {
  if (isNative) {
    await Browser.open({ url });
    return;
  }
  window.open(url, '_blank', 'noopener');
}
