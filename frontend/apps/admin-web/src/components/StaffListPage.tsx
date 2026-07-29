"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import EditStaffModal from "./EditStaffModal";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

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
  address: string | null;
  role: number;
  status: number;
  walletBalance: number;
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

const PAGE_SIZE = 20;

const STAFF_ROLES = [
  { value: 2, label: "Nhân viên kinh doanh" },
  { value: 3, label: "Nhân viên mua hàng" },
  { value: 4, label: "Nhân viên kho Trung Quốc" },
  { value: 5, label: "Nhân viên kho Việt Nam" },
  { value: 6, label: "Kế toán" },
];

interface StaffFilters {
  keyword: string;
  status: string;
  role: string;
}

const EMPTY_STAFF_FILTERS: StaffFilters = { keyword: "", status: "", role: "" };

export default function StaffListPage({ adminApiBaseUrl, loginUrl }: StaffListPageProps) {
  const [editing, setEditing] = useState<StaffListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filters, setFilters] = useState<StaffFilters>(EMPTY_STAFF_FILTERS);
  const isFirstFilterRun = useRef(true);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchStaff = useCallback(
    async (targetPage: number, accessToken: string): Promise<StaffListResult> => {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (filters.keyword.trim()) params.set("search", filters.keyword.trim());
      if (filters.status) params.set("status", filters.status);
      if (filters.role) params.set("role", filters.role);

      const res = await fetch(`${adminApiBaseUrl}/staff/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách (status ${res.status}).`);
      }

      return (await res.json()) as StaffListResult;
    },
    [adminApiBaseUrl, filters],
  );

  const { state, page, goToPage, logout, setState } = useAuthenticatedList<StaffListResult>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchStaff,
  });

  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    if (state.status !== "ready") return;
    const timer = setTimeout(() => goToPage(1), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

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
      <AdminLayout title="Danh sách nhân viên" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <AdminLayout title="Danh sách nhân viên" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">
        Danh sách nhân viên ({data.totalCount})
      </h1>

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Từ khoá</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
              placeholder="Tài khoản, họ tên, SĐT, email..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="1">Chưa kích hoạt</option>
              <option value="2">Khoá tài khoản</option>
              <option value="3">Đã kích hoạt</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Quyền hạn</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              {STAFF_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setFilters(EMPTY_STAFF_FILTERS)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Xoá lọc
            </button>
          </div>
        )}
      </div>

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
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <CoinIcon className="h-3.5 w-3.5 text-amber-500" />
                    {s.walletBalance.toLocaleString("vi-VN")} VNĐ
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
                  <div>{formatDateTime(s.createdAtUtc)}</div>
                  <div className="mt-1 text-zinc-400">{s.createdByUsername ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {s.updatedAtUtc ? (
                    <>
                      <div>{formatDateTime(s.updatedAtUtc)}</div>
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
