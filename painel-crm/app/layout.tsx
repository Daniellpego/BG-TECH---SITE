import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BG Tech | CRM Agêntico',
  description: 'Cockpit de Engenharia de Receita',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#03050a] text-slate-100 min-h-screen flex`}>
        <Sidebar />
        <main className="flex-1 pl-[280px]">
          <div className="mx-auto max-w-[1440px] p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
