import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, Firestore, query, orderBy } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, Auth, onAuthStateChanged, User } from 'firebase/auth';
import { FirebaseConfig, Meal } from '../types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const initFirebase = (config: FirebaseConfig) => {
  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);
    return true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Reset if failed so we don't have partial bad state
    app = null;
    db = null;
    auth = null;
    return false;
  }
};

export const isFirebaseInitialized = () => !!db && !!auth;

export const signInWithGoogle = async () => {
  if (!auth) {
      // Last ditch effort: check if app exists but auth wasn't grabbed?
      if (getApps().length > 0) {
          try {
              auth = getAuth(getApp());
          } catch (e) {
              throw new Error("Firebase Auth not initialized and could not be recovered.");
          }
      } else {
         throw new Error("Firebase Auth not initialized");
      }
  }
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signOut = async () => {
  if (!auth) return;
  return firebaseSignOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

export const fetchMealsFromCloud = async (): Promise<Meal[]> => {
  if (!db || !auth?.currentUser) throw new Error("Firebase not initialized or user not logged in");
  
  const userId = auth.currentUser.uid;
  // Store meals under users/{userId}/meals to secure data per user
  const q = query(collection(db, 'users', userId, 'meals'), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as Meal);
};

export const saveMealToCloud = async (meal: Meal): Promise<void> => {
  if (!db || !auth?.currentUser) throw new Error("Firebase not initialized or user not logged in");
  const userId = auth.currentUser.uid;
  await setDoc(doc(db, 'users', userId, 'meals', meal.id), meal);
};

export const deleteMealFromCloud = async (id: string): Promise<void> => {
  if (!db || !auth?.currentUser) throw new Error("Firebase not initialized or user not logged in");
  const userId = auth.currentUser.uid;
  await deleteDoc(doc(db, 'users', userId, 'meals', id));
};