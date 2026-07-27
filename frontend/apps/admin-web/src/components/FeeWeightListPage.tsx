"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import EditFeeWeightModal from "./EditFeeWeightModal";

interface FeeWeightListPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

export interface FeeWeightListItem {
  id: string;
  orderType: number;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  weightFrom: number;
  weightTo: number;
  price: number;
  shippingMethodId: string;
  shippingMethodName: string;
  isActive: boolean;
  createdAtUtc: string;
  createdByUsername: string | null;
  updatedAtUtc: string | null;
  updatedByUsername: string | null;
}

interface FeeWeightListResult {
  items: FeeWeightListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;

export function orderTypeLabel(orderType: number): string {
  return orderType === 2 ? "Đơn ký gửi" : "Đơn mua hộ";
}

function formatMoney(value: number): string {
  return `${value.toLocaleString("vi-VN")} đ`;
}

export default function FeeWeightListPage({ adminApiBaseUrl, loginUrl }: FeeWeightListPageProps) {
  const [editing, setEditing] = useState<FeeWeightListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchFeeWeight = useCallback(
    async (targetPage: number, accessToken: string): Promise<FeeWeightListResult> => {
      const res = await fetch(`${adminApiBaseUrl}/fee-weight/list?page=${targetPage}&pageSize=${PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách (status ${res.status}).`);
      }

      return (await res.json()) as FeeWeightListResult;
    },
    [adminApiBaseUrl],
  );

  const { state, page, goToPage, logout, setState } = useAuthenticatedList<FeeWeightListResult>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchFeeWeight,
  });

  function handleCreated(created: FeeWeightListItem) {
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

  function handleUpdated(updated: FeeWeightListItem) {
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
      const res = await fetch(`${adminApiBaseUrl}/fee-weight/${id}`, {
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
      <AdminLayout title="Phí vận chuyển" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));

  return (
    <AdminLayout title="Phí vận chuyển" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">
          Phí vận chuyển TQ - VN ({data.totalCount})
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
              <th className="px-4 py-3 font-medium">Loại đơn hàng</th>
              <th className="px-4 py-3 font-medium">Từ kho</th>
              <th className="px-4 py-3 font-medium">Đến kho</th>
              <th className="px-4 py-3 font-medium">Cân nặng từ</th>
              <th className="px-4 py-3 font-medium">Cân nặng đến</th>
              <th className="px-4 py-3 font-medium">Giá</th>
              <th className="px-4 py-3 font-medium">Hình thức vc</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-zinc-400">
                  Chưa có bậc phí nào.
                </td>
              </tr>
            )}
            {data.items.map((f) => (
              <tr key={f.id} className="border-b border-zinc-100 last:border-0 align-top">
                <td className="px-4 py-3 font-medium text-blue-600">{orderTypeLabel(f.orderType)}</td>
                <td className="px-4 py-3 text-zinc-700">{f.fromWarehouseName}</td>
                <td className="px-4 py-3 text-zinc-700">{f.toWarehouseName}</td>
                <td className="px-4 py-3 text-zinc-700">{f.weightFrom}</td>
                <td className="px-4 py-3 text-zinc-700">{f.weightTo}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{formatMoney(f.price)}</td>
                <td className="px-4 py-3 text-zinc-700">{f.shippingMethodName}</td>
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
        <EditFeeWeightModal
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setCreating(false)}
          onSaved={handleCreated}
        />
      )}

      {editing && (
        <EditFeeWeightModal
          feeWeight={editing}
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
