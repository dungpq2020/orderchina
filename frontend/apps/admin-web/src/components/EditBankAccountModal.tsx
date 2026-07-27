"use client";

import { useState } from "react";
import type { BankAccountListItem } from "./BankAccountListPage";

interface EditBankAccountModalProps {
  bankAccount?: BankAccountListItem;
  adminApiBaseUrl: string;
  accessToken: string;
  onClose: () => void;
  onSaved: (item: BankAccountListItem) => void;
}

export default function EditBankAccountModal({
  bankAccount,
  adminApiBaseUrl,
  accessToken,
  onClose,
  onSaved,
}: EditBankAccountModalProps) {
  const isEditing = !!bankAccount;

  const [bankName, setBankName] = useState(bankAccount?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(bankAccount?.accountNumber ?? "");
  const [accountHolderName, setAccountHolderName] = useState(bankAccount?.accountHolderName ?? "");
  const [branch, setBranch] = useState(bankAccount?.branch ?? "");
  const [qrCodeUrl, setQrCodeUrl] = useState(bankAccount?.qrCodeUrl ?? "");
  const [isActive, setIsActive] = useState(bankAccount?.isActive ?? true);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        isEditing ? `${adminApiBaseUrl}/bank-account/${bankAccount!.id}` : `${adminApiBaseUrl}/bank-account`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            bankName,
            accountNumber,
            accountHolderName,
            branch: branch.trim() === "" ? null : branch,
            qrCodeUrl: qrCodeUrl.trim() === "" ? null : qrCodeUrl,
            isActive,
          }),
        },
      );

      if (!res.ok) {
        if (res.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang rồi thử lại.");
          return;
        }
        const body = await res.json().catch(() => null);
        setError(body?.error ?? `Lưu thất bại (status ${res.status}).`);
        return;
      }

      const saved = (await res.json()) as BankAccountListItem;
      onSaved(saved);
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          {isEditing ? "Cập nhật tài khoản ngân hàng" : "Thêm tài khoản ngân hàng mới"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Tên ngân hàng</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Số tài khoản</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Chủ tài khoản</label>
            <input
              type="text"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Chi nhánh</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Link ảnh QR (nếu có)</label>
            <input
              type="text"
              value={qrCodeUrl}
              onChange={(e) => setQrCodeUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="bank-account-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <label htmlFor="bank-account-active" className="text-sm font-medium text-zinc-700">
              Đang áp dụng
            </label>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
