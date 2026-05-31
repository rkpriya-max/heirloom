"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Users, CalendarDays } from "lucide-react";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/family", label: "Family", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 z-50 pb-safe">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/home" ? path === "/home" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors
                ${active ? "text-amber-600" : "text-stone-400 hover:text-stone-600"}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
