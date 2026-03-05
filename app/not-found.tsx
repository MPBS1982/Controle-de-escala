import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
      <h2 className="text-4xl font-bold text-slate-900 mb-4">404</h2>
      <p className="text-lg text-slate-600 mb-8">Ops! A página que você está procurando não foi encontrada.</p>
      <Link 
        href="/" 
        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
      >
        Voltar para o Início
      </Link>
    </div>
  );
}
