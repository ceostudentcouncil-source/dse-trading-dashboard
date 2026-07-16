import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs, onSnapshot, query, orderBy } from "firebase/firestore";

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

export const fsDelete = async (path) => {
  try {
    await deleteDoc(doc(db, ...path.split("/")));
    return true;
  } catch (e) {
    console.log("fsDelete error:", e);
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

// Real-time listener for a whole collection — calls `cb` with the
// current array of docs immediately, then again on every change.
// Returns an unsubscribe function (call it in a useEffect cleanup).
// Used for broadcasts and chat, where users need to see updates
// live without refreshing.
export const fsListen = (collPath, cb, orderByField) => {
  try {
    const ref = orderByField
      ? query(collection(db, collPath), orderBy(orderByField, "desc"))
      : collection(db, collPath);
    return onSnapshot(ref, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cb(docs);
    }, (e) => {
      console.log("fsListen error:", e);
      cb([]);
    });
  } catch (e) {
    console.log("fsListen setup error:", e);
    return () => {};
  }
};

// Real-time listener for a SINGLE document — calls `cb` with the
// current data (or null if it doesn't exist) immediately, then again
// on every change. Used for settings/chat, where multiple admins or
// tabs need to see mode changes live without a full collection scan.
export const fsListenDoc = (path, cb) => {
  try {
    return onSnapshot(doc(db, ...path.split("/")), (snap) => {
      cb(snap.exists() ? snap.data() : null);
    }, (e) => {
      console.log("fsListenDoc error:", e);
      cb(null);
    });
  } catch (e) {
    console.log("fsListenDoc setup error:", e);
    return () => {};
  }
};
