"use client";

import Image from "next/image";
import Link from "next/link";
import logoMark from "@orderchina/ui/assets/logo-mark.png";

export interface SidebarItem {
  label: string;
  href?: string;
  /** Màu nền cho badge tròn phía sau icon (Tailwind) — icon giờ đã tự có màu riêng nên chỉ cần nền trung tính. */
  color: string;
  icon: React.ReactNode;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Trang chủ",
    href: "/dashboard",
    color: "bg-zinc-100",
    icon: (
      <>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5z" fill="#BFDBFE" />
        <path d="M2 11 12 3l10 8" fill="none" stroke="#2563EB" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <rect x="9.5" y="14.5" width="5" height="6" fill="#2563EB" />
      </>
    ),
  },
  {
    label: "Giỏ hàng",
    color: "bg-zinc-100",
    icon: (
      <>
        <path d="M7 6.5 8.2 15h9.6l1.7-6.5H7z" fill="#FDA4AF" />
        <path
          d="M4 6h2l1.6 9.6a2 2 0 0 0 2 1.7h6.8a2 2 0 0 0 2-1.6L20 9H7"
          fill="none"
          stroke="#E11D48"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="20" r="1.4" fill="#9F1239" />
        <circle cx="17" cy="20" r="1.4" fill="#9F1239" />
      </>
    ),
  },
  {
    label: "Tạo đơn thủ công",
    color: "bg-zinc-100",
    icon: (
      <>
        <path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="#D9F99D" />
        <path d="M14 3v4h4" fill="none" stroke="#4D7C0F" strokeWidth={1.4} strokeLinejoin="round" />
        <circle cx="17" cy="17.5" r="4.2" fill="#65A30D" />
        <path d="M17 15.6v3.8M15.1 17.5h3.8" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Tạo đơn ký gửi",
    color: "bg-zinc-100",
    icon: (
      <>
        <path d="M4 7l8-4 8 4-8 4-8-4z" fill="#BAE6FD" />
        <path d="M4 7v10l8 4 8-4V7" fill="none" stroke="#0284C7" strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M4 7l8 4 8-4" fill="none" stroke="#0284C7" strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M12 11v10" stroke="#0284C7" strokeWidth={1.2} />
      </>
    ),
  },
  {
    label: "Đơn hàng mua hộ",
    href: "/orders",
    color: "bg-zinc-100",
    icon: (
      <>
        <path d="M4 8l8-4 8 4-8 4-8-4z" fill="#FDBA74" />
        <path d="M4 8v9l8 4 8-4V8" fill="#F97316" />
        <path d="M4 8l8 4 8-4" fill="none" stroke="#C2410C" strokeWidth={1.2} strokeLinejoin="round" />
        <path d="M12 12v9" stroke="#C2410C" strokeWidth={1.2} />
      </>
    ),
  },
  {
    label: "Kiện hàng",
    color: "bg-zinc-100",
    icon: (
      <>
        <rect x="3.5" y="10.5" width="7.5" height="7.5" rx="0.6" fill="#FDE68A" stroke="#B45309" strokeWidth={1.1} />
        <rect x="12.5" y="7" width="8" height="8" rx="0.6" fill="#FCD34D" stroke="#B45309" strokeWidth={1.1} />
        <path d="M12.5 11h8M16.5 7v8" stroke="#B45309" strokeWidth={0.9} />
        <path d="M3.5 14.2h7.5M7.2 10.5v7.5" stroke="#B45309" strokeWidth={0.9} />
      </>
    ),
  },
  {
    label: "Giao hàng",
    color: "bg-zinc-100",
    icon: (
      <>
        <rect x="3" y="9" width="11" height="8" rx="1" fill="#6EE7B7" />
        <path d="M14 12h4l3 3v2h-7v-5z" fill="#A7F3D0" stroke="#047857" strokeWidth={1.3} strokeLinejoin="round" />
        <rect x="3" y="9" width="11" height="8" rx="1" fill="none" stroke="#047857" strokeWidth={1.3} />
        <circle cx="7.5" cy="19" r="1.5" fill="#065F46" />
        <circle cx="17" cy="19" r="1.5" fill="#065F46" />
      </>
    ),
  },
  {
    label: "Khiếu nại",
    color: "bg-zinc-100",
    icon: (
      <>
        <path d="M5 5h14v10H9l-4 4V5z" fill="#F5D0FE" />
        <path d="M5 5h14v10H9l-4 4V5z" fill="none" stroke="#A21CAF" strokeWidth={1.4} strokeLinejoin="round" />
        <path d="M12 8v4" stroke="#A21CAF" strokeWidth={1.6} strokeLinecap="round" />
        <circle cx="12" cy="14.3" r="1" fill="#A21CAF" />
      </>
    ),
  },
  {
    label: "Nhà cung cấp",
    color: "bg-zinc-100",
    icon: (
      <>
        <path d="M4 21V9l8-5 8 5v12H4z" fill="#C7D2FE" />
        <path d="M4 21V9l8-5 8 5v12" fill="none" stroke="#4338CA" strokeWidth={1.4} strokeLinejoin="round" />
        <rect x="9" y="15" width="6" height="6" fill="#4338CA" />
        <rect x="7" y="10" width="2.5" height="2.5" fill="#4338CA" />
        <rect x="14.5" y="10" width="2.5" height="2.5" fill="#4338CA" />
      </>
    ),
  },
  {
    label: "Tra cước",
    color: "bg-zinc-100",
    icon: (
      <>
        <circle cx="10.5" cy="10.5" r="6" fill="#A5F3FC" stroke="#0E7490" strokeWidth={1.4} />
        <path d="M20 20l-4.8-4.8" stroke="#0E7490" strokeWidth={1.8} strokeLinecap="round" />
        <path d="M10.5 8v5M8 10.5h5" stroke="#0E7490" strokeWidth={1.2} strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Lịch sử giao dịch",
    href: "/transactions",
    color: "bg-zinc-100",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="1.5" fill="#BBF7D0" stroke="#15803D" strokeWidth={1.3} />
        <path d="M3 10h18" stroke="#15803D" strokeWidth={1.3} />
        <circle cx="16.5" cy="14.5" r="1.7" fill="#15803D" />
      </>
    ),
  },
  {
    label: "Tài khoản",
    href: "/account",
    color: "bg-zinc-100",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.4" fill="#FDBA74" stroke="#C2410C" strokeWidth={1.3} />
        <path d="M5 20c1-4 4.5-6 7-6s6 2 7 6" fill="#FED7AA" stroke="#C2410C" strokeWidth={1.3} strokeLinecap="round" />
      </>
    ),
  },
];

