import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Escala do Talho',
  description: 'Painel de gestão de força de trabalho e planejamento de turnos',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="font-sans antialiased text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
