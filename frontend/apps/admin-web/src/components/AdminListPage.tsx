"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import EditAdminModal from "./EditAdminModal";
import { roleLabel } from "./StaffListPage";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface AdminListPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM2 18a8 8 0 1116 0H2z" />
    </svg>
  );
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.75a.75.75 0 00-1.5 0v.318a2.75 2.75 0 00-1.75 2.557c0 1.19.7 1.966 2.058 2.376l1.184.358c.687.208.758.51.758.681 0 .372-.41.68-1 .68-.61 0-1.036-.313-1.126-.68a.75.75 0 00-1.457.363c.222.906.98 1.523 1.833 1.71v.317a.75.75 0 001.5 0v-.318a2.75 2.75 0 001.75-2.556c0-1.19-.7-1.967-2.058-2.376l-1.184-.359c-.687-.208-.758-.51-.758-.68 0-.373.41-.68 1-.68.61 0 1.036.312 1.126.68a.75.75 0 101.457-.364c-.222-.905-.98-1.522-1.833-1.71v-.317z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-.836 1.66l-1.03.515a11.06 11.06 0 005.516 5.516l.515-1.03a1.5 1.5 0 011.66-.836l3.223.716A1.5 1.5 0 0117 14.352V15.5a1.5 1.5 0 01-1.5 1.5H14C7.373 17 2 11.627 2 5V3.5z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M3 4a2 2 0 00-2 2v.4l9 5.4 9-5.4V6a2 2 0 00-2-2H3z" />
      <path d="M18 8.6l-8.55 5.13a1 1 0 01-.9 0L1 8.6V14a2 2 0 002 2h14a2 2 0 002-2V8.6z" />
    </svg>
  );
}

function statusLabel(status: number): string {
  if (status === 1) return "Chưa kích hoạt";
  if (status === 2) return "Khoá tài khoản";
  return "Đã kích hoạt";
}

function statusDotClass(status: number): string {
  if (status === 1) return "bg-zinc-400";
  if (status === 2) return "bg-red-500";
  return "bg-green-500";
}

function statusTextClass(status: number): string {
  if (status === 1) return "text-zinc-500";
  if (status === 2) return "text-red-600";
  return "text-green-600";
}

export interface AdminListItem {
  id: string;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  fullName: string;
  address: string | null;
  role: number;
  status: number;
  walletBalance: number;
  createdAtUtc: string;
  createdByUsername: string | null;
  updatedAtUtc: string | null;
  updatedByUsername: string | null;
}

interface AdminListResult {
  items: AdminListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;

export default function AdminListPage({ adminApiBaseUrl, loginUrl }: AdminListPageProps) {
  const [editing, setEditing] = useState<AdminListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchAdmins = useCallback(
    async (targetPage: number, accessToken: string): Promise<AdminListResult> => {
      const res = await fetch(`${adminApiBaseUrl}/staff/admins?page=${targetPage}&pageSize=${PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách (status ${res.status}).`);
      }

      return (await res.json()) as AdminListResult;
    },
    [adminApiBaseUrl],
  );

  const { state, page, goToPage, logout, setState } = useAuthenticatedList<AdminListResult>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchAdmins,
  });

  function handleAdminSaved(updated: Partial<AdminListItem> & { id: string }) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          items: prev.data.items.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
        },
      };
    });
    setEditing(null);
    setToast("Cập nhật thành công");
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
      <AdminLayout title="Danh sách admin" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));

  return (
    <AdminLayout title="Danh sách admin" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">
        Danh sách admin ({data.totalCount})
      </h1>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-orange-400 text-white font-semibold">
            <tr>
              <th className="px-4 py-3 font-medium">Thông tin tài khoản</th>
              <th className="px-4 py-3 font-medium">Thông tin cá nhân</th>
              <th className="px-4 py-3 font-medium">Quyền hạn</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium">Ngày cập nhật</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  Chưa có admin nào.
                </td>
              </tr>
            )}
            {data.items.map((a) => (
              <tr key={a.id} className="border-b border-zinc-100 last:border-0 align-top">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-600">
                    <PersonIcon className="h-3.5 w-3.5 text-blue-500" />
                    {a.username}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(a.status)}`} />
                    <span className={`font-medium ${statusTextClass(a.status)}`}>{statusLabel(a.status)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <CoinIcon className="h-3.5 w-3.5 text-amber-500" />
                    {a.walletBalance.toLocaleString("vi-VN")} VNĐ
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                    <PersonIcon className="h-3.5 w-3.5 text-zinc-400" />
                    {a.fullName}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-600">
                    <PhoneIcon className="h-3.5 w-3.5 text-green-500" />
                    {a.phoneNumber ?? "—"}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                    <MailIcon className="h-3.5 w-3.5 text-zinc-400" />
                    {a.email ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-700">{roleLabel(a.role)}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  <div>{formatDateTime(a.createdAtUtc)}</div>
                  <div className="mt-1 text-zinc-400">{a.createdByUsername ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {a.updatedAtUtc ? (
                    <>
                      <div>{formatDateTime(a.updatedAtUtc)}</div>
                      <div className="mt-1 text-zinc-400">{a.updatedByUsername ?? "—"}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setEditing(a)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200"
                  >
                    Cập nhật
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.totalCount > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
          <span>
            Trang {data.page}/{totalPages} — {data.totalCount} admin
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Trước
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {editing && (
        <EditAdminModal
          admin={editing}
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setEditing(null)}
          onSaved={handleAdminSaved}
        />
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
