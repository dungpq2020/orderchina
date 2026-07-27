"use client";

import { useEffect, useState } from "react";
import type { FeeWeightListItem } from "./FeeWeightListPage";

interface WarehouseOption {
  id: string;
  name: string;
}

interface ShippingMethodOption {
  id: string;
  name: string;
}

interface EditFeeWeightModalProps {
  feeWeight?: FeeWeightListItem;
  adminApiBaseUrl: string;
  accessToken: string;
  onClose: () => void;
  onSaved: (item: FeeWeightListItem) => void;
}

function formatVnd(digitsOnly: string): string {
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("vi-VN");
}

function toDigitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export default function EditFeeWeightModal({
  feeWeight,
  adminApiBaseUrl,
  accessToken,
  onClose,
  onSaved,
}: EditFeeWeightModalProps) {
  const isEditing = !!feeWeight;

  const [orderType, setOrderType] = useState(feeWeight?.orderType ?? 1);
  const [fromWarehouseId, setFromWarehouseId] = useState(feeWeight?.fromWarehouseId ?? "");
  const [toWarehouseId, setToWarehouseId] = useState(feeWeight?.toWarehouseId ?? "");
  const [weightFrom, setWeightFrom] = useState(feeWeight ? String(feeWeight.weightFrom) : "");
  const [weightTo, setWeightTo] = useState(feeWeight ? String(feeWeight.weightTo) : "");
  const [price, setPrice] = useState(feeWeight ? String(Math.round(feeWeight.price)) : "");
  const [shippingMethodId, setShippingMethodId] = useState(feeWeight?.shippingMethodId ?? "");
  const [isActive, setIsActive] = useState(feeWeight?.isActive ?? true);

  const [chinaWarehouses, setChinaWarehouses] = useState<WarehouseOption[]>([]);
  const [vietnamWarehouses, setVietnamWarehouses] = useState<WarehouseOption[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${accessToken}` };

    async function loadOptions() {
      const [chinaRes, vnRes, shippingRes] = await Promise.all([
        fetch(`${adminApiBaseUrl}/warehouses?type=China`, { headers }),
        fetch(`${adminApiBaseUrl}/warehouses?type=Vietnam`, { headers }),
        fetch(`${adminApiBaseUrl}/shipping-methods`, { headers }),
      ]);

      if (chinaRes.ok) setChinaWarehouses(await chinaRes.json());
      if (vnRes.ok) setVietnamWarehouses(await vnRes.json());
      if (shippingRes.ok) setShippingMethods(await shippingRes.json());
    }

    loadOptions().catch(() => {});
  }, [adminApiBaseUrl, accessToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fromWarehouseId || !toWarehouseId || !shippingMethodId) {
      setError("Vui lòng chọn đầy đủ kho đi, kho đến và hình thức vận chuyển.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        isEditing ? `${adminApiBaseUrl}/fee-weight/${feeWeight!.id}` : `${adminApiBaseUrl}/fee-weight`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            orderType,
            fromWarehouseId,
            toWarehouseId,
            weightFrom: Number(weightFrom),
            weightTo: Number(weightTo),
            price: Number(price),
            shippingMethodId,
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

      const saved = (await res.json()) as FeeWeightListItem;
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
          {isEditing ? "Cập nhật phí vận chuyển" : "Thêm phí vận chuyển mới"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Loại đơn hàng</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
            >
              <option value={1}>Đơn mua hộ</option>
              <option value={2}>Đơn ký gửi</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Từ kho</label>
              <select
                value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="">— Chọn kho —</option>
                {chinaWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Đến kho</label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="">— Chọn kho —</option>
                {vietnamWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Cân nặng từ (kg)</label>
              <input
                type="number"
                min={0}
                step="any"
                value={weightFrom}
                onChange={(e) => setWeightFrom(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Cân nặng đến (kg)</label>
              <input
                type="number"
                min={0}
                step="any"
                value={weightTo}
                onChange={(e) => setWeightTo(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Giá</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formatVnd(price)}
                onChange={(e) => setPrice(toDigitsOnly(e.target.value))}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-9 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-400">
                đ
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Hình thức vận chuyển</label>
            <select
              value={shippingMethodId}
              onChange={(e) => setShippingMethodId(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">— Chọn hình thức —</option>
              {shippingMethods.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="fee-weight-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <label htmlFor="fee-weight-active" className="text-sm font-medium text-zinc-700">
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
