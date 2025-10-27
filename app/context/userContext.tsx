"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getClinicId } from "../actions/getClinicId";
import { usePathname } from "next/navigation";
import axios from "axios";

type User = {
  id: string;
  email: string;
};

type UserContextType = {
  user: User | null;
  handleSetUser: (data: User) => void;
  handleClearUser: () => void;
  clinicId: number;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [clinicId, setClinicId] = useState<number>(0);

  const handleGetClinicId = async () => {
    const response = await getClinicId();
    if (response) {
      setClinicId(response);
    }
  };

  function handleSetUser(data: User) {
    setUserInfo(data);
  }

  function handleClearUser() {
    setUserInfo(null);
  }

  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") return;
    handleGetClinicId();
    async function loadUser() {
      if (pathname === "/") return;
      const res = await axios.get("/api/me", {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });

      if (res.status === 200) {
        handleSetUser({ id: res.data.user.id, email: res.data.user.email });
        return;
      }

      handleClearUser();
    }

    loadUser();
  }, [pathname]);

  return (
    <UserContext.Provider
      value={{ user: userInfo, handleSetUser, handleClearUser, clinicId }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
