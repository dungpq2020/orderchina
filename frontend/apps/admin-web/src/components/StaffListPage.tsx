"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AdminLayout from "./AdminLayout";
import EditStaffModal from "./EditStaffModal";

interface StaffListPageProps {
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

export function roleLabel(role: number): string {
  switch (role) {
    case 0:
      return "Admin";
    case 1:
      return "Khách hàng";
    case 2:
      return "Nhân viên kinh doanh";
    case 3:
      return "Nhân viên mua hàng";
    case 4:
      return "Nhân viên kho Trung Quốc";
    case 5:
      return "Nhân viên kho Việt Nam";
    case 6:
      return "Kế toán";
    default:
      return "—";
  }
}

export interface StaffListItem {
  id: string;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  fullName: string;
  role: number;
  status: number;
  createdAtUtc: string;
  createdByUsername: string | null;
  updatedAtUtc: string | null;
  updatedByUsername: string | null;
}

interface StaffListResult {
  items: StaffListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

type LoadState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "error"; message: string }
  | { status: "ready"; data: StaffListResult; accessToken: string };

const PAGE_SIZE = 20;

export default function StaffListPage({ adminApiBaseUrl, loginUrl }: StaffListPageProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<StaffListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const stateRef = useRef(state);
  const pageRef = useRef(page);
  stateRef.current = state;
  pageRef.current = page;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadPage = useCallback(
    async (targetPage: number, accessToken: string) => {
      const staffRes = await fetch(`${adminApiBaseUrl}/staff/list?page=${targetPage}&pageSize=${PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!staffRes.ok) {
        setState({ status: "error", message: `Lỗi tải danh sách (status ${staffRes.status}).` });
        return;
      }

      const data = (await staffRes.json()) as StaffListResult;
      setState({ status: "ready", data, accessToken });
    },
    [adminApiBaseUrl],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const refreshRes = await fetch(`${adminApiBaseUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!refreshRes.ok) {
          if (!cancelled) setState({ status: "unauthenticated" });
          return;
        }

        const { accessToken } = (await refreshRes.json()) as { accessToken: string };
        if (!cancelled) await loadPage(1, accessToken);
      } catch {
        if (!cancelled) setState({ status: "error", message: "Không kết nối được tới máy chủ." });
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [adminApiBaseUrl, loadPage]);

  // Tự tải lại dữ liệu khi quay lại tab để dữ liệu luôn gần với thời gian thực nhất có thể.
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState !== "visible") return;
      const current = stateRef.current;
      if (current.status !== "ready") return;
      loadPage(pageRef.current, current.accessToken);
    }

    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleVisible);
    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleVisible);
    };
  }, [loadPage]);

  useEffect(() => {
    if (state.status === "unauthenticated") {
      window.location.href = loginUrl;
    }
  }, [state.status, loginUrl]);

  async function handleLogout() {
    await fetch(`${adminApiBaseUrl}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    window.location.href = loginUrl;
  }

  function goToPage(targetPage: number) {
    if (state.status !== "ready") return;
    setPage(targetPage);
    loadPage(targetPage, state.accessToken);
  }

  function handleStaffSaved(updated: Partial<StaffListItem> & { id: string }) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          items: prev.data.items.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
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
      <AdminLayout title="Danh sách nhân viên" onLogout={handleLogout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));

  return (
    <AdminLayout title="Danh sách nhân viên" onLogout={handleLogout}>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">
        Danh sách nhân viên ({data.totalCount})
      </h1>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-orange-300 text-zinc-700">
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
                  Chưa có nhân viên nào.
                </td>
              </tr>
            )}
            {data.items.map((s) => (
              <tr key={s.id} className="border-b border-zinc-100 last:border-0 align-top">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-600">
                    <PersonIcon className="h-3.5 w-3.5 text-blue-500" />
                    {s.username}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(s.status)}`} />
                    <span className={`font-medium ${statusTextClass(s.status)}`}>{statusLabel(s.status)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                    <PersonIcon className="h-3.5 w-3.5 text-zinc-400" />
                    {s.fullName}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-600">
                    <PhoneIcon className="h-3.5 w-3.5 text-green-500" />
                    {s.phoneNumber ?? "—"}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                    <MailIcon className="h-3.5 w-3.5 text-zinc-400" />
                    {s.email ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-700">{roleLabel(s.role)}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  <div>{new Date(s.createdAtUtc).toLocaleString()}</div>
                  <div className="mt-1 text-zinc-400">{s.createdByUsername ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {s.updatedAtUtc ? (
                    <>
                      <div>{new Date(s.updatedAtUtc).toLocaleString()}</div>
                      <div className="mt-1 text-zinc-400">{s.updatedByUsername ?? "—"}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setEditing(s)}
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
            Trang {data.page}/{totalPages} — {data.totalCount} nhân viên
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
        <EditStaffModal
          staff={editing}
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setEditing(null)}
          onSaved={handleStaffSaved}
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
