'use client'

import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from "@/components/theme-provider";
import Sidebar from './Sidebar';
import { useState, ReactNode } from 'react';
import UserContext from './context/UserContext';

/*export const metadata: Metadata = {
  title: 'blink',
  description: 'Sistema blink',
  icons: { icon: '/apenas-img-blink.png' },
};*/

export default function RootLayout({ children }: { children: ReactNode }) {
  const [overbooking, setOverbooking] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(30);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" enableSystem={false}>
          <UserContext.Provider value={{ overbooking, setOverbooking, duration, setDuration }}>
            <Sidebar />
            {children}
          </UserContext.Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
