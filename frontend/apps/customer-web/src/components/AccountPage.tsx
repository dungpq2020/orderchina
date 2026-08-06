"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import PasswordInput from "@orderchina/ui/components/PasswordInput";
import CustomerLayout from "./CustomerLayout";

interface AccountPageProps {
  customerApiBaseUrl: string;
  loginUrl: string;
}

interface MeProfile {
  username: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  walletBalance: number;
  exchangeRate: number;
  hotline: string | null;
  chinaWarehouseName: string | null;
  vietnamWarehouseName: string | null;
  shippingMethodName: string | null;
  salesStaffName: string | null;
}

interface ProfileForm {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

interface UpdateErrorBody {
  error?: string;
  errors?: Record<string, string[]>;
}

interface PasswordForm {
  newPassword: string;
  confirmNewPassword: string;
}

const EMPTY_PASSWORD_FORM: PasswordForm = { newPassword: "", confirmNewPassword: "" };

const inputClasses =
  "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function toForm(profile: MeProfile): ProfileForm {
  return {
    fullName: profile.fullName,
    email: profile.email ?? "",
    phoneNumber: profile.phoneNumber ?? "",
    address: profile.address ?? "",
  };
}

export default function AccountPage({ customerApiBaseUrl, loginUrl }: AccountPageProps) {
  const fetchMe = useCallback(
    async (_page: number, accessToken: string): Promise<MeProfile> => {
      const res = await fetch(`${customerApiBaseUrl}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Lỗi tải thông tin tài khoản (status ${res.status}).`);
      }
      return (await res.json()) as MeProfile;
    },
    [customerApiBaseUrl],
  );

  const { state, logout, setState } = useAuthenticatedList<MeProfile>({
    adminApiBaseUrl: customerApiBaseUrl,
    loginUrl,
    fetchPage: fetchMe,
  });

  const [form, setForm] = useState<ProfileForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const seededRef = useRef(false);

  const [passwordForm, setPasswordForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (state.status !== "ready" || seededRef.current) return;
    seededRef.current = true;
    setForm(toForm(state.data));
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleSubmit(accessToken: string) {
    if (!form) return;

    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`${customerApiBaseUrl}/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          address: form.address.trim() === "" ? null : form.address.trim(),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as UpdateErrorBody | null;
        const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
        setError(firstFieldError ?? body?.error ?? "Cập nhật thất bại.");
        return;
      }

      const updated = (await res.json()) as Omit<MeProfile, "username" | "walletBalance" | "exchangeRate" | "hotline">;
      if (state.status === "ready") {
        const nextProfile: MeProfile = { ...state.data, ...updated };
        setState({ status: "ready", data: nextProfile, accessToken });
        setForm(toForm(nextProfile));
      }
      setToast({ message: "Đã cập nhật thông tin tài khoản.", type: "success" });
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setPasswordError(null);
    setChangingPassword(true);
    try {
      const res = await fetch(`${customerApiBaseUrl}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as UpdateErrorBody | null;
        const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
        setPasswordError(firstFieldError ?? body?.error ?? "Đổi mật khẩu thất bại.");
        return;
      }

      // Response đã set cookie refresh token mới (rotate) — không cần đăng xuất, access token hiện
      // tại vẫn còn hạn dùng bình thường, chỉ các thiết bị/tab khác bị đăng xuất tự nhiên.
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setToast({ message: "Đã đổi mật khẩu.", type: "success" });
    } catch {
      setPasswordError("Không kết nối được tới máy chủ.");
    } finally {
      setChangingPassword(false);
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </div>
    );
  }

  const { me, accessToken } = { me: state.data, accessToken: state.accessToken };

  return (
    <CustomerLayout
      title="Tài khoản"
      fullName={me.fullName}
      username={me.username}
      walletBalance={me.walletBalance}
      exchangeRate={me.exchangeRate}
      hotline={me.hotline}
      onLogout={logout}
    >
      {() => (
        <div className="mx-auto max-w-xl">
          <h1 className="mb-4 text-xl font-semibold text-zinc-900">Thông tin tài khoản</h1>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 space-y-1.5">
              <label className="text-sm font-medium text-zinc-600">Tài khoản</label>
              <input value={me.username} disabled className={`${inputClasses} cursor-not-allowed bg-zinc-100 text-zinc-500`} />
            </div>

            {form && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(accessToken);
                }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-600">Họ tên</label>
                  <input
                    className={inputClasses}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-600">Email</label>
                  <input
                    type="email"
                    className={inputClasses}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-600">Số điện thoại</label>
                  <input
                    type="tel"
                    className={inputClasses}
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    autoComplete="tel"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-600">Địa chỉ</label>
                  <textarea
                    className={`${inputClasses} min-h-20 resize-y`}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    autoComplete="street-address"
                  />
                </div>

                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Đang cập nhật..." : "Cập nhật thông tin"}
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-zinc-900">Thông tin phụ trách</h2>
            <p className="mb-4 text-xs text-zinc-400">
              Các thông tin này do đội ngũ quản trị OrderChina thiết lập, bạn không tự chỉnh sửa được ở đây.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-500">Nhân viên sale phụ trách</span>
                <span className="text-right font-medium text-zinc-800">{me.salesStaffName ?? "Chưa phân công"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-500">Kho Trung Quốc</span>
                <span className="text-right font-medium text-zinc-800">{me.chinaWarehouseName ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-500">Kho nhận (VN)</span>
                <span className="text-right font-medium text-zinc-800">{me.vietnamWarehouseName ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-500">Phương thức vận chuyển</span>
                <span className="text-right font-medium text-zinc-800">{me.shippingMethodName ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-zinc-900">Đổi mật khẩu</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChangePassword();
              }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-600">Mật khẩu mới</label>
                <PasswordInput
                  className={inputClasses}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-zinc-400">Tối thiểu 8 ký tự, gồm hoa, thường, số và ký tự đặc biệt.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-600">Xác nhận mật khẩu mới</label>
                <PasswordInput
                  className={inputClasses}
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                  autoComplete="new-password"
                  required
                />
              </div>

              {passwordError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{passwordError}</p>}

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changingPassword ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </button>
            </form>
          </div>

          {toast && (
            <div
              className={`fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
                toast.type === "success" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {toast.message}
            </div>
          )}
        </div>
      )}
    </CustomerLayout>
  );
}
