"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "@orderchina/ui/assets/logo.png";

export interface SidebarItem {
  label: string;
  href?: string;
  /** Màu nền + chữ cho icon (Tailwind) — dùng cho cả lưới ở Trang chủ lẫn icon ở sidebar lúc không active. */
  color: string;
  icon: React.ReactNode;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Trang chủ",
    href: "/dashboard",
    color: "bg-blue-100 text-blue-700",
    icon: (
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5z"
        strokeWidth={1.5}
        stroke="currentColor"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Giỏ hàng",
    color: "bg-rose-100 text-rose-700",
    icon: (
      <>
        <path
          d="M4 6h2l1.6 9.6a2 2 0 0 0 2 1.7h6.8a2 2 0 0 0 2-1.6L20 9H7"
          strokeWidth={1.5}
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="20" r="1.4" fill="currentColor" />
        <circle cx="17" cy="20" r="1.4" fill="currentColor" />
      </>
    ),
  },
  {
    label: "Tạo đơn order",
    color: "bg-lime-100 text-lime-700",
    icon: <path d="M4 4h9l3 3v13H4V4z" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinejoin="round" />,
  },
  {
    label: "Tạo đơn ký gửi",
    color: "bg-sky-100 text-sky-700",
    icon: (
      <>
        <path d="M4 7l8-4 8 4-8 4-8-4z" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinejoin="round" />
        <path d="M4 7v10l8 4 8-4V7" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinejoin="round" />
      </>
    ),
  },
  {
    label: "Đơn hàng",
    href: "/orders",
    color: "bg-teal-100 text-teal-700",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={1.5} stroke="currentColor" fill="none" />
        <path d="M8 9h8M8 13h8M8 17h5" strokeWidth={1.5} stroke="currentColor" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Kiện hàng",
    color: "bg-amber-100 text-amber-700",
    icon: (
      <>
        <path d="M3 8l9-5 9 5-9 5-9-5z" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinejoin="round" />
        <path d="M3 8v8l9 5 9-5V8" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinejoin="round" />
        <path d="M12 13v8" strokeWidth={1.5} stroke="currentColor" />
      </>
    ),
  },
  {
    label: "Giao hàng",
    color: "bg-emerald-100 text-emerald-700",
    icon: (
      <>
        <rect x="3" y="9" width="11" height="8" rx="1" strokeWidth={1.5} stroke="currentColor" fill="none" />
        <path d="M14 12h4l3 3v2h-7v-5z" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinejoin="round" />
        <circle cx="7.5" cy="19" r="1.4" fill="currentColor" />
        <circle cx="17" cy="19" r="1.4" fill="currentColor" />
      </>
    ),
  },
  {
    label: "Khiếu nại",
    color: "bg-fuchsia-100 text-fuchsia-700",
    icon: (
      <>
        <path d="M5 5h14v10H9l-4 4V5z" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinejoin="round" />
        <path d="M12 8v4" strokeWidth={1.5} stroke="currentColor" strokeLinecap="round" />
        <circle cx="12" cy="14.3" r="0.9" fill="currentColor" />
      </>
    ),
  },
  {
    label: "Nhà cung cấp",
    color: "bg-indigo-100 text-indigo-700",
    icon: (
      <>
        <path d="M4 21V9l8-5 8 5v12" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinejoin="round" />
        <path d="M9 21v-6h6v6" strokeWidth={1.5} stroke="currentColor" fill="none" />
      </>
    ),
  },
  {
    label: "Tra cước",
    color: "bg-cyan-100 text-cyan-700",
    icon: (
      <>
        <circle cx="11" cy="11" r="6" strokeWidth={1.5} stroke="currentColor" fill="none" />
        <path d="M20 20l-4.5-4.5" strokeWidth={1.5} stroke="currentColor" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Tài khoản",
    color: "bg-orange-100 text-orange-700",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.2" strokeWidth={1.5} stroke="currentColor" fill="none" />
        <path d="M5 20c1-4 4.5-6 7-6s6 2 7 6" strokeWidth={1.5} stroke="currentColor" fill="none" strokeLinecap="round" />
      </>
    ),
  },
];

interface CustomerSidebarProps {
  currentPath: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onComingSoon: (label: string) => void;
}

export default function CustomerSidebar({ currentPath, mobileOpen, onCloseMobile, onComingSoon }: CustomerSidebarProps) {
  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-center border-b border-zinc-200 px-4 py-4">
        <Image src={logo} alt="Logo" priority className="h-8 w-auto" />
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
