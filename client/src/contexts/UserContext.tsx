import { createContext, useContext, useState, useEffect } from "react";
import type { UserPublic } from "@shared/schema";

interface UserContextType {
  user: UserPublic | null;
  setUser: (user: UserPublic | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserPublic | null>(null);

  useEffect(() => {
    console.log("🚀 UserContext - Loading from localStorage");
    const stored = localStorage.getItem("sansa-user");
    console.log("📦 Found in localStorage:", stored);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log("✨ Parsed user data:", parsed);
        setUserState(parsed);
      } catch (e) {
        console.error("❌ Failed to parse stored user", e);
      }
    } else {
      console.log("⚠️ No user data in localStorage");
    }
  }, []);

  const setUser = (user: UserPublic | null) => {
    console.log("🔧 UserContext - setUser called with:", user);
    setUserState(user);
    if (user) {
      const userData = JSON.stringify(user);
      console.log("💾 Saving to localStorage:", userData);
      localStorage.setItem("sansa-user", userData);
      // Verify it was saved
      const saved = localStorage.getItem("sansa-user");
      console.log("✅ Verified localStorage has:", saved);
    } else {
      console.log("🗑️ Removing from localStorage");
      localStorage.removeItem("sansa-user");
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
