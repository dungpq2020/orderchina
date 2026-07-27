"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import EditFeeBuyProModal from "./EditFeeBuyProModal";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface FeeBuyProListPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

export interface FeeBuyProListItem {
  id: string;
  priceFrom: number;
  priceTo: number;
  percent: number;
  isActive: boolean;
  createdAtUtc: string;
  createdByUsername: string | null;
  updatedAtUtc: string | null;
  updatedByUsername: string | null;
}

interface FeeBuyProListResult {
  items: FeeBuyProListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;

function formatMoney(value: number): string {
  return `${value.toLocaleString("vi-VN")} đ`;
}

export default function FeeBuyProListPage({ adminApiBaseUrl, loginUrl }: FeeBuyProListPageProps) {
  const [editing, setEditing] = useState<FeeBuyProListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchFeeBuyPro = useCallback(
    async (targetPage: number, accessToken: string): Promise<FeeBuyProListResult> => {
      const res = await fetch(`${adminApiBaseUrl}/fee-buy-pro/list?page=${targetPage}&pageSize=${PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách (status ${res.status}).`);
      }

      return (await res.json()) as FeeBuyProListResult;
    },
    [adminApiBaseUrl],
  );

  const { state, page, goToPage, logout, setState } = useAuthenticatedList<FeeBuyProListResult>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchFeeBuyPro,
  });

  function handleCreated(created: FeeBuyProListItem) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          items: [created, ...prev.data.items],
          totalCount: prev.data.totalCount + 1,
        },
      };
    });
    setCreating(false);
    setToast("Thêm mới thành công");
  }

  function handleUpdated(updated: FeeBuyProListItem) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          items: prev.data.items.map((f) => (f.id === updated.id ? updated : f)),
        },
      };
    });
    setEditing(null);
    setToast("Cập nhật thành công");
  }

  async function handleDelete(id: string, accessToken: string) {
    if (!window.confirm("Xoá bậc phí này?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${adminApiBaseUrl}/fee-buy-pro/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok && res.status !== 404) {
        setToast(`Xoá thất bại (status ${res.status}).`);
        return;
      }

      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            items: prev.data.items.filter((f) => f.id !== id),
            totalCount: Math.max(0, prev.data.totalCount - 1),
          },
        };
      });
      setToast("Đã xoá");
    } catch {
      setToast("Không kết nối được tới máy chủ.");
    } finally {
      setDeletingId(null);
    }
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
      <AdminLayout title="Phí mua hàng" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));

  return (
    <AdminLayout title="Phí mua hàng" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">
          Phí mua hàng ({data.totalCount})
        </h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Thêm mới
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-orange-400 text-white font-semibold">
            <tr>
              <th className="px-4 py-3 font-medium">Giá từ</th>
              <th className="px-4 py-3 font-medium">Giá đến</th>
              <th className="px-4 py-3 font-medium">Phần trăm</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium">Ngày cập nhật</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-400">
                  Chưa có bậc phí nào.
                </td>
              </tr>
            )}
            {data.items.map((f) => (
              <tr key={f.id} className="border-b border-zinc-100 last:border-0 align-top">
                <td className="px-4 py-3 font-medium text-zinc-900">{formatMoney(f.priceFrom)}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{formatMoney(f.priceTo)}</td>
                <td className="px-4 py-3 text-zinc-700">{f.percent}%</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      f.isActive ? "text-green-600" : "text-zinc-500"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${f.isActive ? "bg-green-500" : "bg-zinc-400"}`} />
                    {f.isActive ? "Đang áp dụng" : "Tạm ngưng"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  <div>{formatDateTime(f.createdAtUtc)}</div>
                  <div className="mt-1 text-zinc-400">{f.createdByUsername ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {f.updatedAtUtc ? (
                    <>
                      <div>{formatDateTime(f.updatedAtUtc)}</div>
                      <div className="mt-1 text-zinc-400">{f.updatedByUsername ?? "—"}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(f)}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200"
                    >
                      Cập nhật
                    </button>
                    <button
                      onClick={() => handleDelete(f.id, accessToken)}
                      disabled={deletingId === f.id}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                    >
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.totalCount > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
          <span>
            Trang {data.page}/{totalPages} — {data.totalCount} bậc phí
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

      {creating && (
        <EditFeeBuyProModal
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setCreating(false)}
          onSaved={handleCreated}
        />
      )}

      {editing && (
        <EditFeeBuyProModal
          feeBuyPro={editing}
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setEditing(null)}
          onSaved={handleUpdated}
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
