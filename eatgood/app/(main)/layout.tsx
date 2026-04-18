'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/action', icon: Sparkles, label: 'Compose', isAction: true },
  { href: '/profile', icon: User, label: 'Profile' },
];

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface-elevated shadow-nav"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-center justify-around px-6 h-[4.5rem]">
        {NAV_ITEMS.map(({ href, icon: Icon, label, isAction }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');

          if (isAction) {
            return (
              <li key={href} className="flex items-center justify-center">
                <Link
                  href={href}
                  aria-label={label}
                  className={[
                    'relative flex items-center justify-center',
                    'w-14 h-14 rounded-full -mt-7',
                    'bg-brand shadow-action',
                    'transition-all duration-150 ease-out',
                    'active:scale-95',
                    isActive && 'ring-2 ring-brand ring-offset-2',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Icon
                    size={24}
                    strokeWidth={2}
                    className="text-white"
                  />
                </Link>
              </li>
            );
          }

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={[
                  'flex flex-col items-center justify-center gap-1 py-1',
                  'transition-colors duration-150 ease-out',
                  isActive ? 'text-brand' : 'text-content-tertiary',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className="transition-all duration-150"
                />
                <span
                  className={[
                    'text-[10px] font-display font-semibold tracking-wide',
                    'transition-colors duration-150',
                    isActive ? 'text-brand' : 'text-content-tertiary',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface-base">
      <main className="pb-nav">{children}</main>
      <BottomNav />
    </div>
  );
}