interface CustomerSidebarProps {
  currentPath: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onComingSoon: (label: string) => void;
  onLogout: () => void;
}

export default function CustomerSidebar({ currentPath, mobileOpen, onCloseMobile, onComingSoon, onLogout }: CustomerSidebarProps) {
  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-center border-b border-zinc-200 px-4 py-4">
        <Image src={logoMark} alt="Logo" priority className="h-10 w-10" />
      </div>

      <nav className="flex-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = !!item.href && currentPath.startsWith(item.href);

          const iconBadge = (
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isActive ? "bg-white/20 text-white" : item.color
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6">
                {item.icon}
              </svg>
            </span>
          );

          if (!item.href) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onComingSoon(item.label)}
                className="flex w-full flex-col items-center gap-1.5 border-b border-zinc-100 px-2 py-3 text-center text-zinc-600 transition hover:bg-zinc-50"
              >
                {iconBadge}
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex w-full flex-col items-center gap-1.5 border-b px-2 py-3 text-center transition ${
                isActive
                  ? "border-blue-800 bg-blue-700 text-white"
                  : "border-zinc-100 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {iconBadge}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full flex-col items-center gap-1.5 border-b border-zinc-100 px-2 py-3 text-center text-zinc-600 transition hover:bg-red-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
            <svg viewBox="0 0 24 24" className="h-6 w-6">
              <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" fill="none" stroke="#DC2626" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 16l4-4-4-4M19 12H9" fill="none" stroke="#DC2626" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-xs font-medium text-red-600">Đăng xuất</span>
        </button>
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden w-24 shrink-0 border-r border-zinc-200 lg:block">{content}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside className="absolute inset-y-0 left-0 w-24 shadow-xl">{content}</aside>
        </div>
      )}
    </>
  );
}
