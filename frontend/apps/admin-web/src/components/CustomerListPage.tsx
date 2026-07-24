"use client";

import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";

interface CustomerListPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

interface CustomerListItem {
  id: string;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  fullName: string;
  createdAtUtc: string;
}

interface CustomerListResult {
  items: CustomerListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

type LoadState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CustomerListResult };

export default function CustomerListPage({ adminApiBaseUrl, loginUrl }: CustomerListPageProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        // Dùng refresh token cookie (đã set sẵn từ lúc login qua trang chung /login) để lấy access
        // token mới — admin-web không tự giữ session nào khác, luôn refresh khi tải trang.
        const refreshRes = await fetch(`${adminApiBaseUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!refreshRes.ok) {
          if (!cancelled) setState({ status: "unauthenticated" });
          return;
        }

        const { accessToken } = (await refreshRes.json()) as { accessToken: string };

        const customersRes = await fetch(`${adminApiBaseUrl}/customers?page=1&pageSize=20`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!customersRes.ok) {
          if (!cancelled) setState({ status: "error", message: `Lỗi tải danh sách (status ${customersRes.status}).` });
          return;
        }

        const data = (await customersRes.json()) as CustomerListResult;
        if (!cancelled) setState({ status: "ready", data });
      } catch {
        if (!cancelled) setState({ status: "error", message: "Không kết nối được tới máy chủ." });
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [adminApiBaseUrl]);

  useEffect(() => {
    if (state.status === "unauthenticated") {
      window.location.href = loginUrl;
    }
  }, [state.status, loginUrl]);

  async function handleLogout() {
    await fetch(`${adminApiBaseUrl}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    window.location.href = loginUrl;
  }

  if (state.status === "loading" || state.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Đang tải...</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <AdminLayout title="Danh sách khách hàng" onLogout={handleLogout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data } = state;

  return (
    <AdminLayout title="Danh sách khách hàng" onLogout={handleLogout}>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">
        Danh sách khách hàng ({data.totalCount})
      </h1>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Tài khoản</th>
              <th className="px-4 py-3 font-medium">Họ tên</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Số điện thoại</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  Chưa có khách hàng nào.
                </td>
              </tr>
            )}
            {data.items.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 text-zinc-900">{c.username}</td>
                <td className="px-4 py-3 text-zinc-700">{c.fullName}</td>
                <td className="px-4 py-3 text-zinc-700">{c.email}</td>
                <td className="px-4 py-3 text-zinc-700">{c.phoneNumber}</td>
                <td className="px-4 py-3 text-zinc-500">{new Date(c.createdAtUtc).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
