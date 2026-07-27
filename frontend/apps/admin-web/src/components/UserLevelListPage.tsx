"use client";

import { useCallback, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import EditUserLevelModal from "./EditUserLevelModal";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface UserLevelListPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

export interface UserLevelListItem {
  id: string;
  name: string;
  rank: number;
  purchaseFeeDiscountPercent: number;
  shippingFeeDiscountPercent: number;
  minDepositPercent: number;
  isActive: boolean;
  createdAtUtc: string;
  createdByUsername: string | null;
  updatedAtUtc: string | null;
  updatedByUsername: string | null;
}

export default function UserLevelListPage({ adminApiBaseUrl, loginUrl }: UserLevelListPageProps) {
  const [editing, setEditing] = useState<UserLevelListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUserLevels = useCallback(
    async (_page: number, accessToken: string): Promise<UserLevelListItem[]> => {
      const res = await fetch(`${adminApiBaseUrl}/user-level/list`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách (status ${res.status}).`);
      }

      return (await res.json()) as UserLevelListItem[];
    },
    [adminApiBaseUrl],
  );

  const { state, logout, setState } = useAuthenticatedList<UserLevelListItem[]>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchUserLevels,
  });

  function handleCreated(created: UserLevelListItem) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return { ...prev, data: [...prev.data, created].sort((a, b) => a.rank - b.rank) };
    });
    setCreating(false);
    setToast("Thêm mới thành công");
    setTimeout(() => setToast(null), 2500);
  }

  function handleUpdated(updated: UserLevelListItem) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        data: prev.data.map((l) => (l.id === updated.id ? updated : l)),
      };
    });
    setEditing(null);
    setToast("Cập nhật thành công");
    setTimeout(() => setToast(null), 2500);
  }

  async function handleDelete(id: string, accessToken: string) {
    if (!window.confirm("Xoá cấp độ này?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${adminApiBaseUrl}/user-level/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok && res.status !== 404) {
        setToast(`Xoá thất bại (status ${res.status}).`);
        setTimeout(() => setToast(null), 2500);
        return;
      }

      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return { ...prev, data: prev.data.filter((l) => l.id !== id) };
      });
      setToast("Đã xoá");
      setTimeout(() => setToast(null), 2500);
    } catch {
      setToast("Không kết nối được tới máy chủ.");
      setTimeout(() => setToast(null), 2500);
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
      <AdminLayout title="Ưu đãi khách" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;

  return (
    <AdminLayout title="Ưu đãi khách" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Ưu đãi khách ({data.length})</h1>
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
              <th className="px-4 py-3 font-medium">Cấp độ</th>
              <th className="px-4 py-3 font-medium">Chiết khấu phí mua hàng (%)</th>
              <th className="px-4 py-3 font-medium">Chiết khấu phí vận chuyển (%)</th>
              <th className="px-4 py-3 font-medium">Đặt cọc tối thiểu (%)</th>
              <th className="px-4 py-3 font-medium">Ngày cập nhật</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.map((l) => (
              <tr key={l.id} className="border-b border-zinc-100 last:border-0 align-top">
                <td className="px-4 py-3 font-semibold text-zinc-900">{l.name}</td>
                <td className="px-4 py-3 text-zinc-700">{l.purchaseFeeDiscountPercent}%</td>
                <td className="px-4 py-3 text-zinc-700">{l.shippingFeeDiscountPercent}%</td>
                <td className="px-4 py-3 text-zinc-700">{l.minDepositPercent}%</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {l.updatedAtUtc ? (
                    <>
                      <div>{formatDateTime(l.updatedAtUtc)}</div>
                      <div className="mt-1 text-zinc-400">{l.updatedByUsername ?? "—"}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(l)}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200"
                    >
                      Cập nhật
                    </button>
                    <button
                      onClick={() => handleDelete(l.id, accessToken)}
                      disabled={deletingId === l.id}
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

      {data.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
          <span>Trang 1/1 — {data.length} cấp độ</span>
          <div className="flex gap-2">
            <button
              disabled
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>
            <button
              disabled
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {creating && (
        <EditUserLevelModal
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setCreating(false)}
          onSaved={handleCreated}
        />
      )}

      {editing && (
        <EditUserLevelModal
          userLevel={editing}
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
