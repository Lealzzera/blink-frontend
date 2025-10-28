"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getClinicId } from "../actions/getClinicId";
import axios from "axios";

type User = { id: string; email: string };

type UserContextType = {
  user: User | null;
  clinicId: number | null;
  handleSetUser: (data: User) => void;
  handleClearUser: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [clinicId, setClinicId] = useState<number | null>(null);

  function handleSetUser(data: User) {
    setUserInfo(data);
  }

  function handleClearUser() {
    setUserInfo(null);
  }

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await axios.get("/api/me", {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
        if (res.status === 200) {
          handleSetUser({ id: res.data.user.id, email: res.data.user.email });
          const clinic = await getClinicId();
          if (clinic) setClinicId(clinic);
        } else handleClearUser();
      } catch {
        handleClearUser();
      }
    };
    loadUser();
  }, []);

  return (
    <UserContext.Provider
      value={{ user: userInfo, clinicId, handleSetUser, handleClearUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
