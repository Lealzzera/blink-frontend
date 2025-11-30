"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { usePathname } from "next/navigation";
import { getClinicId } from "../actions/getClinicId";
import axios from "axios";

type User = { id: string; email: string };

type UserContextType = {
  user: User | null;
  clinicId: number | null;
  numberSelected: string | null;
  handleSetUser: (data: User) => void;
  handleClearUser: () => void;
  handleSetNumberSelected: (number: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [numberSelected, setNumberSelected] = useState<string | null>(null);

  function handleSetUser(data: User) {
    setUserInfo(data);
  }

  function handleClearUser() {
    setUserInfo(null);
  }

  function handleSetNumberSelected(number: string) {
    setNumberSelected(number);
  }

  const pathname = usePathname();

  useEffect(() => {
    // don't call /api/me when on the login page (root path)
    if (pathname === "/") return;
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
    // only trigger loadUser when pathname is defined and not root
    if (typeof window !== "undefined") loadUser();
  }, [pathname]);

  return (
    <UserContext.Provider
      value={{
        user: userInfo,
        clinicId,
        handleSetUser,
        handleClearUser,
        numberSelected,
        handleSetNumberSelected,
      }}
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
