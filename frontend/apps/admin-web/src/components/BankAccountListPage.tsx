"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import EditBankAccountModal from "./EditBankAccountModal";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface BankAccountListPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

export interface BankAccountListItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branch: string | null;
  qrCodeUrl: string | null;
  isActive: boolean;
  createdAtUtc: string;
  createdByUsername: string | null;
  updatedAtUtc: string | null;
  updatedByUsername: string | null;
}

export default function BankAccountListPage({ adminApiBaseUrl, loginUrl }: BankAccountListPageProps) {
  const [editing, setEditing] = useState<BankAccountListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchBankAccounts = useCallback(
    async (_page: number, accessToken: string): Promise<BankAccountListItem[]> => {
      const res = await fetch(`${adminApiBaseUrl}/bank-account/list`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách (status ${res.status}).`);
      }

      return (await res.json()) as BankAccountListItem[];
    },
    [adminApiBaseUrl],
  );

  const { state, logout, setState } = useAuthenticatedList<BankAccountListItem[]>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchBankAccounts,
  });

  function handleCreated(created: BankAccountListItem) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return { ...prev, data: [created, ...prev.data] };
    });
    setCreating(false);
    setToast("Thêm mới thành công");
  }

  function handleUpdated(updated: BankAccountListItem) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return { ...prev, data: prev.data.map((b) => (b.id === updated.id ? updated : b)) };
    });
    setEditing(null);
    setToast("Cập nhật thành công");
  }

  async function handleDelete(id: string, accessToken: string) {
    if (!window.confirm("Xoá tài khoản ngân hàng này?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${adminApiBaseUrl}/bank-account/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok && res.status !== 404) {
        setToast(`Xoá thất bại (status ${res.status}).`);
        return;
      }

      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return { ...prev, data: prev.data.filter((b) => b.id !== id) };
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
      <AdminLayout title="Danh sách ngân hàng" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;

  return (
    <AdminLayout title="Danh sách ngân hàng" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Danh sách ngân hàng ({data.length})</h1>
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
              <th className="px-4 py-3 font-medium">Ngân hàng</th>
              <th className="px-4 py-3 font-medium">Số tài khoản</th>
              <th className="px-4 py-3 font-medium">Chủ tài khoản</th>
              <th className="px-4 py-3 font-medium">Chi nhánh</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Cập nhật mới nhất</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-400">
                  Chưa có tài khoản ngân hàng nào.
                </td>
              </tr>
            )}
            {data.map((b) => (
              <tr key={b.id} className="border-b border-zinc-100 last:border-0 align-top">
                <td className="px-4 py-3 font-semibold text-zinc-900">{b.bankName}</td>
                <td className="px-4 py-3 text-zinc-700">{b.accountNumber}</td>
                <td className="px-4 py-3 text-zinc-700">{b.accountHolderName}</td>
                <td className="px-4 py-3 text-zinc-700">{b.branch ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      b.isActive ? "text-green-600" : "text-zinc-500"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${b.isActive ? "bg-green-500" : "bg-zinc-400"}`} />
                    {b.isActive ? "Đang áp dụng" : "Tạm ngưng"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {b.updatedAtUtc ? (
                    <>
                      <div>{formatDateTime(b.updatedAtUtc)}</div>
                      <div className="mt-1 text-zinc-400">{b.updatedByUsername ?? "—"}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(b)}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200"
                    >
                      Cập nhật
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, accessToken)}
                      disabled={deletingId === b.id}
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
          <span>Trang 1/1 — {data.length} tài khoản</span>
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
        <EditBankAccountModal
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setCreating(false)}
          onSaved={handleCreated}
        />
      )}

      {editing && (
        <EditBankAccountModal
          bankAccount={editing}
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
