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
export type ContactSelected = {
  phone_number: string;
  whats_app_name?: string;
  picture_url?: string;
  ai_answer: boolean;
};

type UserContextType = {
  user: User | null;
  clinicId: number | null;
  contactSelected: ContactSelected | null;
  handleSetUser: (data: User) => void;
  handleClearUser: () => void;
  handleSetContactSelected: (contactSelected: ContactSelected) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [contactSelected, setContactSelected] =
    useState<ContactSelected | null>(null);

  function handleSetUser(data: User) {
    setUserInfo(data);
  }

  function handleClearUser() {
    setUserInfo(null);
  }

  function handleSetContactSelected(contactSelected: ContactSelected) {
    setContactSelected(contactSelected);
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
        contactSelected,
        handleSetContactSelected,
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
