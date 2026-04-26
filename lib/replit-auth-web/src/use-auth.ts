import { useState, useEffect, useCallback } from "react";
import type { AuthUser } from "@workspace/api-client-react";
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  type Auth,
} from "firebase/auth";

export type { AuthUser };

const firebaseConfig = {
  apiKey: "AIzaSyDfwkxrDu84aSavw7tc5yra62__T6ghbVw",
  authDomain: "gen-lang-client-0709280604.firebaseapp.com",
  projectId: "gen-lang-client-0709280604",
  storageBucket: "gen-lang-client-0709280604.firebasestorage.app",
  messagingSenderId: "1041373393186",
  appId: "1:1041373393186:web:b7f96702433c6d0651f57b",
  measurementId: "G-KEHV4YYDV7",
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

function getFirebaseAuth(): Auth {
  if (!app) app = initializeApp(firebaseConfig);
  if (!authInstance) authInstance = getAuth(app);
  return authInstance;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: AuthUser | null };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMe().then((u) => {
      if (!cancelled) {
        setUser(u);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const res = await fetch("/api/auth/firebase", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error(`Sign-in failed: ${res.status}`);
      const u = await fetchMe();
      setUser(u);
    } catch (err) {
      console.error("Google sign-in failed", err);
      alert("Sign-in failed. Please try again.");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fbSignOut(getFirebaseAuth());
    } catch {}
    await fetch("/api/auth/firebase/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
    window.location.href = "/";
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
