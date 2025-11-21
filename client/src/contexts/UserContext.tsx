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
    const stored = localStorage.getItem("sansa-user");
    if (stored) {
      try {
        setUserState(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
  }, []);

  const setUser = (user: UserPublic | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem("sansa-user", JSON.stringify(user));
    } else {
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
