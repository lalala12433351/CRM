import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "witty-poetry-wq6d2",
  appId: "1:725308561687:web:ff895882c820676404bf52",
  apiKey: "AIzaSyB-JhzuRxCWvoobBuW88-MKfCm-aC2OOw8",
  authDomain: "witty-poetry-wq6d2.firebaseapp.com",
  storageBucket: "witty-poetry-wq6d2.firebasestorage.app",
  messagingSenderId: "725308561687"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-unifiedbusiness-cbcc480b-e9c4-49dd-a666-559ad5b9b957");
