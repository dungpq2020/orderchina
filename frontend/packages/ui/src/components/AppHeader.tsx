"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import logo from "../assets/logo.png";

export interface AppHeaderNavItem {
  label: string;
  href: string;
}

interface AppHeaderProps {
  navItems: AppHeaderNavItem[];
  onLogout: () => void;
  userLabel?: string;
}

/**
 * Header/menu dùng chung cho admin-web và customer-web — chỉ nhận nav item + callback đăng xuất
 * qua props, không tự gọi API (mỗi app tự biết gọi AdminApi hay CustomerApi để logout).
 */
export default function AppHeader({ navItems, onLogout, userLabel }: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="rounded-lg border border-zinc-100 bg-white px-2 py-1 shadow-sm">
            <Image src={logo} alt="Logo" priority className="h-7 w-auto" />
          </div>
          <nav className="hidden gap-5 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-zinc-600 transition hover:text-blue-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          {userLabel && <span className="text-sm text-zinc-500">{userLabel}</span>}
          <button
            onClick={onLogout}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Đăng xuất
          </button>
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 sm:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-200 px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {userLabel && <p className="mt-2 px-2 text-sm text-zinc-500">{userLabel}</p>}
          <button
            onClick={onLogout}
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
}
