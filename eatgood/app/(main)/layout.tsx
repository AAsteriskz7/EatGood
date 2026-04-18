'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Home, MapPin, Camera, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home,   label: 'Home' },
  { href: '/map',       icon: MapPin, label: 'Map' },
  { href: '/action',    icon: Camera, label: 'Scan', isAction: true },
  { href: '/profile',   icon: User,   label: 'Profile' },
];

function useScrollVisibility() {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY.current;
        // Hide on intentional downward scroll (>6px), show on any upward scroll
        if (delta > 6 && currentY > 80) {
          setVisible(false);
        } else if (delta < -4) {
          setVisible(true);
        }
        lastY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return visible;
}

function BottomNav() {
  const pathname = usePathname();
  const visible = useScrollVisibility();

  return (
    <nav
      className="fixed left-1/2 z-50"
      style={{
        bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
        transform: `translateX(-50%) translateY(${visible ? '0' : 'calc(100% + 2rem)'})`,
        opacity: visible ? 1 : 0,
        transition: 'transform 300ms ease-out, opacity 300ms ease-out',
      }}
      aria-label="Main navigation"
    >
      <ul className="flex items-center gap-3 bg-card rounded-full px-3 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]">
        {NAV_ITEMS.map(({ href, icon: Icon, label, isAction }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');

          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                className={[
                  'flex items-center justify-center',
                  'w-12 h-12 rounded-full',
                  'transition-all duration-200 ease-out active:scale-95',
                  isAction
                    ? [
                        'bg-primary text-primary-foreground',
                        'shadow-[0_4px_16px_rgba(232,139,56,0.35)]',
                        isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                      ].filter(Boolean).join(' ')
                    : isActive
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground',
                ].filter(Boolean).join(' ')}
              >
                <Icon size={20} strokeWidth={isActive || isAction ? 2.25 : 1.75} />
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
    <div className="relative min-h-screen min-h-dvh bg-app">
      <main className="pb-nav">{children}</main>
      <BottomNav />
    </div>
  );
}
