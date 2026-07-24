"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import logo from "@orderchina/ui/assets/logo.png";

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M3 3h6v6H3V3zM11 3h6v6h-6V3zM3 11h6v6H3v-6zM11 11h6v6h-6v-6z" />
    </svg>
  );
}

function UserGroupIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM2 18a8 8 0 1116 0H2z" />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M6.28 3.22a.75.75 0 00-1.06 1.06L6.94 6H4a1 1 0 00-.98 1.196l1.5 8A1 1 0 005.5 16h9a1 1 0 00.98-.804l1.5-8A1 1 0 0016 6h-2.94l1.72-1.72a.75.75 0 00-1.06-1.06L11.44 5.5H8.56L6.28 3.22zM8 8.75a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5zm4.25-.75a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5a.75.75 0 01.75-.75z" />
    </svg>
  );
}

function WarehouseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 2 2 7v1h16V7l-8-5z" />
      <path d="M4 9v8a1 1 0 001 1h3v-5a1 1 0 011-1h2a1 1 0 011 1v5h3a1 1 0 001-1V9H4z" />
    </svg>
  );
}

interface SidebarItem {
  label: string;
  href?: string;
}

interface SidebarGroup {
  title: string;
  icon: ReactNode;
  items: SidebarItem[];
}

const GROUPS: SidebarGroup[] = [
  {
    title: "HỆ THỐNG",
    icon: <GridIcon className="h-4 w-4" />,
    items: [{ label: "Tổng quan" }, { label: "Cài đặt" }],
  },
  {
    title: "TÀI KHOẢN",
    icon: <UserGroupIcon className="h-4 w-4" />,
    items: [
      { label: "Danh sách khách", href: "/userlist" },
      { label: "Danh sách admin", href: "/adminlist" },
      { label: "Danh sách nhân viên", href: "/stafflist" },
      { label: "Tài khoản mua hàng" },
      { label: "Quản lý hoa hồng" },
    ],
  },
  {
    title: "ĐƠN HÀNG",
    icon: <ShoppingBagIcon className="h-4 w-4" />,
    items: [
      { label: "Đơn hàng" },
      { label: "Tạo đơn mua hộ khác" },
      { label: "Tạo đơn ký gửi" },
      { label: "Xử lý khiếu nại" },
    ],
  },
  {
    title: "NGHIỆP VỤ KHO",
    icon: <WarehouseIcon className="h-4 w-4" />,
    items: [
      { label: "Gán kiện ký gửi" },
      { label: "Tracking" },
      { label: "Kho Trung Quốc" },
      { label: "Kho Việt Nam" },
      { label: "Quản lý kiện hàng" },
    ],
  },
];

interface AdminSidebarProps {
  currentPath: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({ currentPath, mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-center border-b border-zinc-200 px-4 py-4">
        <Image src={logo} alt="Logo" priority className="h-8 w-auto" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 flex items-center gap-2 px-2 text-sm font-bold tracking-wide text-blue-800">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-orange-400 via-blue-500 to-indigo-600 text-white shadow-sm">
                {group.icon}
              </span>
              <span className="leading-none">{group.title}</span>
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = !!item.href && currentPath.startsWith(item.href);

                if (!item.href) {
                  return (
                    <li key={item.label}>
                      <span className="flex cursor-not-allowed items-center justify-between rounded-lg px-2 py-2 text-sm text-black">
                        {item.label}
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                          Sắp có
                        </span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`block rounded-lg border-l-4 px-2.5 py-2 text-sm transition ${
                        isActive
                          ? "border-orange-500 bg-orange-50 font-semibold text-orange-700"
                          : "border-transparent font-medium text-black hover:bg-zinc-100"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 lg:block">{content}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">{content}</aside>
        </div>
      )}
    </>
  );
}
