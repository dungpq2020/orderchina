"use client";

import { useState } from "react";
import type { FeeBuyProListItem } from "./FeeBuyProListPage";

function formatVnd(digitsOnly: string): string {
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("vi-VN");
}

function toDigitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

interface EditFeeBuyProModalProps {
  feeBuyPro?: FeeBuyProListItem;
  adminApiBaseUrl: string;
  accessToken: string;
  onClose: () => void;
  onSaved: (item: FeeBuyProListItem) => void;
}

export default function EditFeeBuyProModal({
  feeBuyPro,
  adminApiBaseUrl,
  accessToken,
  onClose,
  onSaved,
}: EditFeeBuyProModalProps) {
  const isEditing = !!feeBuyPro;

  const [priceFrom, setPriceFrom] = useState(feeBuyPro ? String(Math.round(feeBuyPro.priceFrom)) : "");
  const [priceTo, setPriceTo] = useState(feeBuyPro ? String(Math.round(feeBuyPro.priceTo)) : "");
  const [percent, setPercent] = useState(feeBuyPro ? String(feeBuyPro.percent) : "");
  const [isActive, setIsActive] = useState(feeBuyPro?.isActive ?? true);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        isEditing ? `${adminApiBaseUrl}/fee-buy-pro/${feeBuyPro!.id}` : `${adminApiBaseUrl}/fee-buy-pro`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            priceFrom: Number(priceFrom),
            priceTo: Number(priceTo),
            percent: Number(percent),
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

      const saved = (await res.json()) as FeeBuyProListItem;
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
          {isEditing ? "Cập nhật bậc phí" : "Thêm bậc phí mới"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Giá từ</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatVnd(priceFrom)}
                  onChange={(e) => setPriceFrom(toDigitsOnly(e.target.value))}
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-9 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-400">
                  đ
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Giá đến</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatVnd(priceTo)}
                  onChange={(e) => setPriceTo(toDigitsOnly(e.target.value))}
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-9 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-400">
                  đ
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Phần trăm phí (%)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="fee-buy-pro-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <label htmlFor="fee-buy-pro-active" className="text-sm font-medium text-zinc-700">
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
