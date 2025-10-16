import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCT-lTRW7S1HuXK754BirAXkh9MklnQo34",
  authDomain: "timepass-baa8b.firebaseapp.com",
  projectId: "timepass-baa8b",
  storageBucket: "timepass-baa8b.firebasestorage.app",
  messagingSenderId: "473933712111",
  appId: "1:473933712111:web:bcbd738616a9c40639e91a",
  measurementId: "G-9C6QWVEDMF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
