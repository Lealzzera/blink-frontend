'use client';

import axios from 'axios';
import { usePathname } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getClinicId } from '../actions/getClinicId';

type User = { id: string; email: string };
export type ContactSelected = {
  ai_answer: boolean;
  contactName: string;
  id: string;
  phoneNumber: string;
  contactPicture: string;
  lastMessage: {
    hasMedia: boolean;
    message: string;
    sentAt: string;
  };
};

type UserContextType = {
  user: User | null;
  clinicId: string | null;
  contactSelected: ContactSelected | null;
  handleSetUser: (data: User) => void;
  handleClearUser: () => void;
  handleSetContactSelected: (contactSelected: ContactSelected) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [contactSelected, setContactSelected] = useState<ContactSelected | null>(null);

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
    if (pathname === '/' || pathname === '/reset-password' || pathname === '/forgot-password')
      return;
    const loadUser = async () => {
      try {
        const res = await axios.get('/api/me', {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
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
    if (typeof window !== 'undefined') loadUser();
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
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
