import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged,  } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, query, where, orderBy, addDoc, onSnapshot,  getDocs , setDoc , doc, getDoc, updateDoc,arrayUnion, serverTimestamp , arrayRemove, deleteDoc, limit } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCb8Nr6eVeJj0x9h3l0G76vjTGfTIFWPg",
  authDomain: "chatapp-7ff6f.firebaseapp.com",
  projectId: "chatapp-7ff6f",
  storageBucket: "chatapp-7ff6f.firebasestorage.app",
  messagingSenderId: "75942646395",
  appId: "1:75942646395:web:b14ba6abc063dfe913c8de"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged, 
  db,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc ,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp ,
  orderBy,
  addDoc,
  onSnapshot,
  arrayRemove,
  deleteDoc,
  limit
}

