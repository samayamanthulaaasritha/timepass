import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ?? "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID ?? ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const deleteStory = async (storyId: string) => {
  try {
    await deleteDoc(doc(db, "stories", storyId));
  } catch (error) {
    console.error("Error deleting story:", error);
    throw error;
  }
};

export const deletePost = async (postId: string) => {
  try {
    await deleteDoc(doc(db, "posts", postId));
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};

export const deleteReel = async (reelId: string) => {
  try {
    await deleteDoc(doc(db, "reels", reelId));
  } catch (error) {
    console.error("Error deleting reel:", error);
    throw error;
  }
};