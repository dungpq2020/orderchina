"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import EditFeeCheckProductModal from "./EditFeeCheckProductModal";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface FeeCheckProductListPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

export interface FeeCheckProductListItem {
  id: string;
  priceTier: number;
  quantityFrom: number;
  quantityTo: number;
  price: number;
  isActive: boolean;
  createdAtUtc: string;
  createdByUsername: string | null;
  updatedAtUtc: string | null;
  updatedByUsername: string | null;
}

interface FeeCheckProductListResult {
  items: FeeCheckProductListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;

const TABS: { key: number; label: string }[] = [
  { key: 1, label: "Giá sản phẩm nhỏ hơn 10 ¥" },
  { key: 2, label: "Giá sản phẩm lớn hơn 10 ¥" },
];

function formatMoney(value: number): string {
  return `${value.toLocaleString("vi-VN")} đ`;
}

export default function FeeCheckProductListPage({ adminApiBaseUrl, loginUrl }: FeeCheckProductListPageProps) {
  const [priceTier, setPriceTier] = useState(1);
  const [editing, setEditing] = useState<FeeCheckProductListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchFeeCheckProduct = useCallback(
    async (targetPage: number, accessToken: string): Promise<FeeCheckProductListResult> => {
      const res = await fetch(
        `${adminApiBaseUrl}/fee-check-product/list?priceTier=${priceTier}&page=${targetPage}&pageSize=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách (status ${res.status}).`);
      }

      return (await res.json()) as FeeCheckProductListResult;
    },
    [adminApiBaseUrl, priceTier],
  );

  const { state, page, goToPage, logout, setState } = useAuthenticatedList<FeeCheckProductListResult>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchFeeCheckProduct,
  });

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceTier]);

  function handleCreated(created: FeeCheckProductListItem) {
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

  function handleUpdated(updated: FeeCheckProductListItem) {
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
      const res = await fetch(`${adminApiBaseUrl}/fee-check-product/${id}`, {
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
      <AdminLayout title="Phí kiểm hàng" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));

  return (
    <AdminLayout title="Phí kiểm hàng" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Cấu hình phí kiểm đếm</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Thêm mới
        </button>
      </div>

      <div className="mb-4 flex gap-6 border-b border-zinc-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setPriceTier(t.key)}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${
              priceTier === t.key ? "border-orange-500 text-orange-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-orange-400 text-white font-semibold">
            <tr>
              <th className="px-4 py-3 font-medium">Số lượng từ</th>
              <th className="px-4 py-3 font-medium">Số lượng đến</th>
              <th className="px-4 py-3 font-medium">Mức phí (VNĐ)</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày cập nhật</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  Chưa có bậc phí nào.
                </td>
              </tr>
            )}
            {data.items.map((f) => (
              <tr key={f.id} className="border-b border-zinc-100 last:border-0 align-top">
                <td className="px-4 py-3 text-zinc-700">{f.quantityFrom}</td>
                <td className="px-4 py-3 text-zinc-700">{f.quantityTo}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{formatMoney(f.price)}</td>
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
        <EditFeeCheckProductModal
          priceTier={priceTier}
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setCreating(false)}
          onSaved={handleCreated}
        />
      )}

      {editing && (
        <EditFeeCheckProductModal
          feeCheckProduct={editing}
          priceTier={priceTier}
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
