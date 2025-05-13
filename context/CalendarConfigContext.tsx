"use client";

import { createContext, useContext, useState } from "react";

type CalendarConfigContextType = {
  defaultDuration: number;
  allowDoubleBooking: boolean;
  setAllowDoubleBooking: (value: boolean) => void;
  setDefaultDuration: (value: number) => void;
};

const CalendarConfigContext = createContext<CalendarConfigContextType | undefined>(undefined);

export function CalendarConfigProvider({ children }: { children: React.ReactNode }) {
  const [defaultDuration, setDefaultDuration] = useState(60); // valor padrão de 1h
  const [allowDoubleBooking, setAllowDoubleBooking] = useState(false); // valor padrão: não permitir duplo agendamento

  return (
    <CalendarConfigContext.Provider
      value={{
        defaultDuration,
        setDefaultDuration,
        allowDoubleBooking,
        setAllowDoubleBooking,
      }}
    >
      {children}
    </CalendarConfigContext.Provider>
  );
}

export function useCalendarConfig() {
  const context = useContext(CalendarConfigContext);
  if (!context) {
    throw new Error("useCalendarConfig deve estar dentro de CalendarConfigProvider");
  }
  return context;
}
