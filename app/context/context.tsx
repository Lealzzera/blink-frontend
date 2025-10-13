"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type MyContextType = {
  value: number;
  setValue: (v: number) => void;
  emailLogin: string;
  setEmailLogin: (v: string) => void;
};

const MyContext = createContext<MyContextType | undefined>(undefined);

export function MyProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(1); 
  const [emailLogin, setEmailLogin] = useState(''); 

  return (
    <MyContext.Provider value={{ value, setValue, emailLogin, setEmailLogin }}>
      {children}
    </MyContext.Provider>
  );
}

export function useMyContext() {
  const ctx = useContext(MyContext);
  if (ctx === undefined) {
    throw new Error("useMyContext must be used within a MyProvider");
  }
  return ctx;
}
