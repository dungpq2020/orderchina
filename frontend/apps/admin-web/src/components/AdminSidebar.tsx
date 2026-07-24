"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "@orderchina/ui/assets/logo.png";

interface SidebarItem {
  label: string;
  href?: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const GROUPS: SidebarGroup[] = [
  {
    title: "HỆ THỐNG",
    items: [{ label: "Tổng quan" }, { label: "Cài đặt" }],
  },
  {
    title: "TÀI KHOẢN",
    items: [
      { label: "Danh sách khách", href: "/userlist" },
      { label: "Danh sách admin" },
      { label: "Danh sách nhân viên", href: "/stafflist" },
      { label: "Tài khoản mua hàng" },
      { label: "Quản lý hoa hồng" },
    ],
  },
  {
    title: "ĐƠN HÀNG",
    items: [
      { label: "Đơn hàng" },
      { label: "Tạo đơn mua hộ khác" },
      { label: "Tạo đơn ký gửi" },
      { label: "Xử lý khiếu nại" },
    ],
  },
  {
    title: "NGHIỆP VỤ KHO",
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
            <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-blue-600">{group.title}</p>
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
                      className={`block rounded-lg px-2 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-orange-500 text-white"
                          : "text-black hover:bg-zinc-100"
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
