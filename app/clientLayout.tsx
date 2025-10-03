"use client";

import { ReactNode } from "react";
import { MyProvider } from "./context/context";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <MyProvider>{children}</MyProvider>;
}
