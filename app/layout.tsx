import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

export const metadata: Metadata = {
  title: 'blink',
  description: 'Sistema blink',
  icons: {
    icon: '/apenas-img-blink.png',
  },
};

const ibm_plex_sans = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--main-font-sans',
  weight: ['400', '700'],
});

const ibm_plex_mono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--main-font-mono',
  weight: ['400', '700'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${ibm_plex_sans.variable} ${ibm_plex_mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
