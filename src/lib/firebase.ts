import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCsZhHMY1PqQRgTDwqMlMHqItovknrBhow",
  authDomain: "crmnew-8a435.firebaseapp.com",
  projectId: "crmnew-8a435",
  storageBucket: "crmnew-8a435.firebasestorage.app",
  messagingSenderId: "1001840805334",
  appId: "1:1001840805334:web:71971264848f1f66b71077",
  measurementId: "G-DCP7CQ3H4L"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}
