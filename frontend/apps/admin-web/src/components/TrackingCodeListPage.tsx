"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface TrackingCodeListPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

interface TrackingCodeListItem {
  id: string;
  code: string;
  orderId: string;
  orderNumber: number;
  orderCode: string;
  orderType: number;
  username: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
  status: number;
  note: string | null;
  createdAtUtc: string;
  createdByUsername: string | null;
  arrivedChinaWarehouseAtUtc: string | null;
  arrivedChinaWarehouseByUsername: string | null;
  inTransitToVietnamAtUtc: string | null;
  inTransitToVietnamByUsername: string | null;
  arrivedVietnamWarehouseAtUtc: string | null;
  arrivedVietnamWarehouseByUsername: string | null;
  deliveredToCustomerAtUtc: string | null;
  deliveredToCustomerByUsername: string | null;
}

interface TrackingCodeListResult {
  items: TrackingCodeListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;

const ORDER_TYPE_LABELS: Record<number, string> = {
  1: "Mua hộ",
  2: "Ký gửi",
};

const ORDER_TYPE_COLORS: Record<number, string> = {
  1: "text-blue-600",
  2: "text-green-600",
};

const STATUS_LABELS: Record<number, string> = {
  1: "Mới tạo",
  2: "Về kho Trung Quốc",
  3: "Đang vận chuyển về Việt Nam",
  4: "Về kho Việt Nam",
  5: "Đã giao khách",
};

const STATUS_COLORS: Record<number, string> = {
  1: "text-zinc-500",
  2: "text-blue-600",
  3: "text-amber-600",
  4: "text-purple-600",
  5: "text-green-600",
};

const STATUS_DOT_COLORS: Record<number, string> = {
  1: "bg-zinc-400",
  2: "bg-blue-500",
  3: "bg-amber-500",
  4: "bg-purple-500",
  5: "bg-green-500",
};

interface Filters {
  keyword: string;
  status: string;
}

const EMPTY_FILTERS: Filters = { keyword: "", status: "" };

function formatWeight(value: number): string {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function timelineEntries(item: TrackingCodeListItem): { label: string; atUtc: string; byUsername: string | null }[] {
  const entries: { label: string; atUtc: string; byUsername: string | null }[] = [
    { label: "Mới tạo", atUtc: item.createdAtUtc, byUsername: item.createdByUsername },
  ];
  if (item.arrivedChinaWarehouseAtUtc) {
    entries.push({ label: "Về kho TQ", atUtc: item.arrivedChinaWarehouseAtUtc, byUsername: item.arrivedChinaWarehouseByUsername });
  }
  if (item.inTransitToVietnamAtUtc) {
    entries.push({ label: "Đang về VN", atUtc: item.inTransitToVietnamAtUtc, byUsername: item.inTransitToVietnamByUsername });
  }
  if (item.arrivedVietnamWarehouseAtUtc) {
    entries.push({ label: "Về kho VN", atUtc: item.arrivedVietnamWarehouseAtUtc, byUsername: item.arrivedVietnamWarehouseByUsername });
  }
  if (item.deliveredToCustomerAtUtc) {
    entries.push({ label: "Đã giao khách", atUtc: item.deliveredToCustomerAtUtc, byUsername: item.deliveredToCustomerByUsername });
  }
  return entries;
}

export default function TrackingCodeListPage({ adminApiBaseUrl, loginUrl }: TrackingCodeListPageProps) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const isFirstFilterRun = useRef(true);

  const fetchTrackingCodes = useCallback(
    async (targetPage: number, accessToken: string): Promise<TrackingCodeListResult> => {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (filters.keyword.trim()) params.set("search", filters.keyword.trim());
      if (filters.status) params.set("status", filters.status);

      const res = await fetch(`${adminApiBaseUrl}/main-orders/tracking-codes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách (status ${res.status}).`);
      }

      return (await res.json()) as TrackingCodeListResult;
    },
    [adminApiBaseUrl, filters],
  );

  const { state, page, goToPage, logout } = useAuthenticatedList<TrackingCodeListResult>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchTrackingCodes,
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

  if (state.status === "loading" || state.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Đang tải...</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <AdminLayout title="Quản lý mã vận đơn" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <AdminLayout title="Quản lý mã vận đơn" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Quản lý mã vận đơn ({data.totalCount})</h1>

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Từ khoá</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
              placeholder="Mã vận đơn, mã đơn hàng..."
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
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-orange-400 font-semibold text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Loại đơn</th>
              <th className="px-4 py-3 font-medium">Tài khoản</th>
              <th className="px-4 py-3 font-medium">Mã vận đơn</th>
              <th className="px-4 py-3 font-medium">Thông tin kiện</th>
              <th className="px-4 py-3 font-medium">Tiến trình</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-400">
                  Chưa có mã vận đơn nào.
                </td>
              </tr>
            )}
            {data.items.map((item) => (
              <tr key={item.id} className="align-middle">
                <td className="px-4 py-3">
                  <Link
                    href={`/orderdetail?id=${item.orderId}`}
                    className={`font-semibold hover:underline ${ORDER_TYPE_COLORS[item.orderType] ?? "text-zinc-900"}`}
                  >
                    {item.orderCode}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${ORDER_TYPE_COLORS[item.orderType] ?? "text-zinc-500"}`}>
                    • {ORDER_TYPE_LABELS[item.orderType] ?? item.orderType}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-700">{item.username}</td>
                <td className="px-4 py-3 font-mono font-medium text-zinc-900">{item.code}</td>
                <td className="px-4 py-3 text-xs text-zinc-600">
                  <div>Cân nặng: {formatWeight(item.weightKg)} Kg</div>
                  <div>Cân quy đổi: {formatWeight(item.volumetricWeightKg)} Kg</div>
                  <div>
                    {item.lengthCm} x {item.widthCm} x {item.heightCm} cm
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {timelineEntries(item).map((entry, idx, arr) => (
                    <div key={entry.label} className={idx === arr.length - 1 ? `font-medium ${STATUS_COLORS[item.status] ?? "text-zinc-700"}` : ""}>
                      {entry.label}: {formatDateTime(entry.atUtc)}
                      {entry.byUsername ? ` (${entry.byUsername})` : ""}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 font-medium ${STATUS_COLORS[item.status] ?? "text-zinc-500"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[item.status] ?? "bg-zinc-400"}`} />
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">{item.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.totalCount > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
          <span>
            Trang {data.page}/{totalPages} — {data.totalCount} kiện hàng
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
    </AdminLayout>
  );
}
