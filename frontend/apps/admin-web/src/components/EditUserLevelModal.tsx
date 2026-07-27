"use client";

import { useState } from "react";
import type { UserLevelListItem } from "./UserLevelListPage";

interface EditUserLevelModalProps {
  userLevel?: UserLevelListItem;
  adminApiBaseUrl: string;
  accessToken: string;
  onClose: () => void;
  onSaved: (item: UserLevelListItem) => void;
}

export default function EditUserLevelModal({
  userLevel,
  adminApiBaseUrl,
  accessToken,
  onClose,
  onSaved,
}: EditUserLevelModalProps) {
  const isEditing = !!userLevel;

  const [name, setName] = useState(userLevel?.name ?? "");
  const [rank, setRank] = useState(userLevel ? String(userLevel.rank) : "");
  const [purchaseFeeDiscountPercent, setPurchaseFeeDiscountPercent] = useState(
    String(userLevel?.purchaseFeeDiscountPercent ?? 0),
  );
  const [shippingFeeDiscountPercent, setShippingFeeDiscountPercent] = useState(
    String(userLevel?.shippingFeeDiscountPercent ?? 0),
  );
  const [minDepositPercent, setMinDepositPercent] = useState(String(userLevel?.minDepositPercent ?? 0));

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        isEditing ? `${adminApiBaseUrl}/user-level/${userLevel!.id}` : `${adminApiBaseUrl}/user-level`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...(isEditing ? {} : { name, rank: Number(rank) }),
            purchaseFeeDiscountPercent: Number(purchaseFeeDiscountPercent),
            shippingFeeDiscountPercent: Number(shippingFeeDiscountPercent),
            minDepositPercent: Number(minDepositPercent),
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

      const saved = (await res.json()) as UserLevelListItem;
      onSaved(saved);
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          {isEditing ? `Cập nhật cấp độ ${userLevel!.name}` : "Thêm cấp độ mới"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Tên cấp độ</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Thứ tự bậc</label>
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Chiết khấu phí mua hàng (%)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={purchaseFeeDiscountPercent}
              onChange={(e) => setPurchaseFeeDiscountPercent(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Chiết khấu phí vận chuyển (%)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={shippingFeeDiscountPercent}
              onChange={(e) => setShippingFeeDiscountPercent(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Đặt cọc tối thiểu (%)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={minDepositPercent}
              onChange={(e) => setMinDepositPercent(e.target.value)}
              required
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
