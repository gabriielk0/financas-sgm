'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RelatoriosNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/financas/relatorios/consolidado', label: 'Geral Consolidado' },
    { href: '/financas/relatorios/equipes', label: 'Por Área/Equipe' },
    { href: '/financas/relatorios/reembolsos', label: 'Reembolsos' },
  ];

  return (
    <nav className="-mb-px flex gap-6 overflow-x-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`border-b-2 pb-4 px-1 text-sm font-medium transition-colors ${
              isActive
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
