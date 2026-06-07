"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Users, CalendarDays } from "lucide-react";

const tabs = [
  { href: "/home",    label: "Home",    icon: Home },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/family",  label: "Circle",  icon: Users },
  { href: "/events",  label: "Gather",  icon: CalendarDays },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
      <div className="max-w-lg mx-auto flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/home" ? path === "/home" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors"
              style={{ color: active ? 'var(--red)' : 'var(--ink-faint)' }}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className="text-[10px] font-bold tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
