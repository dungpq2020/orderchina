"use client";

interface AdminTopbarProps {
  title: string;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export default function AdminTopbar({ title, onOpenMobileMenu, onLogout }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 lg:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        <h1 className="text-sm font-semibold text-zinc-900">{title}</h1>
      </div>

      <button
        onClick={onLogout}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
      >
        Đăng xuất
      </button>
    </header>
  );
}
