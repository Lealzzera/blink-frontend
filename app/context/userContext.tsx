'use client';

import { usePathname } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getClinicId } from '../actions/getClinicId';
import { ClinicInfoType } from '../types/types';

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
  clinicInfo: ClinicInfoType | null;
  contactSelected: ContactSelected | null;
  handleSetUser: (data: User) => void;
  handleClearUser: () => void;
  handleSetContactSelected: (contactSelected: ContactSelected) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfoType | null>(null);
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
    if (pathname === '/' || pathname === '/reset-password' || pathname === '/forgot-password')
      return;
    const loadUser = async () => {
      const response = await getClinicId();
      setClinicInfo({
        clinicId: response.clinicId,
        userRole: response.role,
        clinicType: response.clinic.type,
        clinicSlug: response.clinic.slug,
        clinicStatus: response.clinic.status,
      });
    };
    if (typeof window !== 'undefined') loadUser();
  }, [pathname]);

  return (
    <UserContext.Provider
      value={{
        user: userInfo,
        clinicInfo,
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
