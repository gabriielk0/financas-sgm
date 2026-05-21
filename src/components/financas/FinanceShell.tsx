'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, ClipboardList, LogOut, ReceiptText, Users, FileText, Menu, X } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

const navItems = [
  {
    href: '/financas/dashboard',
    label: 'Dashboard',
    icon: BarChart3,
  },
  {
    href: '/financas/lancamentos',
    label: 'Lançamentos',
    icon: ClipboardList,
  },
  {
    href: '/financas/pagamentos',
    label: 'Pagamentos',
    icon: ReceiptText,
  },
  {
    href: '/financas/relatorios/consolidado',
    label: 'Relatórios',
    icon: FileText,
  },
  {
    href: '/financas/usuarios',
    label: 'Usuários',
    icon: Users,
  },
];

export default function FinanceShell({
  children,
  pendingReimbursements,
}: {
  children: React.ReactNode;
  pendingReimbursements: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logoutAction();
    localStorage.removeItem('token');
    localStorage.removeItem('perfil');
    localStorage.removeItem('usuario');
    router.replace('/financas/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/financas/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
              S
            </span>
            <span className="hidden font-semibold text-white sm:inline">
              Finanças
            </span>
          </Link>

          <nav className="hidden md:flex min-w-0 items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.href.endsWith('/pagamentos') &&
                    pendingReimbursements > 0 && (
                      <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-950">
                        {pendingReimbursements}
                      </span>
                    )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="hidden md:inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex md:hidden items-center justify-center rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-2 shadow-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base transition ${
                    active
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.href.endsWith('/pagamentos') &&
                    pendingReimbursements > 0 && (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-zinc-950">
                        {pendingReimbursements}
                      </span>
                    )}
                </Link>
              );
            })}
            <div className="pt-4 mt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {children}
    </div>
  );
}
