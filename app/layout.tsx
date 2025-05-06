import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from "@/components/theme-provider";
import Sidebar from './Sidebar';

export const metadata: Metadata = {
  title: 'Blink',
  description: 'Sistema Blink',
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
          <Sidebar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
