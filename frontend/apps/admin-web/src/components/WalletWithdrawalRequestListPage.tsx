"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface WalletWithdrawalRequestListPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

interface WalletWithdrawalRequestListItem {
  id: string;
  userId: string;
  username: string;
  amount: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolderName: string | null;
  note: string | null;
  status: number;
  createdAtUtc: string;
  createdByUsername: string | null;
  approvedAtUtc: string | null;
  approvedByUsername: string | null;
}

interface WalletWithdrawalRequestListResult {
  items: WalletWithdrawalRequestListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;

function formatMoney(value: number): string {
  return value.toLocaleString("vi-VN");
}

export default function WalletWithdrawalRequestListPage({ adminApiBaseUrl, loginUrl }: WalletWithdrawalRequestListPageProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchRequests = useCallback(
    async (targetPage: number, accessToken: string): Promise<WalletWithdrawalRequestListResult> => {
      const res = await fetch(`${adminApiBaseUrl}/wallet-withdrawal/list?page=${targetPage}&pageSize=${PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách (status ${res.status}).`);
      }

      return (await res.json()) as WalletWithdrawalRequestListResult;
    },
    [adminApiBaseUrl],
  );

  const { state, page, goToPage, logout } = useAuthenticatedList<WalletWithdrawalRequestListResult>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchRequests,
  });

  async function handleApprove(id: string, accessToken: string) {
    if (!window.confirm("Duyệt yêu cầu rút này? Tiền sẽ được trừ khỏi ví khách hàng.")) return;

    setApprovingId(id);
    try {
      const res = await fetch(`${adminApiBaseUrl}/wallet-withdrawal/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setToast(body?.error ?? `Duyệt thất bại (status ${res.status}).`);
        return;
      }

      goToPage(page);
      setToast("Đã duyệt — tiền đã được trừ khỏi ví.");
    } catch {
      setToast("Không kết nối được tới máy chủ.");
    } finally {
      setApprovingId(null);
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
      <AdminLayout title="Yêu cầu rút ví" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));

  return (
    <AdminLayout title="Yêu cầu rút ví" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Yêu cầu rút ví ({data.totalCount})</h1>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-orange-400 text-white font-semibold">
            <tr>
              <th className="px-4 py-3 font-medium">STT</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Số tiền rút (VNĐ)</th>
              <th className="px-4 py-3 font-medium">Ngân hàng nhận</th>
              <th className="px-4 py-3 font-medium">Nội dung</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày rút</th>
              <th className="px-4 py-3 font-medium">Ngày duyệt</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-zinc-400">
                  Chưa có yêu cầu rút nào.
                </td>
              </tr>
            )}
            {data.items.map((r, index) => {
              const isPending = r.status === 1;
              return (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0 align-top">
                  <td className="px-4 py-3 text-zinc-500">{(data.page - 1) * data.pageSize + index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">{r.username}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{formatMoney(r.amount)}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    <div>{r.bankName ?? "—"}</div>
                    <div className="mt-1 text-zinc-400">
                      {r.bankAccountNumber ?? "—"}
                      {r.bankAccountHolderName ? ` — ${r.bankAccountHolderName}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{r.note ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        isPending ? "text-zinc-500" : "text-green-600"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isPending ? "bg-zinc-400" : "bg-green-500"}`} />
                      {isPending ? "Chờ duyệt" : "Đã duyệt"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    <div>{formatDateTime(r.createdAtUtc)}</div>
                    <div className="mt-1 text-zinc-400">{r.createdByUsername ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {r.approvedAtUtc ? (
                      <>
                        <div>{formatDateTime(r.approvedAtUtc)}</div>
                        <div className="mt-1 text-zinc-400">{r.approvedByUsername ?? "—"}</div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isPending ? (
                      <button
                        onClick={() => handleApprove(r.id, accessToken)}
                        disabled={approvingId === r.id}
                        className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-600 transition hover:border-green-300 hover:bg-green-50 disabled:opacity-50"
                      >
                        Duyệt
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.totalCount > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
          <span>
            Trang {data.page}/{totalPages} — {data.totalCount} yêu cầu
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

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
