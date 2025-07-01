import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from "@/components/theme-provider";
import Sidebar from './Sidebar';
import { CalendarConfigProvider } from '@/context/CalendarConfigContext';

export const metadata: Metadata = {
  title: 'blink',
  description: 'Sistema blink',
  icons: {
    icon: '/apenas-img-blink.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" enableSystem={false}>
          <CalendarConfigProvider> 
            <Sidebar />
            {children}
          </CalendarConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
