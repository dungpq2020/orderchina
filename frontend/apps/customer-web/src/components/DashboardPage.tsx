"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import CustomerLayout from "./CustomerLayout";
import { SIDEBAR_ITEMS } from "./CustomerSidebar";

interface DashboardPageProps {
  customerApiBaseUrl: string;
  loginUrl: string;
}

interface MeInfo {
  username: string;
  fullName: string | null;
  walletBalance: number;
  exchangeRate: number;
  hotline: string | null;
}

export default function DashboardPage({ customerApiBaseUrl, loginUrl }: DashboardPageProps) {
  const fetchMe = useCallback(
    async (_page: number, accessToken: string): Promise<MeInfo> => {
      const res = await fetch(`${customerApiBaseUrl}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Lỗi tải thông tin tài khoản (status ${res.status}).`);
      }
      return (await res.json()) as MeInfo;
    },
    [customerApiBaseUrl],
  );

  // Dùng chung hook useAuthenticatedList (vốn để load danh sách phân trang) chỉ để refresh session +
  // tải hồ sơ /me — page luôn là 1, không phân trang, nhưng hưởng sẵn cơ chế cache token/logout dùng chung.
  const { state, logout } = useAuthenticatedList<MeInfo>({
    adminApiBaseUrl: customerApiBaseUrl,
    loginUrl,
    fetchPage: fetchMe,
  });

  if (state.status === "loading" || state.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Đang tải...</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </div>
    );
  }

  const { data: me } = state;

  return (
    <CustomerLayout
      title="Trang chủ"
      fullName={me.fullName}
      username={me.username}
      walletBalance={me.walletBalance}
      exchangeRate={me.exchangeRate}
      hotline={me.hotline}
      onLogout={logout}
    >
      {(onComingSoon) => (
        <div className="mx-auto max-w-4xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onComingSoon("Tìm kiếm sản phẩm");
            }}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
          >
            <input
              type="text"
              placeholder="Chào bạn, bạn muốn tìm gì hôm nay?"
              className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Tìm
            </button>
          </form>

          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
            {SIDEBAR_ITEMS.map((item) => {
              const tileContent = (
                <>
                  <span className={`flex h-14 w-14 items-center justify-center rounded-full ${item.color}`}>
                    <svg viewBox="0 0 24 24" className="h-7 w-7">
                      {item.icon}
                    </svg>
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-700">{item.label}</span>
                </>
              );
              const tileClasses =
                "flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-center shadow-sm transition hover:shadow-md";

              return item.href ? (
                <Link key={item.label} href={item.href} className={tileClasses}>
                  {tileContent}
                </Link>
              ) : (
                <button key={item.label} onClick={() => onComingSoon(item.label)} className={tileClasses}>
                  {tileContent}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
