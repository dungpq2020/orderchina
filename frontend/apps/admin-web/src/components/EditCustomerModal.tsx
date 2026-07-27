"use client";

import { useEffect, useState } from "react";
import type { CustomerListItem } from "./CustomerListPage";

const ROLE_SALES_STAFF = 2;
const ROLE_PURCHASING_STAFF = 3;

interface StaffOption {
  id: string;
  username: string;
  fullName: string;
  role: number;
}

interface WarehouseOption {
  id: string;
  name: string;
  type: string;
}

interface ShippingMethodOption {
  id: string;
  name: string;
}

interface UserLevelOption {
  id: string;
  name: string;
  rank: number;
}

interface EditCustomerModalProps {
  customer: CustomerListItem;
  adminApiBaseUrl: string;
  accessToken: string;
  onClose: () => void;
  onSaved: (updated: Partial<CustomerListItem> & { id: string }) => void;
}

function toEmptyOr(value: number | null): string {
  return value === null || value === undefined ? "" : String(value);
}

function toNullableNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export default function EditCustomerModal({
  customer,
  adminApiBaseUrl,
  accessToken,
  onClose,
  onSaved,
}: EditCustomerModalProps) {
  const [fullName, setFullName] = useState(customer.fullName);
  const [email, setEmail] = useState(customer.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(customer.phoneNumber ?? "");
  const [address, setAddress] = useState(customer.address ?? "");
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [tier, setTier] = useState(customer.tier);
  const [customExchangeRate, setCustomExchangeRate] = useState(toEmptyOr(customer.customExchangeRate));
  const [customPurchaseFeePercent, setCustomPurchaseFeePercent] = useState(toEmptyOr(customer.customPurchaseFeePercent));
  const [customWeightFeePerKg, setCustomWeightFeePerKg] = useState(toEmptyOr(customer.customWeightFeePerKg));
  const [customVolumeFeePerCbm, setCustomVolumeFeePerCbm] = useState(toEmptyOr(customer.customVolumeFeePerCbm));
  const [customMinDepositPercent, setCustomMinDepositPercent] = useState(toEmptyOr(customer.customMinDepositPercent));
  const [salesStaffId, setSalesStaffId] = useState(customer.salesStaffId ?? "");
  const [orderStaffId, setOrderStaffId] = useState(customer.orderStaffId ?? "");
  const [chinaWarehouseId, setChinaWarehouseId] = useState(customer.chinaWarehouseId ?? "");
  const [vietnamWarehouseId, setVietnamWarehouseId] = useState(customer.vietnamWarehouseId ?? "");
  const [shippingMethodId, setShippingMethodId] = useState(customer.shippingMethodId ?? "");
  const [status, setStatus] = useState(customer.status);
  const [role, setRole] = useState(customer.role);

  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [chinaWarehouses, setChinaWarehouses] = useState<WarehouseOption[]>([]);
  const [vietnamWarehouses, setVietnamWarehouses] = useState<WarehouseOption[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>([]);
  const [userLevels, setUserLevels] = useState<UserLevelOption[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${accessToken}` };

    async function loadOptions() {
      const [staffRes, chinaRes, vnRes, shippingRes, userLevelRes] = await Promise.all([
        fetch(`${adminApiBaseUrl}/staff`, { headers }),
        fetch(`${adminApiBaseUrl}/warehouses?type=China`, { headers }),
        fetch(`${adminApiBaseUrl}/warehouses?type=Vietnam`, { headers }),
        fetch(`${adminApiBaseUrl}/shipping-methods`, { headers }),
        fetch(`${adminApiBaseUrl}/user-level/list`, { headers }),
      ]);

      if (staffRes.ok) setStaffOptions(await staffRes.json());
      if (chinaRes.ok) setChinaWarehouses(await chinaRes.json());
      if (vnRes.ok) setVietnamWarehouses(await vnRes.json());
      if (shippingRes.ok) setShippingMethods(await shippingRes.json());
      if (userLevelRes.ok) setUserLevels(await userLevelRes.json());
    }

    loadOptions().catch(() => {});
  }, [adminApiBaseUrl, accessToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (changePassword && !newPassword) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${adminApiBaseUrl}/customers/${customer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          fullName,
          email: email.trim() === "" ? null : email,
          phoneNumber: phoneNumber.trim() === "" ? null : phoneNumber,
          address: address.trim() === "" ? null : address,
          newPassword: changePassword ? newPassword : null,
          tier,
          customExchangeRate: toNullableNumber(customExchangeRate),
          customPurchaseFeePercent: toNullableNumber(customPurchaseFeePercent),
          customWeightFeePerKg: toNullableNumber(customWeightFeePerKg),
          customVolumeFeePerCbm: toNullableNumber(customVolumeFeePerCbm),
          customMinDepositPercent: toNullableNumber(customMinDepositPercent),
          salesStaffId: salesStaffId || null,
          orderStaffId: orderStaffId || null,
          chinaWarehouseId: chinaWarehouseId || null,
          vietnamWarehouseId: vietnamWarehouseId || null,
          shippingMethodId: shippingMethodId || null,
          status,
          role,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang rồi thử lại.");
          return;
        }
        const body = await res.json().catch(() => null);
        setError(body?.error ?? `Cập nhật thất bại (status ${res.status}).`);
        return;
      }

      const updated = await res.json();
      onSaved(updated);
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Cập nhật thông tin khách hàng</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700">Tài khoản</label>
              <input
                type="text"
                value={customer.username}
                disabled
                className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Họ tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Số điện thoại</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Địa chỉ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                id="change-password"
                type="checkbox"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <label htmlFor="change-password" className="text-sm font-medium text-zinc-700">
                Đổi mật khẩu?
              </label>
            </div>

            {changePassword && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự, gồm hoa, thường, số và ký tự đặc biệt."
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="border-t border-zinc-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">Cấu hình</h3>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Tỉ giá riêng (VNĐ)</label>
                <input
                  type="number"
                  value={customExchangeRate}
                  onChange={(e) => setCustomExchangeRate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Phí mua hàng riêng (%)</label>
                <input
                  type="number"
                  value={customPurchaseFeePercent}
                  onChange={(e) => setCustomPurchaseFeePercent(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Phí cân nặng riêng (VNĐ/Kg)</label>
                <input
                  type="number"
                  value={customWeightFeePerKg}
                  onChange={(e) => setCustomWeightFeePerKg(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Phí thể tích riêng tạm ẩn khỏi form — chưa dùng tới, giữ nguyên state/payload để không mất dữ liệu đã lưu. */}

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Phần trăm đặt cọc riêng (%)</label>
                <input
                  type="number"
                  value={customMinDepositPercent}
                  onChange={(e) => setCustomMinDepositPercent(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Nhân viên kinh doanh</label>
                <select
                  value={salesStaffId}
                  onChange={(e) => setSalesStaffId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— Chưa gán —</option>
                  {staffOptions.filter((s) => s.role === ROLE_SALES_STAFF).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Nhân viên đặt hàng</label>
                <select
                  value={orderStaffId}
                  onChange={(e) => setOrderStaffId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— Chưa gán —</option>
                  {staffOptions.filter((s) => s.role === ROLE_PURCHASING_STAFF).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Kho Trung Quốc</label>
                <select
                  value={chinaWarehouseId}
                  onChange={(e) => setChinaWarehouseId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— Chưa chọn —</option>
                  {chinaWarehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Kho Việt Nam</label>
                <select
                  value={vietnamWarehouseId}
                  onChange={(e) => setVietnamWarehouseId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— Chưa chọn —</option>
                  {vietnamWarehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Phương thức vận chuyển</label>
                <select
                  value={shippingMethodId}
                  onChange={(e) => setShippingMethodId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— Chưa chọn —</option>
                  {shippingMethods.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Cấp người dùng</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value={0}>— Chưa xếp hạng —</option>
                  {[...userLevels]
                    .sort((a, b) => a.rank - b.rank)
                    .map((level) => (
                      <option key={level.id} value={level.rank}>
                        {level.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value={1}>Chưa kích hoạt</option>
                  <option value={2}>Khoá tài khoản</option>
                  <option value={3}>Đã kích hoạt</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Quyền hạn</label>
                <select
                  value={role}
                  onChange={(e) => setRole(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value={1}>Khách hàng</option>
                  <option value={2}>Nhân viên kinh doanh</option>
                  <option value={3}>Nhân viên mua hàng</option>
                  <option value={4}>Nhân viên kho Trung Quốc</option>
                  <option value={5}>Nhân viên kho Việt Nam</option>
                  <option value={6}>Kế toán</option>
                </select>
              </div>
            </div>
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
