import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDfwkxrDu84aSavw7tc5yra62__T6ghbVw",
  authDomain: "gen-lang-client-0709280604.firebaseapp.com",
  projectId: "gen-lang-client-0709280604",
  storageBucket: "gen-lang-client-0709280604.firebasestorage.app",
  messagingSenderId: "1041373393186",
  appId: "1:1041373393186:web:b7f96702433c6d0651f57b",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });