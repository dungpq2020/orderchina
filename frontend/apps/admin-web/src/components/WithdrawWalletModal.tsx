"use client";

import { useState } from "react";

interface WithdrawWalletModalProps {
  customerId: string;
  customerUsername: string;
  currentWalletBalance: number;
  adminApiBaseUrl: string;
  accessToken: string;
  onClose: () => void;
  onSaved: (customerId: string, newWalletBalance: number, status: number) => void;
}

function formatVnd(digitsOnly: string): string {
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("vi-VN");
}

function toDigitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export default function WithdrawWalletModal({
  customerId,
  customerUsername,
  currentWalletBalance,
  adminApiBaseUrl,
  accessToken,
  onClose,
  onSaved,
}: WithdrawWalletModalProps) {
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolderName, setBankAccountHolderName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState(`${customerUsername} rút tiền`);
  const [status, setStatus] = useState(2);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const amountValue = Number(amount || 0);
  const insufficientBalance = status === 2 && amountValue > currentWalletBalance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${adminApiBaseUrl}/wallet-withdrawal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: customerId,
          amount: amountValue,
          bankName: bankName.trim() === "" ? null : bankName,
          bankAccountNumber: bankAccountNumber.trim() === "" ? null : bankAccountNumber,
          bankAccountHolderName: bankAccountHolderName.trim() === "" ? null : bankAccountHolderName,
          note: note.trim() === "" ? null : note,
          status,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang rồi thử lại.");
          return;
        }
        const body = await res.json().catch(() => null);
        setError(body?.error ?? `Rút ví thất bại (status ${res.status}).`);
        return;
      }

      const body = (await res.json()) as { walletBalance: number };
      onSaved(customerId, body.walletBalance, status);
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Rút ví cho {customerUsername}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Ví hiện tại</label>
            <input
              type="text"
              disabled
              value={`${currentWalletBalance.toLocaleString("vi-VN")} đ`}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
            >
              <option value={1}>Chờ duyệt</option>
              <option value={2}>Đã duyệt</option>
            </select>
            {status === 1 && (
              <p className="mt-1 text-xs text-zinc-500">Chờ duyệt sẽ chưa trừ tiền khỏi ví — cần duyệt sau ở trang Yêu cầu rút ví.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Số tiền cần rút</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formatVnd(amount)}
                onChange={(e) => setAmount(toDigitsOnly(e.target.value))}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-9 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-400">
                đ
              </span>
            </div>
            {insufficientBalance && (
              <p className="mt-1 text-xs text-red-600">Số tiền vượt quá số dư ví hiện tại.</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Ngân hàng nhận</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="VD: Vietcombank"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Số tài khoản</label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Chủ tài khoản</label>
            <input
              type="text"
              value={bankAccountHolderName}
              onChange={(e) => setBankAccountHolderName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Nội dung</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Trở về
            </button>
            <button
              type="submit"
              disabled={saving || !amount}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
            >
              {saving ? "Đang rút..." : "Rút ví"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
