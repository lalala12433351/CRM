/// <reference types="@capacitor/keyboard" />
import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'in.pixbe.crm',
  appName: 'Pixbe CRM',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#4f46e5',
      showSpinner: false,
    },
    // iOS: shrink the whole WebView so the many `fixed inset-0` modals re-centre above the keyboard.
    // Android: Capacitor's SystemBars already pads the window by the IME inset under edge-to-edge,
    // so resizeOnFullScreen must stay off or the WebView is shrunk twice.
    Keyboard: {
      resize: KeyboardResize.Native,
      style: KeyboardStyle.Light,
      resizeOnFullScreen: false,
    },
  },
};

export default config;
