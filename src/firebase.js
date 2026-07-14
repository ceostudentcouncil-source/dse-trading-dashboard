import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCfWlWpPOW5igAZjRaLnWHHa7UcAFFnWcE",
  authDomain: "dse-trading-dashboard.firebaseapp.com",
  projectId: "dse-trading-dashboard",
  storageBucket: "dse-trading-dashboard.firebasestorage.app",
  messagingSenderId: "1373992881",
  appId: "1:1373992881:web:540e6331dd4cade8076f90"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOutUser = () => signOut(auth);
export const onAuth = (cb) => onAuthStateChanged(auth, cb);

export const getUserData = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid, "appdata", "main"));
  return snap.exists() ? snap.data() : null;
};

export const saveUserData = async (uid, data) => {
  await setDoc(doc(db, "users", uid, "appdata", "main"),
    { ...data, updatedAt: new Date().toISOString() },
    { merge: true }
  );
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

export const saveUserProfile = async (uid, data) => {
  await setDoc(doc(db, "users", uid), data, { merge: true });
};
