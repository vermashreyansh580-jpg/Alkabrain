import { useState, useEffect, useCallback } from "react";
import {
  setAuthTokenGetter,
  type AuthUser,
} from "@workspace/api-client-react";
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

const SID_STORAGE_KEY = "alkabrain.sid";

function getApiBase(): string {
  const env = (import.meta as { env?: Record<string, unknown> }).env ?? {};
  const raw = env["VITE_API_BASE_URL"];
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\/+$/, "");
}

function buildApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${p}`;
}

function readStoredSid(): string | null {
  try {
    return globalThis.localStorage?.getItem(SID_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeStoredSid(sid: string | null): void {
  try {
    if (!globalThis.localStorage) return;
    if (sid) globalThis.localStorage.setItem(SID_STORAGE_KEY, sid);
    else globalThis.localStorage.removeItem(SID_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

// Wire generated API client to send the stored sid as a bearer token.
// This is the cross-origin-safe replacement for the session cookie.
setAuthTokenGetter(() => readStoredSid());

function authHeaders(): Record<string, string> {
  const sid = readStoredSid();
  return sid ? { Authorization: `Bearer ${sid}` } : {};
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
    const res = await fetch(buildApiUrl("/api/auth/user"), {
      credentials: "include",
      headers: { ...authHeaders() },
    });
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
      const res = await fetch(buildApiUrl("/api/auth/firebase"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error(`Sign-in failed: ${res.status}`);
      const data = (await res.json()) as {
        user: AuthUser;
        sid?: string;
      };
      if (data.sid) writeStoredSid(data.sid);
      const me = await fetchMe();
      setUser(me ?? data.user ?? null);
    } catch (err) {
      console.error("Google sign-in failed", err);
      writeStoredSid(null);
      alert("Sign-in failed. Please try again.");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fbSignOut(getFirebaseAuth());
    } catch {
      /* ignore */
    }
    await fetch(buildApiUrl("/api/auth/firebase/logout"), {
      method: "POST",
      credentials: "include",
      headers: { ...authHeaders() },
    }).catch(() => undefined);
    writeStoredSid(null);
    setUser(null);
    const env = (import.meta as { env?: Record<string, unknown> }).env ?? {};
    const baseUrl =
      typeof env["BASE_URL"] === "string" ? (env["BASE_URL"] as string) : "/";
    window.location.href = baseUrl;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
