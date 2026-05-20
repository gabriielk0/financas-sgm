import Link from 'next/link';

export default function PublicHome() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950">
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/financas/login"
          className="rounded-md bg-indigo-600 px-8 py-4 text-center font-medium text-white transition hover:bg-indigo-700 shadow-lg"
        >
          Finanças
        </Link>

        <Link
          href="/pagamentos/login"
          className="rounded-md bg-zinc-800 px-8 py-4 text-center font-medium text-zinc-100 transition hover:bg-zinc-700 border border-zinc-700 shadow-lg"
        >
          Solicitar / Acompanhar Reembolso
        </Link>
      </div>
    </div>
  );
}

