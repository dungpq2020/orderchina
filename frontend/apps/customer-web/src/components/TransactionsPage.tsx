"use client";

import { useCallback } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";
import CustomerLayout from "./CustomerLayout";

interface TransactionsPageProps {
  customerApiBaseUrl: string;
  loginUrl: string;
}

interface MeInfo {
  username: string;
  fullName: string | null;
  walletBalance: number;
  exchangeRate: number;
  hotline: string | null;
}

interface WalletTransactionItem {
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
  items: WalletTransactionItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;

const TRANSACTION_TYPE_LABELS: Record<number, string> = {
  1: "Nạp tiền",
  2: "Rút tiền",
  3: "Đặt cọc đơn hàng",
  4: "Thanh toán đơn hàng",
  5: "Hoàn tiền huỷ đơn",
};

const TRANSACTION_TYPE_COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-700",
  2: "bg-red-100 text-red-700",
  3: "bg-orange-100 text-orange-700",
  4: "bg-blue-100 text-blue-700",
  5: "bg-teal-100 text-teal-700",
};

function formatMoney(value: number): string {
  return Math.round(value).toLocaleString("vi-VN");
}

export default function TransactionsPage({ customerApiBaseUrl, loginUrl }: TransactionsPageProps) {
  const fetchMe = useCallback(async (accessToken: string): Promise<MeInfo> => {
    const res = await fetch(`${customerApiBaseUrl}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Lỗi tải thông tin tài khoản (status ${res.status}).`);
    }
    return (await res.json()) as MeInfo;
  }, [customerApiBaseUrl]);

  const fetchTransactions = useCallback(
    async (targetPage: number, accessToken: string): Promise<{ me: MeInfo; transactions: WalletTransactionHistoryResult }> => {
      const [me, transactions] = await Promise.all([
        fetchMe(accessToken),
        fetch(`${customerApiBaseUrl}/wallet/transactions?page=${targetPage}&pageSize=${PAGE_SIZE}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((res) => {
          if (!res.ok) {
            throw new Error(`Lỗi tải lịch sử giao dịch (status ${res.status}).`);
          }
          return res.json() as Promise<WalletTransactionHistoryResult>;
        }),
      ]);
      return { me, transactions };
    },
    [customerApiBaseUrl, fetchMe],
  );

  const { state, page, goToPage, logout } = useAuthenticatedList<{ me: MeInfo; transactions: WalletTransactionHistoryResult }>({
    adminApiBaseUrl: customerApiBaseUrl,
    loginUrl,
    fetchPage: fetchTransactions,
  });

  if (state.status === "loading" || state.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Đang tải...</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </div>
    );
  }

  const { me, transactions } = state.data;
  const totalPages = Math.max(1, Math.ceil(transactions.totalCount / transactions.pageSize));

  return (
    <CustomerLayout
      title="Lịch sử giao dịch"
      fullName={me.fullName}
      username={me.username}
      walletBalance={me.walletBalance}
      exchangeRate={me.exchangeRate}
      hotline={me.hotline}
      onLogout={logout}
    >
      {() => (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold text-zinc-900">Lịch sử giao dịch ({transactions.totalCount})</h1>
            <p className="text-sm text-zinc-500">
              Số dư hiện tại: <span className="font-semibold text-green-600">{formatMoney(me.walletBalance)} đ</span>
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-blue-700 font-semibold text-white">
                <tr>
                  <th className="px-4 py-3 text-center font-medium">Thời gian</th>
                  <th className="px-4 py-3 text-center font-medium">Nội dung</th>
                  <th className="px-4 py-3 text-center font-medium">Loại giao dịch</th>
                  <th className="px-4 py-3 text-center font-medium">Số tiền</th>
                  <th className="px-4 py-3 text-center font-medium">Số dư còn lại</th>
                </tr>
              </thead>
              <tbody>
                {transactions.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                      Chưa có giao dịch nào.
                    </td>
                  </tr>
                )}
                {transactions.items.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 align-middle last:border-0">
                    <td className="px-4 py-3 text-center text-xs text-zinc-500">{formatDateTime(t.createdAtUtc)}</td>
                    <td className="px-4 py-3 text-center text-xs text-zinc-500">{t.description ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          TRANSACTION_TYPE_COLORS[t.type] ?? "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {TRANSACTION_TYPE_LABELS[t.type] ?? t.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-center text-sm font-semibold ${t.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {t.amount >= 0 ? "+" : ""}
                      {formatMoney(t.amount)} đ
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-zinc-700">{formatMoney(t.balanceAfter)} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.totalCount > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
              <span>
                Trang {transactions.page}/{totalPages} — {transactions.totalCount} giao dịch
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
        </div>
      )}
    </CustomerLayout>
  );
}
