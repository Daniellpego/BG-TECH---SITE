import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'CRM BG Tech',
  description: 'Sistema CRM inteligente da BG Tech com agentes de IA',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="antialiased" style={{ fontFamily: "var(--font-sans)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
