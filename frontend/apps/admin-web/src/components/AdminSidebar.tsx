"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import logo from "@orderchina/ui/assets/logo.png";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 3.5A.5.5 0 015.5 5h9a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-2zM5 11a1 1 0 112 0 1 1 0 01-2 0zm1 2.5a1 1 0 100 2 1 1 0 000-2zM9 11a1 1 0 112 0 1 1 0 01-2 0zm1 2.5a1 1 0 100 2 1 1 0 000-2zM13 11a1 1 0 112 0v3.5a1 1 0 11-2 0V11z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface SidebarItem {
  label: string;
  href?: string;
  children?: SidebarItem[];
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
    items: [
      { label: "Tổng quan" },
      {
        label: "Cài đặt",
        children: [
          { label: "Hệ thống", href: "/systemconfig" },
          { label: "Ưu đãi khách", href: "/userlevel" },
          { label: "Phí mua hàng", href: "/feebuypro" },
          { label: "Phí vận chuyển", href: "/feeweight" },
          { label: "Phí kiểm hàng", href: "/feecheckproduct" },
          // Tạm ẩn — chưa xây trang.
          // { label: "Phí thanh toán hộ" },
          // { label: "Phí thể tích" },
          { label: "Kho vận chuyển", href: "/warehousetransport" },
          { label: "Danh sách ngân hàng", href: "/banklist" },
        ],
      },
    ],
  },
  {
    title: "TÀI KHOẢN",
    icon: <UserGroupIcon className="h-4 w-4" />,
    items: [
      { label: "Danh sách khách", href: "/userlist" },
      { label: "Danh sách admin", href: "/adminlist" },
      { label: "Danh sách nhân viên", href: "/stafflist" },
      // Tạm ẩn — chưa xây trang.
      // { label: "Tài khoản mua hàng" },
      // { label: "Quản lý hoa hồng" },
    ],
  },
  {
    title: "ĐƠN HÀNG",
    icon: <ShoppingBagIcon className="h-4 w-4" />,
    items: [
      { label: "Đơn hàng mua hộ", href: "/orders" },
      { label: "Tạo đơn thủ công", href: "/createmainorder" },
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
  {
    title: "NGHIỆP VỤ KẾ TOÁN",
    icon: <CalculatorIcon className="h-4 w-4" />,
    items: [
      { label: "Yêu cầu nạp ví", href: "/walletrechargerequests" },
      { label: "Yêu cầu rút ví", href: "/walletwithdrawalrequests" },
    ],
  },
];

interface AdminSidebarProps {
  currentPath: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export default function AdminSidebar({ currentPath, mobileOpen, onCloseMobile, onLogout }: AdminSidebarProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(label: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

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

                if (item.children) {
                  const hasActiveChild = item.children.some(
                    (child) => !!child.href && currentPath.startsWith(child.href),
                  );
                  const isOpen = expanded.has(item.label) || hasActiveChild;
                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.label)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-black hover:bg-zinc-100"
                      >
                        {item.label}
                        <ChevronIcon className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <ul className="mt-1 space-y-1 pl-3">
                          {item.children.map((child) => {
                            const isChildActive = !!child.href && currentPath.startsWith(child.href);

                            if (!child.href) {
                              return (
                                <li key={child.label}>
                                  <span className="flex cursor-not-allowed items-center justify-between rounded-lg px-2 py-2 text-sm text-black">
                                    {child.label}
                                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                                      Sắp có
                                    </span>
                                  </span>
                                </li>
                              );
                            }

                            return (
                              <li key={child.label}>
                                <Link
                                  href={child.href}
                                  onClick={onCloseMobile}
                                  className={`block rounded-lg border-l-4 px-2.5 py-2 text-sm transition ${
                                    isChildActive
                                      ? "border-orange-500 bg-orange-50 font-semibold text-orange-700"
                                      : "border-transparent font-medium text-black hover:bg-zinc-100"
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

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

      <div className="border-t border-zinc-200 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Đăng xuất
        </button>
      </div>
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
