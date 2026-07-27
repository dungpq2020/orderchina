"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface WalletTransactionHistoryPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

interface WalletTransactionListItem {
  id: string;
  amount: number;
  balanceAfter: number;
  type: number;
  description: string | null;
  createdAtUtc: string;
  createdByUsername: string | null;
}

interface WalletTransactionHistoryResult {
  username: string;
  walletBalance: number;
  items: WalletTransactionListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;

function transactionTypeLabel(type: number): string {
  switch (type) {
    case 1:
      return "Nạp tiền";
    case 2:
      return "Rút tiền";
    case 3:
      return "Đặt cọc";
    case 4:
      return "Thanh toán đơn";
    case 5:
      return "Hoàn tiền huỷ đơn";
    default:
      return "Khác";
  }
}

function formatMoney(value: number): string {
  return Math.abs(value).toLocaleString("vi-VN");
}

export default function WalletTransactionHistoryPage({ adminApiBaseUrl, loginUrl }: WalletTransactionHistoryPageProps) {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";

  const [result, setResult] = useState<WalletTransactionHistoryResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { state, logout } = useAuthenticatedList<null>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: async () => null,
  });

  useEffect(() => {
    if (state.status !== "ready" || !userId) return;

    fetch(`${adminApiBaseUrl}/wallet-recharge/transactions?userId=${userId}&page=${page}&pageSize=${PAGE_SIZE}`, {
      headers: { Authorization: `Bearer ${state.accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi tải lịch sử (status ${res.status}).`);
        return res.json();
      })
      .then((data: WalletTransactionHistoryResult) => setResult(data))
      .catch(() => setLoadError("Không tải được lịch sử giao dịch."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminApiBaseUrl, userId, page, state.status === "ready" ? state.accessToken : null]);

  if (state.status === "loading" || state.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Đang tải...</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <AdminLayout title="Lịch sử giao dịch" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Lịch sử giao dịch"
      adminApiBaseUrl={adminApiBaseUrl}
      accessToken={state.accessToken}
      onLogout={logout}
    >
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Lịch sử giao dịch</h1>

      <div className="mb-4 flex items-center justify-between">
        {result && (
          <div className="inline-flex flex-col gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
            <span className="font-semibold text-orange-600">{result.username}</span>
            <span className="font-semibold text-blue-600">{formatMoney(result.walletBalance)} VNĐ</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            disabled
            title="Sắp có"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-400 disabled:cursor-not-allowed"
          >
            Bộ lọc
          </button>
          <button
            disabled
            title="Sắp có"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-400 disabled:cursor-not-allowed"
          >
            Xuất Excel
          </button>
        </div>
      </div>

      {loadError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</p>}

      {!loadError && !result && <p className="text-sm text-zinc-500">Đang tải...</p>}

      {result && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-orange-400 text-white font-semibold">
              <tr>
                <th className="px-4 py-3 font-medium">STT</th>
                <th className="px-4 py-3 font-medium">Ngày giao dịch</th>
                <th className="px-4 py-3 font-medium">Nội dung</th>
                <th className="px-4 py-3 font-medium">Loại giao dịch</th>
                <th className="px-4 py-3 font-medium">Số tiền (VNĐ)</th>
                <th className="px-4 py-3 font-medium">Số dư (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                    Chưa có giao dịch nào.
                  </td>
                </tr>
              )}
              {result.items.map((t, index) => {
                const isCredit = t.amount >= 0;
                return (
                  <tr key={t.id} className="border-b border-zinc-100 last:border-0 align-top">
                    <td className="px-4 py-3 text-zinc-500">{(result.page - 1) * result.pageSize + index + 1}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{formatDateTime(t.createdAtUtc)}</td>
                    <td className="px-4 py-3 text-zinc-700">{t.description ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-700">{transactionTypeLabel(t.type)}</td>
                    <td className={`px-4 py-3 font-semibold ${isCredit ? "text-green-600" : "text-red-600"}`}>
                      {isCredit ? "+" : "-"}
                      {formatMoney(t.amount)}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{formatMoney(t.balanceAfter)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {result && result.totalCount > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
          <span>
            Trang {result.page}/{Math.max(1, Math.ceil(result.totalCount / result.pageSize))} — {result.totalCount} giao dịch
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={result.page <= 1}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Trước
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={result.page >= Math.ceil(result.totalCount / result.pageSize)}
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
