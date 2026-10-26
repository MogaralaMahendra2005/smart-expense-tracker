
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCbbMa0vd7j3ohkGBoee9Q2cASJBFXo2I4",
  authDomain: "smart-expense-tracker-70fd5.firebaseapp.com",
  projectId: "smart-expense-tracker-70fd5",
  storageBucket: "smart-expense-tracker-70fd5.firebasestorage.app",
  messagingSenderId: "263168023054",
  appId: "1:263168023054:web:9b2394ac1bfc18e666fa5f",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
