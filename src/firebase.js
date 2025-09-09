// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9Edv1SvittW_kd5bczY7pIO7G08JZNo4",
  authDomain: "student-attendance-database.firebaseapp.com",
  databaseURL: "https://student-attendance-database-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "student-attendance-database",
  storageBucket: "student-attendance-database.firebasestorage.app",
  messagingSenderId: "938128070238",
  appId: "1:938128070238:web:672620b0f75aad9199c6cf",
  measurementId: "G-CELM5P5RBM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Export
export { auth, db };
