import type { Metadata, Viewport } from 'next';
import { Manrope, DM_Sans } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ritmo — Calendario & Anotador Personal Inteligente',
  description: 'Sistema monousuario de productividad, calendario táctil y notas inteligentes con Gemini y Telegram.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ritmo',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#6558f5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${manrope.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-ritmo-bg text-ritmo-ink antialiased selection:bg-ritmo-purple selection:text-white">
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-2xl relative">
          {children}
        </main>
      </body>
    </html>
  );
}
