"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type MyContextType = {
  value: number;
  setValue: (v: number) => void;
};

const MyContext = createContext<MyContextType | undefined>(undefined);

export function MyProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(1); //Aqui vai mudar conforme o back-end. Este 1 sera dinamico.

  return (
    <MyContext.Provider value={{ value, setValue }}>
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
