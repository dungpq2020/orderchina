"use client";

function formatMoney(value: number): string {
  return Math.round(value).toLocaleString("vi-VN");
}

interface CustomerTopbarProps {
  title: string;
  fullName: string | null;
  username: string;
  walletBalance: number;
  exchangeRate: number;
  hotline: string | null;
  onOpenMobileMenu: () => void;
  onComingSoon: (label: string) => void;
  onLogout: () => void;
}

export default function CustomerTopbar({
  title,
  fullName,
  username,
  walletBalance,
  exchangeRate,
  hotline,
  onOpenMobileMenu,
  onComingSoon,
  onLogout,
}: CustomerTopbarProps) {
  const displayName = username;

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
      <div className="flex items-center justify-end gap-4 bg-blue-900 px-4 py-2 text-xs text-white">
        {hotline && <span>Hotline: {hotline}</span>}
        <span>Tỷ giá: {formatMoney(exchangeRate)} đ / ¥</span>
        <span>Số dư: {formatMoney(walletBalance)} đ</span>
        <div className="group relative">
          <button className="flex items-center gap-1.5 hover:underline">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            {displayName}
          </button>
          <div className="absolute right-0 z-10 mt-1 hidden w-40 rounded-lg border border-zinc-200 bg-white py-1 text-zinc-700 shadow-lg group-hover:block">
            <button
              onClick={() => onComingSoon("Tài khoản")}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50"
            >
              Tài khoản
            </button>
            <button onClick={onLogout} className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50">
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
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
    </header>
  );
}
