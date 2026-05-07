import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Segue-me | Gestão Financeira',
  description: 'Sistema de gestão financeira do movimento Segue-me.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased dark`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
        {children}
      </body>
    </html>
  );
}
