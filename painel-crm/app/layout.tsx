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
      <body className={`${inter.className} bg-[#03050a] text-slate-100 min-h-screen flex relative overflow-hidden`}>
        {/* Efeitos de Background Imersivos */}
        <div className="fixed inset-0 z-0 opacity-30 pointer-events-none mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>

        {/* Conteúdo Principal */}
        <div className="relative z-10 flex w-full">
          <Sidebar />
          <main className="flex-1 pl-[280px]">
            <div className="mx-auto max-w-[1440px] p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
