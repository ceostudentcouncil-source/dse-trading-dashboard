import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

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
const googleProvider = new GoogleAuthProvider();

export const fbSignIn = () => signInWithPopup(auth, googleProvider);
export const fbSignOut = () => signOut(auth);
export const onAuth = (cb) => onAuthStateChanged(auth, cb);

// ── Firestore Helpers ─────────────────────────────────────────
export const fsGet = async (path) => {
  try {
    const s = await getDoc(doc(db, ...path.split("/")));
    return s.exists() ? s.data() : null;
  } catch (e) {
    console.log("fsGet error:", e);
    return null;
  }
};

export const fsSet = async (path, data, merge = true) => {
  try {
    await setDoc(doc(db, ...path.split("/")), data, { merge });
    return true;
  } catch (e) {
    console.log("fsSet error:", e);
    return false;
  }
};

export const fsGetAll = async (collPath) => {
  try {
    const snap = await getDocs(collection(db, collPath));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.log("fsGetAll error:", e);
    return [];
  }
};
