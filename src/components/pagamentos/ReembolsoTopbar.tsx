'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Plus, ReceiptText } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

const navItems = [
  { href: '/pagamentos/minhas-solicitacoes', label: 'Minhas Solicitações' },
];

export default function ReembolsoTopbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    localStorage.removeItem('token');
    localStorage.removeItem('perfil');
    localStorage.removeItem('usuario');
    router.replace('/pagamentos/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/pagamentos/minhas-solicitacoes" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <ReceiptText className="h-5 w-5" />
          </span>
          <span className="hidden font-semibold text-white sm:inline">
            Reembolso
          </span>
        </Link>

        <nav className="flex min-w-0 items-center gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {item.href.endsWith('/solicitar') && (
                  <Plus className="mr-1 inline h-4 w-4" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}

