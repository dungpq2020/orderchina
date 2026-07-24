"use client";

import { useState } from "react";
import type { AdminListItem } from "./AdminListPage";

interface EditAdminModalProps {
  admin: AdminListItem;
  adminApiBaseUrl: string;
  accessToken: string;
  onClose: () => void;
  onSaved: (updated: Partial<AdminListItem> & { id: string }) => void;
}

export default function EditAdminModal({ admin, adminApiBaseUrl, accessToken, onClose, onSaved }: EditAdminModalProps) {
  const [fullName, setFullName] = useState(admin.fullName);
  const [email, setEmail] = useState(admin.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(admin.phoneNumber ?? "");
  const [address, setAddress] = useState(admin.address ?? "");
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState(admin.status);
  const [role, setRole] = useState(admin.role);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (changePassword && !newPassword) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${adminApiBaseUrl}/staff/admins/${admin.id}`, {
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Cập nhật thông tin admin</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Tài khoản</label>
            <input
              type="text"
              value={admin.username}
              disabled
              className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>

          <div className="flex items-center gap-2">
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
            <div>
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

          <div className="grid grid-cols-1 gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-2">
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
                <option value={0}>Admin</option>
                <option value={2}>Nhân viên kinh doanh</option>
                <option value={3}>Nhân viên mua hàng</option>
                <option value={4}>Nhân viên kho Trung Quốc</option>
                <option value={5}>Nhân viên kho Việt Nam</option>
                <option value={6}>Kế toán</option>
              </select>
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
